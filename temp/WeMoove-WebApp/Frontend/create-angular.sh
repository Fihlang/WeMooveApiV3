#!/bin/bash

# Create the Angular application without git
npm init -y
npx -p @angular/cli ng new FurnitureDelivery --style=scss --routing=true --standalone=true --skip-tests=true --skip-git --force