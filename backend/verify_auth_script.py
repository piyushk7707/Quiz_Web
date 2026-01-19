import os
import django
import sys

# Setup Django environment
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from rest_framework.test import APIRequestFactory
from apps.accounts.views import SignupView, LoginView
from apps.accounts.models import User

def test_auth_flow():
    print("Starting Auth Flow Verification...")
    factory = APIRequestFactory()
    
    # Test Data
    email = "test_user_verification@example.com"
    password = "secure_password_123"
    
    # Check if user exists and delete
    try:
        User.objects.get(email=email).delete()
        print(f"Cleaned up existing user: {email}")
    except User.DoesNotExist:
        pass

    # 1. Test Registration
    print("\n1. Testing Registration...")
    signup_data = {
        "email": email,
        "first_name": "Test",
        "last_name": "User",
        "password": password,
        "password_confirm": password
    }
    
    request = factory.post('/api/auth/signup/', signup_data, format='json')
    view = SignupView.as_view()
    response = view(request)
    
    if response.status_code == 201:
        print("✅ Registration Successful")
        print(f"Response: {response.data.keys()}")
    else:
        print(f"❌ Registration Failed: {response.status_code}")
        print(response.data)
        return

    # 2. Test Login
    print("\n2. Testing Login...")
    login_data = {
        "email": email,
        "password": password
    }
    
    request = factory.post('/api/auth/login/', login_data, format='json')
    view = LoginView.as_view()
    response = view(request)
    
    if response.status_code == 200:
        print("✅ Login Successful")
        print(f"Tokens received: {'access' in response.data and 'refresh' in response.data}")
    else:
        print(f"❌ Login Failed: {response.status_code}")
        print(response.data)

if __name__ == "__main__":
    test_auth_flow()
