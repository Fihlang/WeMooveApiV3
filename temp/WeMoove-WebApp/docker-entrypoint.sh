#!/bin/sh
set -e

# Function to wait for PostgreSQL to be ready
wait_for_postgres() {
  echo "Waiting for PostgreSQL to be ready..."
  
  # Define connection variables from environment
  PG_HOST=$(echo $DATABASE_URL | sed -n 's/.*@\([^:]*\).*/\1/p')
  PG_PORT=$(echo $DATABASE_URL | sed -n 's/.*:\([0-9]*\)\/.*/\1/p')
  
  # Default to standard Postgres port if not found
  if [ -z "$PG_PORT" ]; then
    PG_PORT=5432
  fi
  
  # Wait for PostgreSQL to be available
  until nc -z $PG_HOST $PG_PORT; do
    echo "PostgreSQL is unavailable - sleeping"
    sleep 1
  done
  
  echo "PostgreSQL is up - continuing"
}

# If a command was passed to the container, execute it
if [ "${1#-}" != "$1" ]; then
  set -- node "$@"
fi

# If we're running the start command and using a database
if [ "$1" = "npm" ] && [ "$2" = "start" ] && [[ $DATABASE_URL == *"postgres"* ]]; then
  wait_for_postgres
fi

# Run database migrations if needed
if [ "$NODE_ENV" = "production" ] && [ -f "./node_modules/.bin/drizzle-kit" ] && [[ $DATABASE_URL == *"postgres"* ]]; then
  echo "Running database migrations..."
  ./node_modules/.bin/drizzle-kit push:pg
fi

# Execute the passed command
exec "$@"