# Furniture Delivery - Angular Frontend

This is the frontend for the Furniture Delivery application, a modern platform for furniture delivery management built with Angular.

## Features

- Modern, responsive design with gradient color schemes
- Real-time delivery tracking with interactive maps
- Live chat between customers and drivers
- Robust authentication and authorization
- Comprehensive dashboards for customers and drivers

## Technical Stack

- **Angular**: Latest version with TypeScript
- **Angular Material**: UI component library
- **WebSockets**: Real-time communication
- **Google Maps API**: For delivery tracking
- **RxJS**: Reactive programming

## Prerequisites

- Node.js (v14 or later)
- Angular CLI
- A running instance of the FurnitureDelivery.API backend

## Getting Started

### Installation

1. Extract the zip file to your desired location
2. Navigate to the extracted directory
3. Install dependencies:

```bash
npm install
```

### Configuration

Update the environment configuration in `src/environments/environment.ts`:

```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:5001/api',
  wsUrl: 'ws://localhost:5001/ws',
  mapsApiKey: 'YOUR_GOOGLE_MAPS_API_KEY' // Replace with your Google Maps API key if needed
};
```

### Running the Application

Start the development server:

```bash
npm start
```

The application will be available at `http://localhost:4200/`.

### Building for Production

To build the application for production:

```bash
npm run build
```

The build artifacts will be stored in the `dist/` directory.

## Project Structure

- `src/app/auth`: Authentication-related components and services
- `src/app/core`: Core services, guards, and interceptors
- `src/app/customer`: Customer-facing components
- `src/app/driver`: Driver-facing components
- `src/app/models`: Data models
- `src/app/shared`: Shared components and utilities

## Deployment

The production build can be deployed to any web server or hosting service that supports static websites, such as:

- Azure Static Web Apps
- AWS S3 + CloudFront
- Netlify
- Vercel
- GitHub Pages

## License

This project is proprietary and confidential.