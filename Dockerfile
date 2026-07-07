# Stage 1 - Build
FROM node:22-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .

# .env is gitignored (never committed) and Vite only reads VITE_* vars at
# build time, so provide safe defaults here, overridable with --build-arg.
ARG VITE_API_BASE_URL=/api-siege
ARG VITE_MOCK=false
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}
ENV VITE_MOCK=${VITE_MOCK}

RUN npm run build-only

# Stage 2 - Serve (nginx)
FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 3000
CMD ["nginx", "-g", "daemon off;"]
