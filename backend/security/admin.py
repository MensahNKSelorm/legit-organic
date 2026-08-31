from django.contrib import admin
from unfold.admin import ModelAdmin

from .models import AuditEvent


@admin.action(description='Export selected audit events to Excel')
def export_audit_events(modeladmin, request, queryset):
    from .exports import generate_audit_excel
    from .audit import record_event

    record_event(
        action='security.audit_exported',
        request=request,
        severity=AuditEvent.Severity.CRITICAL,
        metadata={'count': queryset.count()},
    )
    return generate_audit_excel(queryset.select_related('actor').order_by('-created_at'))


@admin.register(AuditEvent)
class AuditEventAdmin(ModelAdmin):
    actions = [export_audit_events]
    list_display = [
        'created_at',
        'severity',
        'action',
        'actor_email',
        'target_type',
        'target_label',
        'ip_address',
    ]
    list_filter = ['severity', 'action', 'target_type', 'created_at']
    search_fields = ['actor_email', 'action', 'target_label', 'target_id', 'reason']
    date_hierarchy = 'created_at'
    ordering = ['-created_at']
    readonly_fields = [
        'created_at',
        'severity',
        'action',
        'actor',
        'actor_email',
        'target_type',
        'target_id',
        'target_label',
        'reason',
        'before',
        'after',
        'ip_address',
        'user_agent',
        'metadata',
    ]

    def has_module_permission(self, request):
        return request.user.is_staff

    def has_view_permission(self, request, obj=None):
        if request.user.is_superuser or request.user.groups.filter(name='Executive Admin').exists():
            return True
        return obj is None or obj.actor_id == request.user.id

    def get_queryset(self, request):
        queryset = super().get_queryset(request)
        if request.user.is_superuser or request.user.groups.filter(name='Executive Admin').exists():
            return queryset
        return queryset.filter(actor=request.user)

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False

    def has_delete_permission(self, request, obj=None):
        return False

    def get_actions(self, request):
        if request.user.is_superuser or request.user.groups.filter(name='Executive Admin').exists():
            return super().get_actions(request)
        return {}
