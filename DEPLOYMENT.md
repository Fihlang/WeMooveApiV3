# Furniture Delivery Platform Deployment Guide

This guide explains how to deploy the Furniture Delivery Platform on DigitalOcean using Docker and Docker Compose.

## Prerequisites

- A DigitalOcean account
- Docker and Docker Compose installed on your local machine
- Git installed on your local machine

## Step 1: Create a DigitalOcean Droplet

1. Log in to your DigitalOcean account
2. Click on "Create" and select "Droplets"
3. Choose an image: Select the "Marketplace" tab and choose "Docker"
4. Choose a plan: Select a Standard plan with at least 2GB RAM
5. Choose a datacenter region close to your users (e.g., for South Africa, choose the closest region)
6. Select additional options as needed (e.g., monitoring, IPv6)
7. Add your SSH key or create a password
8. Choose a hostname (e.g., furniture-delivery-app)
9. Click "Create Droplet"

## Step 2: Connect to Your Droplet

```bash
ssh root@YOUR_DROPLET_IP
```

## Step 3: Clone the Repository

```bash
git clone https://github.com/your-username/furniture-delivery-platform.git
cd furniture-delivery-platform
```

## Step 4: Configure Environment Variables

Create a `.env` file in the root directory:

```bash
touch .env
```

Add the following environment variables to the `.env` file:

```
NODE_ENV=production
DATABASE_URL=postgres://postgres:postgres@postgres:5432/furniture_delivery
PORT=5000
```

## Step 5: Start the Application

```bash
docker-compose up -d
```

This will start both the PostgreSQL database and the Node.js application in detached mode.

## Step 6: Initialize the Database

Run the database migration script to create the tables:

```bash
docker-compose exec api npm run db:push
```

## Step 7: Configure Firewall (Optional)

Allow only necessary ports through the firewall:

```bash
ufw allow OpenSSH
ufw allow 5000/tcp
ufw enable
```

## Step 8: Set Up a Domain Name (Optional)

1. Purchase a domain name from a domain registrar
2. Add a DNS A record pointing to your Droplet's IP address
3. Install and configure Nginx as a reverse proxy or set up a DigitalOcean Load Balancer

## Step 9: Set Up SSL with Let's Encrypt (Optional)

If you've set up a domain name, you can secure your application with SSL:

```bash
apt-get update
apt-get install certbot python3-certbot-nginx
certbot --nginx -d yourdomain.com
```

## Step 10: Monitoring and Maintenance

- Set up monitoring with DigitalOcean Monitoring
- Configure backups for your Droplet and database
- Regularly update your application and dependencies

## Troubleshooting

### Database Connection Issues

If the application can't connect to the database, check the following:

```bash
docker-compose logs postgres
docker-compose logs api
```

### Application Issues

To view application logs:

```bash
docker-compose logs api
```

## Scaling Up

As your user base grows, consider:

1. Increasing the Droplet size
2. Using a managed database service (e.g., DigitalOcean Managed Database)
3. Implementing a load balancer
4. Setting up a CDN for static assets

## Rolling Updates

For zero-downtime updates:

```bash
git pull
docker-compose build api
docker-compose up -d --no-deps api
```