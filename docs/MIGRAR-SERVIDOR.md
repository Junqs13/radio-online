# Levar a rádio para outro servidor (ex: VPS da Locaweb)

A rádio precisa de uma máquina com Docker ligada 24 horas, então hospedagem de sites comum não serve: é preciso um VPS. Na Locaweb, o VPS 4 GB (2 vCPU, 70 GB) com Ubuntu 24.04 dá conta com folga. O de 2 GB funciona, mas fica no limite na hora de montar o site.

A ideia é montar o servidor novo inteiro, copiar músicas e banco, e só no fim trocar o DNS. A rádio não sai do ar durante a mudança.

Nos comandos abaixo, troque `NOVO_IP` pelo IP do VPS. O servidor antigo da Oracle é `137.131.173.135`.

## 1. Criar o usuário ubuntu no VPS

O instalador roda como um usuário comum chamado `ubuntu`, e o VPS costuma vir só com o `root`. No PowerShell do PC, entre com a senha de root que a Locaweb mandou:

```
ssh root@NOVO_IP
```

Dentro do VPS:

```
adduser --disabled-password --gecos "" ubuntu
usermod -aG sudo ubuntu
echo "ubuntu ALL=(ALL) NOPASSWD:ALL" > /etc/sudoers.d/ubuntu
mkdir -p /home/ubuntu/.ssh && chown ubuntu:ubuntu /home/ubuntu/.ssh && chmod 700 /home/ubuntu/.ssh
exit
```

De volta ao PowerShell, autorize a mesma chave que você já usa:

```
type $HOME\.ssh\oracle_radio.pub | ssh root@NOVO_IP "cat >> /home/ubuntu/.ssh/authorized_keys && chown ubuntu:ubuntu /home/ubuntu/.ssh/authorized_keys && chmod 600 /home/ubuntu/.ssh/authorized_keys"
```

Teste: `ssh -i $HOME\.ssh\oracle_radio ubuntu@NOVO_IP` tem que entrar sem pedir senha.

Se o painel da Locaweb tiver firewall para o VPS, libere as portas 80 e 443 (TCP) e 443 (UDP).

## 2. Instalar a rádio no VPS

Dentro do VPS, como ubuntu:

```
curl -fsSL https://raw.githubusercontent.com/Junqs13/radio-online/main/infra/server/setup.sh | bash
```

Enter aceita o domínio `antenarock.com.br`. No fim aparece a senha nova do painel. Guarde.

## 3. Copiar as músicas, as vinhetas e as fotos do painel

No PowerShell do PC. O `-3` passa os arquivos de um servidor para o outro usando a sua chave:

```
scp -3 -i $HOME\.ssh\oracle_radio -r ubuntu@137.131.173.135:/opt/radio-online/storage ubuntu@NOVO_IP:/opt/radio-online/
```

## 4. Copiar o banco (deixe para perto da troca de DNS)

Tudo que mudar na Oracle depois deste passo (pedidos, estatísticas, lendas novas) fica para trás, então faça logo antes do passo 5.

No servidor antigo:

```
/opt/radio-online/infra/server/backup.sh
```

No PowerShell do PC, copie o backup de hoje (troque a data):

```
scp -3 -i $HOME\.ssh\oracle_radio ubuntu@137.131.173.135:/opt/radio-online/backups/radio-AAAA-MM-DD.sql.gz ubuntu@NOVO_IP:/opt/radio-online/backups/
```

No VPS:

```
cd /opt/radio-online
gunzip -c backups/radio-AAAA-MM-DD.sql.gz | sudo docker compose -f docker-compose.prod.yml exec -T postgres sh -c 'psql -q -U "$POSTGRES_USER" -d "$POSTGRES_DB"'
sudo docker compose -f docker-compose.prod.yml restart backend liquidsoap
```

## 5. Trocar o DNS no Registro.br

Em registro.br → antenarock.com.br → DNS → Editar zona, troque o valor dos dois registros A (o vazio e o `www`) de `137.131.173.135` para `NOVO_IP`.

Em minutos ou poucas horas o domínio passa a apontar para o VPS, e o Caddy emite o certificado HTTPS sozinho. Acompanhe no VPS:

```
cd /opt/radio-online && sudo docker compose -f docker-compose.prod.yml logs -f caddy
```

## 6. Desligar a Oracle

Deixe a Oracle ligada uns 2 dias, para quem ainda estiver com o endereço antigo guardado. Depois, no console da Oracle, pare a máquina e, quando tiver certeza, encerre (Terminate).

A partir daí, os comandos do dia a dia são os mesmos, trocando só o IP:

```
ssh -i $HOME\.ssh\oracle_radio ubuntu@NOVO_IP
/opt/radio-online/infra/server/deploy.sh
```
