export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000/api/v1";

export const ENDPOINTS = {
  // Auth
  AUTH: {
    REGISTER: "/auth/register/",
    LOGIN: "/auth/login/",
    REFRESH: "/auth/token/refresh/",
    PROFILE: "/auth/profile/",
    CHANGE_PASSWORD: "/auth/change-password/",
  },

  // Events
  EVENTS: {
    LIST: "/events/",
    DETAIL: (id) => `/events/${id}/`,
    REGISTER: (id) => `/events/${id}/register/`,
    ATTENDANCE: (id) => `/events/${id}/attendance/`,
    START: (id) => `/events/${id}/start/`,
    COMPLETE: (id) => `/events/${id}/complete/`,
  },

  // Certificates
  CERTIFICATES: {
    LIST: "/certificates/",
    DETAIL: (id) => `/certificates/${id}/`,
    DOWNLOAD: (id) => `/certificates/${id}/download/`,
    VERIFY: "/certificates/verify/",
  },

  // AICTE Points
  POINTS: {
    LEDGER: "/aicte-points/ledger/",
    TRANSACTIONS: "/aicte-points/transactions/",
    APPROVE: (id) => `/aicte-points/transactions/${id}/approve/`,
    REJECT: (id) => `/aicte-points/transactions/${id}/reject/`,
  },

  // Halls
  HALLS: {
    LIST: "/halls/",
    DETAIL: (id) => `/halls/${id}/`,
    BOOKINGS: "/halls/bookings/",
    CHECK_AVAILABILITY: "/halls/check-availability/",
  },

  // Clubs
  CLUBS: {
    LIST: "/clubs/",
    DETAIL: (id) => `/clubs/${id}/`,
    MEMBERS: (id) => `/clubs/${id}/members/`,
  },

  // Reports
  REPORTS: {
    STUDENT_ACTIVITY: "/reports/student-activity/",
    EVENT_STATISTICS: "/reports/event-statistics/",
    CLUB_PERFORMANCE: "/reports/club-performance/",
  },

  // Notifications
  NOTIFICATIONS: {
    LIST: "/notifications/",
    MARK_READ: (id) => `/notifications/${id}/mark-read/`,
    PREFERENCES: "/notifications/preferences/",
  },
};
