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

# Ne conserver que les dépendances nécessaires à l'exécution
ENV NODE_ENV=production
RUN npm prune --omit=dev

# Réduire la surface d'attaque : supprimer wget/curl et exécuter en utilisateur non-root
RUN rm -f /usr/bin/wget /usr/bin/curl || true \
  && addgroup -g 1001 appgroup \
  && adduser -D -u 1001 -G appgroup appuser \
  && chown -R appuser:appgroup /app
USER appuser

EXPOSE 4000

CMD ["sh", "-c", "./scripts/wait-for-it.sh db:3306 -- npx prisma migrate deploy && npm run start"]
