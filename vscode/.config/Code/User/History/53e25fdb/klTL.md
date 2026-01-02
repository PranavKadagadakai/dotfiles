# Attendance Feature Implementation Plan

## Overview

This document outlines the implementation plan for adding an attendance feature to the student dashboard. Students should be able to mark their attendance for registered events that are currently ongoing/happening.

## Requirements Analysis

- Students can mark attendance only for registered events
- Attendance can only be marked when the event is in progress (ongoing state)
- Attendance marking should be simple - a single button click
- Once attendance is marked, students receive confirmation
- Attendance status should update immediately on the dashboard
- Invalid attendance attempts should show appropriate error messages

## Current Status

- Event registration workflow is implemented with registration states
- Backend supports event statuses (scheduled, ongoing, completed)
- EventRegistration model tracks student-event relationships

## Backend Implementation Plan

### 1. Update Event Model

- Add method to check if attendance can be marked (event is ongoing)
- Ensure proper status transitions

### 2. Update EventAttendance Model

- Add `marked_by_student` field to distinguish between organizer-uploaded and student-self-marked attendance
- Add validation to prevent duplicate attendance marking

### 3. Create Attendance Endpoint

- `POST /api/events/{event_id}/mark_attendance/`
- Student can only mark attendance for their registered events
- Validate that event is currently in progress
- Validate student has a REGISTERED status for the event
- Create EventAttendance record with is_present=True
- Update EventRegistration status to 'ATTENDED' when student marks attendance

### 4. Update EventSerializer

- Add logic to determine if event is currently in progress for attendance marking
- Include attendance-eligible status in event data

### 5. Event Status Logic

- Events should transition to 'ongoing' based on event start time
- Consider time window for attendance marking (e.g., during event time plus buffer)

## Frontend Implementation Plan

### 1. Update StudentDashboard

- Add attendance marking handler function
- Refresh event data after successful attendance marking

### 2. Update EventCard Component

- Add "Mark Attendance" button for registered events when they are in progress
- Show attendance confirmation when event has been attended
- Disable attendance button after marking or when not eligible

### 3. Add Attendance UI Elements

- Clear visual indication of attendance eligibility
- Consistent button styling for attendance action
- Success/error feedback for attendance actions

## Implementation Steps

### Phase 1: Backend API Development

1. Add `marked_by_student` field to EventAttendance model
2. Create `mark_attendance` action in EventViewSet
3. Add validation logic for attendance eligibility
4. Update event serialization to include attendance status

### Phase 2: Event Status Management

1. Implement event status transition logic (scheduled → ongoing based on time)
2. Add database management command to update event statuses
3. Consider using Celery/background tasks for status updates

### Phase 3: Frontend Development

1. Add attendance button to EventCard for eligible events
2. Implement attendance success/error handling
3. Update dashboard to reflect attendance changes immediately

### Phase 4: Testing and Validation

1. Test attendance marking for various event states
2. Test edge cases (cancelled events, invalid registrations)
3. Validate database consistency after attendance marking

## Workflow Details

### Attendance Eligibility Check

```python
def can_mark_attendance(student, event):
    # Student has REGISTERED status
    registration = EventRegistration.objects.filter(
        student=student, event=event,
        status='REGISTERED'
    ).first()

    # Event is currently in progress (ongoing status)
    current_time = timezone.now().time()
    current_date = timezone.now().date()

    if event.event_date != current_date:
        return False

    # Check if current time is within event time window
    event_start = event.start_time
    event_end = event.end_time or event.start_time

    # Allow attendance marking with 30-minute buffer before and after
    buffer_start = (datetime.combine(current_date, event_start) - timedelta(minutes=30)).time()
    buffer_end = (datetime.combine(current_date, event_end) + timedelta(minutes=30)).time()

    return buffer_start <= current_time <= buffer_end
```

### Attendance Marking Process

1. Student clicks "Mark Attendance" button
2. Frontend sends POST request to `/api/events/{id}/mark_attendance/`
3. Backend validates eligibility (registration status, event timing)
4. Creates EventAttendance record with `is_present=True`, `marked_by_student=True`
5. Updates EventRegistration status to 'ATTENDED'
6. Returns success response
7. Frontend updates UI to show attendance confirmation

### UI States

- **Not Registered**: Show "Register" button
- **Registered + Event Not Started**: Show "Cancel Registration" button
- **Registered + Event In Progress**: Show "Mark Attendance" button
- **Attended**: Show "✓ Event Attended" confirmation
- **Attendance Not Allowed**: Show appropriate message or disable attendance

## Error Handling

- Event not in progress: "Attendance can only be marked during the event time"
- No registration: "You need to register for this event first"
- Invalid event status: "This event is not accepting attendance at this time"
- Network/server errors: "Failed to mark attendance. Please try again."

## Security Considerations

- Only authenticated students can mark attendance
- Students can only mark attendance for events they're registered for
- Rate limiting to prevent attendance spam
- Audit logging for attendance modifications

## Future Enhancements

- QR code-based attendance verification
- Location-based attendance (GPS verification)
- Biometric attendance marking
- Integration with NFC/Bluetooth attendance systems
- Batch attendance processing for large events

## Integration Points

- Certificate generation: Use attendance records for certificate eligibility
- AICTE point calculation: Link to attendance records
- Reporting: Include self-marked vs organizer-marked attendance stats
- Notifications: Send confirmation when attendance is marked

## Testing Scenarios

1. Student attempts to mark attendance before event starts
2. Student marks attendance during event time window
3. Student attempts duplicate attendance marking
4. Student marks attendance after event ends
5. Unregistered user attempts to mark attendance
6. System behavior during network failures
7. Database rollback on failed attendance marking

## Deployment Checklist

- [ ] Backend API endpoints tested
- [ ] Frontend components updated and tested
- [ ] Database migrations applied
- [ ] Event status update mechanism in place
- [ ] Error handling implemented
- [ ] User feedback mechanisms working
- [ ] Security validations in place
- [ ] Performance testing completed
- [ ] Edge cases handled

This plan ensures a comprehensive and user-friendly attendance marking system that integrates seamlessly with the existing event registration workflow.
