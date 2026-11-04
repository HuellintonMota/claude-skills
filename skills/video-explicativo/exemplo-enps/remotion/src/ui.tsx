import React from 'react';
import { AbsoluteFill, Easing, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { loadFont } from '@remotion/google-fonts/SofiaSans';
import temposJson from './tempos.json';
import { FPS, momento as momentoBruto, type Legenda as LegendaTipo, type Tempos } from './linhaDoTempo';

export const { fontFamily } = loadFont('normal', { weights: ['400', '600', '700', '800'], subsets: ['latin', 'latin-ext'] });

export const tempos = temposJson as Tempos;
export const momento = (id: string, trecho: string, ocorrencia = 1): number => momentoBruto(tempos, id, trecho, ocorrencia);

export const COR = {
  fundo: '#F4F7F5',
  tinta: '#1E241A',
  suave: '#5B6360',
  marca: '#18DF9A',
  marcaEscura: '#0B8F60',
  lilas: '#9EA0E5',
  detrator: '#E5484D',
  neutro: '#8B8D98',
  promotor: '#12B981',
  cartao: '#FFFFFF',
  borda: '#E2E8E4',
};

export const seg = (s: number): number => Math.round(s * FPS);

// Entrada suave a partir do segundo `em` (relativo à cena): 0 → 1.
export function useEntrada(em: number, duracao = 0.6): number {
  const frame = useCurrentFrame();
  return interpolate(frame, [seg(em), seg(em + duracao)], [0, 1], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic),
  });
}

export function useMola(em: number, rigidez = 120): number {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return spring({ frame: frame - seg(em), fps, config: { damping: 16, stiffness: rigidez } });
}

export const Cena: React.FC<{ duracao: number; children: React.ReactNode; fundo?: string }> = ({ duracao, children, fundo = COR.fundo }) => {
  const frame = useCurrentFrame();
  const opacidade = interpolate(frame, [0, 10, duracao - 10, duracao], [0, 1, 1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  return (
    <AbsoluteFill style={{ background: fundo, fontFamily, color: COR.tinta, opacity: opacidade }}>
      {children}
    </AbsoluteFill>
  );
};

export const Etiqueta: React.FC<{ children: React.ReactNode; cor?: string; fundo?: string; estilo?: React.CSSProperties }> = ({ children, cor = COR.tinta, fundo = '#FFFFFF', estilo }) => (
  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 14, padding: '14px 28px', borderRadius: 999, background: fundo, color: cor, fontSize: 36, fontWeight: 700, boxShadow: '0 6px 24px rgba(30,36,26,0.10)', ...estilo }}>
    {children}
  </div>
);

export const TituloCena: React.FC<{ texto: string; em?: number; ate?: number }> = ({ texto, em = 0.1, ate = 9999 }) => {
  const e = useEntrada(em) * (1 - useEntrada(ate, 0.4));
  return (
    <div style={{ position: 'absolute', top: 64, left: 0, right: 0, textAlign: 'center', opacity: e, transform: `translateY(${(1 - e) * -20}px)` }}>
      <span style={{ fontSize: 30, fontWeight: 800, letterSpacing: 4, textTransform: 'uppercase', color: COR.marcaEscura }}>{texto}</span>
    </div>
  );
};

export const LegendaQueimada: React.FC<{ legendas: LegendaTipo[] }> = ({ legendas }) => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const atual = legendas.find((l) => t >= l.inicio && t < l.fim);
  if (!atual) return null;
  return (
    <AbsoluteFill style={{ justifyContent: 'flex-end', alignItems: 'center', paddingBottom: 56, fontFamily, pointerEvents: 'none' }}>
      <div style={{ maxWidth: 1480, padding: '14px 32px', borderRadius: 16, background: 'rgba(20,24,20,0.84)', color: '#FFFFFF', fontSize: 44, fontWeight: 600, lineHeight: 1.3, textAlign: 'center' }}>
        {atual.texto}
      </div>
    </AbsoluteFill>
  );
};

export const Logo: React.FC<{ tamanho: number }> = ({ tamanho }) => (
  <Img src={staticFile('isotipo-job.png')} width={tamanho} height={tamanho} />
);

export const MarcaBruning: React.FC<{ largura: number }> = ({ largura }) => (
  <Img src={staticFile('bruning-conecta-logo-light.png')} width={largura} style={{ height: 'auto' }} />
);
