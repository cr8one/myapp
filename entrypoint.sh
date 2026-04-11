#!/bin/sh

if [ -n "$DB_HOST" ]; then
  export DATABASE_URL="postgresql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:5432/${DB_NAME}?sslmode=no-verify"
fi

echo "DATABASE_URL is set: $([ -n "$DATABASE_URL" ] && echo yes || echo no)"
echo "Running prisma migrate deploy..."
npx prisma migrate deploy || echo "Migration failed, continuing anyway..."
echo "Starting app..."
exec npm start
