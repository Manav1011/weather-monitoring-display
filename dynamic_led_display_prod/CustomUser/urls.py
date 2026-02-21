from django.urls import path
from .views import LoginView,LogoutView,RegisterView,CheckSessionView

urlpatterns = [
    path('login/',LoginView,name='login'),
    path('check-session/',CheckSessionView,name='check-session'),
    path('logout/',LogoutView,name='logout'),
    path('register/',RegisterView,name='register')
]
