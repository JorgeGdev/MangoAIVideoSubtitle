FROM node:18-alpine

# Instalar FFmpeg
RUN apk add --no-cache ffmpeg

# Crear directorio de trabajo
WORKDIR /app

# Copiar package files
COPY package*.json ./

# Instalar dependencias
RUN npm ci --only=production

# Copiar código fuente
COPY . .

# Crear directorio tmp
RUN mkdir -p tmp

# Exponer puerto
EXPOSE 3000

# Comando de inicio
CMD ["npm", "start"]