# Furniture Delivery - .NET Core API

This is the backend API for the Furniture Delivery application, a modern platform for furniture delivery management built with .NET Core.

## Features

- RESTful API with comprehensive endpoints
- WebSocket support for real-time updates
- JWT authentication and role-based authorization
- Notification services
- Data persistence with Entity Framework Core

## Technical Stack

- **.NET Core**: Backend framework
- **Entity Framework Core**: ORM for database operations
- **MS SQL Server**: Containerized database
- **WebSockets**: Real-time communication
- **JWT**: Authentication and security

## Prerequisites

- .NET SDK (6.0 or later)
- Docker and Docker Compose (for MS SQL Server)
- Visual Studio, VS Code, or other .NET-compatible IDE

## Getting Started

### Installation

1. Extract the zip file to your desired location
2. Navigate to the extracted directory

### Database Setup

The application uses a containerized MS SQL Server for easy deployment on any platform, including macOS.

1. Start the SQL Server container:

```bash
docker-compose up -d
```

2. Update database connection string in `appsettings.json` if needed:

```json
"ConnectionStrings": {
  "DefaultConnection": "Server=localhost,1433;Database=FurnitureDelivery;User Id=sa;Password=yourStrongPassword123!;TrustServerCertificate=True;"
}
```

### Running the API

1. Navigate to the API project directory:

```bash
cd FurnitureDelivery.API
```

2. Run the application:

```bash
dotnet run
```

The API will be available at `https://localhost:5001/` and `http://localhost:5000/`.

### Publishing for Production

To publish the application for production:

```bash
dotnet publish -c Release -o ./publish
```

## Project Structure

- `Controllers`: API endpoints
- `Models`: Domain models
- `DTOs`: Data transfer objects
- `Services`: Business logic and services
- `Data`: Database context and migrations

## API Documentation

Once the API is running, Swagger documentation is available at:

```
https://localhost:6001/swagger
```

## WebSocket Support

The API includes a WebSocket server for real-time updates on:

- Delivery status changes
- Driver location updates
- Chat messages
- Notifications

Connect to the WebSocket server at:

```
ws://localhost:5001/ws
```

## Docker Support

The project includes Docker support for easy deployment. 

### Building the Docker Image

```bash
docker build -t furniture-delivery-api .
```

### Running with Docker Compose

```bash
docker-compose up
```

## License

This project is proprietary and confidential.



Troubleshooting

  Setting up backend API...
======================================================
======================================================
  Furniture Delivery - .NET Core API Setup
======================================================

✅ .NET SDK detected: 6.0.136
✅ Docker detected: Docker version 27.5.1, build 9f9e405
✅ Docker Compose detected: Docker Compose version v2.32.4-desktop.1

Starting MS SQL Server container...
WARN[0000] /Users/zakithidlomo/Documents/GitHub/WeMoove-WebApp/docker-compose.yml: the attribute `version` is obsolete, it will be ignored, please remove it to avoid potential confusion 
[+] Running 1/2
 ✔ Container furniture_delivery_postgres  Healthy                                                                                                                                                               3.5s 
 ⠋ Container furniture_delivery_api       Starting                                                                                                                                                              0.0s 
Error response from daemon: Ports are not available: exposing port TCP 0.0.0.0:5000 -> 127.0.0.1:0: listen tcp 0.0.0.0:5000: bind: address already in use
Failed to start MS SQL Server container. Please check the error messages above.
❌ Backend setup failed. Please check the error messages above.
zakithidlomo@Zakithis-MacBook-Air WeMoove-WebApp % ps aux | grep tsx
zakithidlomo     35497   0.0  0.0 410209008   1312 s028  S+    4:21AM   0:00.01 grep tsx
zakithidlomo@Zakithis-MacBook-Air WeMoove-WebApp % sudo lsof -t -i:5000 | xargs kill -9
Password:
zakithidlomo@Zakithis-MacBook-Air WeMoove-WebApp % 