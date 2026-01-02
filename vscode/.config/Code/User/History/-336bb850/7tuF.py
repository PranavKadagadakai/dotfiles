from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    
    # API endpoints
    path('api/v1/auth/', include('apps.users.urls')),
    path('api/v1/students/', include('apps.students.urls')),
    path('api/v1/mentors/', include('apps.mentors.urls')),
    path('api/v1/clubs/', include('apps.clubs.urls')),
    path('api/v1/events/', include('apps.events.urls')),
    path('api/v1/halls/', include('apps.halls.urls')),
    path('api/v1/certificates/', include('apps.certificates.urls')),
    path('api/v1/aicte-points/', include('apps.aicte_points.urls')),
    path('api/v1/notifications/', include('apps.notifications.urls')),
    path('api/v1/reports/', include('apps.reports.urls')),
    path('api/v1/admin/', include('apps.audit.urls')),
    path('api/v1/core/', include('apps.core.urls')),
]

# Serve media files in development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
    
    # Debug toolbar
    if 'debug_toolbar' in settings.INSTALLED_APPS:
        import debug_toolbar
        urlpatterns = [
            path('__debug__/', include(debug_toolbar.urls)),
        ] + urlpatterns