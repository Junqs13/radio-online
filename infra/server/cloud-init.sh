#!/bin/bash
# Cole este conteúdo em "cloud-init script" ao criar a máquina na Oracle.
# Na primeira vez que a máquina liga, ela instala a rádio sozinha.
# Acompanhe pelo SSH com: tail -f /var/log/radio-setup.log
curl -fsSL https://raw.githubusercontent.com/Junqs13/radio-online/main/infra/server/setup.sh -o /tmp/radio-setup.sh
touch /var/log/radio-setup.log && chmod 600 /var/log/radio-setup.log  # o log mostra a senha do painel
# shellcheck disable=SC2024
sudo -u ubuntu -H env SITE_DOMAIN=antenarock.com.br bash /tmp/radio-setup.sh > /var/log/radio-setup.log 2>&1
