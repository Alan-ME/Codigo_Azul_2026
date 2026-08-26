# ─────────────────────────────────────────────────────────────
# Dockerfile — Código Azul Backend
# Imagen de contenedor optimizada basada en Node.js Alpine
# ─────────────────────────────────────────────────────────────
FROM node:20-alpine

# Definir directorio de trabajo
WORKDIR /app

# Instalar dependencias de producción
COPY package*.json ./
RUN npm ci --omit=dev

# Copiar código fuente, migraciones y assets públicos
COPY src/ ./src/
COPY sql/ ./sql/
COPY public/ ./public/
COPY scripts/ ./scripts/

# Exponer puerto HTTP / WebSocket
EXPOSE 3000

# Variables de entorno por defecto en contenedor
ENV NODE_ENV=production
ENV PORT=3000

# Ejecutar migraciones automáticas y arrancar servidor
CMD ["node", "src/server.js"]
