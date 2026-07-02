#!/bin/sh
set -e

# Run Prisma migrations
npx prisma migrate deploy

# Start the server
exec node server.js
