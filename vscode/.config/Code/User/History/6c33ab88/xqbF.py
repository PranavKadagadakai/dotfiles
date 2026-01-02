from rest_framework import serializers
from .models import Event, EventRegistration, Attendance
from apps.clubs.models import Club
from apps.aicte_points.models import EventAICTEConfig

class EventSerializer(serializers.ModelSerializer):
    club_name = serializers.CharField(source='club.club_name', read_only=True)
    created_by_name = serializers.SerializerMethodField()
    registrations_count = serializers.SerializerMethodField()
    is_registered = serializers.SerializerMethodField()
    can_register = serializers.SerializerMethodField()
    
    class Meta:
        model = Event
        fields = '__all__'
        read_only_fields = ['created_by', 'created_at', 'updated_at']
    
    def get_created_by_name(self, obj):
        student = obj.created_by.student
        return f"{student.first_name} {student.last_name}"
    
    def get_registrations_count(self, obj):
        return obj.registrations.filter(
            registration_status='REGISTERED'
        ).count()
    
    def get_is_registered(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            if request.user.user_type == 'STUDENT':
                return obj.registrations.filter(
                    student__user=request.user
                ).exists()
        return False
    
    def get_can_register(self, obj):
        if obj.event_status != 'SCHEDULED':
            return False
        if obj.max_participants:
            current_count = self.get_registrations_count(obj)
            return current_count < obj.max_participants
        return True


class EventRegistrationSerializer(serializers.ModelSerializer):
    student_name = serializers.SerializerMethodField()
    event_name = serializers.CharField(source='event.event_name', read_only=True)
    
    class Meta:
        model = EventRegistration
        fields = '__all__'
        read_only_fields = ['registration_date']
    
    def get_student_name(self, obj):
        return f"{obj.student.first_name} {obj.student.last_name}"


class AttendanceSerializer(serializers.ModelSerializer):
    student_name = serializers.SerializerMethodField()
    student_usn = serializers.CharField(source='student.usn', read_only=True)
    
    class Meta:
        model = Attendance
        fields = '__all__'
        read_only_fields = ['marked_by', 'marked_at']
    
    def get_student_name(self, obj):
        return f"{obj.student.first_name} {obj.student.last_name}"