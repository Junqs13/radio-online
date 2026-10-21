/**
 * "Lenda do dia" do carrossel. Todas as bandas e músicas abaixo estão no acervo
 * da rádio (storage/_catalogo.csv). Os cards não usam foto: fundo em degradê
 * com o nome da banda, para não depender de imagem de terceiros.
 */
export interface Legend {
  artist: string;
  title: string; // música que está no acervo
  year: string;
  origin: string;
  description: string;
  gradient: string; // classes Tailwind do fundo
}

export const LEGENDS: Legend[] = [
  {
    artist: 'Iron Maiden',
    title: 'The Trooper',
    year: '1983',
    origin: 'Londres, Inglaterra',
    description:
      'O baixista Steve Harris formou a banda em 1975. The Trooper, do disco Piece of Mind, conta a carga da Brigada Ligeira na Guerra da Crimeia, e o baixo galopa junto com os cavalos.',
    gradient: 'from-red-700 via-rose-900 to-black',
  },
  {
    artist: 'Megadeth',
    title: 'Symphony of Destruction',
    year: '1992',
    origin: 'Los Angeles, EUA',
    description:
      'Dave Mustaine criou o Megadeth em 1983, depois de sair do Metallica. Symphony of Destruction está em Countdown to Extinction, disco que chegou ao segundo lugar da parada da Billboard.',
    gradient: 'from-zinc-500 via-zinc-800 to-black',
  },
  {
    artist: 'Black Sabbath',
    title: 'War Pigs',
    year: '1970',
    origin: 'Birmingham, Inglaterra',
    description:
      'Quatro rapazes de uma cidade industrial inglesa que começaram a tocar juntos em 1968. War Pigs abre o disco Paranoid com uma letra contra a guerra e um riff que anda devagar e pesado.',
    gradient: 'from-purple-900 via-neutral-900 to-black',
  },
  {
    artist: 'Kiss',
    title: 'Detroit Rock City',
    year: '1976',
    origin: 'Nova York, EUA',
    description:
      'Maquiagem e botas de plataforma desde 1973. Detroit Rock City abre o disco Destroyer e virou presença certa nos shows da banda.',
    gradient: 'from-neutral-200 via-neutral-700 to-black',
  },
  {
    artist: 'Def Leppard',
    title: 'Pour Some Sugar on Me',
    year: '1987',
    origin: 'Sheffield, Inglaterra',
    description:
      'Banda formada no fim dos anos 70 por adolescentes de Sheffield. O disco Hysteria rendeu sete singles, e Pour Some Sugar on Me é o mais lembrado deles.',
    gradient: 'from-amber-500 via-red-800 to-black',
  },
  {
    artist: 'Ramones',
    title: 'Blitzkrieg Bop',
    year: '1976',
    origin: 'Queens, Nova York, EUA',
    description:
      'Jaqueta de couro, calça rasgada e músicas de dois minutos. Blitzkrieg Bop abre o primeiro disco da banda e ajudou a dar forma ao punk.',
    gradient: 'from-stone-400 via-stone-800 to-black',
  },
  {
    artist: 'Alice In Chains',
    title: 'Would?',
    year: '1992',
    origin: 'Seattle, EUA',
    description:
      'Layne Staley e Jerry Cantrell cantavam em harmonia por cima de guitarras pesadas. Would? saiu primeiro na trilha do filme Singles e depois no disco Dirt.',
    gradient: 'from-teal-800 via-slate-900 to-black',
  },
  {
    artist: 'The Smashing Pumpkins',
    title: '1979',
    year: '1995',
    origin: 'Chicago, EUA',
    description:
      'Billy Corgan formou a banda em 1988. 1979 está no álbum duplo Mellon Collie and the Infinite Sadness e fala da adolescência do próprio Corgan.',
    gradient: 'from-sky-700 via-indigo-900 to-black',
  },
  {
    artist: 'Red Hot Chili Peppers',
    title: 'Californication',
    year: '1999',
    origin: 'Los Angeles, EUA',
    description:
      'Desde 1983 o baixo de Flea puxa o funk para dentro do rock. Californication marcou a volta do guitarrista John Frusciante, que tinha saído da banda em 1992.',
    gradient: 'from-orange-600 via-red-900 to-black',
  },
  {
    artist: 'David Bowie',
    title: 'Starman',
    year: '1972',
    origin: 'Londres, Inglaterra',
    description:
      'Em julho de 1972, Bowie apresentou o personagem Ziggy Stardust ao Reino Unido cantando Starman no programa de TV Top of the Pops.',
    gradient: 'from-fuchsia-600 via-blue-900 to-black',
  },
  {
    artist: 'Elvis Presley',
    title: 'Heartbreak Hotel',
    year: '1956',
    origin: 'Tupelo, Mississippi, EUA',
    description:
      'Heartbreak Hotel foi o primeiro número um de Elvis nas paradas americanas. Na Antena Rock ele tem hora marcada: de segunda a sexta, das 11h ao meio-dia.',
    gradient: 'from-yellow-500 via-amber-800 to-black',
  },
  {
    artist: 'The Smiths',
    title: 'There Is a Light That Never Goes Out',
    year: '1986',
    origin: 'Manchester, Inglaterra',
    description:
      'A voz de Morrissey e a guitarra de Johnny Marr. There Is a Light That Never Goes Out está em The Queen Is Dead, o terceiro disco de estúdio da banda.',
    gradient: 'from-pink-700 via-zinc-900 to-black',
  },
  {
    artist: 'Coldplay',
    title: 'Clocks',
    year: '2002',
    origin: 'Londres, Inglaterra',
    description:
      'A banda nasceu em 1996 entre colegas de faculdade. Clocks, puxada por um riff de piano de Chris Martin, ganhou o Grammy de Gravação do Ano em 2004.',
    gradient: 'from-cyan-600 via-blue-900 to-black',
  },
  {
    artist: 'Pink Floyd',
    title: 'Money',
    year: '1973',
    origin: 'Londres, Inglaterra',
    description:
      'Money abre o lado B de The Dark Side of the Moon com o som de caixas registradoras gravado em loop. O compasso é de sete tempos, coisa rara num sucesso de rádio.',
    gradient: 'from-violet-700 via-slate-900 to-black',
  },
  {
    artist: 'The Doors',
    title: 'Riders on the Storm',
    year: '1971',
    origin: 'Los Angeles, EUA',
    description:
      'Riders on the Storm fecha L.A. Woman, o último disco gravado com Jim Morrison. Ele morreu em Paris em julho de 1971, três meses depois do lançamento.',
    gradient: 'from-slate-600 via-slate-900 to-black',
  },
  {
    artist: 'Deep Purple',
    title: 'Hush',
    year: '1968',
    origin: 'Hertford, Inglaterra',
    description:
      'O órgão de Jon Lord dividia o peso com a guitarra de Ritchie Blackmore. Hush, uma versão de música de Joe South, foi o primeiro sucesso da banda nos Estados Unidos.',
    gradient: 'from-purple-700 via-purple-950 to-black',
  },
  {
    artist: 'Legião Urbana',
    title: 'Tempo Perdido',
    year: '1986',
    origin: 'Brasília, DF',
    description:
      'Renato Russo escrevia letras que muita gente sabe de cor até hoje. Tempo Perdido está no disco Dois, o segundo da banda.',
    gradient: 'from-emerald-700 via-green-950 to-black',
  },
  {
    artist: 'Raul Seixas',
    title: 'Gita',
    year: '1974',
    origin: 'Salvador, BA',
    description:
      'O baiano que juntou Elvis e Luiz Gonzaga na mesma vitrola. Gita dá nome ao disco de 1974.',
    gradient: 'from-amber-600 via-orange-950 to-black',
  },
  {
    artist: 'Titãs',
    title: 'Homem Primata',
    year: '1986',
    origin: 'São Paulo, SP',
    description:
      'Homem Primata está em Cabeça Dinossauro, disco de guitarra seca e letra de protesto lançado pela banda paulistana em 1986.',
    gradient: 'from-lime-600 via-neutral-900 to-black',
  },
  {
    artist: 'Dire Straits',
    title: 'Sultans of Swing',
    year: '1978',
    origin: 'Londres, Inglaterra',
    description:
      'Mark Knopfler toca com os dedos, sem palheta, e dá para ouvir isso em cada nota. Sultans of Swing foi o primeiro sucesso da banda.',
    gradient: 'from-red-800 via-neutral-900 to-black',
  },
];
