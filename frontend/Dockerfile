# ── Stage 1: Build the React app ───────────────────────────────
FROM node:20-alpine AS build

WORKDIR /app
COPY package.json .
RUN npm install

COPY public ./public
COPY src    ./src

# Pass service URLs as build-time args so they are baked in
ARG REACT_APP_PHP_URL=http://localhost:8080
ARG REACT_APP_JAVA_URL=http://localhost:8081

ENV REACT_APP_PHP_URL=$REACT_APP_PHP_URL
ENV REACT_APP_JAVA_URL=$REACT_APP_JAVA_URL

RUN npm run build

# ── Stage 2: Serve with nginx ───────────────────────────────────
FROM nginx:alpine

COPY --from=build /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 3000
