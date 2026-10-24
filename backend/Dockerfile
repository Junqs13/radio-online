FROM node:20-alpine
# openssl é exigido pelo motor do Prisma no Alpine; ffmpeg mede o silêncio das pontas das faixas
RUN apk add --no-cache openssl ffmpeg
WORKDIR /app
ENV NODE_ENV=production

COPY package*.json ./
RUN npm ci --omit=dev

COPY prisma ./prisma
RUN npx prisma generate

COPY src ./src
COPY tsconfig.json ./

EXPOSE 3001
# Aplica as migrations pendentes e sobe a API
CMD ["sh", "-c", "npx prisma migrate deploy && npm start"]
