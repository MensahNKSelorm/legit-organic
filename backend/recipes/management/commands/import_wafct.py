from pathlib import Path

from django.conf import settings
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from django.utils import timezone

from recipes.models import NutritionSourceDataset, NutritionSourceRecord
from recipes.wafct import (
    WAFCT_CITATION, WAFCT_DATASET_CODE, WAFCT_DATASET_NAME, WAFCT_REUSE_TERMS,
    WAFCT_SOURCE_URL, WAFCT_VERSION, iter_wafct_rows, workbook_sha256,
)


class Command(BaseCommand):
    help = 'Validate or locally import the official WAFCT 2019 Excel workbook.'

    def add_arguments(self, parser):
        parser.add_argument('workbook')
        parser.add_argument('--validate-only', action='store_true')
        parser.add_argument('--limit', type=int)
        parser.add_argument('--commercial-permission-reference', default='')

    def handle(self, *args, **options):
        path = Path(options['workbook']).expanduser().resolve()
        if not path.is_file():
            raise CommandError(f'Workbook not found: {path}')
        checksum = workbook_sha256(path)
        rows = iter_wafct_rows(path)
        if options['limit'] is not None:
            from itertools import islice
            rows = islice(rows, max(options['limit'], 0))
        rows = list(rows)
        if not rows:
            raise CommandError('No WAFCT food rows were found in the expected datasheet.')
        if options['validate_only']:
            self.stdout.write(self.style.SUCCESS(
                f'Valid WAFCT workbook: {len(rows)} food rows; sha256={checksum}'
            ))
            return

        permission_reference = options['commercial_permission_reference'].strip()
        existing = NutritionSourceDataset.objects.filter(code=WAFCT_DATASET_CODE).first()
        permission_status = (
            'granted' if permission_reference else
            (existing.commercial_permission_status if existing else 'pending')
        )
        permission_reference = permission_reference or (
            existing.commercial_permission_reference if existing else ''
        )
        if not settings.DEBUG and (
            permission_status != 'granted' or not permission_reference
        ):
            raise CommandError(
                'Production WAFCT import is blocked until FAO commercial-use permission is recorded.'
            )
        with transaction.atomic():
            dataset, _ = NutritionSourceDataset.objects.update_or_create(
                code=WAFCT_DATASET_CODE,
                defaults={
                    'name': WAFCT_DATASET_NAME, 'version': WAFCT_VERSION,
                    'publisher': 'Food and Agriculture Organization of the United Nations',
                    'source_url': WAFCT_SOURCE_URL, 'citation': WAFCT_CITATION,
                    'reuse_terms': WAFCT_REUSE_TERMS,
                    'commercial_permission_status': permission_status,
                    'commercial_permission_reference': permission_reference,
                    'workbook_sha256': checksum, 'imported_at': timezone.now(),
                },
            )
            created = updated = 0
            for row in rows:
                _, was_created = NutritionSourceRecord.objects.update_or_create(
                    dataset=dataset, food_code=row.food_code,
                    defaults={
                        'original_food_name': row.original_food_name,
                        'food_name_french': row.food_name_french,
                        'scientific_name': row.scientific_name,
                        'preparation_state': row.preparation_state,
                        'source_identifiers': row.source_identifiers,
                        'nutrient_values': row.nutrient_values,
                        'quality_indicators': row.quality_indicators,
                        'source_sheet': row.source_sheet, 'source_row': row.source_row,
                    },
                )
                created += int(was_created)
                updated += int(not was_created)
        self.stdout.write(self.style.SUCCESS(
            f'WAFCT import complete: {created} created, {updated} updated; '
            f'all source records remain unverified.'
        ))
