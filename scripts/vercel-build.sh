#!/bin/sh
# Build Vercel : migration de la base (marqueur « dev » retiré d'abord, sinon Payload refuse de migrer), puis build.
set -e
if [ -n "$PAYLOAD_SECRET" ] && [ -n "$DATABASE_URL" ]; then
  PAYLOAD_MIGRATING=true pnpm payload run src/scripts/prepare-migrate.ts
  pnpm payload migrate
else
  echo "⚠ PAYLOAD_SECRET ou DATABASE_URL absent des variables Vercel : migration ignorée, le site ne pourra pas lire la base."
fi
pnpm build
