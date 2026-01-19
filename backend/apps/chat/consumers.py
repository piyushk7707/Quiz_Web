import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth import get_user_model
from django.db import models
from rest_framework_simplejwt.tokens import AccessToken
from .models import Message
from apps.friends.models import FriendRequest

User = get_user_model()


class ChatConsumer(AsyncWebsocketConsumer):
    """WebSocket consumer for one-to-one real-time chat"""
    
    async def connect(self):
        # Extract JWT token and authenticate
        self.user = await self.get_user_from_token()
        
        if not self.user:
            await self.close()
            return
        
        # Get friend_id and room_name from URL
        self.friend_id = self.scope['url_route']['kwargs'].get('friend_id')
        self.sender_id = self.user.id
        self.receiver_id = int(self.friend_id)
        
        # Verify they are friends
        are_friends = await self.check_friendship()
        if not are_friends:
            await self.send(text_data=json.dumps({
                'type': 'error',
                'message': 'You can only chat with friends'
            }))
            await self.close()
            return
        
        # Create consistent room name (lower ID comes first)
        if self.sender_id < self.receiver_id:
            self.room_name = f'chat_{self.sender_id}_{self.receiver_id}'
        else:
            self.room_name = f'chat_{self.receiver_id}_{self.sender_id}'
        
        self.room_group_name = self.room_name
        
        # Join room group
        await self.channel_layer.group_add(self.room_group_name, self.channel_name)
        await self.accept()
        
        # Send connection message
        await self.send(text_data=json.dumps({
            'type': 'connection_established',
            'message': 'Connected to chat'
        }))
    
    async def disconnect(self, close_code):
        # Leave room group
        await self.channel_layer.group_discard(self.room_group_name, self.channel_name)
    
    async def receive(self, text_data):
        """Receive message from WebSocket"""
        try:
            data = json.loads(text_data)
            message_text = data.get('message', '').strip()
            
            if not message_text:
                return
            
            # Save message to database
            await self.save_message(message_text)
            
            # Send message to room group
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'chat_message',
                    'message': message_text,
                    'sender_id': self.sender_id,
                    'sender_username': self.user.username,
                    'timestamp': self.get_current_timestamp()
                }
            )
        except json.JSONDecodeError:
            pass
    
    async def chat_message(self, event):
        """Send chat message to WebSocket"""
        await self.send(text_data=json.dumps({
            'type': 'message',
            'message': event['message'],
            'sender_id': event['sender_id'],
            'sender_username': event['sender_username'],
            'timestamp': event['timestamp']
        }))
    
    @database_sync_to_async
    def get_user_from_token(self):
        """Extract and authenticate user from JWT token"""
        try:
            token_str = None
            
            # Get token from query string
            if self.scope.get('query_string'):
                query_string = self.scope['query_string'].decode()
                for param in query_string.split('&'):
                    if param.startswith('token='):
                        token_str = param.split('=')[1]
                        break
            
            if not token_str:
                return None
            
            token = AccessToken(token_str)
            user_id = token['user_id']
            user = User.objects.get(id=user_id)
            return user
        except Exception as e:
            print(f'Token error: {e}')
            return None
    
    @database_sync_to_async
    def check_friendship(self):
        """Check if two users are friends"""
        try:
            friendship = FriendRequest.objects.filter(
                (models.Q(sender_id=self.sender_id, receiver_id=self.receiver_id) |
                 models.Q(sender_id=self.receiver_id, receiver_id=self.sender_id)),
                status='accepted'
            ).exists()
            return friendship
        except Exception as e:
            print(f'Friendship check error: {e}')
            return False
    
    @database_sync_to_async
    def save_message(self, message_text):
        """Save message to database"""
        try:
            receiver = User.objects.get(id=self.receiver_id)
            Message.objects.create(
                sender=self.user,
                recipient=receiver,
                text=message_text
            )
        except Exception as e:
            print(f'Message save error: {e}')
    
    @staticmethod
    def get_current_timestamp():
        """Get current timestamp as ISO format"""
        from django.utils import timezone
        return timezone.now().isoformat()
