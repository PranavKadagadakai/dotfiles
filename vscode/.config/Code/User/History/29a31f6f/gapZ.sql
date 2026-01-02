-- ============================================
-- CERTIFYTRACK DATABASE SCHEMA
-- Version: 2.0
-- Date: November 16, 2025
-- Based on: Detailed SRS for CertifyTrack
-- ============================================

-- ============================================
-- 1. USER MANAGEMENT TABLES
-- ============================================

-- Users Table (Base table for all user types)
CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    user_type VARCHAR(20) NOT NULL, -- 'STUDENT', 'MENTOR', 'CLUB_ORGANIZER', 'ADMIN'
    is_active BOOLEAN DEFAULT TRUE,
    is_email_verified BOOLEAN DEFAULT FALSE,
    email_verification_token VARCHAR(255),
    password_reset_token VARCHAR(255),
    password_reset_expires TIMESTAMP,
    last_login TIMESTAMP,
    failed_login_attempts INTEGER DEFAULT 0,
    account_locked_until TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Students Table
CREATE TABLE students (
    student_id SERIAL PRIMARY KEY,
    user_id INTEGER UNIQUE NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    usn VARCHAR(20) UNIQUE NOT NULL,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    phone VARCHAR(15),
    department VARCHAR(100),
    semester INTEGER,
    date_of_birth DATE,
    gender VARCHAR(10),
    address TEXT,
    profile_photo_url VARCHAR(500),
    mentor_id INTEGER REFERENCES mentors(mentor_id) ON DELETE SET NULL,
    max_event_registrations INTEGER DEFAULT 10,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Mentors Table (Faculty members)
CREATE TABLE mentors (
    mentor_id SERIAL PRIMARY KEY,
    user_id INTEGER UNIQUE NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    employee_id VARCHAR(20) UNIQUE NOT NULL,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    phone VARCHAR(15),
    department VARCHAR(100),
    designation VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 2. CLUB MANAGEMENT TABLES
-- ============================================

-- Clubs Table
CREATE TABLE clubs (
    club_id SERIAL PRIMARY KEY,
    club_name VARCHAR(100) UNIQUE NOT NULL,
    club_description TEXT,
    club_email VARCHAR(100),
    club_logo_url VARCHAR(500),
    faculty_coordinator_id INTEGER REFERENCES mentors(mentor_id) ON DELETE SET NULL,
    club_head_id INTEGER REFERENCES students(student_id) ON DELETE SET NULL,
    established_date DATE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Club Roles Table (Permission definitions)
CREATE TABLE club_roles (
    role_id SERIAL PRIMARY KEY,
    role_name VARCHAR(50) UNIQUE NOT NULL, -- 'HEAD', 'CO-COORDINATOR', 'MEMBER'
    can_create_events BOOLEAN DEFAULT FALSE,
    can_edit_events BOOLEAN DEFAULT FALSE,
    can_delete_events BOOLEAN DEFAULT FALSE,
    can_start_events BOOLEAN DEFAULT FALSE,
    can_end_events BOOLEAN DEFAULT FALSE,
    can_mark_attendance BOOLEAN DEFAULT FALSE,
    can_manage_bookings BOOLEAN DEFAULT FALSE,
    can_upload_templates BOOLEAN DEFAULT FALSE,
    can_generate_certificates BOOLEAN DEFAULT FALSE,
    can_view_reports BOOLEAN DEFAULT FALSE,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Club Members Table
CREATE TABLE club_members (
    member_id SERIAL PRIMARY KEY,
    club_id INTEGER NOT NULL REFERENCES clubs(club_id) ON DELETE CASCADE,
    student_id INTEGER NOT NULL REFERENCES students(student_id) ON DELETE CASCADE,
    role_id INTEGER NOT NULL REFERENCES club_roles(role_id),
    joined_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    UNIQUE(club_id, student_id)
);

-- ============================================
-- 3. HALL/VENUE MANAGEMENT TABLES
-- ============================================

-- Halls/Venues Table
CREATE TABLE halls (
    hall_id SERIAL PRIMARY KEY,
    hall_name VARCHAR(100) UNIQUE NOT NULL,
    hall_code VARCHAR(20) UNIQUE NOT NULL,
    location VARCHAR(200),
    capacity INTEGER NOT NULL,
    facilities TEXT, -- JSON array of available facilities
    description TEXT,
    is_available BOOLEAN DEFAULT TRUE,
    requires_approval BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Hall Bookings Table
CREATE TABLE hall_bookings (
    booking_id SERIAL PRIMARY KEY,
    hall_id INTEGER NOT NULL REFERENCES halls(hall_id) ON DELETE CASCADE,
    event_id INTEGER REFERENCES events(event_id) ON DELETE CASCADE,
    booked_by INTEGER NOT NULL REFERENCES club_members(member_id),
    booking_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    setup_buffer_minutes INTEGER DEFAULT 30,
    cleanup_buffer_minutes INTEGER DEFAULT 15,
    booking_status VARCHAR(20) DEFAULT 'PENDING', -- 'PENDING', 'APPROVED', 'REJECTED', 'CANCELLED', 'COMPLETED'
    approved_by INTEGER REFERENCES users(user_id),
    approved_at TIMESTAMP,
    rejection_reason TEXT,
    cancellation_reason TEXT,
    cancelled_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT no_end_before_start CHECK (end_time > start_time)
);

-- ============================================
-- 4. EVENT MANAGEMENT TABLES
-- ============================================

-- Events Table
CREATE TABLE events (
    event_id SERIAL PRIMARY KEY,
    club_id INTEGER NOT NULL REFERENCES clubs(club_id) ON DELETE CASCADE,
    event_name VARCHAR(200) NOT NULL,
    event_description TEXT,
    event_type VARCHAR(50), -- 'TECHNICAL', 'CULTURAL', 'SPORTS', 'WORKSHOP', 'SEMINAR', etc.
    event_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME,
    max_participants INTEGER,
    registration_deadline TIMESTAMP,
    venue_details VARCHAR(200),
    banner_image_url VARCHAR(500),
    created_by INTEGER NOT NULL REFERENCES club_members(member_id),
    last_edited_by INTEGER REFERENCES club_members(member_id),
    last_edited_at TIMESTAMP,
    event_status VARCHAR(20) DEFAULT 'DRAFT', -- 'DRAFT', 'SCHEDULED', 'ONGOING', 'COMPLETED', 'CANCELLED'
    event_started_at TIMESTAMP,
    event_ended_at TIMESTAMP,
    started_by INTEGER REFERENCES club_members(member_id),
    ended_by INTEGER REFERENCES club_members(member_id),
    cancellation_reason TEXT,
    cancelled_by INTEGER REFERENCES users(user_id),
    cancelled_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT future_event_date CHECK (event_date >= CURRENT_DATE OR event_status != 'DRAFT')
);

-- Event Edit History Table (Audit trail)
CREATE TABLE event_edit_history (
    edit_id SERIAL PRIMARY KEY,
    event_id INTEGER NOT NULL REFERENCES events(event_id) ON DELETE CASCADE,
    edited_by INTEGER NOT NULL REFERENCES club_members(member_id),
    field_changed VARCHAR(100) NOT NULL,
    old_value TEXT,
    new_value TEXT,
    change_reason TEXT,
    edited_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Event Registrations Table
CREATE TABLE event_registrations (
    registration_id SERIAL PRIMARY KEY,
    event_id INTEGER NOT NULL REFERENCES events(event_id) ON DELETE CASCADE,
    student_id INTEGER NOT NULL REFERENCES students(student_id) ON DELETE CASCADE,
    registration_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    registration_status VARCHAR(20) DEFAULT 'REGISTERED', -- 'REGISTERED', 'WAITLISTED', 'CANCELLED', 'ATTENDED'
    cancelled_at TIMESTAMP,
    cancellation_reason TEXT,
    waitlist_position INTEGER,
    promoted_from_waitlist_at TIMESTAMP,
    UNIQUE(event_id, student_id)
);

-- Attendance Table
CREATE TABLE attendance (
    attendance_id SERIAL PRIMARY KEY,
    event_id INTEGER NOT NULL REFERENCES events(event_id) ON DELETE CASCADE,
    student_id INTEGER NOT NULL REFERENCES students(student_id) ON DELETE CASCADE,
    attendance_status VARCHAR(20) NOT NULL, -- 'PRESENT', 'ABSENT'
    check_in_time TIMESTAMP,
    marked_by INTEGER NOT NULL REFERENCES club_members(member_id),
    marked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    marking_method VARCHAR(20), -- 'MANUAL', 'QR_CODE', 'BIOMETRIC'
    remarks TEXT,
    UNIQUE(event_id, student_id)
);

-- ============================================
-- 5. CERTIFICATE MANAGEMENT TABLES
-- ============================================

-- Certificates Table
CREATE TABLE certificates (
    certificate_id SERIAL PRIMARY KEY,
    event_id INTEGER NOT NULL REFERENCES events(event_id) ON DELETE CASCADE,
    student_id INTEGER NOT NULL REFERENCES students(student_id) ON DELETE CASCADE,
    certificate_file_path VARCHAR(500) NOT NULL,
    issue_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(event_id, student_id)
);

-- ============================================
-- 6. AICTE POINTS MANAGEMENT TABLES
-- ============================================

-- AICTE Categories Table
CREATE TABLE aicte_categories (
    category_id SERIAL PRIMARY KEY,
    category_name VARCHAR(100) UNIQUE NOT NULL, -- 'TECHNICAL', 'CULTURAL', 'SPORTS', 'SOCIAL_SERVICE', etc.
    category_code VARCHAR(20) UNIQUE NOT NULL,
    category_description TEXT,
    min_points_required INTEGER, -- Minimum points required per semester
    max_points_allowed INTEGER, -- Maximum points allowed per semester
    validation_rules JSON, -- Custom validation rules
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Event AICTE Configuration (Links events to categories and points)
CREATE TABLE event_aicte_config (
    config_id SERIAL PRIMARY KEY,
    event_id INTEGER UNIQUE NOT NULL REFERENCES events(event_id) ON DELETE CASCADE,
    category_id INTEGER NOT NULL REFERENCES aicte_categories(category_id),
    points_allocated INTEGER NOT NULL,
    requires_mentor_approval BOOLEAN DEFAULT TRUE,
    auto_approve_after_days INTEGER DEFAULT 7,
    CONSTRAINT positive_points CHECK (points_allocated > 0)
);

-- AICTE Point Transactions Table
CREATE TABLE aicte_point_transactions (
    transaction_id SERIAL PRIMARY KEY,
    student_id INTEGER NOT NULL REFERENCES students(student_id) ON DELETE CASCADE,
    event_id INTEGER NOT NULL REFERENCES events(event_id) ON DELETE CASCADE,
    category_id INTEGER NOT NULL REFERENCES aicte_categories(category_id),
    points_allocated INTEGER NOT NULL,
    transaction_status VARCHAR(20) DEFAULT 'PENDING', -- 'PENDING', 'APPROVED', 'REJECTED', 'OVERRIDDEN'
    approved_by INTEGER REFERENCES mentors(mentor_id),
    approved_at TIMESTAMP,
    rejection_reason TEXT,
    override_reason TEXT,
    overridden_by INTEGER REFERENCES mentors(mentor_id),
    overridden_at TIMESTAMP,
    original_points INTEGER, -- For override tracking
    transaction_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    auto_approved BOOLEAN DEFAULT FALSE,
    UNIQUE(student_id, event_id)
);

-- AICTE Points Ledger (Summary view - can be a materialized view)
CREATE TABLE aicte_points_ledger (
    ledger_id SERIAL PRIMARY KEY,
    student_id INTEGER NOT NULL REFERENCES students(student_id) ON DELETE CASCADE,
    category_id INTEGER NOT NULL REFERENCES aicte_categories(category_id),
    semester INTEGER NOT NULL,
    academic_year VARCHAR(20) NOT NULL,
    total_points INTEGER DEFAULT 0,
    pending_points INTEGER DEFAULT 0,
    approved_points INTEGER DEFAULT 0,
    rejected_points INTEGER DEFAULT 0,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(student_id, category_id, semester, academic_year)
);

-- ============================================
-- 7. NOTIFICATION MANAGEMENT TABLES
-- ============================================

-- Notification Templates Table
CREATE TABLE notification_templates (
    template_id SERIAL PRIMARY KEY,
    template_name VARCHAR(100) UNIQUE NOT NULL,
    notification_type VARCHAR(50) NOT NULL, -- 'EMAIL', 'SMS', 'IN_APP'
    event_trigger VARCHAR(100) NOT NULL, -- 'USER_REGISTRATION', 'EVENT_REGISTRATION', etc.
    subject_template VARCHAR(200), -- For emails
    body_template TEXT NOT NULL,
    template_variables JSON,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Notifications Table
CREATE TABLE notifications (
    notification_id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    notification_type VARCHAR(20) NOT NULL, -- 'INFO', 'SUCCESS', 'WARNING', 'ERROR'
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    action_url VARCHAR(500),
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP DEFAULT (CURRENT_TIMESTAMP + INTERVAL '30 days')
);

-- Email Queue Table
CREATE TABLE email_queue (
    queue_id SERIAL PRIMARY KEY,
    recipient_email VARCHAR(100) NOT NULL,
    subject VARCHAR(200) NOT NULL,
    body_html TEXT NOT NULL,
    body_text TEXT,
    attachment_paths JSON, -- Array of file paths
    status VARCHAR(20) DEFAULT 'PENDING', -- 'PENDING', 'SENT', 'FAILED', 'RETRY'
    retry_count INTEGER DEFAULT 0,
    max_retries INTEGER DEFAULT 3,
    last_attempt_at TIMESTAMP,
    sent_at TIMESTAMP,
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Notification Preferences Table
CREATE TABLE notification_preferences (
    preference_id SERIAL PRIMARY KEY,
    user_id INTEGER UNIQUE NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    email_enabled BOOLEAN DEFAULT TRUE,
    sms_enabled BOOLEAN DEFAULT FALSE,
    in_app_enabled BOOLEAN DEFAULT TRUE,
    event_reminders BOOLEAN DEFAULT TRUE,
    registration_confirmations BOOLEAN DEFAULT TRUE,
    certificate_notifications BOOLEAN DEFAULT TRUE,
    point_approval_notifications BOOLEAN DEFAULT TRUE,
    booking_notifications BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 8. REPORTING AND ANALYTICS TABLES
-- ============================================

-- Event Reports Table
CREATE TABLE event_reports (
    report_id SERIAL PRIMARY KEY,
    event_id INTEGER NOT NULL REFERENCES events(event_id) ON DELETE CASCADE,
    total_registered INTEGER DEFAULT 0,
    total_waitlisted INTEGER DEFAULT 0,
    total_attended INTEGER DEFAULT 0,
    total_absent INTEGER DEFAULT 0,
    attendance_percentage DECIMAL(5,2),
    certificates_generated INTEGER DEFAULT 0,
    points_allocated INTEGER DEFAULT 0,
    report_generated_by INTEGER REFERENCES club_members(member_id),
    report_generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    report_file_path VARCHAR(500)
);

-- System Analytics Table (Aggregated metrics)
CREATE TABLE system_analytics (
    analytics_id SERIAL PRIMARY KEY,
    metric_name VARCHAR(100) NOT NULL,
    metric_value DECIMAL(15,2) NOT NULL,
    metric_category VARCHAR(50), -- 'EVENTS', 'USERS', 'BOOKINGS', 'CERTIFICATES', 'POINTS'
    measurement_date DATE NOT NULL,
    metadata JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 9. AUDIT AND SECURITY TABLES
-- ============================================

-- Audit Logs Table
CREATE TABLE audit_logs (
    log_id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(user_id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL, -- 'CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', etc.
    entity_type VARCHAR(50) NOT NULL, -- 'USER', 'EVENT', 'BOOKING', 'CERTIFICATE', etc.
    entity_id INTEGER,
    ip_address VARCHAR(45),
    user_agent TEXT,
    changes_made JSON, -- Before/after values
    action_result VARCHAR(20), -- 'SUCCESS', 'FAILURE'
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Session Tokens Table (JWT tracking)
CREATE TABLE session_tokens (
    token_id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    token_hash VARCHAR(255) UNIQUE NOT NULL,
    issued_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    is_revoked BOOLEAN DEFAULT FALSE,
    revoked_at TIMESTAMP,
    ip_address VARCHAR(45),
    user_agent TEXT,
    CONSTRAINT valid_expiry CHECK (expires_at > issued_at)
);

-- ============================================
-- 10. CONFIGURATION TABLES
-- ============================================

-- System Configuration Table
CREATE TABLE system_config (
    config_id SERIAL PRIMARY KEY,
    config_key VARCHAR(100) UNIQUE NOT NULL,
    config_value TEXT NOT NULL,
    config_type VARCHAR(20) NOT NULL, -- 'STRING', 'INTEGER', 'BOOLEAN', 'JSON'
    description TEXT,
    is_public BOOLEAN DEFAULT FALSE, -- Can be accessed by non-admin users
    last_modified_by INTEGER REFERENCES users(user_id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Academic Calendar Table
CREATE TABLE academic_calendar (
    calendar_id SERIAL PRIMARY KEY,
    academic_year VARCHAR(20) NOT NULL,
    semester INTEGER NOT NULL,
    semester_start_date DATE NOT NULL,
    semester_end_date DATE NOT NULL,
    exam_start_date DATE,
    exam_end_date DATE,
    vacation_start_date DATE,
    vacation_end_date DATE,
    is_current BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(academic_year, semester)
);

-- ============================================
-- INDEXES FOR PERFORMANCE OPTIMIZATION
-- ============================================

-- User Management Indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_type ON users(user_type);
CREATE INDEX idx_students_usn ON students(usn);
CREATE INDEX idx_students_user_id ON students(user_id);
CREATE INDEX idx_students_mentor ON students(mentor_id);
CREATE INDEX idx_mentors_employee_id ON mentors(employee_id);

-- Club Management Indexes
CREATE INDEX idx_club_members_club ON club_members(club_id);
CREATE INDEX idx_club_members_student ON club_members(student_id);
CREATE INDEX idx_club_members_role ON club_members(role_id);

-- Hall Booking Indexes
CREATE INDEX idx_hall_bookings_hall ON hall_bookings(hall_id);
CREATE INDEX idx_hall_bookings_event ON hall_bookings(event_id);
CREATE INDEX idx_hall_bookings_date ON hall_bookings(booking_date);
CREATE INDEX idx_hall_bookings_status ON hall_bookings(booking_status);
CREATE INDEX idx_hall_bookings_datetime ON hall_bookings(booking_date, start_time, end_time);

-- Event Management Indexes
CREATE INDEX idx_events_club ON events(club_id);
CREATE INDEX idx_events_date ON events(event_date);
CREATE INDEX idx_events_status ON events(event_status);
CREATE INDEX idx_events_type ON events(event_type);
CREATE INDEX idx_event_registrations_event ON event_registrations(event_id);
CREATE INDEX idx_event_registrations_student ON event_registrations(student_id);
CREATE INDEX idx_event_registrations_status ON event_registrations(registration_status);
CREATE INDEX idx_attendance_event ON attendance(event_id);
CREATE INDEX idx_attendance_student ON attendance(student_id);

-- Certificate Indexes
CREATE INDEX idx_certificates_event ON certificates(event_id);
CREATE INDEX idx_certificates_student ON certificates(student_id);
CREATE INDEX idx_certificates_number ON certificates(certificate_number);

-- AICTE Points Indexes
CREATE INDEX idx_aicte_transactions_student ON aicte_point_transactions(student_id);
CREATE INDEX idx_aicte_transactions_event ON aicte_point_transactions(event_id);
CREATE INDEX idx_aicte_transactions_status ON aicte_point_transactions(transaction_status);
CREATE INDEX idx_aicte_ledger_student ON aicte_points_ledger(student_id);
CREATE INDEX idx_aicte_ledger_category ON aicte_points_ledger(category_id);

-- Notification Indexes
CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(is_read);
CREATE INDEX idx_email_queue_status ON email_queue(status);

-- Audit Indexes
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_created ON audit_logs(created_at);

-- ============================================
-- CONSTRAINTS AND TRIGGERS
-- ============================================

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to relevant tables
CREATE TRIGGER update_users_timestamp BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_students_timestamp BEFORE UPDATE ON students
    FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_mentors_timestamp BEFORE UPDATE ON mentors
    FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_clubs_timestamp BEFORE UPDATE ON clubs
    FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_halls_timestamp BEFORE UPDATE ON halls
    FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_hall_bookings_timestamp BEFORE UPDATE ON hall_bookings
    FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_events_timestamp BEFORE UPDATE ON events
    FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_aicte_categories_timestamp BEFORE UPDATE ON aicte_categories
    FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_notification_preferences_timestamp BEFORE UPDATE ON notification_preferences
    FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_system_config_timestamp BEFORE UPDATE ON system_config
    FOR EACH ROW EXECUTE FUNCTION update_timestamp();

-- ============================================
-- INITIAL DATA POPULATION
-- ============================================

-- Insert default club roles
INSERT INTO club_roles (role_name, can_create_events, can_edit_events, can_delete_events, 
                        can_start_events, can_end_events, can_mark_attendance, 
                        can_manage_bookings, can_upload_templates, can_generate_certificates,
                        can_view_reports, description) 
VALUES 
('HEAD', TRUE, TRUE, TRUE, TRUE, TRUE, TRUE, TRUE, TRUE, TRUE, TRUE, 
 'Club Head with full permissions for all club operations'),
 
('CO-COORDINATOR', TRUE, TRUE, FALSE, TRUE, TRUE, TRUE, TRUE, TRUE, TRUE, TRUE, 
 'Co-coordinator can manage events, bookings, and certificates but cannot delete events'),
 
('MEMBER', TRUE, FALSE, FALSE, FALSE, FALSE, TRUE, FALSE, FALSE, FALSE, FALSE, 
 'Regular member can create events and mark attendance during active events');

-- Insert default AICTE categories
INSERT INTO aicte_categories (category_name, category_code, category_description, 
                              min_points_required, max_points_allowed, is_active)
VALUES
('TECHNICAL', 'TECH', 'Technical workshops, hackathons, coding competitions, project exhibitions', 15, 50, TRUE),
('CULTURAL', 'CULT', 'Cultural events, dance, music, drama, literary activities', 10, 30, TRUE),
('SPORTS', 'SPRT', 'Sports events, tournaments, athletic competitions', 10, 30, TRUE),
('SOCIAL_SERVICE', 'SOCSVC', 'NSS, community service, volunteering activities', 10, 40, TRUE),
('ENTREPRENEURSHIP', 'ENTR', 'Startup events, business plan competitions, innovation challenges', 5, 25, TRUE),
('LEADERSHIP', 'LEAD', 'Leadership programs, club management, organizational activities', 5, 20, TRUE);

-- Insert default system configuration
INSERT INTO system_config (config_key, config_value, config_type, description, is_public)
VALUES
('MAX_EVENT_REGISTRATIONS', '10', 'INTEGER', 'Maximum concurrent event registrations per student', TRUE),
('CERTIFICATE_VALIDITY_YEARS', '5', 'INTEGER', 'Number of years certificates are stored', FALSE),
('AUTO_APPROVE_POINTS_DAYS', '7', 'INTEGER', 'Days after which points are auto-approved', FALSE),
('BOOKING_ADVANCE_HOURS', '24', 'INTEGER', 'Minimum hours in advance for hall booking', TRUE),
('EMAIL_RETRY_ATTEMPTS', '3', 'INTEGER', 'Maximum email sending retry attempts', FALSE),
('SESSION_TIMEOUT_MINUTES', '30', 'INTEGER', 'User session timeout in minutes', FALSE),
('FAILED_LOGIN_LOCKOUT_MINUTES', '15', 'INTEGER', 'Account lockout duration after failed logins', FALSE),
('MAX_FAILED_LOGIN_ATTEMPTS', '5', 'INTEGER', 'Maximum failed login attempts before lockout', FALSE);

-- ============================================
-- END OF SCHEMA
-- ============================================