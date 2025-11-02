FROM node:20-alpine

# ffmpeg + fontconfig + una fuente (DejaVu Sans)
RUN apk add --no-cache ffmpeg fontconfig ttf-dejavu

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY . .

ENV NODE_ENV=production
EXPOSE 3000
CMD ["node", "server.js"]
