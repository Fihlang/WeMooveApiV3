#!/bin/bash

# Create the Angular application
# Use --force to bypass Angular installation prompts
npx --yes -p @angular/cli ng new FurnitureDelivery --style=scss --routing=true --standalone=true --skip-tests=true --skip-git --force

# Move into the project directory
cd FurnitureDelivery

# Install additional dependencies for the project
npm install @angular/material @angular/cdk @angular/flex-layout
npm install leaflet @types/leaflet
npm install @ngrx/store @ngrx/effects @ngrx/entity @ngrx/store-devtools
npm install ngx-socket-io

# Generate core modules and components

# Auth Module
ng generate module auth --routing
ng generate component auth/login
ng generate component auth/register
ng generate service auth/auth

# User Module
ng generate module user --routing
ng generate component user/profile
ng generate component user/dashboard
ng generate service user/user

# Driver Module
ng generate module driver --routing
ng generate component driver/dashboard
ng generate component driver/delivery-map
ng generate component driver/active-delivery
ng generate service driver/driver

# Furniture Module
ng generate module furniture --routing
ng generate component furniture/furniture-list
ng generate component furniture/furniture-item
ng generate service furniture/furniture

# Delivery Module
ng generate module delivery --routing
ng generate component delivery/create-delivery
ng generate component delivery/delivery-details
ng generate component delivery/delivery-tracking
ng generate service delivery/delivery

# Shared Module
ng generate module shared
ng generate component shared/header
ng generate component shared/footer
ng generate component shared/loading-spinner
ng generate component shared/error-message
ng generate component shared/rating
ng generate component shared/map

# Core Module
ng generate module core
ng generate service core/http
ng generate service core/websocket
ng generate interceptor core/auth

# Create Models
mkdir -p src/app/core/models