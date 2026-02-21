from django.shortcuts import render,redirect
from django.contrib.auth import login,logout,authenticate
from django.contrib import messages
from django.contrib.auth import get_user_model

# Create your views here.

from django.http import JsonResponse
import json
from django.views.decorators.csrf import ensure_csrf_cookie

@ensure_csrf_cookie
def LoginView(request):
    if request.method == 'POST':
        try:
            if request.content_type == 'application/json':
                data = json.loads(request.body)
                email = data.get('email')
                password = data.get('password')
            else:
                email = request.POST.get('email')
                password = request.POST.get('password')

            user = authenticate(username=email, password=password)
            if user:
                login(request, user)
                if request.content_type == 'application/json':
                    return JsonResponse({'status': 'success', 'user': {'email': user.email}})
                return redirect('analytics')
            else:
                if request.content_type == 'application/json':
                    return JsonResponse({'status': 'error', 'message': 'Invalid credentials'}, status=401)
                messages.error(request, "User does not exist")
        except Exception as e:
            if request.content_type == 'application/json':
                return JsonResponse({'status': 'error', 'message': str(e)}, status=400)
            messages.error(request, str(e))

    if request.content_type == 'application/json':
        return JsonResponse({'status': 'error', 'message': 'GET method not allowed for login via API'}, status=405)
    return render(request, 'auth/login.html')

def CheckSessionView(request):
    if request.user.is_authenticated:
        return JsonResponse({
            'isAuthenticated': True,
            'user': {'email': request.user.email}
        })
    return JsonResponse({'isAuthenticated': False}, status=401)


def RegisterView(request):
    try:               
        if request.method == 'POST':
            if 'email' in request.POST and 'password' in request.POST:
                if request.user.is_superuser:
                    User = get_user_model()
                    user = User(email=request.POST['email'],is_editor=True)
                    if 'superusercheck' in request.POST and request.POST['superusercheck'] == 'on':
                        user.is_superuser = True
                        user.is_staff = True
                    user.set_password(request.POST['password'])
                    user.save()
                    return redirect('analytics')
                else:
                    messages.error(request,"You're not allowed to perform this action")        
    except Exception as e:        
        messages.error(request,str(e))

    return render(request,'auth/register.html')

def LogoutView(request):    
    try:               
        if request.user.is_authenticated:
           logout(request)
           messages.success(request, 'Logged out successfully')
           return redirect('login')
    except Exception as e:
        print(e)
        messages.error(request,str(e))    