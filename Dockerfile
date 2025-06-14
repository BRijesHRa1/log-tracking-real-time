# Dockerfile
FROM node:14

# Set working dir in container
WORKDIR /usr/src/app

# Copy package manifest & install deps
COPY package*.json ./
RUN npm install --production

# Copy source code
COPY src ./src

# Switch into src where your index.js lives
WORKDIR /usr/src/app/src

# Expose your app port
EXPOSE 3000

# Launch your server
CMD ["node", "index.js"]
