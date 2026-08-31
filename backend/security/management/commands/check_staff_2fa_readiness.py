from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand, CommandError
from django_otp.plugins.otp_totp.models import TOTPDevice


class Command(BaseCommand):
    help = 'Verify every active staff account has a confirmed authenticator before enforcement.'

    def handle(self, *args, **options):
        staff = get_user_model().objects.filter(is_staff=True, is_active=True)
        enrolled_ids = set(
            TOTPDevice.objects.filter(
                user__in=staff,
                confirmed=True,
            ).values_list('user_id', flat=True)
        )
        missing = list(staff.exclude(pk__in=enrolled_ids).values_list('email', flat=True))
        owners_missing = list(
            staff.filter(is_superuser=True)
            .exclude(pk__in=enrolled_ids)
            .values_list('email', flat=True)
        )
        self.stdout.write(
            f'Active staff: {staff.count()} · Enrolled: {len(enrolled_ids)} · Missing: {len(missing)}'
        )
        if owners_missing:
            raise CommandError('Owner 2FA is not ready: ' + ', '.join(owners_missing))
        if missing:
            raise CommandError(
                'Do not enable STAFF_2FA_MODE=enforce yet. Missing: ' + ', '.join(missing)
            )
        self.stdout.write(
            self.style.SUCCESS(
                'All active staff are enrolled. STAFF_2FA_MODE=enforce is safe to enable.'
            )
        )
