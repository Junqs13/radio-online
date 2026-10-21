import { createRequire } from 'module';
import maxmind, { Reader } from 'maxmind';

/**
 * Cidade, estado e país a partir do IP, consultando uma base local (DB-IP Lite,
 * licença CC BY 4.0). Nada é enviado para fora e o IP não é guardado.
 */
interface DbipCity {
  city?: string;
  state1?: string;
  country_code?: string;
}

const require = createRequire(import.meta.url);
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyReader = Reader<any>;
let readers: Promise<{ v4: AnyReader; v6: AnyReader } | null> | null = null;

function load() {
  if (!readers) {
    readers = (async () => {
      try {
        const base = '@ip-location-db/dbip-city-mmdb';
        const [v4, v6] = await Promise.all([
          maxmind.open(require.resolve(`${base}/dbip-city-ipv4.mmdb`)),
          maxmind.open(require.resolve(`${base}/dbip-city-ipv6.mmdb`)),
        ]);
        return { v4, v6 };
      } catch (err) {
        console.error('[estatísticas] base de localização indisponível:', err);
        return null;
      }
    })();
  }
  return readers;
}

const isPrivate = (ip: string) =>
  /^(10\.|127\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|169\.254\.|::1$|fc|fd|fe80)/i.test(ip);

export async function locate(rawIp: string | undefined) {
  if (!rawIp) return null;
  const ip = rawIp.replace(/^::ffff:/, '');
  if (isPrivate(ip) || !maxmind.validate(ip)) return null;
  const r = await load();
  if (!r) return null;
  const hit = (ip.includes(':') ? r.v6 : r.v4).get(ip) as DbipCity | null;
  if (!hit) return null;
  return { country: hit.country_code || null, region: hit.state1 || null, city: hit.city || null };
}
