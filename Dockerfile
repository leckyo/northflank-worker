# 1. Use the official lightweight Node alpine image
FROM node:18-alpine

# 2. Create and set the workspace directory inside the container
WORKDIR /workspace

# 3. Copy only the package configuration first
COPY package.json ./

# 4. Force a raw clean installation of your express dependency modules
RUN npm install

# 5. Copy your index.js script code into the container workspace
COPY index.js ./

# 6. Expose the execution communication port
EXPOSE 8080

# 7. Execute the startup run script command
CMD ["npm", "start"]
