from rest_framework import viewsets, generics, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from django.utils import timezone
from .models import Event, EventRegistration, Attendance
from .serializers import EventSerializer, EventRegistrationSerializer, AttendanceSerializer
from apps.clubs.models import ClubMember
from apps.students.models import Student
from apps.core.permissions import IsClubOrganizerOrReadOnly

class EventViewSet(viewsets.ModelViewSet):
    queryset = Event.objects.all()
    serializer_class = EventSerializer
    permission_classes = [IsAuthenticated, IsClubOrganizerOrReadOnly]
    filterset_fields = ['club', 'event_status', 'event_type', 'event_date']
    search_fields = ['event_name', 'event_description']
    ordering_fields = ['event_date', 'created_at']
    
    def get_queryset(self):
        queryset = super().get_queryset()
        user = self.request.user
        
        # Filter based on user type
        if user.user_type == 'STUDENT':
            # Students see all scheduled and ongoing events
            queryset = queryset.filter(
                event_status__in=['SCHEDULED', 'ONGOING']
            )
        elif user.user_type == 'CLUB_ORGANIZER':
            # Club organizers see their club's events
            club_member = ClubMember.objects.filter(
                student__user=user
            ).first()
            if club_member:
                queryset = queryset.filter(club=club_member.club)
        
        return queryset.select_related('club', 'created_by__student')
    
    def perform_create(self, serializer):
        # Get club member record
        club_member = ClubMember.objects.filter(
            student__user=self.request.user
        ).first()
        
        if not club_member:
            raise serializers.ValidationError(
                "You must be a club member to create events"
            )
        
        serializer.save(
            created_by=club_member,
            club=club_member.club
        )


class RegisterForEventView(generics.CreateAPIView):
    serializer_class = EventRegistrationSerializer
    permission_classes = [IsAuthenticated]
    
    def create(self, request, *args, **kwargs):
        event = get_object_or_404(Event, pk=kwargs['pk'])
        
        # Check if user is a student
        if request.user.user_type != 'STUDENT':
            return Response(
                {'error': 'Only students can register for events'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        student = Student.objects.get(user=request.user)
        
        # Check if already registered
        if EventRegistration.objects.filter(
            event=event, student=student
        ).exists():
            return Response(
                {'error': 'Already registered for this event'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check event capacity
        if event.max_participants:
            current_count = event.registrations.filter(
                registration_status='REGISTERED'
            ).count()
            if current_count >= event.max_participants:
                # Add to waitlist
                EventRegistration.objects.create(
                    event=event,
                    student=student,
                    registration_status='WAITLISTED'
                )
                return Response(
                    {'message': 'Added to waitlist'},
                    status=status.HTTP_201_CREATED
                )
        
        # Create registration
        registration = EventRegistration.objects.create(
            event=event,
            student=student
        )
        
        serializer = self.get_serializer(registration)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class MarkAttendanceView(generics.CreateAPIView):
    serializer_class = AttendanceSerializer
    permission_classes = [IsAuthenticated]
    
    def create(self, request, *args, **kwargs):
        event = get_object_or_404(Event, pk=kwargs['pk'])
        
        # Check if user has permission to mark attendance
        club_member = ClubMember.objects.filter(
            student__user=request.user,
            club=event.club
        ).first()
        
        if not club_member or not club_member.role.can_mark_attendance:
            return Response(
                {'error': 'You do not have permission to mark attendance'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Get student USNs and attendance status from request
        attendance_data = request.data.get('attendance', [])
        
        created_count = 0
        for item in attendance_data:
            student = get_object_or_404(Student, usn=item['usn'])
            
            Attendance.objects.update_or_create(
                event=event,
                student=student,
                defaults={
                    'attendance_status': item['status'],
                    'marked_by': club_member,
                    'check_in_time': timezone.now() if item['status'] == 'PRESENT' else None
                }
            )
            created_count += 1
        
        return Response(
            {'message': f'Attendance marked for {created_count} students'},
            status=status.HTTP_201_CREATED
        )


class StartEventView(generics.UpdateAPIView):
    queryset = Event.objects.all()
    permission_classes = [IsAuthenticated]
    
    def update(self, request, *args, **kwargs):
        event = self.get_object()
        
        if event.event_status != 'SCHEDULED':
            return Response(
                {'error': 'Event must be in scheduled state'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        club_member = ClubMember.objects.filter(
            student__user=request.user,
            club=event.club
        ).first()
        
        if not club_member or not club_member.role.can_start_events:
            return Response(
                {'error': 'You do not have permission to start events'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        event.event_status = 'ONGOING'
        event.event_started_at = timezone.now()
        event.started_by = club_member
        event.save()
        
        serializer = EventSerializer(event)
        return Response(serializer.data)


class CompleteEventView(generics.UpdateAPIView):
    queryset = Event.objects.all()
    permission_classes = [IsAuthenticated]
    
    def update(self, request, *args, **kwargs):
        event = self.get_object()
        
        if event.event_status != 'ONGOING':
            return Response(
                {'error': 'Event must be ongoing to complete'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        club_member = ClubMember.objects.filter(
            student__user=request.user,
            club=event.club
        ).first()
        
        if not club_member or not club_member.role.can_end_events:
            return Response(
                {'error': 'You do not have permission to complete events'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        event.event_status = 'COMPLETED'
        event.event_ended_at = timezone.now()
        event.ended_by = club_member
        event.save()
        
        # Trigger certificate generation and point allocation
        # This would be done asynchronously with Celery
        from apps.events.tasks import generate_certificates_and_allocate_points
        generate_certificates_and_allocate_points.delay(event.id)
        
        serializer = EventSerializer(event)
        return Response(serializer.data)