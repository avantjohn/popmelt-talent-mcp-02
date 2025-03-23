FROM node:20-slim

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy build files
COPY dist ./dist

# Set environment variables (override these with --env at runtime)
ENV NODE_ENV=production
ENV DEBUG=false

# Expose the port if needed (for health checks, etc.)
# EXPOSE 8080

# Run the MCP server
CMD ["node", "dist/index.js"] 