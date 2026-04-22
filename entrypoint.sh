#!/bin/sh
set -e
set +H

if [ -n "$DB_HOST" ]; then
  echo "DB_SECRET_ID is: ${DB_SECRET_ID}"
  echo "Fetching latest credentials from Secrets Manager..."
  SECRET=$(aws secretsmanager get-secret-value \
    --secret-id "${DB_SECRET_ID}" \
    --region ap-northeast-1 \
    --query SecretString \
    --output text)

  DB_USER=$(echo "$SECRET" | jq -r '.username')
  DB_PASSWORD=$(echo "$SECRET" | jq -r '.password')

  export DATABASE_URL="postgresql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:5432/${DB_NAME}?sslmode=no-verify"
  echo "DATABASE_URL constructed."
fi

echo "Running prisma migrate deploy..."
npx prisma migrate deploy
echo "Migration done. Starting app..."
exec npm start
