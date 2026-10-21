-- Conteúdo editável do site e estatísticas
CREATE TABLE IF NOT EXISTS "legends" (
  "id" SERIAL PRIMARY KEY,
  "artist" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "image_url" TEXT,
  "gradient" TEXT NOT NULL DEFAULT 'vermelho',
  "year" TEXT,
  "origin" TEXT,
  "enabled" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "legends_enabled_created_at_idx" ON "legends"("enabled", "created_at");

CREATE TABLE IF NOT EXISTS "curiosities" (
  "id" SERIAL PRIMARY KEY,
  "text" TEXT NOT NULL,
  "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "enabled" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "curiosities_enabled_idx" ON "curiosities"("enabled");

CREATE TABLE IF NOT EXISTS "stat_sessions" (
  "id" TEXT PRIMARY KEY,
  "visitor_id" TEXT NOT NULL,
  "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "last_seen_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "landing_path" TEXT,
  "referrer" TEXT,
  "utm_source" TEXT,
  "country" TEXT,
  "region" TEXT,
  "city" TEXT,
  "device" TEXT,
  "os" TEXT,
  "browser" TEXT,
  "lang" TEXT,
  "timezone" TEXT,
  "pageviews" INTEGER NOT NULL DEFAULT 0,
  "listen_seconds" INTEGER NOT NULL DEFAULT 0,
  "played" BOOLEAN NOT NULL DEFAULT false
);
CREATE INDEX IF NOT EXISTS "stat_sessions_started_at_idx" ON "stat_sessions"("started_at");
CREATE INDEX IF NOT EXISTS "stat_sessions_visitor_id_idx" ON "stat_sessions"("visitor_id");

CREATE TABLE IF NOT EXISTS "stat_events" (
  "id" SERIAL PRIMARY KEY,
  "session_id" TEXT NOT NULL REFERENCES "stat_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  "type" TEXT NOT NULL,
  "name" TEXT,
  "section" TEXT,
  "path" TEXT,
  "value" INTEGER,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "stat_events_created_at_idx" ON "stat_events"("created_at");
CREATE INDEX IF NOT EXISTS "stat_events_type_created_at_idx" ON "stat_events"("type", "created_at");

-- Conteúdo que já estava no site
INSERT INTO "legends" ("artist", "title", "description", "image_url", "gradient", "year", "origin", "created_at") VALUES
('Iron Maiden', 'The Trooper', 'O baixista Steve Harris formou a banda em 1975. The Trooper, do disco Piece of Mind, conta a carga da Brigada Ligeira na Guerra da Crimeia, e o baixo galopa junto com os cavalos.', NULL, 'vermelho', '1983', 'Londres, Inglaterra', TIMESTAMP '2026-10-01 12:00:00'),
('Megadeth', 'Symphony of Destruction', 'Dave Mustaine criou o Megadeth em 1983, depois de sair do Metallica. Symphony of Destruction está em Countdown to Extinction, disco que chegou ao segundo lugar da parada da Billboard.', NULL, 'cinza', '1992', 'Los Angeles, EUA', TIMESTAMP '2026-10-01 13:00:00'),
('Black Sabbath', 'War Pigs', 'Quatro rapazes de uma cidade industrial inglesa que começaram a tocar juntos em 1968. War Pigs abre o disco Paranoid com uma letra contra a guerra e um riff que anda devagar e pesado.', NULL, 'roxo-escuro', '1970', 'Birmingham, Inglaterra', TIMESTAMP '2026-10-01 14:00:00'),
('Kiss', 'Detroit Rock City', 'Maquiagem e botas de plataforma desde 1973. Detroit Rock City abre o disco Destroyer e virou presença certa nos shows da banda.', NULL, 'prata', '1976', 'Nova York, EUA', TIMESTAMP '2026-10-01 15:00:00'),
('Def Leppard', 'Pour Some Sugar on Me', 'Banda formada no fim dos anos 70 por adolescentes de Sheffield. O disco Hysteria rendeu sete singles, e Pour Some Sugar on Me é o mais lembrado deles.', NULL, 'fogo', '1987', 'Sheffield, Inglaterra', TIMESTAMP '2026-10-01 16:00:00'),
('Ramones', 'Blitzkrieg Bop', 'Jaqueta de couro, calça rasgada e músicas de dois minutos. Blitzkrieg Bop abre o primeiro disco da banda e ajudou a dar forma ao punk.', NULL, 'pedra', '1976', 'Queens, Nova York, EUA', TIMESTAMP '2026-10-01 17:00:00'),
('Alice In Chains', 'Would?', 'Layne Staley e Jerry Cantrell cantavam em harmonia por cima de guitarras pesadas. Would? saiu primeiro na trilha do filme Singles e depois no disco Dirt.', NULL, 'verde-agua', '1992', 'Seattle, EUA', TIMESTAMP '2026-10-01 18:00:00'),
('The Smashing Pumpkins', '1979', 'Billy Corgan formou a banda em 1988. 1979 está no álbum duplo Mellon Collie and the Infinite Sadness e fala da adolescência do próprio Corgan.', NULL, 'azul', '1995', 'Chicago, EUA', TIMESTAMP '2026-10-01 19:00:00'),
('Red Hot Chili Peppers', 'Californication', 'Desde 1983 o baixo de Flea puxa o funk para dentro do rock. Californication marcou a volta do guitarrista John Frusciante, que tinha saído da banda em 1992.', NULL, 'laranja', '1999', 'Los Angeles, EUA', TIMESTAMP '2026-10-01 20:00:00'),
('David Bowie', 'Starman', 'Em julho de 1972, Bowie apresentou o personagem Ziggy Stardust ao Reino Unido cantando Starman no programa de TV Top of the Pops.', NULL, 'magenta', '1972', 'Londres, Inglaterra', TIMESTAMP '2026-10-01 21:00:00'),
('Elvis Presley', 'Heartbreak Hotel', 'Heartbreak Hotel foi o primeiro número um de Elvis nas paradas americanas. Na Antena Rock ele tem hora marcada: de segunda a sexta, das 11h ao meio-dia.', NULL, 'ouro', '1956', 'Tupelo, Mississippi, EUA', TIMESTAMP '2026-10-01 22:00:00'),
('The Smiths', 'There Is a Light That Never Goes Out', 'A voz de Morrissey e a guitarra de Johnny Marr. There Is a Light That Never Goes Out está em The Queen Is Dead, o terceiro disco de estúdio da banda.', NULL, 'rosa', '1986', 'Manchester, Inglaterra', TIMESTAMP '2026-10-01 23:00:00'),
('Coldplay', 'Clocks', 'A banda nasceu em 1996 entre colegas de faculdade. Clocks, puxada por um riff de piano de Chris Martin, ganhou o Grammy de Gravação do Ano em 2004.', NULL, 'ciano', '2002', 'Londres, Inglaterra', TIMESTAMP '2026-10-02 00:00:00'),
('Pink Floyd', 'Money', 'Money abre o lado B de The Dark Side of the Moon com o som de caixas registradoras gravado em loop. O compasso é de sete tempos, coisa rara num sucesso de rádio.', NULL, 'violeta', '1973', 'Londres, Inglaterra', TIMESTAMP '2026-10-02 01:00:00'),
('The Doors', 'Riders on the Storm', 'Riders on the Storm fecha L.A. Woman, o último disco gravado com Jim Morrison. Ele morreu em Paris em julho de 1971, três meses depois do lançamento.', NULL, 'ardosia', '1971', 'Los Angeles, EUA', TIMESTAMP '2026-10-02 02:00:00'),
('Deep Purple', 'Hush', 'O órgão de Jon Lord dividia o peso com a guitarra de Ritchie Blackmore. Hush, uma versão de música de Joe South, foi o primeiro sucesso da banda nos Estados Unidos.', NULL, 'roxo', '1968', 'Hertford, Inglaterra', TIMESTAMP '2026-10-02 03:00:00'),
('Legião Urbana', 'Tempo Perdido', 'Renato Russo escrevia letras que muita gente sabe de cor até hoje. Tempo Perdido está no disco Dois, o segundo da banda.', NULL, 'verde', '1986', 'Brasília, DF', TIMESTAMP '2026-10-02 04:00:00'),
('Raul Seixas', 'Gita', 'O baiano que juntou Elvis e Luiz Gonzaga na mesma vitrola. Gita dá nome ao disco de 1974.', NULL, 'ambar', '1974', 'Salvador, BA', TIMESTAMP '2026-10-02 05:00:00'),
('Titãs', 'Homem Primata', 'Homem Primata está em Cabeça Dinossauro, disco de guitarra seca e letra de protesto lançado pela banda paulistana em 1986.', NULL, 'lima', '1986', 'São Paulo, SP', TIMESTAMP '2026-10-02 06:00:00'),
('Dire Straits', 'Sultans of Swing', 'Mark Knopfler toca com os dedos, sem palheta, e dá para ouvir isso em cada nota. Sultans of Swing foi o primeiro sucesso da banda.', NULL, 'vinho', '1978', 'Londres, Inglaterra', TIMESTAMP '2026-10-02 07:00:00'),
('Nirvana', 'Smells Like Teen Spirit', 'O grito de geração grunge de Kurt Cobain que implodiu a indústria musical no início dos anos 90.', '/images/rock3.jpg', 'vermelho', NULL, NULL, TIMESTAMP '2026-10-02 08:00:00'),
('AC/DC', 'Back in Black', 'Um tributo estrondoso a Bon Scott que se tornou um dos álbuns mais vendidos de todos os tempos.', '/images/rock4.jpg', 'vermelho', NULL, NULL, TIMESTAMP '2026-10-02 09:00:00'),
('Led Zeppelin', 'Stairway to Heaven', 'O hino definitivo do rock clássico que consagrou Jimmy Page e Robert Plant na história eterna da música.', '/images/rock2.jpg', 'vermelho', NULL, NULL, TIMESTAMP '2026-10-02 10:00:00'),
('Jimi Hendrix', 'Purple Haze', 'A revolução psicodélica da guitarra elétrica que transformou Jimi Hendrix em uma lenda mística.', '/images/rock5.jpg', 'vermelho', NULL, NULL, TIMESTAMP '2026-10-02 11:00:00'),
('Freddie Mercury', 'Bohemian Rhapsody', 'A obra-prima operística que redefiniu os limites do rock nos anos 70, liderada pela voz incomparável de Freddie Mercury.', '/images/rock1.jpg', 'vermelho', NULL, NULL, TIMESTAMP '2026-10-02 12:00:00');

INSERT INTO "curiosities" ("text", "tags", "created_at") VALUES
('Paranoid, do Black Sabbath, foi feita às pressas no estúdio porque faltava uma música para fechar o disco de 1970. Virou a mais famosa da banda.', ARRAY['BlackSabbath', 'Metal']::TEXT[], TIMESTAMP '2026-10-01 12:00:00'),
('Bohemian Rhapsody não tem refrão e passa dos cinco minutos. Mesmo assim ficou nove semanas em primeiro lugar no Reino Unido, entre 1975 e 1976.', ARRAY['Queen']::TEXT[], TIMESTAMP '2026-10-01 12:01:00'),
('Smoke on the Water conta uma história real. Em dezembro de 1971, durante um show de Frank Zappa, o cassino de Montreux pegou fogo e o Deep Purple viu a fumaça cobrir o lago Léman.', ARRAY['DeepPurple', 'Anos70']::TEXT[], TIMESTAMP '2026-10-01 12:02:00'),
('Eddie, o mascote morto-vivo do Iron Maiden, aparece nas capas dos discos de estúdio da banda desde o primeiro, de 1980.', ARRAY['IronMaiden']::TEXT[], TIMESTAMP '2026-10-01 12:03:00'),
('Os Ramones não eram irmãos. Cada um adotou o sobrenome Ramone, inspirado em Paul Ramon, nome falso que Paul McCartney usava em hotéis no começo dos Beatles.', ARRAY['Ramones', 'Punk']::TEXT[], TIMESTAMP '2026-10-01 12:04:00'),
('O Kiss passou dez anos sem mostrar o rosto em público. A banda tirou a maquiagem na MTV em setembro de 1983, no lançamento de Lick It Up.', ARRAY['Kiss']::TEXT[], TIMESTAMP '2026-10-01 12:05:00'),
('Stairway to Heaven nunca foi lançada como single nos Estados Unidos. Quem quisesse a música tinha que comprar o disco inteiro.', ARRAY['LedZeppelin']::TEXT[], TIMESTAMP '2026-10-01 12:06:00'),
('The Dark Side of the Moon, do Pink Floyd, passou mais de 900 semanas na parada de discos da Billboard. Dá mais de 17 anos.', ARRAY['PinkFloyd', 'Anos70']::TEXT[], TIMESTAMP '2026-10-01 12:07:00'),
('Elvis Presley quase nunca tocou fora dos Estados Unidos. Os únicos shows no exterior foram no Canadá, em 1957.', ARRAY['Elvis']::TEXT[], TIMESTAMP '2026-10-01 12:08:00'),
('Space Oddity, de David Bowie, saiu em 11 de julho de 1969. Cinco dias depois a Apollo 11 decolava rumo à Lua.', ARRAY['DavidBowie']::TEXT[], TIMESTAMP '2026-10-01 12:09:00'),
('A letra de Gita, de Raul Seixas, foi escrita em parceria com Paulo Coelho. Os dois assinaram juntos várias músicas nos anos 70.', ARRAY['RaulSeixas', 'RockNacional']::TEXT[], TIMESTAMP '2026-10-01 12:10:00'),
('Faroeste Caboclo, da Legião Urbana, passa dos nove minutos e não tem refrão. Mesmo assim tocou muito no rádio.', ARRAY['LegiaoUrbana', 'RockNacional']::TEXT[], TIMESTAMP '2026-10-01 12:11:00'),
('O Dire Straits gravou Sultans of Swing numa demo barata. O radialista Charlie Gillett tocou a fita na BBC Radio London e a banda conseguiu contrato com gravadora.', ARRAY['DireStraits']::TEXT[], TIMESTAMP '2026-10-01 12:12:00'),
('Dave Mustaine foi tirado do Metallica em 1983, pouco antes da gravação do primeiro disco. No mesmo ano ele fundou o Megadeth.', ARRAY['Megadeth', 'Thrash']::TEXT[], TIMESTAMP '2026-10-01 12:13:00'),
('Rick Allen, baterista do Def Leppard, perdeu o braço esquerdo num acidente de carro no último dia de 1984. Voltou a tocar com uma bateria eletrônica adaptada, usando os pés para o que o braço fazia.', ARRAY['DefLeppard']::TEXT[], TIMESTAMP '2026-10-01 12:14:00'),
('As batidas de pé e as palmas de We Will Rock You foram gravadas várias vezes, uma por cima da outra, para soar como um estádio inteiro.', ARRAY['Queen']::TEXT[], TIMESTAMP '2026-10-01 12:15:00'),
('Nos shows, o The Doors não tinha baixista. Ray Manzarek fazia as linhas de baixo com a mão esquerda, num teclado, enquanto tocava órgão com a direita.', ARRAY['TheDoors']::TEXT[], TIMESTAMP '2026-10-01 12:16:00'),
('O nome AC/DC veio de uma máquina de costura. Margaret, irmã de Malcolm e Angus Young, viu a sigla na etiqueta do aparelho e sugeriu para a banda.', ARRAY['ACDC']::TEXT[], TIMESTAMP '2026-10-01 12:17:00'),
('Smells Like Teen Spirit tem nome de desodorante. Uma amiga escreveu na parede que Kurt Cobain cheirava a Teen Spirit, e ele só soube da marca depois.', ARRAY['Nirvana', 'Grunge']::TEXT[], TIMESTAMP '2026-10-01 12:18:00'),
('Jimi Hendrix era canhoto e tocava uma Stratocaster de destro virada de cabeça para baixo, com as cordas invertidas.', ARRAY['Hendrix', 'Guitarra']::TEXT[], TIMESTAMP '2026-10-01 12:19:00'),
('Tony Iommi, do Black Sabbath, perdeu as pontas de dois dedos numa fábrica de chapas de metal. Ele fez próteses caseiras e afinou a guitarra mais baixo para doer menos.', ARRAY['BlackSabbath', 'Guitarra']::TEXT[], TIMESTAMP '2026-10-01 12:20:00'),
('The Smiths durou só de 1982 a 1987 e lançou quatro discos de estúdio. Foi pouco tempo, e muita banda inglesa dos anos 90 cita o grupo como influência.', ARRAY['TheSmiths']::TEXT[], TIMESTAMP '2026-10-01 12:21:00'),
('Flea, baixista do Red Hot Chili Peppers, nasceu em Melbourne, na Austrália, e se mudou para os Estados Unidos ainda criança.', ARRAY['RHCP']::TEXT[], TIMESTAMP '2026-10-01 12:22:00'),
('O primeiro Rock in Rio foi em janeiro de 1985, em Jacarepaguá. No palco passaram Queen, Iron Maiden, AC/DC e Ozzy Osbourne, entre muitos outros.', ARRAY['RockInRio', 'Brasil']::TEXT[], TIMESTAMP '2026-10-01 12:23:00'),
('Os Mamonas Assassinas lançaram um único disco, em 1995, e venderam mais de 2 milhões de cópias dele.', ARRAY['Mamonas', 'RockNacional']::TEXT[], TIMESTAMP '2026-10-01 12:24:00'),
('Os Titãs começaram com nove integrantes no palco. Na época a banda ainda se chamava Titãs do Iê-Iê.', ARRAY['Titas', 'RockNacional']::TEXT[], TIMESTAMP '2026-10-01 12:25:00'),
('Segundo a história mais contada, o nome Led Zeppelin vem de uma piada de Keith Moon, do The Who: a banda ia afundar como um balão de chumbo.', ARRAY['LedZeppelin']::TEXT[], TIMESTAMP '2026-10-01 12:26:00'),
('Free Bird, do Lynyrd Skynyrd, passa dos nove minutos na versão de estúdio. Ao vivo, o solo final costumava esticar ainda mais.', ARRAY['LynyrdSkynyrd', 'Anos70']::TEXT[], TIMESTAMP '2026-10-01 12:27:00'),
('O riff de Sweet Child O'' Mine começou como um exercício de aquecimento que Slash tocava de brincadeira. Axl Rose ouviu e escreveu a letra em cima.', ARRAY['GunsNRoses']::TEXT[], TIMESTAMP '2026-10-01 12:28:00'),
('A última apresentação pública dos Beatles foi no telhado da gravadora Apple, em Londres, em 30 de janeiro de 1969. A polícia apareceu para pedir que baixassem o som.', ARRAY['Beatles']::TEXT[], TIMESTAMP '2026-10-01 12:29:00'),
('Bruce Dickinson, vocalista do Iron Maiden, é piloto de avião comercial e chegou a pilotar o jato da banda nas turnês mundiais.', ARRAY['IronMaiden']::TEXT[], TIMESTAMP '2026-10-01 12:30:00'),
('O Charlie Brown Jr. nasceu em Santos, no litoral paulista, em 1992. Skate e surfe aparecem em boa parte das letras de Chorão.', ARRAY['CharlieBrownJr', 'RockNacional']::TEXT[], TIMESTAMP '2026-10-01 12:31:00');
