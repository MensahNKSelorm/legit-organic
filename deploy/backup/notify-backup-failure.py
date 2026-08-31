#!/usr/bin/env python3
import argparse
import os
import socket
from datetime import datetime, timezone
from pathlib import Path

import resend
from dotenv import load_dotenv


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--status', type=int)
    parser.add_argument('--test', action='store_true')
    args = parser.parse_args()

    if not args.test and args.status is None:
        parser.error('--status is required unless --test is used')

    load_dotenv(Path('/var/www/legitorganic/backend/.env'))
    api_key = os.getenv('RESEND_API_KEY', '')
    if not api_key:
        raise RuntimeError('RESEND_API_KEY is not configured')
    resend.api_key = api_key

    recipient = os.getenv('BACKUP_ALERT_EMAIL', 'admin@legitorganic.com')
    sender = os.getenv('DEFAULT_FROM_EMAIL', 'hello@legitorganic.com')
    hostname = socket.gethostname()
    timestamp = datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M UTC')

    if args.test:
        subject = '[TEST] Legit Organic backup alert is working'
        message = (
            'This is a test. Nightly backup failure notifications are configured '
            'correctly; no backup failed.'
        )
    else:
        subject = 'ACTION REQUIRED: Legit Organic backup failed'
        message = (
            f'The nightly backup failed with exit status {args.status}. '
            'Check /var/log/legitorganic-backup.log on the production server.'
        )

    response = resend.Emails.send(
        {
            'from': f'Legit Organic <{sender}>',
            'to': [recipient],
            'subject': subject,
            'text': f'{message}\n\nServer: {hostname}\nTime: {timestamp}',
        }
    )
    message_id = response.get('id') if isinstance(response, dict) else getattr(response, 'id', None)
    print(f'Backup alert accepted by Resend: {message_id or "id unavailable"}')


if __name__ == '__main__':
    main()
