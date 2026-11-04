// Copia o screenshot do portal para public/capturas e registra os alvos (x, y, w, h) em capturas.json.
import { copyFileSync, readFileSync, writeFileSync } from 'node:fs';

const [nome, origem, largura, altura, alvos] = process.argv.slice(2);
const destino = new URL('../remotion/src/capturas.json', import.meta.url);
copyFileSync(origem, new URL(`../remotion/public/capturas/${nome}.png`, import.meta.url));
const capturas = JSON.parse(readFileSync(destino, 'utf8'));
capturas[nome] = { arquivo: `${nome}.png`, largura: Number(largura), altura: Number(altura), alvos: JSON.parse(alvos) };
writeFileSync(destino, JSON.stringify(capturas, null, 2));
console.log(`registrada ${nome}: ${Object.keys(capturas[nome].alvos).join(', ')}`);
