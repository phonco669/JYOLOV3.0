# Stage 1: Build
FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# Stage 2: Runtime
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --production

COPY --from=builder /app/dist ./dist
# SQLite database file persistence will be handled by volume
# Copy any other necessary assets if they exist (e.g. static files)

EXPOSE 3000

CMD ["npm", "start"]
