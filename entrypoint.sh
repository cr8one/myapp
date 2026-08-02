#!/bin/sh
set -e
if [ -n "$DB_HOST" ]; then
  echo "Fetching latest credentials from Secrets Manager..."
  SECRET=$(aws secretsmanager get-secret-value \
    --secret-id "${DB_SECRET_ID}" \
    --region ap-northeast-1 \
    --query SecretString \
    --output text)
  DB_USER=$(echo "$SECRET" | jq -r '.username')
  DB_PASSWORD=$(echo "$SECRET" | jq -r '.password')
  # パスワードの特殊文字をURLエンコード
  DB_PASSWORD_ENCODED=$(python3 -c "import urllib.parse, sys; print(urllib.parse.quote(sys.argv[1], safe=''))" "$DB_PASSWORD")
  export DATABASE_URL="postgresql://${DB_USER}:${DB_PASSWORD_ENCODED}@${DB_HOST}:5432/${DB_NAME}?sslmode=no-verify"
  echo "DATABASE_URL constructed."
fi
echo "Running prisma migrate deploy..."
npx prisma migrate deploy
echo "=== schema.prisma requester_user_id check ==="
grep -n "requester_user_id" prisma/schema.prisma || echo "NOT FOUND in schema.prisma"
echo "=== generated client check ==="
grep -rn "requester_user_id" src/generated/prisma/*.d.ts 2>/dev/null | head -3 || echo "NOT FOUND in generated client"
echo "=== git commit info ==="
cat .git-commit 2>/dev/null || echo "no .git-commit file"
echo "Migration done. Starting app..."
exec npm start
