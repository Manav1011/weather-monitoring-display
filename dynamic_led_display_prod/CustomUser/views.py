from django.shortcuts import render,redirect
from django.contrib.auth import login,logout,authenticate
from django.contrib import messages
from django.contrib.auth import get_user_model

# Create your views here.

from django.http import JsonResponse
import json
from django.views.decorators.csrf import ensure_csrf_cookie
from serial_comm.models import Station

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
                    return JsonResponse({'status': 'success', 'user': {'email': user.email, 'is_superuser': user.is_superuser}})
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
            'user': {'email': request.user.email, 'is_superuser': request.user.is_superuser}
        })
    return JsonResponse({'isAuthenticated': False}, status=401)


def RegisterView(request):
    try:               
        if request.method == 'POST':
            if request.content_type == 'application/json':
                data = json.loads(request.body)
                email = data.get('email')
                password = data.get('password')
                superusercheck = data.get('superusercheck', False)
            else:
                email = request.POST.get('email')
                password = request.POST.get('password')
                superusercheck = request.POST.get('superusercheck') == 'on'

            if email and password:
                if request.user.is_superuser:
                    User = get_user_model()
                    user = User(email=email, is_editor=True)
                    if superusercheck:
                        user.is_superuser = True
                        user.is_staff = True
                    user.set_password(password)
                    user.save()
                    if request.content_type == 'application/json':
                        return JsonResponse({'status': 'success', 'message': 'User created successfully'})
                    return redirect('analytics')
                else:
                    if request.content_type == 'application/json':
                        return JsonResponse({'status': 'error', 'message': "You're not allowed to perform this action"}, status=403)
                    messages.error(request,"You're not allowed to perform this action")        
    except Exception as e:
        if request.content_type == 'application/json':
            return JsonResponse({'status': 'error', 'message': str(e)}, status=400)
        messages.error(request,str(e))

    if request.content_type == 'application/json':
        return JsonResponse({'status': 'error', 'message': 'GET method not allowed via API'}, status=405)
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

def StationSettingsView(request):
    try:
        # Get or create the first station row to ensure one always exists
        station, created = Station.objects.get_or_create(id=1)
        
        if request.method == 'GET':
            return JsonResponse({
                'station_id': station.station_id,
                'station_name': station.station_name
            })
            
        elif request.method == 'POST':
            if not request.user.is_superuser:
                return JsonResponse({'status': 'error', 'message': 'Unauthorized'}, status=403)
                
            data = json.loads(request.body)
            station.station_id = data.get('station_id', station.station_id)
            station.station_name = data.get('station_name', station.station_name)
            station.save()
            
            return JsonResponse({'status': 'success', 'message': 'Station updated successfully'})
            
    except Exception as e:
        return JsonResponse({'status': 'error', 'message': str(e)}, status=400)