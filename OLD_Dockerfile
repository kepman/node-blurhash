# Development stage
FROM node:19 as development
WORKDIR /usr
COPY package*.json ./
RUN npm install
COPY ./ ./
CMD [ "npm", "run", "start:dev" ]

# Builder stage
FROM development as builder
WORKDIR /usr
# Build the app with devDependencies still installed from "development" stage
RUN npm run build
# Clear dependencies and reinstall for production (no devDependencies)
RUN rm -rf node_modules
RUN npm ci --only=production

# Production stage
FROM alpine:latest as production
RUN apk --no-cache add nodejs ca-certificates
WORKDIR /root/
COPY --from=builder /usr ./
CMD [ "node", "./build/index.js" ]