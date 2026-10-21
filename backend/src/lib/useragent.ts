/** Leitura simples do navegador: tipo de aparelho, sistema e navegador. */
export function parseUserAgent(ua = '') {
  const isBot = /bot|crawl|spider|slurp|preview|facebookexternalhit|whatsapp|headless|lighthouse|pingdom|uptime/i.test(ua);

  const tablet = /ipad|tablet|(android(?!.*mobile))/i.test(ua);
  const mobile = !tablet && /mobi|iphone|ipod|android/i.test(ua);
  const device = tablet ? 'Tablet' : mobile ? 'Celular' : 'Computador';

  const os = /windows/i.test(ua)
    ? 'Windows'
    : /iphone|ipad|ipod/i.test(ua)
      ? 'iOS'
      : /android/i.test(ua)
        ? 'Android'
        : /mac os x|macintosh/i.test(ua)
          ? 'macOS'
          : /cros/i.test(ua)
            ? 'ChromeOS'
            : /linux/i.test(ua)
              ? 'Linux'
              : 'Outro';

  const browser = /edg\//i.test(ua)
    ? 'Edge'
    : /opr\/|opera/i.test(ua)
      ? 'Opera'
      : /samsungbrowser/i.test(ua)
        ? 'Samsung Internet'
        : /firefox|fxios/i.test(ua)
          ? 'Firefox'
          : /chrome|crios/i.test(ua)
            ? 'Chrome'
            : /safari/i.test(ua)
              ? 'Safari'
              : 'Outro';

  return { isBot, device, os, browser };
}
