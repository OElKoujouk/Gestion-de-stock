FROM node:20-alpine

WORKDIR /app

# Installer bash pour wait-for-it.sh
RUN apk add --no-cache bash

COPY package*.json ./
RUN npm ci

COPY . .

RUN chmod +x ./scripts/wait-for-it.sh

# Générer Prisma client et builder l'app
ENV DATABASE_URL=mysql://root:root@db:3306/gestion_stock
RUN npx prisma generate
RUN npm run build

EXPOSE 4000

CMD ["sh", "-c", "./scripts/wait-for-it.sh db:3306 -- npx prisma migrate deploy && npm run start"]
