#!/bin/bash

# Furniture Delivery - .NET Core API Setup Script
# ------------------------------------------------------

echo "======================================================"
echo "  Furniture Delivery - .NET Core API Setup"
echo "======================================================"
echo ""

# Check for .NET SDK
if ! command -v dotnet &> /dev/null
then
    echo ".NET SDK not found. Please install .NET SDK 6.0 or higher."
    echo "Download from: https://dotnet.microsoft.com/download"
    exit 1
fi

# Check .NET version
DOTNET_VERSION=$(dotnet --version | cut -d '.' -f 1)
if [ "$DOTNET_VERSION" -lt 6 ]; then
    echo ".NET SDK 6.0 or higher is required. Found version: $(dotnet --version)"
    exit 1
fi

echo "✅ .NET SDK detected: $(dotnet --version)"

# Check for Docker
if ! command -v docker &> /dev/null
then
    echo "Docker not found. Please install Docker for the MS SQL Server container."
    echo "Download from: https://www.docker.com/products/docker-desktop"
    exit 1
fi

echo "✅ Docker detected: $(docker --version)"

# Check for Docker Compose
if ! command -v docker-compose &> /dev/null
then
    echo "Docker Compose not found. Please install Docker Compose."
    echo "Download from: https://docs.docker.com/compose/install/"
    exit 1
fi

echo "✅ Docker Compose detected: $(docker-compose --version)"

# Start MS SQL Server container
echo ""
echo "Starting MS SQL Server container..."
docker-compose up -d
if [ $? -ne 0 ]; then
    echo "Failed to start MS SQL Server container. Please check the error messages above."
    exit 1
fi

echo "✅ MS SQL Server container started"

# Wait for SQL Server to be ready
echo "Waiting for SQL Server to be ready..."
sleep 15

# Navigate to API project
cd FurnitureDelivery.API

# Restore dependencies
echo ""
echo "Restoring dependencies..."
dotnet restore
if [ $? -ne 0 ]; then
    echo "Failed to restore dependencies. Please check the error messages above."
    exit 1
fi

echo "✅ Dependencies restored"

# Build the project
echo ""
echo "Building the project..."
dotnet build
if [ $? -ne 0 ]; then
    echo "Failed to build the project. Please check the error messages above."
    exit 1
fi

echo "✅ Project built successfully"

# Apply migrations
echo ""
echo "Applying database migrations..."
dotnet ef database update
if [ $? -ne 0 ]; then
    echo "⚠️ Failed to apply migrations. You may need to run migrations manually:"
    echo "  $ cd FurnitureDelivery.API"
    echo "  $ dotnet ef database update"
fi

echo ""
echo "======================================================"
echo "  Setup complete! You can now start the API:"
echo "  $ cd FurnitureDelivery.API"
echo "  $ dotnet run"
echo ""
echo "  The API will be available at: http://localhost:5001"
echo "  API documentation: http://localhost:5001/swagger"
echo "======================================================"