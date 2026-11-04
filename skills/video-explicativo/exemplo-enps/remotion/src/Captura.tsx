import React from 'react';
import { AbsoluteFill, Easing, Img, interpolate, staticFile, useCurrentFrame } from 'remotion';
import capturasJson from './capturas.json';
import { COR, seg } from './ui';

type Retangulo = [number, number, number, number];
interface CapturaInfo { arquivo: string; largura: number; altura: number; alvos: Record<string, Retangulo> }
const capturas = capturasJson as unknown as Record<string, CapturaInfo>;

export interface Passo {
  em: number;
  foco?: string;
  destaque?: string;
  rotulo?: string;
}

const AREA = { largura: 1760, altura: 860, centroX: 960, centroY: 470 };
const TRANSICAO = 0.9;

interface Camera { escala: number; x: number; y: number }

function cameraPara(info: CapturaInfo, foco?: string): Camera {
  if (!foco) {
    const escala = Math.min(AREA.largura / info.largura, AREA.altura / info.altura);
    return { escala, x: info.largura / 2, y: info.altura / 2 };
  }
  const [x, y, w, h] = info.alvos[foco];
  const margem = 90;
  const escala = Math.min(AREA.largura / (w + margem * 2), AREA.altura / (h + margem * 2), 1.35);
  return { escala, x: x + w / 2, y: y + h / 2 };
}

export const Captura: React.FC<{ nome: string; passos: Passo[]; entrada?: number }> = ({ nome, passos, entrada = 0 }) => {
  const frame = useCurrentFrame();
  const info = capturas[nome];
  const t = frame / 30;

  const ordenados = [{ em: entrada } as Passo, ...passos];
  let atual = 0;
  ordenados.forEach((p, i) => { if (t >= p.em) atual = i; });
  const anterior = cameraPara(info, ordenados[Math.max(0, atual - 1)].foco);
  const destino = cameraPara(info, ordenados[atual].foco);
  const progresso = atual === 0 ? 1 : interpolate(frame, [seg(ordenados[atual].em), seg(ordenados[atual].em + TRANSICAO)], [0, 1], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.cubic),
  });
  const cam: Camera = {
    escala: anterior.escala + (destino.escala - anterior.escala) * progresso,
    x: anterior.x + (destino.x - anterior.x) * progresso,
    y: anterior.y + (destino.y - anterior.y) * progresso,
  };

  const surgir = interpolate(frame, [seg(entrada), seg(entrada + 0.7)], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic) });
  const passo = ordenados[atual];
  const destaque = passo.destaque ? info.alvos[passo.destaque] : null;
  const brilho = passo.destaque
    ? interpolate(frame, [seg(passo.em + TRANSICAO * 0.6), seg(passo.em + TRANSICAO + 0.3)], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
    : 0;

  const transformar = `translate(${AREA.centroX}px, ${AREA.centroY}px) scale(${cam.escala}) translate(${-cam.x}px, ${-cam.y}px)`;

  return (
    <AbsoluteFill style={{ opacity: surgir, transform: `translateY(${(1 - surgir) * 30}px)` }}>
      <div style={{ position: 'absolute', left: 0, top: 0, width: info.largura, height: info.altura, transformOrigin: '0 0', transform: transformar }}>
        <div style={{ position: 'absolute', inset: 0, borderRadius: 18 / cam.escala, overflow: 'hidden', boxShadow: '0 30px 80px rgba(30,36,26,0.22)', border: `${1 / cam.escala}px solid ${COR.borda}` }}>
          <Img src={staticFile(`capturas/${info.arquivo}`)} style={{ width: info.largura, height: info.altura, display: 'block' }} />
          <div style={{ position: 'absolute', inset: 0, background: `rgba(20,24,20,${0.38 * brilho})`, clipPath: destaque ? recorte(destaque, info) : undefined }} />
        </div>
        {destaque && (
          <div style={{
            position: 'absolute', left: destaque[0] - 8, top: destaque[1] - 8, width: destaque[2] + 16, height: destaque[3] + 16,
            borderRadius: 14, border: `${4 / cam.escala * 1.4}px solid ${COR.marca}`, opacity: brilho,
            boxShadow: `0 0 0 ${8 / cam.escala}px rgba(24,223,154,0.25)`,
          }} />
        )}
      </div>
      {destaque && passo.rotulo && (
        <div style={{
          position: 'absolute', top: 40, left: 0, right: 0, display: 'flex', justifyContent: 'center', opacity: brilho,
          transform: `translateY(${(1 - brilho) * -12}px)`,
        }}>
          <div style={{ padding: '12px 30px', borderRadius: 999, background: COR.tinta, color: '#FFFFFF', fontSize: 36, fontWeight: 700, boxShadow: '0 10px 30px rgba(0,0,0,0.25)' }}>
            {passo.rotulo}
          </div>
        </div>
      )}
    </AbsoluteFill>
  );
};

// Escurece tudo, menos o retângulo destacado (polígono com "furo").
function recorte([x, y, w, h]: Retangulo, info: CapturaInfo): string {
  const px = (v: number, total: number): string => `${(v / total) * 100}%`;
  const [l, t, r, b] = [px(x - 8, info.largura), px(y - 8, info.altura), px(x + w + 8, info.largura), px(y + h + 8, info.altura)];
  return `polygon(evenodd, 0 0, 100% 0, 100% 100%, 0 100%, 0 0, ${l} ${t}, ${l} ${b}, ${r} ${b}, ${r} ${t}, ${l} ${t})`;
}
