FROM node:20-slim

WORKDIR /app

ENV NODE_ENV=production

# Deterministic installs for Render
COPY package.json package-lock.json ./
RUN npm ci --omit=dev --no-audit --no-fund

# Copy runtime sources
COPY . .

CMD ["node", "src/index.js"]
