FROM node:18-alpine

# Instalar FFmpeg
RUN apk add --no-cache ffmpeg

# Crear directorio de trabajo
WORKDIR /app

# Copiar primero package.json y package-lock.json específicamente
COPY package.json package-lock.json ./

# Instalar dependencias
RUN npm ci --omit=dev

# Copiar todo el código fuente
COPY . .

# Crear directorio tmp
RUN mkdir -p tmp

# Exponer puerto
EXPOSE 3000

# Comando de inicio
CMD ["npm", "start"]