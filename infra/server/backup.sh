#!/usr/bin/env bash
# Backup do banco (programas, grade, pedidos, histórico). Roda todo dia pelo cron.
# Guarda os últimos 14 dias em backups/. As músicas não entram: o original está no seu PC.
#
# Restaurar um backup:
#   gunzip -c backups/radio-AAAA-MM-DD.sql.gz | docker compose -f docker-compose.prod.yml exec -T postgres psql -U radio_user -d radio_db
set -euo pipefail
cd "$(dirname "$0")/../.."
set -a; . ./.env; set +a

mkdir -p backups
FILE="backups/radio-$(date +%F).sql.gz"
docker compose -f docker-compose.prod.yml exec -T postgres \
  pg_dump --clean --if-exists -U "$POSTGRES_USER" -d "$POSTGRES_DB" | gzip > "$FILE.tmp"
mv "$FILE.tmp" "$FILE"
find backups -name 'radio-*.sql.gz' -mtime +14 -delete
echo "$(date '+%F %T') backup ok: $FILE ($(du -h "$FILE" | cut -f1))"
