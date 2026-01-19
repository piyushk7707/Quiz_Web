from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from django.contrib.auth import get_user_model
from django.db.models import Q
from .models import FriendRequest, ChatRoom
from .serializers import (
    FriendRequestSerializer,
    UserSearchSerializer,
    FriendSerializer,
    ChatRoomSerializer,
)

User = get_user_model()


class SearchUsersView(APIView):
    """Search users by username or email"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        query = request.query_params.get('q', '').strip()
        
        if not query or len(query) < 2:
            return Response(
                {'error': 'Query must be at least 2 characters'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Search users excluding current user
        users = User.objects.filter(
            Q(username__icontains=query) | Q(email__icontains=query)
        ).exclude(id=request.user.id).distinct()[:20]
        
        serializer = UserSearchSerializer(users, many=True)
        return Response(serializer.data)


class SendFriendRequestView(APIView):
    """Send a friend request to another user"""
    permission_classes = [IsAuthenticated]
    
    def post(self, request, user_id):
        # Prevent self-requests
        if user_id == request.user.id:
            return Response(
                {'error': 'You cannot send a friend request to yourself'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            receiver = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response(
                {'error': 'User not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Check if request already exists
        existing = FriendRequest.objects.filter(
            Q(sender=request.user, receiver=receiver) |
            Q(sender=receiver, receiver=request.user)
        ).exclude(status=FriendRequest.REJECTED).first()
        
        if existing:
            return Response(
                {'error': f'Request already exists with status: {existing.status}'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Create friend request
        friend_request = FriendRequest.objects.create(
            sender=request.user,
            receiver=receiver,
            status=FriendRequest.PENDING
        )
        
        serializer = FriendRequestSerializer(friend_request)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class AcceptFriendRequestView(APIView):
    """Accept a friend request"""
    permission_classes = [IsAuthenticated]
    
    def post(self, request, request_id):
        try:
            friend_request = FriendRequest.objects.get(
                id=request_id,
                receiver=request.user,
                status=FriendRequest.PENDING
            )
        except FriendRequest.DoesNotExist:
            return Response(
                {'error': 'Friend request not found or already processed'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        friend_request.accept()
        
        # Create chat room for the new friends
        ChatRoom.get_or_create_room(friend_request.sender, friend_request.receiver)
        
        serializer = FriendRequestSerializer(friend_request)
        return Response(serializer.data)


class RejectFriendRequestView(APIView):
    """Reject a friend request"""
    permission_classes = [IsAuthenticated]
    
    def post(self, request, request_id):
        try:
            friend_request = FriendRequest.objects.get(
                id=request_id,
                receiver=request.user,
                status=FriendRequest.PENDING
            )
        except FriendRequest.DoesNotExist:
            return Response(
                {'error': 'Friend request not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        friend_request.reject()
        serializer = FriendRequestSerializer(friend_request)
        return Response(serializer.data)


class PendingRequestsView(APIView):
    """List all pending friend requests for the current user"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        pending = FriendRequest.objects.filter(
            receiver=request.user,
            status=FriendRequest.PENDING
        )
        serializer = FriendRequestSerializer(pending, many=True)
        return Response(serializer.data)


class FriendsListView(APIView):
    """List all friends of the current user"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        # Get all accepted friend requests involving current user
        friend_requests = FriendRequest.objects.filter(
            Q(sender=request.user) | Q(receiver=request.user),
            status=FriendRequest.ACCEPTED
        )
        
        friends = []
        for fr in friend_requests:
            friend = fr.receiver if fr.sender == request.user else fr.sender
            friends.append({
                'id': friend.id,
                'username': friend.username,
                'email': friend.email,
                'total_points': getattr(friend.userprofile, 'total_points', 0) if hasattr(friend, 'userprofile') else 0,
                'friend_request_id': fr.id
            })
        
        return Response(friends)


class RemoveFriendView(APIView):
    """Remove a friend (reject the accepted request)"""
    permission_classes = [IsAuthenticated]
    
    def post(self, request, friend_id):
        try:
            friend_request = FriendRequest.objects.get(
                Q(sender=request.user, receiver_id=friend_id) |
                Q(receiver=request.user, sender_id=friend_id),
                status=FriendRequest.ACCEPTED
            )
        except FriendRequest.DoesNotExist:
            return Response(
                {'error': 'Friendship not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        friend_request.delete()
        return Response({'message': 'Friend removed'}, status=status.HTTP_200_OK)


class GetChatRoomView(APIView):
    """Get or create a chat room with a friend"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request, friend_id):
        try:
            friend = User.objects.get(id=friend_id)
        except User.DoesNotExist:
            return Response(
                {'error': 'User not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Check if they are friends
        friendship = FriendRequest.objects.filter(
            Q(sender=request.user, receiver=friend) |
            Q(sender=friend, receiver=request.user),
            status=FriendRequest.ACCEPTED
        ).first()
        
        if not friendship:
            return Response(
                {'error': 'You can only chat with friends'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Get or create chat room
        chat_room = ChatRoom.get_or_create_room(request.user, friend)
        serializer = ChatRoomSerializer(chat_room)
        return Response(serializer.data)
