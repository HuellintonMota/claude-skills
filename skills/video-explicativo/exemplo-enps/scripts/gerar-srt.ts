// Gera o .srt de cada corte com as mesmas contas que o Remotion usa para a legenda queimada.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { CORTES, duracaoDoCorte, FPS, legendasDoCorte, montarCorte, type Tempos } from '../remotion/src/linhaDoTempo.ts';

const raiz = new URL('..', import.meta.url);
const tempos = JSON.parse(readFileSync(new URL('remotion/src/tempos.json', raiz), 'utf8')) as Tempos;
mkdirSync(new URL('saida/', raiz), { recursive: true });

const relogio = (s: number): string => {
  const ms = Math.round(s * 1000);
  const p = (n: number, t = 2): string => String(n).padStart(t, '0');
  return `${p(Math.floor(ms / 3600000))}:${p(Math.floor(ms / 60000) % 60)}:${p(Math.floor(ms / 1000) % 60)},${p(ms % 1000, 3)}`;
};

for (const [nome, arquivo] of [['Colaboradores', 'enps-conecta-colaboradores'], ['RH', 'enps-conecta-rh']] as const) {
  const corte = montarCorte(tempos, CORTES[nome]);
  const srt = legendasDoCorte(tempos, corte)
    .map((l, i) => `${i + 1}\n${relogio(l.inicio)} --> ${relogio(l.fim)}\n${l.texto}\n`)
    .join('\n');
  writeFileSync(new URL(`saida/${arquivo}.srt`, raiz), srt, 'utf8');
  const segundos = duracaoDoCorte(corte) / FPS;
  console.log(`${arquivo}.srt — ${Math.floor(segundos / 60)}:${String(Math.round(segundos % 60)).padStart(2, '0')}`);
}
