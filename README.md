# SonicWave Radio

Rádio online com Auto-DJ: Liquidsoap toca os arquivos da pasta `storage/` e transmite pelo Icecast. A API (Express + Prisma + Postgres) cuida do acervo, da grade e dos pedidos. O site e o painel são em Next.js.

## Rodar tudo com Docker

1. Copie `.env.example` para `.env` e preencha as senhas (o `.env` já existe na sua máquina).
2. Coloque os MP3 em `storage/`. Eles entram no acervo sozinhos em até 5 minutos, e o Liquidsoap relê a pasta a cada 60 segundos.
3. Suba:

```
docker compose up -d --build
```

Endereços locais:

| O quê | Onde |
|---|---|
| Site | http://localhost:3000 |
| Painel | http://localhost:3000/admin |
| API | http://localhost:3001/api/health |
| Stream | http://localhost:8000/live.mp3 |
| Status do Icecast | http://localhost:8000 |

Para ver o que está acontecendo: `docker compose logs -f liquidsoap backend`.

## Rodar o backend ou o site fora do Docker

Com a stack de pé (`docker compose up -d postgres icecast liquidsoap`):

```
cd backend && npm install && npx prisma migrate deploy && npm run dev
cd frontend && npm install && npm run dev
```

O backend usa `backend/.env` e o site usa `frontend/.env.local`.

## Como o Auto-DJ decide o que tocar

A cada faixa, o Liquidsoap pergunta à API qual é a próxima e avisa quando ela começa. A API escolhe nesta ordem:

1. Pedido de ouvinte que está na fila (o mais antigo primeiro).
2. Vinheta, se o bloco da grade permitir e já tiver passado `JINGLE_EVERY_MIN` minutos desde a última.
3. Música do programa no ar: as faixas da pasta ligada a ele (por exemplo `Rock Anos 70`).
4. Fora da grade, o acervo inteiro.

Regras de rotação:

- Nunca a mesma faixa duas vezes seguidas.
- Metade do conjunto que tocou por último fica bloqueada, até no máximo 60 faixas.
- Evita o mesmo artista das últimas 3 faixas.
- Entre as que estão há mais tempo sem tocar, sorteia uma.

Se a API cair, o Liquidsoap toca a pasta `storage` embaralhada e a rádio continua no ar.

Para ter vinhetas, crie a pasta `storage/Vinhetas` e coloque os arquivos lá. Eles entram como vinheta sozinhos. No painel, em Acervo, dá para trocar o tipo de qualquer faixa e tirar faixas da rotação.

Pedidos de ouvintes:

- Se o ouvinte escolher uma música do acervo na busca, ela entra direto na fila, até `MAX_QUEUED_REQUESTS` pedidos.
- Uma música que tocou há menos de `REQUEST_COOLDOWN_MIN` minutos fica com o locutor, em Pedidos, para ele decidir.
- O mesmo vale para pedidos de músicas que não existem no acervo.

## Segurança do painel

O login do painel é validado pela API. A senha fica em `ADMIN_PASSWORD` no `.env`, e a sessão vai num cookie que o JavaScript da página não consegue ler, válido por 12 horas (`SESSION_HOURS`).

O que está protegido:

| Rota | Quem acessa |
|---|---|
| Ouvir, ver acervo, grade e "tocando agora" | Público |
| Enviar pedido de música | Público, até 5 por IP a cada 10 minutos |
| Ver e apagar pedidos, criar programas e horários, enviar áudio | Só logado |
| Login | 5 tentativas erradas por IP a cada 15 minutos |

O upload aceita só arquivos de áudio (confere o conteúdo, não só a extensão), até 100 MB (`MAX_UPLOAD_MB`).

Para gerar valores fortes no PowerShell:

```
[Convert]::ToBase64String((1..32 | % { Get-Random -Max 256 }))
```

## Trocar a senha do Postgres

O Postgres só lê `POSTGRES_USER` e `POSTGRES_PASSWORD` na primeira vez que cria o volume `pgdata`. Para trocar a senha de um banco que já existe:

```
docker compose exec postgres psql -U radio_user -d radio_db -c "ALTER USER radio_user PASSWORD 'nova-senha';"
```

Depois atualize `POSTGRES_PASSWORD` no `.env` e no `backend/.env` e rode `docker compose up -d`.

## Estrutura

- `infra/icecast/` imagem do Icecast. O `entrypoint.sh` põe as senhas do `.env` no `icecast.xml`.
- `infra/liquidsoap/radio.liq` script do Auto-DJ.
- `storage/` acervo de áudio, uma subpasta por categoria, compartilhado entre backend e Liquidsoap. Os arquivos seguem o padrão `Artista - Título.mp3` e têm a tag de ganho ReplayGain, que o Liquidsoap usa para igualar o volume. `storage/_catalogo.csv` lista todas as faixas.
- `backend/prisma/` schema e migrations do banco.
