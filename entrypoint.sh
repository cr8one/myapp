#!/bin/sh
set -e

if [ -n "$DB_HOST" ]; then
  export DATABASE_URL="postgresql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:5432/${DB_NAME}?sslmode=no-verify"
fi

echo "Running prisma migrate deploy..."
npx prisma migrate deploy
echo "Migration done. Starting app..."
exec npm start
