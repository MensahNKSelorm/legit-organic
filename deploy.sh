#!/bin/bash
echo "🚀 Deploying Legit Organic..."

cd /var/www/legitorganic

# Pull latest code
git pull origin main

# Backend
cd backend
source venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py collectstatic --noinput
deactivate

# Frontend
cd ../frontend
npm install
npm run build

# Restart services
systemctl restart legitorganic
pm2 restart legitorganic-frontend

echo "✅ Deployment complete!"
