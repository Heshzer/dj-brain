FROM node:20-alpine

WORKDIR /app

# Copier les dépendances
COPY package*.json ./
RUN npm install

# Copier le code source
COPY . .

# Build l'application Next.js
RUN npm run build

EXPOSE 3000

# Démarrer l'application
CMD ["node_modules/.bin/next", "start", "-H", "0.0.0.0"]
