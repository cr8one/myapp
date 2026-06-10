FROM node:20-alpine
RUN apk add --no-cache aws-cli jq
RUN apk add --no-cache aws-cli jq python3 make g++ cairo-dev pango-dev jpeg-dev giflib-dev librsvg-dev
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
