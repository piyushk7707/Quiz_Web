from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework_simplejwt.tokens import RefreshToken
from .serializers import (
    SignupSerializer,
    LoginSerializer,
    UserSerializer,
    UserProfileSerializer,
    ProfileDetailSerializer,
    ProfileUpdateSerializer,
)
from .models import User, UserProfile


class SignupView(APIView):
    """User registration endpoint"""
    permission_classes = [AllowAny]
    
    def post(self, request):
        """Create a new user account"""
        serializer = SignupSerializer(data=request.data)
        
        if serializer.is_valid():
            user = serializer.save()
            
            # Generate tokens
            refresh = RefreshToken.for_user(user)
            
            return Response({
                'message': 'User registered successfully',
                'user': UserSerializer(user).data,
                'refresh': str(refresh),
                'access': str(refresh.access_token),
            }, status=status.HTTP_201_CREATED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class LoginView(APIView):
    """User login endpoint"""
    permission_classes = [AllowAny]
    
    def post(self, request):
        """Authenticate user and return JWT tokens"""
        serializer = LoginSerializer(data=request.data)
        
        if serializer.is_valid():
            user = serializer.validated_data['user']
            
            # Generate tokens
            refresh = RefreshToken.for_user(user)
            
            return Response({
                'message': 'Login successful',
                'user': UserSerializer(user).data,
                'refresh': str(refresh),
                'access': str(refresh.access_token),
            }, status=status.HTTP_200_OK)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class UserProfileView(APIView):
    """
    User profile endpoint for GET and PUT operations.
    
    GET /accounts/profile/
    - Retrieve current user's complete profile with statistics
    - Requires authentication
    
    PUT /accounts/profile/
    - Update user profile (email, name, bio, photo)
    - Accepts multipart/form-data for file uploads
    - Requires authentication
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        """
        Retrieve current user's profile with all details.
        
        Response includes:
        - User info (email, name)
        - Bio
        - Profile photo
        - Quiz statistics (points, tests, accuracy)
        """
        try:
            profile = UserProfile.objects.get(user=request.user)
            serializer = ProfileDetailSerializer(profile)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except UserProfile.DoesNotExist:
            # Create profile if it doesn't exist
            profile = UserProfile.objects.create(user=request.user)
            serializer = ProfileDetailSerializer(profile)
            return Response(serializer.data, status=status.HTTP_200_OK)
    
    def put(self, request):
        """
        Update current user's profile.
        
        Accepted fields:
        - email: User email address
        - first_name: User first name
        - last_name: User last name
        - bio: User biography
        - profile_picture: Profile photo (multipart/form-data)
        
        Returns updated profile.
        """
        try:
            profile = UserProfile.objects.get(user=request.user)
        except UserProfile.DoesNotExist:
            profile = UserProfile.objects.create(user=request.user)
        
        serializer = ProfileUpdateSerializer(
            profile,
            data=request.data,
            partial=True  # Allow partial updates
        )
        
        if serializer.is_valid():
            serializer.save()
            
            # Return updated profile with all details
            response_serializer = ProfileDetailSerializer(profile)
            return Response(
                {
                    'message': 'Profile updated successfully',
                    'profile': response_serializer.data
                },
                status=status.HTTP_200_OK
            )
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    def patch(self, request):
        """
        Partial update of user profile (same as PUT but explicit).
        """
        return self.put(request)


class CurrentUserView(APIView):
    """Get authenticated user information"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        """Retrieve current user data"""
        serializer = UserSerializer(request.user)
        return Response(serializer.data, status=status.HTTP_200_OK)


class TestProtectedView(APIView):
    """Protected test endpoint"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        """Test endpoint to verify JWT authentication"""
        return Response({
            'message': 'Access granted - JWT authentication working',
            'user_email': request.user.email,
            'user_id': request.user.id,
        }, status=status.HTTP_200_OK)
