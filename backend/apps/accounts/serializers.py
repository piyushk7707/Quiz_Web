from rest_framework import serializers
from django.contrib.auth import authenticate
from .models import User, UserProfile


class UserSerializer(serializers.ModelSerializer):
    """Serializer for displaying user information"""
    full_name = serializers.CharField(source='get_full_name', read_only=True)
    
    class Meta:
        model = User
        fields = ('id', 'email', 'first_name', 'last_name', 'full_name', 'is_active', 'created_at')
        read_only_fields = ('id', 'created_at')


class SignupSerializer(serializers.ModelSerializer):
    """Serializer for user registration"""
    password = serializers.CharField(
        write_only=True,
        min_length=8,
        style={'input_type': 'password'}
    )
    password_confirm = serializers.CharField(
        write_only=True,
        min_length=8,
        style={'input_type': 'password'}
    )
    
    class Meta:
        model = User
        fields = ('email', 'first_name', 'last_name', 'password', 'password_confirm')
    
    def validate(self, data):
        """Validate that passwords match"""
        if data.get('password') != data.pop('password_confirm'):
            raise serializers.ValidationError({'password': 'Passwords do not match'})
        return data
    
    def validate_email(self, value):
        """Check if email is unique"""
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError('Email already registered')
        return value
    
    def create(self, validated_data):
        """Create user and profile"""
        user = User.objects.create_user(
            email=validated_data['email'],
            password=validated_data['password'],
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', '')
        )
        # Create user profile automatically
        UserProfile.objects.create(user=user)
        return user


class LoginSerializer(serializers.Serializer):
    """Serializer for user login"""
    email = serializers.EmailField()
    password = serializers.CharField(
        write_only=True,
        style={'input_type': 'password'}
    )
    
    def validate(self, data):
        """Authenticate user with email and password"""
        email = data.get('email')
        password = data.get('password')
        
        if not email or not password:
            raise serializers.ValidationError('Email and password are required')
        
        # Get user by email and authenticate
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            raise serializers.ValidationError('Invalid email or password')
        
        if not user.check_password(password):
            raise serializers.ValidationError('Invalid email or password')
        
        if not user.is_active:
            raise serializers.ValidationError('User account is inactive')
        
        data['user'] = user
        return data


class UserProfileSerializer(serializers.ModelSerializer):
    """Serializer for user profile (read-only display)"""
    user = UserSerializer(read_only=True)
    
    class Meta:
        model = UserProfile
        fields = ('id', 'user', 'bio', 'profile_picture', 'total_points', 'created_at', 'updated_at')
        read_only_fields = ('id', 'created_at', 'updated_at')


class ProfileDetailSerializer(serializers.ModelSerializer):
    """
    Serializer for user profile detail with comprehensive information.
    Used for GET /accounts/profile/ endpoint.
    """
    username = serializers.CharField(
        source='user.email',
        read_only=True,
        help_text='User email'
    )
    email = serializers.EmailField(
        source='user.email',
        read_only=True,
        help_text='User email'
    )
    first_name = serializers.CharField(
        source='user.first_name',
        read_only=True,
        allow_blank=True,
        help_text='User first name'
    )
    last_name = serializers.CharField(
        source='user.last_name',
        read_only=True,
        allow_blank=True,
        help_text='User last name'
    )
    full_name = serializers.SerializerMethodField()
    accuracy_percentage = serializers.SerializerMethodField(
        help_text='Quiz accuracy percentage'
    )
    
    class Meta:
        model = UserProfile
        fields = [
            'id',
            'username',
            'email',
            'first_name',
            'last_name',
            'full_name',
            'bio',
            'profile_picture',
            'total_points',
            'tests_attempted',
            'correct_answers',
            'accuracy_percentage',
        ]
        read_only_fields = ['id', 'username', 'email', 'accuracy_percentage']
    
    def get_full_name(self, obj):
        """Get user full name"""
        return obj.user.get_full_name()
    
    def get_accuracy_percentage(self, obj):
        """Calculate and return accuracy percentage"""
        return obj.accuracy_percentage


class ProfileUpdateSerializer(serializers.ModelSerializer):
    """
    Serializer for updating user profile.
    Used for PUT /accounts/profile/ endpoint with multipart/form-data.
    """
    # Allow updating user fields
    email = serializers.EmailField(
        source='user.email',
        required=False,
        help_text='User email address'
    )
    first_name = serializers.CharField(
        source='user.first_name',
        required=False,
        max_length=150,
        allow_blank=True,
        help_text='User first name'
    )
    last_name = serializers.CharField(
        source='user.last_name',
        required=False,
        max_length=150,
        allow_blank=True,
        help_text='User last name'
    )
    bio = serializers.CharField(
        required=False,
        allow_blank=True,
        help_text='User biography'
    )
    profile_picture = serializers.ImageField(
        required=False,
        allow_null=True,
        help_text='User profile photo'
    )
    
    class Meta:
        model = UserProfile
        fields = [
            'email',
            'first_name',
            'last_name',
            'bio',
            'profile_picture',
        ]
    
    def validate_email(self, value):
        """Validate email is unique (excluding current user)"""
        user = self.instance.user
        if User.objects.filter(email=value).exclude(id=user.id).exists():
            raise serializers.ValidationError('Email is already in use')
        return value
    
    def update(self, instance, validated_data):
        """
        Update user profile and related user fields.
        Handles nested user field updates.
        """
        # Extract nested user data
        user_data = {}
        if 'user' in validated_data:
            user_data = validated_data.pop('user')
        
        # Update User model fields
        user = instance.user
        for field, value in user_data.items():
            setattr(user, field, value)
        user.save()
        
        # Update UserProfile fields
        for field, value in validated_data.items():
            setattr(instance, field, value)
        instance.save()
        
        return instance
