FROM node:20-alpine

WORKDIR /app

# Copier les fichiers de dépendances
COPY package*.json ./

# Installer les dépendances
RUN npm install

# Copier le reste du code
COPY . .

# Exposer le port
EXPOSE 4000

# Démarrer en mode dev (ou build si nécessaire plus tard)
CMD ["npm", "run", "dev"]
