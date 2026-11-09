'use client';

import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  ArrowLeft,
  Save,
  Upload,
  Link2,
  ImageOff,
  RotateCcw,
  Bold,
  Italic,
  Heading2,
  List,
  Quote,
  Eye,
  PenLine,
  X,
  ExternalLink,
  Trash2,
  Pin,
  EyeOff,
} from 'lucide-react';
import Markdown from '@/components/materias/Markdown';
import { CATEGORIAS, categoria, urlImagem, type Materia } from '@/lib/materias';
import { apagar, doGeek, doSite, enviarFoto, salvar, type Registro } from '../dados';

const campo = 'w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-red-500';
const btn = 'inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg border cursor-pointer transition-colors disabled:opacity-50';

interface Form {
  titulo: string;
  linhaFina: string;
  categoria: string;
  tags: string[];
  imagem: string | null; // o que vai aparecer (endereço como salvo: /api/... ou https://...)
  corpoMd: string;
  publicadaEm: string; // datetime-local
  rascunho: boolean;
  oculta: boolean;
  fixada: boolean;
}

// datetime-local trabalha no horário do navegador
const paraLocal = (iso: string | null) => {
  if (!iso) return '';
  const d = new Date(iso);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
};
const deLocal = (v: string) => (v ? new Date(v).toISOString() : null);
const iguais = (a: string[], b: string[]) => a.length === b.length && a.every((x, i) => x === b[i]);

export default function Pagina() {
  return (
    <Suspense fallback={<p className="p-12 text-gray-400">Carregando...</p>}>
      <Editor />
    </Suspense>
  );
}

function Editor() {
  const q = useSearchParams();
  const router = useRouter();
  const slug = q.get('slug');
  const nova = !slug;

  const [original, setOriginal] = useState<Materia | null>(null); // geek-news, como veio
  const [registro, setRegistro] = useState<Registro | null>(null);
  const [form, setForm] = useState<Form | null>(null);
  const [aba, setAba] = useState<'escrever' | 'previa'>('escrever');
  const [msg, setMsg] = useState<{ ok: boolean; t: string } | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [tagNova, setTagNova] = useState('');
  const texto = useRef<HTMLTextAreaElement>(null);
  const arquivo = useRef<HTMLInputElement>(null);

  useEffect(() => {
    (async () => {
      if (nova) {
        setForm({ titulo: '', linhaFina: '', categoria: 'musica', tags: [], imagem: null, corpoMd: '', publicadaEm: paraLocal(new Date().toISOString()), rascunho: true, oculta: false, fixada: false });
        return;
      }
      try {
        const [site, geek] = await Promise.all([doSite(), doGeek('*', { slug: `eq.${slug}` })]);
        const r = site.materias.find((x) => x.slug === slug) ?? null;
        const o = geek[0] ?? null;
        if (!r && !o) {
          setMsg({ ok: false, t: 'Matéria não encontrada. Pode ter sido retirada no geek-news.' });
          return;
        }
        setOriginal(o);
        setRegistro(r);
        setForm({
          titulo: r?.titulo ?? o?.titulo ?? '',
          linhaFina: r?.linhaFina ?? o?.linha_fina ?? '',
          categoria: r?.categoria ?? o?.categoria ?? 'outros',
          tags: (r?.tagsDefinidas ? r.tags : o?.tags) ?? [],
          imagem: r?.semFoto ? null : (r?.imagemUrl ?? o?.imagem_url ?? null),
          corpoMd: r?.corpoMd ?? o?.corpo_md ?? '',
          publicadaEm: paraLocal(r?.publicadaEm ?? o?.publicada_em ?? null),
          rascunho: r?.rascunho ?? false,
          oculta: r?.oculta ?? false,
          fixada: r?.fixada ?? false,
        });
      } catch (e) {
        setMsg({ ok: false, t: e instanceof Error ? e.message : 'Erro ao carregar.' });
      }
    })();
  }, [slug, nova]);

  const doGeekNews = !nova && (registro?.origem ?? 'geek') === 'geek';
  const set = <K extends keyof Form>(k: K, v: Form[K]) => setForm((f) => (f ? { ...f, [k]: v } : f));

  // Para o geek-news, só vai o que mudou em relação ao original (o resto continua seguindo o geek-news)
  const corpoDoPedido = (form: Form) => {
    const base = {
      oculta: form.oculta,
      fixada: form.fixada,
    };
    if (!doGeekNews) {
      return {
        ...base,
        titulo: form.titulo,
        linhaFina: form.linhaFina || null,
        categoria: form.categoria,
        tags: form.tags,
        imagemUrl: form.imagem,
        semFoto: !form.imagem,
        corpoMd: form.corpoMd,
        publicadaEm: deLocal(form.publicadaEm),
        rascunho: form.rascunho,
      };
    }
    const o = original;
    // Igual ao original = null (continua seguindo o geek-news)
    const dif = (v: string, ori: string | null | undefined) => (o && v === (ori ?? '') ? null : v);
    return {
      ...base,
      titulo: dif(form.titulo, o?.titulo),
      linhaFina: dif(form.linhaFina, o?.linha_fina),
      categoria: dif(form.categoria, o?.categoria),
      corpoMd: dif(form.corpoMd, o?.corpo_md),
      tags: o && iguais(form.tags, o.tags ?? []) ? null : form.tags,
      imagemUrl: form.imagem && form.imagem !== o?.imagem_url ? form.imagem : null,
      semFoto: !form.imagem && !!o?.imagem_url,
      publicadaEm: o && paraLocal(o.publicada_em) === form.publicadaEm ? null : deLocal(form.publicadaEm),
    };
  };

  const gravar = async (extra: Partial<Form> = {}) => {
    if (!form) return;
    const f = { ...form, ...extra };
    if (f.titulo.trim().length < 5) {
      setMsg({ ok: false, t: 'O título precisa de pelo menos 5 letras.' });
      return;
    }
    setForm(f);
    setSalvando(true);
    setMsg(null);
    try {
      const r = await salvar(nova ? null : slug, corpoDoPedido(f));
      setRegistro(r);
      setMsg({ ok: true, t: f.rascunho && !doGeekNews ? 'Rascunho salvo. Ainda não aparece no site.' : 'Salvo. Já está no site.' });
      if (nova) router.replace(`/admin/materias/editar?slug=${r.slug}`);
    } catch (e) {
      setMsg({ ok: false, t: e instanceof Error ? e.message : 'Não deu para salvar.' });
    } finally {
      setSalvando(false);
    }
  };

  const subirFoto = async (file?: File) => {
    if (!file) return;
    setEnviando(true);
    try {
      set('imagem', await enviarFoto(file));
    } catch (e) {
      setMsg({ ok: false, t: e instanceof Error ? e.message : 'Erro no envio.' });
    } finally {
      setEnviando(false);
    }
  };

  // Barra do texto: envolve a seleção ou põe o marcador no começo da linha
  const marcar = (antes: string, depois = '', linha = false) => {
    const el = texto.current;
    if (!el || !form) return;
    const { selectionStart: a, selectionEnd: b, value } = el;
    let novo: string;
    let cursor: number;
    if (linha) {
      const ini = value.lastIndexOf('\n', a - 1) + 1;
      novo = value.slice(0, ini) + antes + value.slice(ini);
      cursor = b + antes.length;
    } else {
      const sel = value.slice(a, b) || 'texto';
      novo = value.slice(0, a) + antes + sel + depois + value.slice(b);
      cursor = a + antes.length + sel.length + depois.length;
    }
    set('corpoMd', novo);
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(cursor, cursor);
    });
  };

  const addTag = (t: string) => {
    const limpa = t.replace(/^#/, '').replace(/,/g, '').trim().slice(0, 40);
    if (!form || !limpa || form.tags.some((x) => x.toLowerCase() === limpa.toLowerCase()) || form.tags.length >= 10) return;
    set('tags', [...form.tags, limpa]);
    setTagNova('');
  };

  const palavras = useMemo(() => (form?.corpoMd.trim() ? form.corpoMd.trim().split(/\s+/).length : 0), [form?.corpoMd]);
  const c = categoria(form?.categoria ?? 'outros');
  const mudou = (campoGeek: unknown, atual: unknown) => doGeekNews && original && JSON.stringify(campoGeek ?? '') !== JSON.stringify(atual ?? '');

  if (!form) return <div className="p-12 text-gray-400">{msg?.t ?? 'Carregando...'}</div>;

  const urlPublica = !nova ? `/materias/${registro?.slug ?? slug}` : null;
  const estaNoAr = !form.oculta && !(form.rascunho && !doGeekNews);

  return (
    <div className="min-h-screen bg-[#050507] text-white p-4 sm:p-6 lg:p-10">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <Link href="/admin/materias" className="text-sm text-gray-400 hover:text-white inline-flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" /> Matérias
          </Link>
          <div className="flex flex-wrap gap-2">
            {urlPublica && estaNoAr && registro !== undefined && (
              <a href={urlPublica} target="_blank" rel="noreferrer" className={`${btn} border-white/10 text-gray-300 hover:bg-white/5`}>
                <ExternalLink className="w-3.5 h-3.5" /> Ver no site
              </a>
            )}
            {!doGeekNews && (
              <button disabled={salvando} onClick={() => gravar({ rascunho: true })} className={`${btn} border-white/15 text-gray-200 hover:bg-white/5`}>
                Salvar rascunho
              </button>
            )}
            <button disabled={salvando} onClick={() => gravar(doGeekNews ? {} : { rascunho: false })} className={`${btn} bg-red-600 border-red-600 text-white hover:bg-red-500 !text-sm !px-4`}>
              <Save className="w-4 h-4" /> {salvando ? 'Salvando...' : doGeekNews ? 'Salvar' : form.rascunho ? 'Publicar' : 'Salvar'}
            </button>
          </div>
        </div>

        {msg && <p className={`mb-5 text-sm rounded-xl px-4 py-2.5 border ${msg.ok ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200' : 'border-red-500/30 bg-red-500/10 text-red-200'}`}>{msg.t}</p>}

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_20rem] gap-6">
          {/* COLUNA PRINCIPAL */}
          <div className="space-y-5">
            <p className="text-xs text-gray-500">
              {nova
                ? 'Matéria nova, escrita no site.'
                : doGeekNews
                  ? 'Matéria do geek-news. O que você mudar vale só para o site; campos que você não mexer continuam seguindo o geek-news.'
                  : 'Matéria escrita no site.'}
            </p>

            <Campo rotulo="Título" conta={`${form.titulo.length}/110`} alerta={form.titulo.length > 110} mudou={mudou(original?.titulo, form.titulo)} voltar={() => set('titulo', original?.titulo ?? '')}>
              <input value={form.titulo} onChange={(e) => set('titulo', e.target.value)} className={`${campo} text-lg font-bold`} placeholder="O que aconteceu, em uma frase" />
            </Campo>

            <Campo
              rotulo="Linha fina"
              ajuda="Aparece abaixo do título e no Google. Até 160 caracteres."
              conta={`${form.linhaFina.length}/160`}
              alerta={form.linhaFina.length > 160}
              mudou={mudou(original?.linha_fina, form.linhaFina)}
              voltar={() => set('linhaFina', original?.linha_fina ?? '')}
            >
              <textarea value={form.linhaFina} onChange={(e) => set('linhaFina', e.target.value)} rows={2} className={campo} placeholder="O detalhe que faz a pessoa clicar" />
            </Campo>

            <Campo rotulo="Texto" conta={`${palavras} palavras`} mudou={mudou(original?.corpo_md, form.corpoMd)} voltar={() => set('corpoMd', original?.corpo_md ?? '')}>
              <div className="rounded-xl border border-white/10 bg-black/40 overflow-hidden">
                <div className="flex items-center gap-1 border-b border-white/10 px-2 py-1.5">
                  <Ferramenta t="Negrito" onClick={() => marcar('**', '**')} icon={Bold} />
                  <Ferramenta t="Itálico" onClick={() => marcar('*', '*')} icon={Italic} />
                  <Ferramenta t="Intertítulo" onClick={() => marcar('## ', '', true)} icon={Heading2} />
                  <Ferramenta t="Lista" onClick={() => marcar('- ', '', true)} icon={List} />
                  <Ferramenta t="Citação" onClick={() => marcar('> ', '', true)} icon={Quote} />
                  <div className="ml-auto flex gap-1">
                    {(['escrever', 'previa'] as const).map((a) => (
                      <button
                        key={a}
                        onClick={() => setAba(a)}
                        className={`text-xs px-2.5 py-1 rounded-md cursor-pointer inline-flex items-center gap-1.5 ${aba === a ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white'}`}
                      >
                        {a === 'escrever' ? <PenLine className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        {a === 'escrever' ? 'Escrever' : 'Prévia'}
                      </button>
                    ))}
                  </div>
                </div>
                {aba === 'escrever' ? (
                  <textarea
                    ref={texto}
                    value={form.corpoMd}
                    onChange={(e) => set('corpoMd', e.target.value)}
                    rows={18}
                    className="w-full bg-transparent px-4 py-3 text-sm leading-relaxed text-gray-100 focus:outline-none font-mono"
                    placeholder={'Escreva em parágrafos, separados por uma linha em branco.\n\n## Use isto para um intertítulo\n\n**negrito** e *itálico* também funcionam.'}
                  />
                ) : (
                  <div className="px-5 py-4 space-y-5 text-[1.0625rem] leading-[1.75] text-gray-300 min-h-[24rem]">
                    {form.corpoMd.trim() ? <Markdown source={form.corpoMd} /> : <p className="text-gray-600">Nada escrito ainda.</p>}
                  </div>
                )}
              </div>
              <p className="text-[0.6875rem] text-gray-600 mt-1.5">Links viram só texto no site, e nenhum HTML é aceito.</p>
            </Campo>
          </div>

          {/* LATERAL */}
          <aside className="space-y-5">
            <Bloco titulo="Foto de capa" mudou={doGeekNews && !!original && form.imagem !== original.imagem_url} voltar={() => set('imagem', original?.imagem_url ?? null)}>
              <div className="relative aspect-[16/10] rounded-xl overflow-hidden bg-black/40 border border-white/10">
                {form.imagem ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={urlImagem(form.imagem) ?? ''} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full grid place-items-center text-center text-xs text-white/60" style={{ background: `radial-gradient(120% 90% at 15% 10%, ${c.cor}55, transparent 60%), #0b0a10` }}>
                    Sem foto: o site usa o fundo
                    <br />
                    na cor da categoria
                  </div>
                )}
                {enviando && <div className="absolute inset-0 bg-black/60 grid place-items-center text-xs">Enviando...</div>}
              </div>
              <input ref={arquivo} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => subirFoto(e.target.files?.[0])} />
              <div className="flex flex-wrap gap-1.5 mt-2.5">
                <button onClick={() => arquivo.current?.click()} className={`${btn} border-white/15 text-white hover:bg-white/10`}>
                  <Upload className="w-3.5 h-3.5" /> {form.imagem ? 'Trocar foto' : 'Enviar foto'}
                </button>
                <button
                  onClick={() => {
                    const u = prompt('Cole o link da foto (https://...)');
                    if (u) set('imagem', u.trim());
                  }}
                  className={`${btn} border-white/10 text-gray-300 hover:bg-white/5`}
                >
                  <Link2 className="w-3.5 h-3.5" /> Link
                </button>
                {form.imagem && (
                  <button onClick={() => set('imagem', null)} className={`${btn} border-white/10 text-gray-300 hover:bg-white/5`}>
                    <ImageOff className="w-3.5 h-3.5" /> Tirar
                  </button>
                )}
              </div>
              <p className="text-[0.6875rem] text-gray-600 mt-2">JPG, PNG ou WEBP até 5 MB. Melhor na horizontal, com 1600 px de largura.</p>
            </Bloco>

            <Bloco titulo="Categoria" mudou={mudou(original?.categoria, form.categoria)} voltar={() => set('categoria', original?.categoria ?? 'outros')}>
              <div className="grid grid-cols-2 gap-1.5">
                {CATEGORIAS.map((k) => (
                  <button
                    key={k.id}
                    onClick={() => set('categoria', k.id)}
                    className={`${btn} justify-start ${form.categoria === k.id ? 'text-white' : 'border-white/10 text-gray-400 hover:text-white'}`}
                    style={form.categoria === k.id ? { background: `${k.cor}33`, borderColor: k.cor } : undefined}
                  >
                    <span className="w-2 h-2 rounded-full" style={{ background: k.cor }} />
                    {k.nome}
                  </button>
                ))}
              </div>
            </Bloco>

            <Bloco titulo="Tags" mudou={doGeekNews && !!original && !iguais(form.tags, original.tags ?? [])} voltar={() => set('tags', original?.tags ?? [])}>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {form.tags.map((t) => (
                  <span key={t} className="inline-flex items-center gap-1 text-xs bg-white/10 rounded-lg pl-2 pr-1 py-1">
                    #{t}
                    <button onClick={() => set('tags', form.tags.filter((x) => x !== t))} className="hover:text-red-300 cursor-pointer" aria-label={`Tirar ${t}`}>
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
                {!form.tags.length && <span className="text-xs text-gray-600">Nenhuma tag.</span>}
              </div>
              <input
                value={tagNova}
                onChange={(e) => setTagNova(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ',') {
                    e.preventDefault();
                    addTag(tagNova);
                  }
                }}
                onBlur={() => tagNova && addTag(tagNova)}
                className={campo}
                placeholder="Digite e aperte Enter"
              />
              <p className="text-[0.6875rem] text-gray-600 mt-1.5">De 3 a 6 tags curtas. Até 10.</p>
            </Bloco>

            <Bloco titulo="Publicação" mudou={doGeekNews && !!original && paraLocal(original.publicada_em) !== form.publicadaEm} voltar={() => set('publicadaEm', paraLocal(original?.publicada_em ?? null))}>
              <label className="text-xs text-gray-400">Data e hora</label>
              <input type="datetime-local" value={form.publicadaEm} onChange={(e) => set('publicadaEm', e.target.value)} className={`${campo} mt-1 [color-scheme:dark]`} />
              <p className="text-[0.6875rem] text-gray-600 mt-1.5">
                {doGeekNews ? 'Muda a ordem na lista.' : 'Com data no futuro, a matéria entra no ar sozinha nesse horário.'}
              </p>
              <div className="space-y-2 mt-4">
                <Chave on={form.fixada} onChange={(v) => set('fixada', v)} icon={Pin} t="Fixar no topo" sub="Primeira da lista e da home" />
                <Chave on={form.oculta} onChange={(v) => set('oculta', v)} icon={EyeOff} t="Tirar do site" sub="Some da lista, da home e do Google" />
              </div>
            </Bloco>

            <Bloco titulo="Como aparece no Google">
              <div className="rounded-xl bg-white p-3 text-left">
                <p className="text-[0.6875rem] text-[#4d5156] truncate">antenarock.com.br › materias</p>
                <p className="text-[#1a0dab] text-[0.9375rem] leading-snug mt-0.5 line-clamp-2">{(form.titulo || 'Título da matéria') + ' | Antena Rock'}</p>
                <p className="text-[#4d5156] text-xs mt-1 line-clamp-2">{form.linhaFina || 'A linha fina aparece aqui.'}</p>
              </div>
            </Bloco>

            {!nova && registro && (
              <Bloco titulo={doGeekNews ? 'Desfazer' : 'Excluir'}>
                {doGeekNews ? (
                  <button
                    onClick={async () => {
                      if (!confirm('Desfazer todas as mudanças e voltar ao original do geek-news?')) return;
                      await apagar(registro.slug);
                      router.push('/admin/materias');
                    }}
                    className={`${btn} border-white/15 text-gray-200 hover:bg-white/5 w-full justify-center`}
                  >
                    <RotateCcw className="w-3.5 h-3.5" /> Voltar ao original do geek-news
                  </button>
                ) : (
                  <button
                    onClick={async () => {
                      if (!confirm('Excluir esta matéria de vez? Não dá para desfazer.')) return;
                      await apagar(registro.slug);
                      router.push('/admin/materias');
                    }}
                    className={`${btn} border-red-500/30 text-red-300 hover:bg-red-500/10 w-full justify-center`}
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Excluir matéria
                  </button>
                )}
              </Bloco>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
}

function Campo({
  rotulo,
  ajuda,
  conta,
  alerta,
  mudou,
  voltar,
  children,
}: {
  rotulo: string;
  ajuda?: string;
  conta?: string;
  alerta?: boolean;
  mudou?: boolean | null;
  voltar?: () => void;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <label className="text-xs font-bold uppercase tracking-widest text-gray-400 flex items-center gap-2">
          {rotulo}
          {mudou && <span className="normal-case tracking-normal font-semibold text-amber-300 bg-amber-500/10 rounded-md px-1.5 py-0.5 text-[0.6875rem]">editado</span>}
        </label>
        <div className="flex items-center gap-3">
          {mudou && voltar && (
            <button onClick={voltar} className="text-[0.6875rem] text-gray-400 hover:text-white inline-flex items-center gap-1 cursor-pointer">
              <RotateCcw className="w-3 h-3" /> original
            </button>
          )}
          {conta && <span className={`text-[0.6875rem] tabular-nums ${alerta ? 'text-amber-300' : 'text-gray-600'}`}>{conta}</span>}
        </div>
      </div>
      {children}
      {ajuda && <p className="text-[0.6875rem] text-gray-600 mt-1.5">{ajuda}</p>}
    </div>
  );
}

function Bloco({ titulo, mudou, voltar, children }: { titulo: string; mudou?: boolean | null; voltar?: () => void; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-[0.6875rem] uppercase tracking-[0.2em] text-red-500 font-bold flex items-center gap-2">
          {titulo}
          {mudou && <span className="normal-case tracking-normal text-amber-300 bg-amber-500/10 rounded-md px-1.5 py-0.5 text-[0.625rem]">editado</span>}
        </h2>
        {mudou && voltar && (
          <button onClick={voltar} className="text-[0.6875rem] text-gray-400 hover:text-white inline-flex items-center gap-1 cursor-pointer">
            <RotateCcw className="w-3 h-3" /> original
          </button>
        )}
      </div>
      {children}
    </section>
  );
}

function Ferramenta({ t, onClick, icon: Icon }: { t: string; onClick: () => void; icon: React.ComponentType<{ className?: string }> }) {
  return (
    <button onClick={onClick} title={t} aria-label={t} className="p-1.5 rounded-md text-gray-400 hover:text-white hover:bg-white/10 cursor-pointer">
      <Icon className="w-4 h-4" />
    </button>
  );
}

function Chave({ on, onChange, icon: Icon, t, sub }: { on: boolean; onChange: (v: boolean) => void; icon: React.ComponentType<{ className?: string }>; t: string; sub: string }) {
  return (
    <button onClick={() => onChange(!on)} className="w-full flex items-center gap-3 rounded-xl border border-white/10 px-3 py-2 text-left hover:bg-white/5 cursor-pointer">
      <Icon className={`w-4 h-4 ${on ? 'text-red-400' : 'text-gray-500'}`} />
      <span className="flex-1">
        <span className="block text-xs font-semibold">{t}</span>
        <span className="block text-[0.6875rem] text-gray-500">{sub}</span>
      </span>
      <span className={`w-9 h-5 rounded-full relative transition ${on ? 'bg-red-600' : 'bg-white/15'}`}>
        <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${on ? 'left-[1.125rem]' : 'left-0.5'}`} />
      </span>
    </button>
  );
}
