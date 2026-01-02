from rest_framework import serializers
from django.contrib.auth import get_user_model
from apps.students.models import Student
from apps.mentors.models import Mentor

User = get_user_model()

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'email', 'user_type', 'is_email_verified', 
                  'last_login', 'created_at']
        read_only_fields = ['id', 'created_at']


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)
    password_confirm = serializers.CharField(write_only=True, min_length=8)
    
    # Additional fields based on user type
    usn = serializers.CharField(required=False)
    employee_id = serializers.CharField(required=False)
    first_name = serializers.CharField(required=True)
    last_name = serializers.CharField(required=True)
    
    class Meta:
        model = User
        fields = ['email', 'password', 'password_confirm', 'user_type',
                  'first_name', 'last_name', 'usn', 'employee_id']
    
    def validate(self, attrs):
        if attrs['password'] != attrs.pop('password_confirm'):
            raise serializers.ValidationError("Passwords do not match")
        
        # Validate based on user type
        user_type = attrs.get('user_type')
        
        if user_type == 'STUDENT':
            if not attrs.get('usn'):
                raise serializers.ValidationError("USN is required for students")
            if not attrs['email'].endswith('@students.git.edu'):
                raise serializers.ValidationError(
                    "Student emails must end with @students.git.edu"
                )
        
        elif user_type in ['MENTOR', 'CLUB_ORGANIZER', 'ADMIN']:
            if not attrs.get('employee_id'):
                raise serializers.ValidationError(
                    "Employee ID is required for faculty/staff"
                )
            if not attrs['email'].endswith('@git.edu'):
                raise serializers.ValidationError(
                    "Faculty emails must end with @git.edu"
                )
        
        return attrs
    
    def create(self, validated_data):
        user_type = validated_data['user_type']
        first_name = validated_data.pop('first_name')
        last_name = validated_data.pop('last_name')
        
        # Create user
        user = User.objects.create_user(
            email=validated_data['email'],
            password=validated_data['password'],
            user_type=user_type
        )
        
        # Create profile based on user type
        if user_type == 'STUDENT':
            Student.objects.create(
                user=user,
                usn=validated_data['usn'],
                first_name=first_name,
                last_name=last_name
            )
        elif user_type in ['MENTOR', 'CLUB_ORGANIZER']:
            Mentor.objects.create(
                user=user,
                employee_id=validated_data['employee_id'],
                first_name=first_name,
                last_name=last_name
            )
        
        return user