// Dados da rádio usados no site, no Google (SEO) e no rodapé.
// Para ligar uma rede social, coloque o link completo. Link vazio = ícone aparece apagado, sem clique.
export const SITE = {
  name: 'Antena Rock',
  url: 'https://antenarock.com.br',
  description: 'Rádio online de rock feita em Sorocaba, SP. Rock nacional e internacional 24 horas no ar.',
  city: 'Sorocaba',
  state: 'SP',
  country: 'BR',
  // E-mail público de contato (opcional). Vazio = não aparece no site.
  email: '',
  social: {
    instagram: '',
    youtube: '',
    facebook: '',
    whatsapp: '', // ex: https://wa.me/5515999999999
    tiktok: '',
    spotify: '',
  },
} as const;
