from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

app_name = 'events'

router = DefaultRouter()
router.register(r'', views.EventViewSet, basename='event')

urlpatterns = [
    path('', include(router.urls)),
    path('<int:pk>/register/', views.RegisterForEventView.as_view(), name='register'),
    path('<int:pk>/attendance/', views.MarkAttendanceView.as_view(), name='attendance'),
    path('<int:pk>/start/', views.StartEventView.as_view(), name='start'),
    path('<int:pk>/complete/', views.CompleteEventView.as_view(), name='complete'),
]