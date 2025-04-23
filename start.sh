#!/bin/bash

# Start Chroma DB
echo "Starting Chroma DB..."
docker-compose up -d

# Wait for Chroma DB to start
echo "Waiting for Chroma DB to start..."
sleep 5

# Start the backend server
echo "Starting backend server..."
npm run server &
SERVER_PID=$!

# Wait for the server to start
echo "Waiting for backend server to start..."
sleep 3

# Start the frontend
echo "Starting frontend..."
npm run dev

# Cleanup on exit
trap "kill $SERVER_PID; docker-compose down" EXIT 