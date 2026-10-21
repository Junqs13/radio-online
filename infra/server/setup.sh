#!/usr/bin/env bash
# Instala a rádio num servidor Ubuntu novo (Oracle Cloud, ARM ou x86).
# Rodar uma vez, como o usuário "ubuntu":
#   curl -fsSL https://raw.githubusercontent.com/Junqs13/radio-online/main/infra/server/setup.sh | bash
# Sem perguntas (ex: cloud-init na criação da máquina): defina SITE_DOMAIN antes.
#   SITE_DOMAIN=antenarock.com.br bash setup.sh
# Pode rodar de novo sem problema: ele pula o que já está feito.
set -euo pipefail

REPO_URL="${REPO_URL:-https://github.com/Junqs13/radio-online.git}"
APP_DIR="${APP_DIR:-/opt/radio-online}"
DOMAIN_DEFAULT="antenarock.com.br"

# Na primeira inicialização o Ubuntu costuma estar rodando atualizações sozinho: espera a vez em vez de falhar
APT="sudo DEBIAN_FRONTEND=noninteractive apt-get -o DPkg::Lock::Timeout=900"

say() { printf '\n\033[1;32m==> %s\033[0m\n' "$*"; }

if [ "$(id -u)" -eq 0 ]; then
  echo "Rode como o usuário normal (ubuntu), não como root. O script usa sudo quando precisa." >&2
  exit 1
fi

say "Atualizando o sistema"
$APT update -y
$APT upgrade -y
$APT install -y ca-certificates curl git openssl unattended-upgrades iptables-persistent

say "Ativando atualizações automáticas de segurança"
sudo dpkg-reconfigure -f noninteractive unattended-upgrades

if ! command -v docker >/dev/null 2>&1; then
  say "Instalando Docker (repositório oficial)"
  sudo install -m 0755 -d /etc/apt/keyrings
  sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
  sudo chmod a+r /etc/apt/keyrings/docker.asc
  echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" \
    | sudo tee /etc/apt/sources.list.d/docker.list >/dev/null
  $APT update -y
  $APT install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
  sudo usermod -aG docker "$USER"
fi
sudo systemctl enable --now docker

say "Liberando as portas 80 e 443 no firewall do Ubuntu"
# As imagens Ubuntu da Oracle vêm com regras iptables que bloqueiam tudo menos SSH.
for rule in "-p tcp --dport 80" "-p tcp --dport 443" "-p udp --dport 443"; do
  if ! sudo iptables -C INPUT $rule -m state --state NEW -j ACCEPT 2>/dev/null; then
    pos=$(sudo iptables -L INPUT --line-numbers | awk '/REJECT/ {print $1; exit}')
    sudo iptables -I INPUT "${pos:-1}" $rule -m state --state NEW -j ACCEPT
  fi
done
sudo netfilter-persistent save

say "Baixando o código em $APP_DIR"
if [ ! -d "$APP_DIR/.git" ]; then
  sudo mkdir -p "$APP_DIR"
  sudo chown "$USER:$USER" "$APP_DIR"
  git clone "$REPO_URL" "$APP_DIR"
else
  git -C "$APP_DIR" pull --ff-only
fi
cd "$APP_DIR"
mkdir -p storage backups

if [ ! -f .env ]; then
  say "Criando o .env com senhas aleatórias"
  DOMAIN="${SITE_DOMAIN:-}"
  if [ -z "$DOMAIN" ] && [ -r /dev/tty ]; then
    read -r -p "Domínio da rádio [$DOMAIN_DEFAULT]: " DOMAIN < /dev/tty || true
  fi
  DOMAIN="${DOMAIN:-$DOMAIN_DEFAULT}"
  rnd() { openssl rand -base64 48 | tr -dc 'A-Za-z0-9' | head -c "$1"; }
  ADMIN_PASS="$(rnd 20)"
  umask 077
  cat > .env <<ENV
# Gerado por infra/server/setup.sh em $(date -u +%Y-%m-%dT%H:%MZ). Não versionar.
SITE_DOMAIN=$DOMAIN

POSTGRES_USER=radio_user
POSTGRES_PASSWORD=$(rnd 32)
POSTGRES_DB=radio_db

ICECAST_SOURCE_PASSWORD=$(rnd 32)
ICECAST_ADMIN_PASSWORD=$(rnd 32)
ICECAST_RELAY_PASSWORD=$(rnd 32)
ICECAST_MOUNT=/live.mp3

ADMIN_USER=admin
ADMIN_PASSWORD=$ADMIN_PASS
SESSION_SECRET=$(rnd 48)
AUTODJ_TOKEN=$(rnd 40)

RADIO_TIMEZONE=America/Sao_Paulo
JINGLE_EVERY_SONGS_MIN=5
JINGLE_EVERY_SONGS_MAX=7
REQUEST_COOLDOWN_MIN=60
MAX_QUEUED_REQUESTS=5
ENV
  umask 022
  CREATED_ENV=1
fi

say "Agendando backup diário do banco (03:17)"
chmod +x infra/server/*.sh
CRON_LINE="17 3 * * * $APP_DIR/infra/server/backup.sh >> $APP_DIR/backups/backup.log 2>&1"
# Servidor novo não tem crontab: "crontab -l" falha e, com pipefail, derrubaria o script aqui
{ crontab -l 2>/dev/null | grep -v 'infra/server/backup.sh' || true; echo "$CRON_LINE"; } | crontab -

say "Construindo e subindo os containers (a primeira vez demora uns 10 minutos)"
sudo docker compose -f docker-compose.prod.yml up -d --build

say "Pronto"
IP=$(curl -fsS -4 https://ifconfig.me 2>/dev/null || echo "IP-DO-SERVIDOR")
DOMAIN=$(grep '^SITE_DOMAIN=' .env | cut -d= -f2)
cat <<MSG

Rádio instalada em $APP_DIR.

1. No Registro.br, aponte o domínio para este servidor:
     $DOMAIN      tipo A  ->  $IP
     www.$DOMAIN  tipo A  ->  $IP
   O HTTPS é emitido sozinho alguns minutos depois que o DNS propagar.

2. Envie as músicas do seu PC (PowerShell):
     scp -i \$HOME\\.ssh\\oracle_radio -r "C:\\Users\\EMERSON\\radio-online\\storage" ubuntu@$IP:$APP_DIR/
   Elas entram no acervo sozinhas em até 5 minutos.

3. Site:   https://$DOMAIN
   Painel: https://$DOMAIN/admin  (usuário: admin)
MSG
if [ "${CREATED_ENV:-0}" = 1 ]; then
  echo "   Senha do painel: $ADMIN_PASS"
  echo "   Guarde agora. Para ver de novo: grep ADMIN_PASSWORD $APP_DIR/.env"
fi
