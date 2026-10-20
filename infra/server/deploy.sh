#!/usr/bin/env bash
# Atualiza a rádio com a versão mais nova do GitHub. Rodar no servidor:
#   /opt/radio-online/infra/server/deploy.sh
set -euo pipefail
cd "$(dirname "$0")/../.."

echo "==> Baixando a versão nova"
git pull --ff-only

echo "==> Reconstruindo e reiniciando o que mudou"
docker compose -f docker-compose.prod.yml up -d --build --remove-orphans

echo "==> Limpando imagens antigas"
docker image prune -f >/dev/null

docker compose -f docker-compose.prod.yml ps
