#!/bin/sh
# Gera o icecast.xml final trocando os marcadores pelas senhas do ambiente.
set -e

: "${ICECAST_SOURCE_PASSWORD:?defina ICECAST_SOURCE_PASSWORD no .env}"
: "${ICECAST_ADMIN_PASSWORD:?defina ICECAST_ADMIN_PASSWORD no .env}"
: "${ICECAST_RELAY_PASSWORD:=$ICECAST_SOURCE_PASSWORD}"

sed -e "s|__SOURCE_PASSWORD__|${ICECAST_SOURCE_PASSWORD}|g" \
    -e "s|__ADMIN_PASSWORD__|${ICECAST_ADMIN_PASSWORD}|g" \
    -e "s|__RELAY_PASSWORD__|${ICECAST_RELAY_PASSWORD}|g" \
    /etc/icecast/icecast.template.xml > /tmp/icecast.xml

exec icecast -c /tmp/icecast.xml
