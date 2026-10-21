/** Curiosidade do dia. Uma por dia, em ordem embaralhada, igual para todos os ouvintes. */
export interface Curiosity {
  text: string;
  tags: string[];
}

export const CURIOSITIES: Curiosity[] = [
  {
    text: 'Paranoid, do Black Sabbath, foi feita às pressas no estúdio porque faltava uma música para fechar o disco de 1970. Virou a mais famosa da banda.',
    tags: ['BlackSabbath', 'Metal'],
  },
  {
    text: 'Bohemian Rhapsody não tem refrão e passa dos cinco minutos. Mesmo assim ficou nove semanas em primeiro lugar no Reino Unido, entre 1975 e 1976.',
    tags: ['Queen'],
  },
  {
    text: 'Smoke on the Water conta uma história real. Em dezembro de 1971, durante um show de Frank Zappa, o cassino de Montreux pegou fogo e o Deep Purple viu a fumaça cobrir o lago Léman.',
    tags: ['DeepPurple', 'Anos70'],
  },
  {
    text: 'Eddie, o mascote morto-vivo do Iron Maiden, aparece nas capas dos discos de estúdio da banda desde o primeiro, de 1980.',
    tags: ['IronMaiden'],
  },
  {
    text: 'Os Ramones não eram irmãos. Cada um adotou o sobrenome Ramone, inspirado em Paul Ramon, nome falso que Paul McCartney usava em hotéis no começo dos Beatles.',
    tags: ['Ramones', 'Punk'],
  },
  {
    text: 'O Kiss passou dez anos sem mostrar o rosto em público. A banda tirou a maquiagem na MTV em setembro de 1983, no lançamento de Lick It Up.',
    tags: ['Kiss'],
  },
  {
    text: 'Stairway to Heaven nunca foi lançada como single nos Estados Unidos. Quem quisesse a música tinha que comprar o disco inteiro.',
    tags: ['LedZeppelin'],
  },
  {
    text: 'The Dark Side of the Moon, do Pink Floyd, passou mais de 900 semanas na parada de discos da Billboard. Dá mais de 17 anos.',
    tags: ['PinkFloyd', 'Anos70'],
  },
  {
    text: 'Elvis Presley quase nunca tocou fora dos Estados Unidos. Os únicos shows no exterior foram no Canadá, em 1957.',
    tags: ['Elvis'],
  },
  {
    text: 'Space Oddity, de David Bowie, saiu em 11 de julho de 1969. Cinco dias depois a Apollo 11 decolava rumo à Lua.',
    tags: ['DavidBowie'],
  },
  {
    text: 'A letra de Gita, de Raul Seixas, foi escrita em parceria com Paulo Coelho. Os dois assinaram juntos várias músicas nos anos 70.',
    tags: ['RaulSeixas', 'RockNacional'],
  },
  {
    text: 'Faroeste Caboclo, da Legião Urbana, passa dos nove minutos e não tem refrão. Mesmo assim tocou muito no rádio.',
    tags: ['LegiaoUrbana', 'RockNacional'],
  },
  {
    text: 'O Dire Straits gravou Sultans of Swing numa demo barata. O radialista Charlie Gillett tocou a fita na BBC Radio London e a banda conseguiu contrato com gravadora.',
    tags: ['DireStraits'],
  },
  {
    text: 'Dave Mustaine foi tirado do Metallica em 1983, pouco antes da gravação do primeiro disco. No mesmo ano ele fundou o Megadeth.',
    tags: ['Megadeth', 'Thrash'],
  },
  {
    text: 'Rick Allen, baterista do Def Leppard, perdeu o braço esquerdo num acidente de carro no último dia de 1984. Voltou a tocar com uma bateria eletrônica adaptada, usando os pés para o que o braço fazia.',
    tags: ['DefLeppard'],
  },
  {
    text: 'As batidas de pé e as palmas de We Will Rock You foram gravadas várias vezes, uma por cima da outra, para soar como um estádio inteiro.',
    tags: ['Queen'],
  },
  {
    text: 'Nos shows, o The Doors não tinha baixista. Ray Manzarek fazia as linhas de baixo com a mão esquerda, num teclado, enquanto tocava órgão com a direita.',
    tags: ['TheDoors'],
  },
  {
    text: 'O nome AC/DC veio de uma máquina de costura. Margaret, irmã de Malcolm e Angus Young, viu a sigla na etiqueta do aparelho e sugeriu para a banda.',
    tags: ['ACDC'],
  },
  {
    text: 'Smells Like Teen Spirit tem nome de desodorante. Uma amiga escreveu na parede que Kurt Cobain cheirava a Teen Spirit, e ele só soube da marca depois.',
    tags: ['Nirvana', 'Grunge'],
  },
  {
    text: 'Jimi Hendrix era canhoto e tocava uma Stratocaster de destro virada de cabeça para baixo, com as cordas invertidas.',
    tags: ['Hendrix', 'Guitarra'],
  },
  {
    text: 'Tony Iommi, do Black Sabbath, perdeu as pontas de dois dedos numa fábrica de chapas de metal. Ele fez próteses caseiras e afinou a guitarra mais baixo para doer menos.',
    tags: ['BlackSabbath', 'Guitarra'],
  },
  {
    text: 'The Smiths durou só de 1982 a 1987 e lançou quatro discos de estúdio. Foi pouco tempo, e muita banda inglesa dos anos 90 cita o grupo como influência.',
    tags: ['TheSmiths'],
  },
  {
    text: 'Flea, baixista do Red Hot Chili Peppers, nasceu em Melbourne, na Austrália, e se mudou para os Estados Unidos ainda criança.',
    tags: ['RHCP'],
  },
  {
    text: 'O primeiro Rock in Rio foi em janeiro de 1985, em Jacarepaguá. No palco passaram Queen, Iron Maiden, AC/DC e Ozzy Osbourne, entre muitos outros.',
    tags: ['RockInRio', 'Brasil'],
  },
  {
    text: 'Os Mamonas Assassinas lançaram um único disco, em 1995, e venderam mais de 2 milhões de cópias dele.',
    tags: ['Mamonas', 'RockNacional'],
  },
  {
    text: 'Os Titãs começaram com nove integrantes no palco. Na época a banda ainda se chamava Titãs do Iê-Iê.',
    tags: ['Titas', 'RockNacional'],
  },
  {
    text: 'Segundo a história mais contada, o nome Led Zeppelin vem de uma piada de Keith Moon, do The Who: a banda ia afundar como um balão de chumbo.',
    tags: ['LedZeppelin'],
  },
  {
    text: 'Free Bird, do Lynyrd Skynyrd, passa dos nove minutos na versão de estúdio. Ao vivo, o solo final costumava esticar ainda mais.',
    tags: ['LynyrdSkynyrd', 'Anos70'],
  },
  {
    text: 'O riff de Sweet Child O\' Mine começou como um exercício de aquecimento que Slash tocava de brincadeira. Axl Rose ouviu e escreveu a letra em cima.',
    tags: ['GunsNRoses'],
  },
  {
    text: 'A última apresentação pública dos Beatles foi no telhado da gravadora Apple, em Londres, em 30 de janeiro de 1969. A polícia apareceu para pedir que baixassem o som.',
    tags: ['Beatles'],
  },
  {
    text: 'Bruce Dickinson, vocalista do Iron Maiden, é piloto de avião comercial e chegou a pilotar o jato da banda nas turnês mundiais.',
    tags: ['IronMaiden'],
  },
  {
    text: 'O Charlie Brown Jr. nasceu em Santos, no litoral paulista, em 1992. Skate e surfe aparecem em boa parte das letras de Chorão.',
    tags: ['CharlieBrownJr', 'RockNacional'],
  },
];
