#!/bin/bash

# Start both the .NET API and Angular app
echo "Starting Furniture Delivery Application..."

# Start the .NET API in the background
echo "Starting .NET Core API..."
cd Backend/FurnitureDelivery.API && dotnet run --urls="http://0.0.0.0:5001" &
DOTNET_PID=$!

# Wait a moment for the .NET app to start
sleep 5

# Start the Angular app
echo "Starting Angular frontend..."
cd Frontend/FurnitureDelivery && ng serve --host 0.0.0.0 --port 5000 &
ANGULAR_PID=$!

# Function to handle script termination
cleanup() {
  echo "Shutting down services..."
  kill $DOTNET_PID
  kill $ANGULAR_PID
  exit 0
}

# Set up trap to catch termination signal
trap cleanup SIGINT SIGTERM

# Keep the script running
wait