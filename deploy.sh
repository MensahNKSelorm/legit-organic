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
npm run build

# Runtime-owned paths must remain writable after root performs a deployment.
if id -u legitorganic >/dev/null 2>&1; then
    install -d -o legitorganic -g legitorganic ../backend/media
    touch ../backend/django_errors.log
    chown -R legitorganic:legitorganic ../backend/media ../backend/django_errors.log .next
fi

# Restart services
systemctl restart legitorganic
if systemctl cat legitorganic-frontend.service >/dev/null 2>&1; then
    systemctl restart legitorganic-frontend
else
    pm2 restart legitorganic-frontend
fi

echo "✅ Deployment complete!"
