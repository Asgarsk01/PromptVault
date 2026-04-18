#!/bin/sh

# 1. Wait for PostgreSQL
echo "Waiting for PostgreSQL..."
while ! nc -z $DB_HOST $DB_PORT; do
  sleep 1
done
echo "PostgreSQL is ready."

# 2. Run migrations
python manage.py migrate --noinput

# 3. Collect static files
python manage.py collectstatic --noinput

# 4. Start gunicorn
exec gunicorn backend.wsgi:application --bind 0.0.0.0:8000 --workers 3
