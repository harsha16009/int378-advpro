FROM node:18 AS builder

WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./

# Clean npm cache and install
RUN npm cache clean --force && \
    rm -f package-lock.json && \
    npm install

# Copy source
COPY . .

# Build
RUN npm run build

# Production stage
FROM node:18-alpine

WORKDIR /app

RUN npm install -g serve

COPY --from=builder /app/dist ./dist

EXPOSE 5173

CMD ["serve", "-s", "dist", "-l", "5173"]
