FROM node:20-alpine

WORKDIR /app

ARG DATABASE_URL="mysql://root:root@db:3306/gestion_stock"
ENV DATABASE_URL=${DATABASE_URL}

COPY package*.json ./
RUN npm ci

COPY . .

RUN npx prisma generate
RUN npm run build

EXPOSE 4000

CMD ["sh", "-c", "until npx prisma migrate deploy; do echo 'Waiting for database...'; sleep 2; done; npm run start"]
