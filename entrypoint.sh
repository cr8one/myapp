#!/bin/sh
set -e

# DB_HOST が存在する場合（本番ECS環境）はDATABASE_URLを組み立てる
if [ -n "$DB_HOST" ]; then
  export DATABASE_URL="postgresql://${DB_USER}:$(python3 -c "import urllib.parse,os; print(urllib.parse.quote(os.environ['DB_PASSWORD']))")@${DB_HOST}:5432/${DB_NAME}?sslmode=no-verify"
fi

echo "Running prisma migrate deploy..."
npx prisma migrate deploy
echo "Migration done. Starting app..."
exec npm start
