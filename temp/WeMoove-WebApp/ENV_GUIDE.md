# Environment Configuration Guide

This guide explains how to use environment variables in the Furniture Delivery Platform for different deployment environments.

## Overview

The application uses `.env` files to configure environment-specific settings. This approach makes it easier to manage configuration across different environments (development, staging, production) without changing code.

## Environment Files

1. `.env.example`: Template file with all possible environment variables and example values
2. `.env`: Local development environment file (not committed to version control)
3. `.env.production`: Production settings (can be used for deployment to DigitalOcean)

## Key Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| NODE_ENV | Environment mode | `development`, `production`, `test` |
| DATABASE_URL | PostgreSQL connection string | `postgres://user:password@host:port/database` |
| PORT | Server port | `5001` |
| SESSION_SECRET | Secret for session encryption | `your_secure_session_secret_key` |
| JWT_SECRET | Secret for JWT authentication | `your_secure_jwt_secret_key` |
| CORS_ORIGIN | Allowed CORS origins | `http://localhost:3000` |
| WS_PATH | WebSocket server path | `/ws` |
| LOG_LEVEL | Logging level | `info` |
| SMTP_HOST | Email server hostname | `smtp.gmail.com` |
| SMTP_PORT | Email server port | `587` |
| SMTP_SECURE | Use secure connection | `false` (or `true` for port 465) |
| SMTP_USER | Email server username | `user@example.com` |
| SMTP_PASS | Email server password | `your_smtp_password` |
| EMAIL_FROM | Sender email address | `Furniture Delivery <no-reply@furnituredelivery.co.za>` |

## Environment-Specific Settings

### Development (Local)

For local development, create a `.env` file in the project root:

```env
NODE_ENV=development
DATABASE_URL=postgres://postgres:postgres@localhost:5432/furniture_delivery
PORT=5001
SESSION_SECRET=furniture_delivery_dev_session_secret
JWT_SECRET=furniture_delivery_dev_jwt_secret
CORS_ORIGIN=http://localhost:3000
WS_PATH=/ws
LOG_LEVEL=debug
# In development, leave SMTP settings commented out to use Ethereal for testing
# SMTP_HOST=smtp.gmail.com
# SMTP_PORT=587
# SMTP_SECURE=false
# SMTP_USER=your.email@gmail.com
# SMTP_PASS=your_app_password
# EMAIL_FROM=Furniture Delivery <your.email@gmail.com>
```

### Production (DigitalOcean)

For production deployment, you can:

1. Create a `.env.production` file locally and copy it to the server
2. Set environment variables directly in the DigitalOcean dashboard
3. Use the environment variables section in docker-compose.yml

Example production settings:

```env
NODE_ENV=production
DATABASE_URL=postgres://postgres:strong_password@postgres:5432/furniture_delivery
PORT=5001
SESSION_SECRET=<generated_secure_secret>
JWT_SECRET=<generated_secure_secret>
CORS_ORIGIN=https://your-domain.com
WS_PATH=/ws
LOG_LEVEL=info
# Email configuration for production environment
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=delivery@furnituredelivery.co.za
SMTP_PASS=<your_smtp_password>
EMAIL_FROM=Furniture Delivery <no-reply@furnituredelivery.co.za>
```

## Security Considerations

1. **Never commit real secrets to version control**
   - Keep `.env` and `.env.production` in your `.gitignore` file

2. **Generate strong secrets for production**
   - For SESSION_SECRET and JWT_SECRET, use a secure random string generator

3. **Restrict database permissions**
   - In production, use a database user with limited permissions

## Using in Docker

When using Docker, you can:

1. Build the image with default environment variables (in Dockerfile)
2. Override them at runtime using:
   - docker-compose.yml environment section
   - Docker Swarm secrets
   - Docker run with --env flag

Example docker-compose environment override:

```yaml
services:
  api:
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgres://postgres:postgres@postgres:5432/furniture_delivery
      - SESSION_SECRET=${SESSION_SECRET}
      - JWT_SECRET=${JWT_SECRET}
      - SMTP_HOST=${SMTP_HOST}
      - SMTP_PORT=${SMTP_PORT}
      - SMTP_SECURE=${SMTP_SECURE}
      - SMTP_USER=${SMTP_USER}
      - SMTP_PASS=${SMTP_PASS}
      - EMAIL_FROM=${EMAIL_FROM}
```

## DigitalOcean Specific Configuration

When deploying to DigitalOcean:

1. **App Platform**: Use the Environment Variables section in the app settings
2. **Droplets**: Use the `.env.production` file or set variables in docker-compose.yml
3. **Kubernetes**: Use ConfigMaps and Secrets

### Setting Environment Variables on a DigitalOcean Droplet

```bash
# SSH into your Droplet
ssh root@your-droplet-ip

# Navigate to your application directory
cd /path/to/furniture-delivery-platform

# Create or edit the .env file
nano .env

# Add your environment variables and save

# Restart your application
docker-compose down
docker-compose up -d
```

## Generating Secure Secrets

For production, generate secure random strings for secrets:

```bash
# On Linux/macOS
openssl rand -base64 32

# Alternative
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```