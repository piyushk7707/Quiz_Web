from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Q
from .models import Message
from .serializers import MessageSerializer

class ChatHistoryView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request, friend_id):
        """Get chat history between current user and friend"""
        messages = Message.objects.filter(
            Q(sender_id=request.user.id, recipient_id=friend_id) |
            Q(sender_id=friend_id, recipient_id=request.user.id)
        ).order_by('created_at')
        
        serializer = MessageSerializer(messages, many=True)
        return Response(serializer.data)
