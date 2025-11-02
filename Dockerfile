# Antes: FROM node:18-alpine
FROM node:20-alpine

# (Opcional si usas el ffmpeg del sistema)
# RUN apk add --no-cache ffmpeg

WORKDIR /app

# Mejor caché de deps
COPY package*.json ./
RUN npm ci --omit=dev

# Copia el resto
COPY . .

ENV NODE_ENV=production
EXPOSE 3000
CMD ["node", "server.js"]
