#!/bin/sh
set -e

echo "Running seed..."
python -m app.seed

echo "Starting server..."
exec gunicorn app.main:app \
    --bind 0.0.0.0:8200 \
    --worker-class uvicorn.workers.UvicornWorker \
    --workers 2 \
    --timeout 120 \
    --access-logfile - \
    --error-logfile -
