from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import FriendRequest, ChatRoom

User = get_user_model()


class UserSearchSerializer(serializers.ModelSerializer):
    """Simple user serializer for search results"""
    class Meta:
        model = User
        fields = ('id', 'username', 'email')


class UserDetailSerializer(serializers.ModelSerializer):
    """User details with profile info"""
    total_points = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'total_points')
    
    def get_total_points(self, obj):
        # Assumes user has profile with total_points
        try:
            return obj.userprofile.total_points
        except:
            return 0


class FriendRequestSerializer(serializers.ModelSerializer):
    sender = UserSearchSerializer(read_only=True)
    receiver = UserSearchSerializer(read_only=True)
    sender_username = serializers.CharField(source='sender.username', read_only=True)
    receiver_username = serializers.CharField(source='receiver.username', read_only=True)
    
    class Meta:
        model = FriendRequest
        fields = (
            'id',
            'sender',
            'sender_username',
            'receiver',
            'receiver_username',
            'status',
            'created_at',
            'updated_at'
        )
        read_only_fields = ('created_at', 'updated_at')


class FriendSerializer(serializers.Serializer):
    """Represents a friend in the friends list"""
    id = serializers.IntegerField()
    username = serializers.CharField()
    email = serializers.CharField()
    total_points = serializers.IntegerField()
    friend_request_id = serializers.IntegerField()  # ID of accepted friend request


class ChatRoomSerializer(serializers.ModelSerializer):
    user1 = UserSearchSerializer()
    user2 = UserSearchSerializer()
    
    class Meta:
        model = ChatRoom
        fields = ('id', 'user1', 'user2', 'created_at')
