FROM node:22-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy application files
COPY . .

# Build assets
RUN npm run build

EXPOSE 8086

CMD ["node", "server.js"]
