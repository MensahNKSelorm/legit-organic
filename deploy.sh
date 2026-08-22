#!/bin/bash
set -euo pipefail

echo "🚀 Deploying Legit Organic..."

cd /var/www/legitorganic

# Pull latest code
git pull origin main

# Backend
cd backend
source venv/bin/activate
python -m pip install --upgrade pip==26.2.1
pip install -r requirements.txt
python manage.py migrate
python manage.py setup_groups
python manage.py collectstatic --noinput
deactivate

# Retry transient owner-report email failures in the background. The oneshot
# service runs as the same unprivileged account as Django.
install -m 0644 ../deploy/systemd/legitorganic-order-reports.service \
    /etc/systemd/system/legitorganic-order-reports.service
install -m 0644 ../deploy/systemd/legitorganic-order-reports.timer \
    /etc/systemd/system/legitorganic-order-reports.timer
systemctl daemon-reload
systemctl enable --now legitorganic-order-reports.timer

# Persist and retry failed customer email/SMS deliveries. Dispatch retries
# rotate the delivery PIN and resend both channels with the new valid code.
install -m 0644 ../deploy/systemd/legitorganic-order-notifications.service \
    /etc/systemd/system/legitorganic-order-notifications.service
install -m 0644 ../deploy/systemd/legitorganic-order-notifications.timer \
    /etc/systemd/system/legitorganic-order-notifications.timer
systemctl daemon-reload
systemctl enable --now legitorganic-order-notifications.timer

# Generate customer-approved renewal orders, close expired payment windows,
# deliver scheduled price notices, and apply only safely notified changes.
install -m 0644 ../deploy/systemd/legitorganic-subscriptions.service \
    /etc/systemd/system/legitorganic-subscriptions.service
install -m 0644 ../deploy/systemd/legitorganic-subscriptions.timer \
    /etc/systemd/system/legitorganic-subscriptions.timer
systemctl daemon-reload
systemctl enable --now legitorganic-subscriptions.timer

# Frontend
cd ../frontend
npm ci
rm -rf -- .next-build
NEXT_DIST_DIR=.next-build npm run build

# Runtime-owned paths must remain writable after root performs a deployment.
if id -u legitorganic >/dev/null 2>&1; then
    install -d -o legitorganic -g legitorganic ../backend/media
    touch ../backend/django_errors.log
    chown -R legitorganic:legitorganic ../backend/media ../backend/django_errors.log .next-build
fi

# Restart the backend, then atomically replace the frontend build while the
# frontend process is stopped. Visitors can no longer receive HTML from one
# build and CSS chunks from another during deployment.
systemctl restart legitorganic
if systemctl cat legitorganic-frontend.service >/dev/null 2>&1; then
    systemctl stop legitorganic-frontend
    rm -rf -- .next-previous
    if [ -d .next ]; then mv .next .next-previous; fi
    mv .next-build .next
    if ! systemctl start legitorganic-frontend; then
        rm -rf -- .next
        if [ -d .next-previous ]; then mv .next-previous .next; fi
        systemctl start legitorganic-frontend
        exit 1
    fi
else
    pm2 stop legitorganic-frontend
    rm -rf -- .next-previous
    if [ -d .next ]; then mv .next .next-previous; fi
    mv .next-build .next
    if ! pm2 restart legitorganic-frontend; then
        rm -rf -- .next
        if [ -d .next-previous ]; then mv .next-previous .next; fi
        pm2 restart legitorganic-frontend
        exit 1
    fi
fi
rm -rf -- .next-previous

echo "✅ Deployment complete!"
