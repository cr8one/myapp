#!/bin/sh
set -e
echo "Running prisma migrate deploy..."
npx prisma migrate deploy
echo "Migration done. Starting app..."
exec npm start
