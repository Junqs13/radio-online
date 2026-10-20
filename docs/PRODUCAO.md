# Colocar a rádio no ar (Oracle Cloud + antenarock.com.br)

Tudo roda numa máquina grátis da Oracle. Na frente fica o Caddy, que emite e renova o certificado HTTPS sozinho:

| Endereço | O que é |
|---|---|
| `https://antenarock.com.br` | Site |
| `https://antenarock.com.br/admin` | Painel |
| `https://antenarock.com.br/live.mp3` | Stream de áudio |

Só as portas 80 e 443 ficam abertas. Banco, API, Icecast e Liquidsoap ficam fechados dentro do Docker.

Tempo total: uns 40 minutos, mais o tempo de enviar as músicas.

## 1. Chave SSH no seu PC

No PowerShell:

```
ssh-keygen -t ed25519 -f $HOME\.ssh\oracle_radio
```

Pode deixar a senha da chave em branco ou criar uma. O arquivo `C:\Users\EMERSON\.ssh\oracle_radio.pub` é o que vai para a Oracle.

## 2. Criar a máquina na Oracle

No console da Oracle: menu → Compute → Instances → Create instance.

- Name: `antenarock`
- Image: Canonical Ubuntu 24.04 (a versão comum, não a "Minimal")
- Shape: Ampere, `VM.Standard.A1.Flex`, com 2 OCPU e 12 GB de memória. Sobra para a rádio e deixa metade da cota grátis livre.
- Networking: deixe criar a rede nova e marque "Assign a public IPv4 address".
- Add SSH keys: "Upload public key files" e escolha o `oracle_radio.pub`.
- Boot volume: marque "Specify a custom boot volume size" e coloque 100 GB.

Se aparecer "Out of capacity", tente de novo mais tarde ou troque o "Availability domain". Isso acontece com o plano grátis.

Quando a máquina ficar "Running", anote o "Public IP address".

## 3. Abrir as portas 80 e 443 na rede da Oracle

Na página da máquina: clique na Subnet → Security Lists → Default Security List → Add Ingress Rules. Adicione duas regras:

| Source CIDR | IP Protocol | Destination Port |
|---|---|---|
| `0.0.0.0/0` | TCP | `80,443` |
| `0.0.0.0/0` | UDP | `443` |

## 4. Instalar a rádio no servidor

No PowerShell (troque `IP` pelo IP da máquina):

```
ssh -i $HOME\.ssh\oracle_radio ubuntu@IP
```

Já dentro do servidor:

```
curl -fsSL https://raw.githubusercontent.com/Junqs13/radio-online/main/infra/server/setup.sh | bash
```

O script vai fazer isto:

1. Atualiza o Ubuntu.
2. Instala o Docker.
3. Libera as portas no firewall do Ubuntu.
4. Baixa o código.
5. Cria o `.env` com senhas aleatórias.
6. Agenda o backup diário.
7. Sobe a rádio.

Ele pergunta o domínio (Enter aceita `antenarock.com.br`) e o seu e-mail. No fim, mostra a senha do painel. Guarde essa senha.

## 5. Apontar o domínio no Registro.br

Em registro.br → antenarock.com.br → DNS → Editar zona (se pedir, ative o "modo avançado"). Crie:

| Nome | Tipo | Valor |
|---|---|---|
| (vazio) | A | IP do servidor |
| www | A | IP do servidor |

A propagação leva de minutos a algumas horas. Assim que ela terminar, o Caddy emite o certificado sozinho. Para acompanhar, rode no servidor:

```
cd /opt/radio-online && docker compose -f docker-compose.prod.yml logs -f caddy
```

## 6. Enviar as músicas

No PowerShell do seu PC:

```
scp -i $HOME\.ssh\oracle_radio -r "C:\Users\EMERSON\radio-online\storage" ubuntu@IP:/opt/radio-online/
```

São uns 2 GB. Depende da velocidade de upload da sua internet. Em até 5 minutos depois de chegarem, as faixas aparecem no painel em Acervo. Enquanto isso, o Liquidsoap toca o que já chegou.

## 7. Evitar que a Oracle desligue a máquina

No plano grátis, a Oracle pode recuperar máquinas que considera paradas. Para evitar isso:

1. Em Billing → Upgrade and Manage Payment, mude a conta para "Pay As You Go". Ela pede cartão.
2. Continue usando só recursos "Always Free". Assim a conta não é cobrada.
3. Em Billing → Budgets, crie um orçamento de R$ 1 com aviso por e-mail. Se algo sair do grátis, você fica sabendo na hora.

## 8. Monitoramento grátis

Em uptimerobot.com, crie dois monitores HTTP(s) com intervalo de 5 minutos:

- `https://antenarock.com.br/api/health` (responde 503 se o banco ou o stream caírem)
- `https://antenarock.com.br/live.mp3`

## Dia a dia

Atualizar a rádio depois de uma mudança no GitHub:

```
/opt/radio-online/infra/server/deploy.sh
```

Ver o que está rodando e os logs:

```
cd /opt/radio-online
docker compose -f docker-compose.prod.yml ps
docker compose -f docker-compose.prod.yml logs -f liquidsoap backend
```

Backup: o banco é salvo todo dia às 03:17 em `/opt/radio-online/backups`, e o servidor guarda os últimos 14 dias. Para ter uma cópia fora do servidor, baixe de vez em quando:

```
scp -i $HOME\.ssh\oracle_radio -r ubuntu@IP:/opt/radio-online/backups .
```

Restaurar um backup:

```
gunzip -c backups/radio-AAAA-MM-DD.sql.gz | docker compose -f docker-compose.prod.yml exec -T postgres psql -U radio_user -d radio_db
```

## Ligar a pasta do seu PC ao GitHub

A pasta `C:\Users\EMERSON\radio-online` ainda usa o `.git` antigo, que tem senhas no histórico. Para trocar pelo repositório novo sem mexer nos arquivos, rode no PowerShell, dentro da pasta:

```
Rename-Item .git .git-antigo-com-senhas
git init -b main
git remote add origin https://github.com/Junqs13/radio-online
git fetch origin
git reset origin/main
git status
```

Depois de conferir que está tudo certo, apague a pasta `.git-antigo-com-senhas`.

## Direitos autorais

Tocar música comercial em público na internet, no Brasil, exige licença do ECAD para webrádio. Vale consultar o ECAD antes de divulgar a rádio.
