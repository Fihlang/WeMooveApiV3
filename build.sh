#!/bin/bash

# Build both the .NET API and Angular app
echo "Building Furniture Delivery Application..."

# Build the .NET API
echo "Building .NET Core API..."
cd Backend/FurnitureDelivery.API && dotnet publish -c Release -o ../../dist/api

# Build the Angular app
echo "Building Angular frontend..."
cd Frontend/FurnitureDelivery && ng build --configuration production --output-path ../../dist/web

echo "Build complete."