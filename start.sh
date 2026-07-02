#!/bin/sh
export HOSTNAME=0.0.0.0
export PORT=3000
mkdir -p uploads
npx prisma migrate deploy && npm run start
