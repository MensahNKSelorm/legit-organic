from django.conf import settings
from django.contrib.auth.hashers import check_password, make_password
from django.db import models


class AuditEvent(models.Model):
    class Severity(models.TextChoices):
        INFO = 'info', 'Information'
        SENSITIVE = 'sensitive', 'Sensitive'
        WARNING = 'warning', 'Warning'
        CRITICAL = 'critical', 'Critical'

    actor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='security_audit_events',
    )
    actor_email = models.EmailField(blank=True)
    action = models.CharField(max_length=100, db_index=True)
    severity = models.CharField(
        max_length=20,
        choices=Severity.choices,
        default=Severity.INFO,
        db_index=True,
    )
    target_type = models.CharField(max_length=100, blank=True, db_index=True)
    target_id = models.CharField(max_length=100, blank=True)
    target_label = models.CharField(max_length=255, blank=True)
    reason = models.TextField(blank=True)
    before = models.JSONField(default=dict, blank=True)
    after = models.JSONField(default=dict, blank=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.CharField(max_length=500, blank=True)
    metadata = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        ordering = ['-created_at']
        permissions = [('export_auditevent', 'Can export audit events')]
        indexes = [
            models.Index(fields=['target_type', 'target_id', '-created_at']),
            models.Index(fields=['actor_email', '-created_at']),
        ]

    def save(self, *args, **kwargs):
        if self.pk:
            raise RuntimeError('Audit events are immutable.')
        return super().save(*args, **kwargs)

    def delete(self, *args, **kwargs):
        raise RuntimeError('Audit events cannot be deleted.')

    def __str__(self):
        return f'{self.created_at:%Y-%m-%d %H:%M} · {self.action}'


class StaffSecurityProfile(models.Model):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='staff_security',
        limit_choices_to={'is_staff': True},
    )
    enrolled_at = models.DateTimeField(null=True, blank=True)
    security_version = models.PositiveIntegerField(default=1)
    recovery_codes_generated_at = models.DateTimeField(null=True, blank=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f'Security · {self.user.email}'


class RecoveryCode(models.Model):
    profile = models.ForeignKey(
        StaffSecurityProfile, on_delete=models.CASCADE, related_name='recovery_codes'
    )
    code_hash = models.CharField(max_length=128)
    used_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def set_code(self, code):
        self.code_hash = make_password(code)

    def matches(self, code):
        return self.used_at is None and check_password(code, self.code_hash)

    def __str__(self):
        return f'Recovery code · {self.profile.user.email}'
