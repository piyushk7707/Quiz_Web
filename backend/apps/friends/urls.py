from django.urls import path
from .views import (
    SearchUsersView,
    SendFriendRequestView,
    AcceptFriendRequestView,
    RejectFriendRequestView,
    PendingRequestsView,
    FriendsListView,
    RemoveFriendView,
    GetChatRoomView,
)

urlpatterns = [
    # Search
    path('search/', SearchUsersView.as_view(), name='search-users'),
    
    # Friend requests
    path('request/<int:user_id>/', SendFriendRequestView.as_view(), name='send-friend-request'),
    path('request/<int:request_id>/accept/', AcceptFriendRequestView.as_view(), name='accept-friend-request'),
    path('request/<int:request_id>/reject/', RejectFriendRequestView.as_view(), name='reject-friend-request'),
    path('requests/', PendingRequestsView.as_view(), name='pending-requests'),
    
    # Friends
    path('list/', FriendsListView.as_view(), name='friends-list'),
    path('remove/<int:friend_id>/', RemoveFriendView.as_view(), name='remove-friend'),
    
    # Chat
    path('chat/<int:friend_id>/', GetChatRoomView.as_view(), name='get-chat-room'),
]
