from rest_framework import permissions

class IsClubOrganizerOrReadOnly(permissions.BasePermission):
    """
    Custom permission to only allow club organizers to edit events.
    """
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        return request.user.user_type in ['CLUB_ORGANIZER', 'ADMIN']
    
    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        
        if request.user.user_type == 'ADMIN':
            return True
        
        # Check if user is a member of the club
        from apps.clubs.models import ClubMember
        return ClubMember.objects.filter(
            student__user=request.user,
            club=obj.club if hasattr(obj, 'club') else obj
        ).exists()


class IsStudentOwnerOrMentor(permissions.BasePermission):
    """
    Custom permission for student data - student can view own data,
    mentor can view mentee data.
    """
    def has_object_permission(self, request, view, obj):
        user = request.user
        
        # Admin has full access
        if user.user_type == 'ADMIN':
            return True
        
        # Student can access own data
        if user.user_type == 'STUDENT' and obj.user == user:
            return True
        
        # Mentor can access mentee data
        if user.user_type == 'MENTOR':
            from apps.mentors.models import Mentor
            mentor = Mentor.objects.get(user=user)
            return obj.mentor == mentor
        
        return False