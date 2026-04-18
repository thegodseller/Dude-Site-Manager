#!/bin/bash
# 🏝️ DuDe Hawaiian v2.1 — Bootstrap Wrapper
set -e

echo "Starting Qdrant Bootstrap..."
sg docker -c "docker run --rm -v $(pwd)/../tHe_DuDe_Service/scripts:/scripts --network the_dude_compose_dude_net the_dude_compose-ag_librarian python /scripts/qdrant_bootstrap_v2.py"

echo "Initializing PostgreSQL Schema..."
sg docker -c "docker compose exec db_postgres psql -U dude -d dude -f /docker-entrypoint-initdb.d/schema.sql"

echo "✅ Bootstrap sequence complete."
