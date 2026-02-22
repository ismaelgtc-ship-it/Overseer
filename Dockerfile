FROM node:20-alpine

WORKDIR /app

# Deterministic installs when a lockfile exists; fallback to npm install if it doesn't.
COPY package.json package-lock.json* ./

RUN if [ -f package-lock.json ]; then \
      npm ci --omit=dev --no-audit --no-fund; \
    else \
      npm install --omit=dev --no-audit --no-fund; \
    fi

COPY . .

ENV NODE_ENV=production

CMD ["node", "src/index.js"]
