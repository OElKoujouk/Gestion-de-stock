FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

RUN npx prisma generate
RUN npm run build

EXPOSE 4000

CMD ["sh", "-c", "until npx prisma migrate deploy; do echo 'Waiting for database...'; sleep 2; done; npm run start"]
