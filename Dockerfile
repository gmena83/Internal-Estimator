# Docker implementation for Internal-Estimator

FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build the project (if applicable, though current setup is mostly dev)
# RUN npm run build

# Expose port (default Vite/Express port)
EXPOSE 5000

# Start the application
CMD ["npm", "run", "dev"]
