from django.db import models
from django.conf import settings
from django.db.models import Q

class FriendRequest(models.Model):
    PENDING = 'pending'
    ACCEPTED = 'accepted'
    REJECTED = 'rejected'
    
    STATUS_CHOICES = [
        (PENDING, 'Pending'),
        (ACCEPTED, 'Accepted'),
        (REJECTED, 'Rejected'),
    ]
    
    sender = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='sent_friend_requests'
    )
    receiver = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='received_friend_requests'
    )
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default=PENDING
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ('sender', 'receiver')
        ordering = ['-created_at']
    
    def __str__(self):
        return f'{self.sender.username} -> {self.receiver.username} ({self.status})'
    
    def accept(self):
        self.status = self.ACCEPTED
        self.save()
    
    def reject(self):
        self.status = self.REJECTED
        self.save()


class ChatRoom(models.Model):
    """One-to-one chat room between two friends"""
    user1 = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='chat_rooms_user1'
    )
    user2 = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='chat_rooms_user2'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ('user1', 'user2')
        ordering = ['-created_at']
    
    def __str__(self):
        return f'ChatRoom: {self.user1.username} - {self.user2.username}'
    
    @staticmethod
    def get_or_create_room(user1, user2):
        """Ensure user1 has lower ID than user2 for consistency"""
        if user1.id > user2.id:
            user1, user2 = user2, user1
        room, created = ChatRoom.objects.get_or_create(user1=user1, user2=user2)
        return room
