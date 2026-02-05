# Use official Node.js image
FROM node:18-slim

# Set working directory
WORKDIR /usr/src/app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install --production

# Copy application code
COPY . .

# Expose the port (Cloud Run sets PORT environment variable)
EXPOSE 8080

# Command to start the application
CMD [ "node", "server.js" ]
