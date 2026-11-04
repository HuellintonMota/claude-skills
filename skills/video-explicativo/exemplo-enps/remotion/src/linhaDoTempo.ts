// Fonte única do tempo do vídeo: duração de cada cena (pela fala), cortes e legendas.
// Sem JSX e sem import de JSON para o script do .srt (Node puro) reusar as mesmas contas.

export const FPS = 30;
export const ANTES_DA_FALA = 0.6;

export interface Palavra { texto: string; inicio: number; fim: number }
export type Tempos = Record<string, { legenda: string; palavras: Palavra[] }>;
export interface CenaNoCorte { id: string; inicio: number; duracao: number }
export interface Legenda { inicio: number; fim: number; texto: string }

const PAUSA_DEPOIS: Record<string, number> = { c1: 1.4, c2: 1.8, c3: 2.0, c4: 2.0, c5: 1.8, c6: 2.6, c7: 2.2, c8: 2.4, c9: 3.0 };

export const CORTES: Record<'Colaboradores' | 'RH', string[]> = {
  Colaboradores: ['c1', 'c2', 'c3', 'c4', 'c5', 'c6', 'c9'],
  RH: ['c1', 'c2', 'c3', 'c4', 'c5', 'c6', 'c7', 'c8', 'c9'],
};

const MAX_CARACTERES_LEGENDA = 62;

const UNIDADES = ['zero', 'um', 'dois', 'três', 'quatro', 'cinco', 'seis', 'sete', 'oito', 'nove', 'dez', 'onze', 'doze', 'treze', 'quatorze', 'quinze', 'dezesseis', 'dezessete', 'dezoito', 'dezenove'];
const DEZENAS = ['', '', 'vinte', 'trinta', 'quarenta', 'cinquenta', 'sessenta', 'setenta', 'oitenta', 'noventa'];

function porExtenso(n: number): string {
  if (n === 100) return 'cem';
  if (n < 20) return UNIDADES[n];
  const dezena = DEZENAS[Math.floor(n / 10)];
  return n % 10 ? `${dezena} e ${UNIDADES[n % 10]}` : dezena;
}

// A Thalita é multilíngue: algarismos soltos às vezes saem em espanhol. A fala leva os números por
// extenso; a legenda continua com algarismos, e o alinhamento expande os dois do mesmo jeito.
export const textoFalado = (legenda: string): string =>
  legenda.replace(/(\d+)(%?)/g, (_, n: string, pct: string) => porExtenso(Number(n)) + (pct ? ' por cento' : ''));

const normalizar = (texto: string): string[] =>
  textoFalado(texto).toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, ' ').split(/\s+/).filter(Boolean);

export function duracaoDaCena(tempos: Tempos, id: string): number {
  const palavras = tempos[id].palavras;
  return Math.ceil((ANTES_DA_FALA + palavras[palavras.length - 1].fim + PAUSA_DEPOIS[id]) * FPS);
}

export function montarCorte(tempos: Tempos, ids: string[]): CenaNoCorte[] {
  let inicio = 0;
  return ids.map((id) => {
    const cena = { id, inicio, duracao: duracaoDaCena(tempos, id) };
    inicio += cena.duracao;
    return cena;
  });
}

export const duracaoDoCorte = (corte: CenaNoCorte[]): number => corte.reduce((total, c) => total + c.duracao, 0);

// Cada token normalizado da fala com o tempo da palavra de onde veio ("0 a 6" vira três tokens).
function tokensComTempo(palavras: Palavra[]): { token: string; inicio: number; fim: number }[] {
  return palavras.flatMap((p) => normalizar(p.texto).map((token) => ({ token, inicio: p.inicio, fim: p.fim })));
}

// Segundos (relativos ao início da cena) em que começa a N-ésima ocorrência do trecho na fala.
export function momento(tempos: Tempos, id: string, trecho: string, ocorrencia = 1): number {
  const tokens = tokensComTempo(tempos[id].palavras);
  const alvo = normalizar(trecho);
  let achados = 0;
  for (let i = 0; i + alvo.length <= tokens.length; i++) {
    if (alvo.every((t, j) => tokens[i + j].token === t) && ++achados === ocorrencia) {
      return ANTES_DA_FALA + tokens[i].inicio;
    }
  }
  throw new Error(`Trecho "${trecho}" não encontrado na cena ${id}`);
}

function quebrarEmBlocos(texto: string): string[] {
  const frases = texto.split(/(?<=[.?!:])\s+/);
  return frases.flatMap((frase) => {
    if (frase.length <= MAX_CARACTERES_LEGENDA) return [frase];
    const palavras = frase.split(' ');
    const partes = Math.ceil(frase.length / MAX_CARACTERES_LEGENDA);
    const alvo = frase.length / partes;
    const blocos: string[] = [];
    let atual = '';
    for (const palavra of palavras) {
      const candidato = atual ? `${atual} ${palavra}` : palavra;
      const virgulaPerto = atual.endsWith(',') && atual.length >= alvo * 0.6;
      if (atual && (candidato.length > MAX_CARACTERES_LEGENDA || atual.length >= alvo || virgulaPerto)) {
        blocos.push(atual);
        atual = palavra;
      } else {
        atual = candidato;
      }
    }
    if (atual) blocos.push(atual);
    return blocos;
  });
}

export function legendasDaCena(tempos: Tempos, id: string): Legenda[] {
  const { legenda, palavras } = tempos[id];
  const tokens = tokensComTempo(palavras);
  const blocos = quebrarEmBlocos(legenda);
  const totalTokens = blocos.reduce((n, b) => n + normalizar(b).length, 0);
  const alinhado = totalTokens === tokens.length;
  const tempoDoToken = (i: number, lado: 'inicio' | 'fim'): number => {
    if (alinhado) return tokens[Math.min(i, tokens.length - 1)][lado];
    const proporcional = Math.round((i / totalTokens) * (tokens.length - 1));
    return tokens[proporcional][lado];
  };

  let cursor = 0;
  return blocos.map((texto) => {
    const n = normalizar(texto).length;
    const bloco = { texto, inicio: ANTES_DA_FALA + tempoDoToken(cursor, 'inicio'), fim: ANTES_DA_FALA + tempoDoToken(cursor + n - 1, 'fim') };
    cursor += n;
    return bloco;
  }).map((bloco, i, todos) => ({
    ...bloco,
    inicio: Math.max(0, bloco.inicio - 0.1),
    fim: i < todos.length - 1 ? todos[i + 1].inicio - 0.1 : bloco.fim + 0.5,
  }));
}

export function legendasDoCorte(tempos: Tempos, corte: CenaNoCorte[]): Legenda[] {
  return corte.flatMap((cena) => legendasDaCena(tempos, cena.id).map((l) => ({
    ...l,
    inicio: cena.inicio / FPS + l.inicio,
    fim: Math.min(cena.inicio / FPS + l.fim, (cena.inicio + cena.duracao) / FPS - 0.05),
  })));
}
