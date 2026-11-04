// Imprime o texto falado de cada cena (números por extenso), da mesma função que alinha a legenda.
import { readFileSync } from 'node:fs';
import { textoFalado } from '../remotion/src/linhaDoTempo.ts';

const roteiro = JSON.parse(readFileSync(new URL('narracao.json', import.meta.url), 'utf8')) as { cenas: { id: string; legenda: string }[] };
process.stdout.write(JSON.stringify(Object.fromEntries(roteiro.cenas.map((c) => [c.id, textoFalado(c.legenda)]))));
