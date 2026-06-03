# Frontend Dockerfile for production Vite build served as static assets
FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm install

# Allow docker-compose to override the API base URL at build time
ARG VITE_API_BASE_URL
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}

COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app

# Add non-root user for security
RUN addgroup --system appgroup && adduser --system --ingroup appgroup appuser

RUN npm install -g serve

COPY --from=builder /app/dist ./dist
RUN chown -R appuser:appgroup /app

USER appuser

EXPOSE 5173

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:5173 || exit 1

CMD ["serve", "-s", "dist", "-l", "5173"]
