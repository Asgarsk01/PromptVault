#!/bin/sh

echo "Waiting for PostgreSQL..."
until python -c "
import socket
import sys
host = '${DB_HOST:-db}'
port = int('${DB_PORT:-5432}')
try:
    s = socket.create_connection((host, port), timeout=2)
    s.close()
    sys.exit(0)
except Exception:
    sys.exit(1)
"; do
  echo "PostgreSQL not ready, waiting..."
  sleep 2
done

echo "PostgreSQL is ready."
python manage.py migrate --noinput
python manage.py collectstatic --noinput
gunicorn backend.wsgi:application --bind 0.0.0.0:8000 --workers 3
