#!/bin/bash

# Furniture Delivery - Package Creation Script
# ------------------------------------------------------

echo "======================================================"
echo "  Creating Deployment Packages"
echo "======================================================"
echo ""

# Check if zip command is available
if ! command -v zip &> /dev/null
then
    echo "zip command not found. Please install zip utility."
    exit 1
fi

# Function to create a timestamp
timestamp() {
  date +"%Y%m%d-%H%M%S"
}

# Create the backend API package
echo "Creating backend API package..."
TIMESTAMP=$(timestamp)
BACKEND_PACKAGE="furniture-delivery-api-${TIMESTAMP}.zip"

# Create temporary directory for backend files
mkdir -p temp_backend
cp -r Backend/* temp_backend/
cp docker-compose.yml temp_backend/
cp Dockerfile temp_backend/
cp docker-entrypoint.sh temp_backend/ 2>/dev/null || :
cp install.sh temp_backend/

# Create the backend zip package
zip -r "$BACKEND_PACKAGE" temp_backend/* -x "*/obj/*" -x "*/bin/*" -x "*/node_modules/*"

# Create the frontend package
echo "Creating frontend package..."
FRONTEND_PACKAGE="furniture-delivery-angular-${TIMESTAMP}.zip"

# Create temporary directory for frontend files
mkdir -p temp_frontend
cp -r Frontend/* temp_frontend/
cp install.sh temp_frontend/

# Create the frontend zip package
zip -r "$FRONTEND_PACKAGE" temp_frontend/* -x "*/node_modules/*" -x "*/dist/*" -x "*/.angular/*"

# Create a complete package with both frontend and backend
echo "Creating complete package..."
COMPLETE_PACKAGE="furniture-delivery-full-${TIMESTAMP}.zip"

# Copy essential files to a temp directory
mkdir -p temp_complete
cp -r Backend temp_complete/
cp -r Frontend temp_complete/
cp docker-compose.yml temp_complete/
cp Dockerfile temp_complete/
cp docker-entrypoint.sh temp_complete/ 2>/dev/null || :
cp install.sh temp_complete/

# Create the complete package
zip -r "$COMPLETE_PACKAGE" temp_complete/* -x "*/obj/*" -x "*/bin/*" -x "*/node_modules/*" -x "*/dist/*" -x "*/.angular/*"

# Clean up temporary directories
rm -rf temp_backend temp_frontend temp_complete

echo ""
echo "Packages created successfully:"
echo "  - Backend API: $BACKEND_PACKAGE"
echo "  - Frontend Angular: $FRONTEND_PACKAGE"
echo "  - Complete Solution: $COMPLETE_PACKAGE"
echo ""
echo "These packages can be distributed and easily deployed by extracting"
echo "the ZIP file and running the included setup script."
echo "======================================================"