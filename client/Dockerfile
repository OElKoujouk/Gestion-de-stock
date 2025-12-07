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

EXPOSE 3000

CMD ["npm", "run", "start"]
