from rest_framework import permissions

class IsOwnerOrReadOnly(permissions.BasePermission):
    """
    Object-level permission to only allow owners of an object to edit it.
    """
    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        return obj.user == request.user


class IsClubAdmin(permissions.BasePermission):
    """
    Permission to check if user is a club admin/organizer.
    """
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.user_type in ['CLUB_ORGANIZER', 'ADMIN']


class IsStudent(permissions.BasePermission):
    """
    Permission to check if user is a student.
    """
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.user_type == 'STUDENT'


class IsMentor(permissions.BasePermission):
    """
    Permission to check if user is a mentor.
    """
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.user_type == 'MENTOR'


class IsClubOrganizerOrReadOnly(permissions.BasePermission):
    """
    Custom permission to only allow club organizers to edit.
    """
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        return request.user.is_authenticated and request.user.user_type in ['CLUB_ORGANIZER', 'ADMIN']


class IsStudentOwnerOrMentor(permissions.BasePermission):
    """
    Custom permission for student data - student can view own data,
    mentor can view mentee data.
    """
    def has_object_permission(self, request, view, obj):
        user = request.user
        
        if not user.is_authenticated:
            return False
        
        # Admin has full access
        if user.user_type == 'ADMIN':
            return True
        
        # Student can access own data
        if user.user_type == 'STUDENT' and hasattr(obj, 'user') and obj.user == user:
            return True
        
        # Mentor can access mentee data
        if user.user_type == 'MENTOR' and hasattr(obj, 'mentor'):
            from apps.mentors.models import Mentor
            try:
                mentor = Mentor.objects.get(user=user)
                return obj.mentor == mentor
            except Mentor.DoesNotExist:
                return False
        
        return False