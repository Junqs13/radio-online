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

- Advanced options → Management → "Paste cloud-init script": cole o conteúdo de `infra/server/cloud-init.sh`. Assim a máquina já instala a rádio sozinha quando ligar pela primeira vez, e o passo 4 vira só conferência.

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

Se você usou o cloud-init no passo 2, a instalação já está rodando sozinha. Acompanhe (leva uns 15 minutos) e veja a senha do painel no final:

```
sudo tail -f /var/log/radio-setup.log
```

Sem cloud-init, rode a instalação na mão, já dentro do servidor:

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

Ele pergunta o domínio (Enter aceita `antenarock.com.br`). No fim, mostra a senha do painel. Guarde essa senha. Para ver de novo depois: `grep ADMIN_PASSWORD /opt/radio-online/.env`.

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

Para mandar só uma pasta nova depois (ex: uma banda que entrou no acervo):

```
scp -i $HOME\.ssh\oracle_radio -r "C:\Users\EMERSON\radio-online\storage\Iron Maiden" ubuntu@IP:/opt/radio-online/storage/
```

## Grade da semana

`infra/server/grade-semana.sql` monta a grade completa: blocos por estilo durante o dia, Especial Elvis Presley de segunda a sexta das 11h às 12h e especiais de 30 minutos de uma banda só entre 23h e 7h, intercalados com a Madrugada. Ele apaga a grade e os programas atuais antes de criar de novo. Rode no servidor depois que as músicas estiverem no acervo:

```
cd /opt/radio-online && sudo docker compose -f docker-compose.prod.yml exec -T postgres sh -c 'psql -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" -d "$POSTGRES_DB"' < infra/server/grade-semana.sql
```

Depois, ajuste no painel em Grade: arraste um bloco sobre outro para trocar os dois, ou arraste um programa da lista para um bloco. Em Programas, cada programa pode tocar mais de uma pasta.

## Vinhetas

As vinhetas ficam em `storage/Vinhetas`, separadas em subpastas. O nome da subpasta diz onde a vinheta pode tocar:

| Subpasta | Quando toca |
|---|---|
| `Geral` | Qualquer hora, em qualquer programa |
| Nome de um programa, ex: `Especial Elvis Presley`, `Rock Anos 70`, `Alternativo` | Só durante esse programa |
| Com horário, ex: `Almoco 11h-14h`, `Noite 18h-24h` | Só nesse horário |
| Com dia, ex: `Sexta`, `Promo Elvis seg-sex 06h-11h` | Só nesses dias (e no horário, se tiver) |

Toca uma vinheta a cada 5 a 7 músicas, sorteado a cada vez. Quando existe uma vinheta do programa ou do horário que está no ar, ela tem metade das chances e a geral fica com a outra metade. A mesma vinheta não se repete em seguida.

Para mandar as vinhetas para o servidor:

```powershell
scp -i $HOME\.ssh\oracle_radio -r "C:\Users\EMERSON\radio-online\storage\Vinhetas" ubuntu@IP:/opt/radio-online/storage/
```

A rádio encontra os arquivos novos sozinha em até 5 minutos. Para criar uma vinheta nova de um programa, é só criar a subpasta com o nome exato do programa na grade.

## Conteúdo do site e estatísticas

No painel, em **Conteúdo**, você cria, edita, esconde e apaga as lendas do carrossel e as curiosidades. Não precisa de deploy: salvou, já aparece no site.

- O carrossel mostra 6 lendas. A mais recente abre, a segunda mais recente fecha e as do meio são sorteadas a cada visita. "Subir para o topo" faz uma lenda antiga voltar para a frente.
- Lenda pode ter foto (enviada pelo painel, até 5 MB, ou um endereço https://) ou ficar só com o degradê colorido e o nome da banda. As fotos enviadas ficam em `storage/_site/`, que entra no backup junto com o acervo.
- A curiosidade é sorteada a cada visita, sem repetir a última que a pessoa viu.

Em **Estatísticas** ficam visitas, pessoas, tempo no site, quem deu play e quanto tempo ouviu, cliques, partes da página, lendas abertas, curiosidades curtidas e compartilhadas, cidade, estado, país, aparelho e de onde a pessoa veio.

- Tudo roda no próprio servidor, sem Google Analytics. O IP é usado só na hora para estimar a cidade (base DB-IP Lite, CC BY 4.0) e não é guardado.
- Quem liga "Não rastrear" no navegador fica de fora. Robôs também.
- Visitas com mais de 400 dias são apagadas sozinhas toda madrugada.
- Para saber de onde vem cada divulgação, use links com `?utm_source=`, por exemplo `https://antenarock.com.br/?utm_source=instagram`.

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
