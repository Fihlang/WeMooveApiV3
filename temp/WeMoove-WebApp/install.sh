#!/bin/bash

# Furniture Delivery - Full Installation Script
# ------------------------------------------------------

echo "======================================================"
echo "  Furniture Delivery - Complete Installation"
echo "======================================================"
echo ""
echo "This script will set up both the backend API and frontend Angular application."
echo ""
echo "Prerequisites:"
echo "  - .NET SDK 6.0+"
echo "  - Docker & Docker Compose"
echo "  - Node.js 14+"
echo "  - npm"
echo ""
read -p "Press Enter to continue or Ctrl+C to cancel..." 

# Start with the backend
echo ""
echo "======================================================"
echo "  Setting up backend API..."
echo "======================================================"
cd Backend
bash setup.sh
if [ $? -ne 0 ]; then
    echo "❌ Backend setup failed. Please check the error messages above."
    exit 1
fi

# Then set up the frontend
echo ""
echo "======================================================"
echo "  Setting up frontend application..."
echo "======================================================"
cd ../Frontend
bash setup.sh
if [ $? -ne 0 ]; then
    echo "❌ Frontend setup failed. Please check the error messages above."
    exit 1
fi

echo ""
echo "======================================================"
echo "  Installation complete!"
echo "======================================================"
echo ""
echo "To start the backend API:"
echo "  $ cd Backend/FurnitureDelivery.API"
echo "  $ dotnet run"
echo ""
echo "To start the frontend application:"
echo "  $ cd Frontend"
echo "  $ npm start"
echo ""
echo "Make sure the backend API is running before starting the frontend."
echo "======================================================"