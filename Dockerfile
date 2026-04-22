FROM node:20-alpine
RUN apk add --no-cache aws-cli jq
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npx prisma generate
RUN npm run build
COPY entrypoint.sh ./
RUN chmod +x entrypoint.sh
EXPOSE 3000
CMD ["sh", "entrypoint.sh"]
