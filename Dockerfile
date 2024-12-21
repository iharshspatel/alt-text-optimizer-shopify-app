FROM node

# Create app directory
RUN mkdir -p /usr/src/app

# Set working directory
WORKDIR /usr/src/app

# Copy package.json and package-lock.json
COPY package*.json /usr/src/app/

# Install dependencies
RUN npm install

# Copy application code
COPY . /usr/src/app

# Copy the .env file into the container (this is the important step)
COPY .env /usr/src/app/

# Build the application
RUN npm run build


# Expose the port
EXPOSE 3000

# Start the application
CMD [ "npm", "start" ]
