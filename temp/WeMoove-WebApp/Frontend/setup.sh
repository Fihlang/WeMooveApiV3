#!/bin/bash

# Furniture Delivery - Angular Frontend Setup Script
# ------------------------------------------------------

echo "======================================================"
echo "  Furniture Delivery - Angular Frontend Setup"
echo "======================================================"
echo ""

# Check for Node.js
if ! command -v node &> /dev/null
then
    echo "Node.js not found. Please install Node.js v14 or higher."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d 'v' -f 2 | cut -d '.' -f 1)
if [ "$NODE_VERSION" -lt 14 ]; then
    echo "Node.js version 14 or higher is required. Found version: $(node -v)"
    exit 1
fi

echo "✅ Node.js detected: $(node -v)"

# Check for npm
if ! command -v npm &> /dev/null
then
    echo "npm not found. Please install npm."
    exit 1
fi

echo "✅ npm detected: $(npm -v)"

# Check for Angular CLI
if ! command -v ng &> /dev/null
then
    echo "Angular CLI not found. Installing..."
    npm install -g @angular/cli
    if [ $? -ne 0 ]; then
        echo "Failed to install Angular CLI. Please install it manually."
        exit 1
    fi
    echo "✅ Angular CLI installed: $(ng version --version)"
else
    echo "✅ Angular CLI detected: $(ng version --version)"
fi

# Install dependencies
echo ""
echo "Installing dependencies..."
npm install
if [ $? -ne 0 ]; then
    echo "Failed to install dependencies. Please check the error messages above."
    exit 1
fi

echo "✅ Dependencies installed successfully"

# Check for configuration
if [ -f "src/environments/environment.ts" ]; then
    echo ""
    echo "Please update environment configuration in src/environments/environment.ts"
    echo "The API URL should point to your backend API server."
    echo ""
    echo "For example:"
    echo "  apiUrl: 'http://localhost:5001/api'"
    echo "  wsUrl: 'ws://localhost:5001/ws'"
fi

echo ""
echo "======================================================"
echo "  Setup complete! You can now start the application:"
echo "  $ npm start"
echo ""
echo "  The application will be available at: http://localhost:4200/"
echo "======================================================"