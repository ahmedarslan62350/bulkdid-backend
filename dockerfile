# Use official Node.js image
FROM node:18

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json first (for caching dependencies)
COPY package.json package-lock.json ./

# Install production dependencies
RUN npm i copyfiles
RUN npm install

# Copy the rest of the application
COPY . .


RUN npm run build

RUN npm run prepare

# Ensure ecosystem.config.js is included in the copy
COPY ecosystem.config.js .

# Expose the application port
EXPOSE 3000

# Start the application using PM2 for process management
CMD ["npx", "pm2-runtime", "ecosystem.config.js"]
