#!/bin/bash
set -euo pipefail

echo "🚀 Deploying Legit Organic..."

cd /var/www/legitorganic

# Pull latest code
git pull origin main

# Backend
cd backend
source venv/bin/activate
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

# Frontend
cd ../frontend
npm install
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
