FROM node:20-alpine

WORKDIR /app

# Copiamos ambos para instalación correcta
COPY package.json package-lock.json* ./

# Instalación limpia
RUN npm install --omit=dev --no-audit --no-fund

# Copiamos el resto del código
COPY . .

ENV NODE_ENV=production

CMD ["node", "src/index.js"]
