FROM node:20-alpine

ARG NEXT_PUBLIC_API_URL=/api
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

RUN npm run build

# Nettoyer les dépendances de dev après le build
ENV NODE_ENV=production
RUN npm prune --omit=dev

# Réduire la surface d'attaque : supprimer wget/curl et exécuter en utilisateur non-root
RUN rm -f /usr/bin/wget /usr/bin/curl || true \
  && addgroup -g 1001 appgroup \
  && adduser -D -u 1001 -G appgroup appuser \
  && chown -R appuser:appgroup /app
USER appuser

EXPOSE 3000

CMD ["npm", "run", "start"]
