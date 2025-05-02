# Build stage
FROM node:18 AS build
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application
COPY . .

# Build the application
RUN npm run build -- --configuration=production

# Runtime stage
FROM nginx:alpine
COPY --from=build /app/dist/furniture-delivery /usr/share/nginx/html

# Copy custom nginx configuration for Angular routing
COPY ./nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]