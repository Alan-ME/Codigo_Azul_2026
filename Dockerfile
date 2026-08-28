# ─────────────────────────────────────────────────────────────
# Dockerfile — Código Azul Backend & Frontend PWA (Multi-Stage)
# ─────────────────────────────────────────────────────────────

# Stage 1: Compilación de Frontend React con Vite
FROM node:20-alpine AS client-builder
WORKDIR /app/client

COPY client/package*.json ./
RUN npm install

COPY client/ ./
RUN npm run build

# Stage 2: Imagen Final de Producción Node.js
FROM node:20-alpine
WORKDIR /app

# Instalar dependencias del backend
COPY package*.json ./
RUN npm ci --omit=dev

# Copiar código fuente backend, scripts y migraciones
COPY src/ ./src/
COPY sql/ ./sql/
COPY scripts/ ./scripts/

# Copiar la compilación de la PWA React
COPY --from=client-builder /app/client/dist ./client/dist

# Exponer puerto HTTP / WebSocket
EXPOSE 3000

# Variables de entorno por defecto
ENV NODE_ENV=production
ENV PORT=3000

# Arrancar servidor
CMD ["node", "src/server.js"]
