FROM node:18-alpine

# Instalar FFmpeg
RUN apk add --no-cache ffmpeg

# Crear directorio de trabajo
WORKDIR /app

# Copiar TODO primero (simple y funcional)
COPY . .

# Instalar dependencias
RUN npm install --production

# Crear directorio tmp
RUN mkdir -p tmp

# Exponer puerto
EXPOSE 3000

# Comando de inicio
CMD ["npm", "start"]