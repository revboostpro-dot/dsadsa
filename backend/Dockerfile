FROM node:20-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy Prisma schema and generate client
COPY prisma ./prisma/
RUN npx prisma generate

# Copy source
COPY src ./src/

EXPOSE 3001

CMD ["sh", "-c", "npx prisma migrate deploy && node prisma/seed.js || true && node src/index.js"]
