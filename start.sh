#!/bin/sh
export HOSTNAME=0.0.0.0
export PORT=3000
npx prisma migrate deploy && npm run start
