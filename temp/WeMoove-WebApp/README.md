# Furniture Delivery - Modern Delivery Platform

A comprehensive furniture delivery management platform with real-time tracking, messaging, and efficient delivery coordination.

## Overview

This application revolutionizes furniture transport with:

- Real-time tracking of delivery vehicles
- Seamless communication between customers and drivers
- Efficient route optimization
- Modern, responsive UI design
- Secure authentication and data handling

## Project Structure

The project is organized into two main components:

### Backend API (Node.js)

- RESTful API endpoints for all application functions
- WebSocket implementation for real-time updates
- PostgreSQL database with Drizzle ORM
- JWT authentication and role-based security
- Containerized deployment with Docker

### Frontend (React)

- Modern, responsive design with gradient color schemes
- Real-time delivery tracking with interactive maps
- WebSocket integration for live updates
- Comprehensive customer and driver dashboards
- Tailwind CSS for styling

## Environment Configuration

This application uses environment variables for configuration, making it easy to deploy across different environments:

1. Copy `.env.example` to `.env` for local development:
   ```bash
   cp .env.example .env
   ```

2. Edit the `.env` file with your specific settings:
   ```
   NODE_ENV=development
   DATABASE_URL=postgres://postgres:postgres@localhost:5432/furniture_delivery
   PORT=5001
   ```

3. For production deployment, configure environment variables according to the `ENV_GUIDE.md` documentation.

For more detailed environment configuration, refer to the `ENV_GUIDE.md` file.

## Deployment Options

### Option 1: Using the Installation Scripts

The simplest way to deploy the application:

1. Extract the ZIP file to your desired location
2. Run the installation script:
   ```
   ./install.sh
   ```
3. Follow the on-screen instructions

### Option 2: Using Docker Compose

For a containerized deployment:

1. Extract the ZIP file
2. Run Docker Compose:
   ```
   docker-compose up -d
   ```

### Option 3: Manual Setup

For separate backend and frontend setup:

1. Extract the ZIP file
2. Set up the backend:
   ```
   cd Backend
   ./setup.sh
   ```
3. Set up the frontend:
   ```
   cd Frontend
   ./setup.sh
   ```

## System Requirements

- **For Backend**:
  - Node.js 20 or higher
  - Docker and Docker Compose (for PostgreSQL)
  - 2GB RAM, 1GB disk space

- **For Frontend**:
  - Node.js 20 or higher
  - npm
  - 1GB RAM, 500MB disk space

- **For Production Deployment**:
  - 4GB RAM recommended
  - 10GB disk space
  - Internet connectivity for map services
  - DigitalOcean Droplet (Standard plan recommended)

## License

This application is proprietary and confidential.