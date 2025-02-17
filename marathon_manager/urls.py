"""
URL configuration for marathon_manager project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.1/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.shortcuts import redirect
from django.urls import include, path
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView, TokenVerifyView

from manager.views import (registration_page, autorization_page, LoginUserView, logout_view,
                           create_race_page, main_page, race_page, edit_race_settings)

router = DefaultRouter()

urlpatterns = [
    path('admin/', admin.site.urls),
    path('register/', registration_page, name='registration_page'),
    path('login/', autorization_page, name='autorization_page'),
    path('main/', main_page, name='main_page'),
    path('', lambda request: redirect('main_page')),
    path('race/<int:pk>/', race_page, name='race_page'),
    path('race/edit/<int:pk>/', edit_race_settings, name='edit_race_settings'),
    path('api/v1/logout/', logout_view, name='logout'),
    path('api/v1/login/', LoginUserView.as_view(), name='login'),
    path('create_race/', create_race_page, name='create_race_page'),
    path('', include(router.urls)),
    path('api/v1/', include('manager.urls')),
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),  # Получение токена
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),  # Обновление токена
    path('api/token/verify/', TokenVerifyView.as_view(), name='token_verify'),

]