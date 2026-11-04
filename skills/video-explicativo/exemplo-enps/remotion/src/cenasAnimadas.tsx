import React from 'react';
import { interpolate, useCurrentFrame } from 'remotion';
import { COR, Etiqueta, Logo, MarcaBruning, TituloCena, momento, seg, useEntrada, useMola } from './ui';

const NOTAS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
const corDaNota = (n: number): string => (n >= 9 ? COR.promotor : n >= 7 ? COR.neutro : COR.detrator);

export const C1Abertura: React.FC = () => {
  const logo = useMola(0.2);
  const titulo = useEntrada(0.7);
  const sub = useEntrada(momento('c1', 'veja como'));
  const pilula = useMola(momento('c1', 'uma pergunta'));
  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', paddingBottom: 120 }}>
      <div style={{ transform: `scale(${logo})` }}><Logo tamanho={180} /></div>
      <div style={{ fontSize: 190, fontWeight: 800, letterSpacing: -4, marginTop: 30, opacity: titulo, transform: `translateY(${(1 - titulo) * 30}px)` }}>eNPS</div>
      <div style={{ transform: `scale(${pilula})`, marginTop: 10 }}>
        <Etiqueta fundo={COR.marca} cor={COR.tinta}>1 pergunta · nota de 0 a 10</Etiqueta>
      </div>
      <div style={{ fontSize: 54, fontWeight: 600, color: COR.suave, marginTop: 36, opacity: sub }}>Como funciona no Conecta</div>
    </div>
  );
};

export const C2Pergunta: React.FC = () => {
  const frame = useCurrentFrame();
  const cartao = useEntrada(0.2);
  const tRegua = momento('c2', 'em uma escala');
  const tNota = momento('c2', 'você escolhe uma nota');
  const tComentario = momento('c2', 'deixa um comentário');
  const comentario = 'Gosto do ambiente e da autonomia no dia a dia.';
  const letras = Math.floor(interpolate(frame, [seg(tComentario), seg(tComentario + 2.2)], [0, comentario.length], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }));
  const caixa = useEntrada(tComentario - 0.4);
  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', paddingBottom: 150 }}>
      <TituloCena texto="A pergunta" />
      <div style={{ width: 1500, background: COR.cartao, borderRadius: 28, padding: '56px 64px', boxShadow: '0 24px 70px rgba(30,36,26,0.12)', opacity: cartao, transform: `translateY(${(1 - cartao) * 40}px)` }}>
        <div style={{ fontSize: 50, fontWeight: 700, lineHeight: 1.25 }}>
          Em uma escala de 0 a 10, o quanto você recomendaria a Bruning como um bom lugar para trabalhar?
        </div>
        <div style={{ display: 'flex', gap: 16, marginTop: 48 }}>
          {NOTAS.map((n) => {
            const surge = interpolate(frame, [seg(tRegua + n * 0.08), seg(tRegua + n * 0.08 + 0.35)], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
            const escolhida = n === 9 && frame >= seg(tNota + 0.4);
            return (
              <div key={n} style={{
                flex: 1, height: 104, borderRadius: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 44, fontWeight: 800,
                border: `3px solid ${escolhida ? COR.marcaEscura : COR.borda}`, background: escolhida ? COR.marca : '#FFFFFF',
                opacity: surge, transform: `translateY(${(1 - surge) * 20}px) scale(${escolhida ? 1.08 : 1})`,
              }}>{n}</div>
            );
          })}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 16, fontSize: 30, color: COR.suave, opacity: useEntrada(tRegua + 0.9) }}>
          <span>0 · Nada provável</span><span>10 · Extremamente provável</span>
        </div>
        <div style={{ marginTop: 36, opacity: caixa }}>
          <div style={{ fontSize: 30, fontWeight: 600, color: COR.suave, marginBottom: 10 }}>Comentário (opcional)</div>
          <div style={{ height: 92, borderRadius: 16, border: `2px solid ${COR.borda}`, padding: '0 26px', display: 'flex', alignItems: 'center', fontSize: 36 }}>
            {comentario.slice(0, letras)}<span style={{ opacity: frame % 30 < 15 ? 1 : 0, color: COR.marcaEscura }}>|</span>
          </div>
        </div>
      </div>
    </div>
  );
};

const Caixa: React.FC<{ titulo: string; icone: string; children: React.ReactNode; opacidade: number }> = ({ titulo, icone, children, opacidade }) => (
  <div style={{ width: 620, minHeight: 420, background: COR.cartao, borderRadius: 28, padding: 40, boxShadow: '0 20px 60px rgba(30,36,26,0.10)', opacity: opacidade }}>
    <div style={{ fontSize: 40, fontWeight: 800, display: 'flex', gap: 16, alignItems: 'center' }}><span>{icone}</span>{titulo}</div>
    <div style={{ marginTop: 28 }}>{children}</div>
  </div>
);

export const C5Anonimato: React.FC = () => {
  const frame = useCurrentFrame();
  const tSeparar = momento('c5', 'o conecta registra');
  const tCinco = momento('c5', 'com menos de cinco');
  const tGrupos = momento('c5', 'e grupos muito pequenos');
  const tDica = momento('c5', 'só evite');

  const fase1 = interpolate(frame, [seg(tCinco - 0.5), seg(tCinco)], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const fase2 = interpolate(frame, [seg(tCinco - 0.2), seg(tCinco + 0.4), seg(tDica - 0.4), seg(tDica)], [0, 1, 1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const fase3 = useEntrada(tDica - 0.1);

  const ficha = useEntrada(0.3);
  const separar = interpolate(frame, [seg(tSeparar), seg(tSeparar + 1.4)], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const caixas = useEntrada(tSeparar - 0.3);

  const respostas = Math.min(5, Math.floor(interpolate(frame, [seg(tCinco + 0.3), seg(tCinco + 2.6)], [1, 4.99], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })) + (frame >= seg(tGrupos - 0.3) ? 1 : 0));
  const liberado = respostas >= 5;

  return (
    <div style={{ position: 'absolute', inset: 0 }}>
      <TituloCena texto="Anonimato" />

      <div style={{ position: 'absolute', inset: 0, opacity: fase1 }}>
        <div style={{ position: 'absolute', left: 0, right: 0, top: 170, display: 'flex', justifyContent: 'center', opacity: ficha * (1 - separar) }}>
          <div style={{ background: COR.cartao, borderRadius: 24, padding: '26px 44px', boxShadow: '0 16px 50px rgba(30,36,26,0.12)', fontSize: 44, fontWeight: 700, display: 'flex', gap: 40 }}>
            <span>👤 Você</span><span style={{ color: COR.promotor }}>Nota 9</span>
          </div>
        </div>
        <div style={{ position: 'absolute', left: 0, right: 0, top: 320, display: 'flex', justifyContent: 'center', gap: 80 }}>
          <Caixa titulo="Participação" icone="✅" opacidade={caixas}>
            <div style={{ fontSize: 36, lineHeight: 1.7, color: COR.suave }}>
              <div>Ana · participou</div>
              <div>Bruno · participou</div>
              <div style={{ color: COR.tinta, fontWeight: 700, opacity: separar }}>Você · participou</div>
            </div>
            <div style={{ marginTop: 18, fontSize: 28, color: COR.suave }}>Sem nota</div>
          </Caixa>
          <Caixa titulo="Respostas" icone="🗳️" opacidade={caixas}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
              {[7, 10, 9, 6, 8].map((n, i) => (
                <div key={i} style={{ width: 92, height: 92, borderRadius: 18, background: corDaNota(n), color: '#FFF', fontSize: 42, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{n}</div>
              ))}
              <div style={{ width: 92, height: 92, borderRadius: 18, background: COR.promotor, color: '#FFF', fontSize: 42, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: separar, transform: `scale(${0.6 + 0.4 * separar})` }}>9</div>
            </div>
            <div style={{ marginTop: 24, fontSize: 28, color: COR.suave }}>Sem nome</div>
          </Caixa>
        </div>
      </div>

      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', paddingBottom: 170, opacity: fase2 }}>
        <div style={{ display: 'flex', gap: 22 }}>
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} style={{ width: 110, height: 110, borderRadius: 999, fontSize: 52, display: 'flex', alignItems: 'center', justifyContent: 'center', background: i < respostas ? COR.lilas : '#E6E8EF', color: '#FFF' }}>👤</div>
          ))}
        </div>
        <div style={{ marginTop: 50 }}>
          <Etiqueta fundo={liberado ? COR.marca : COR.tinta} cor={liberado ? COR.tinta : '#FFFFFF'} estilo={{ fontSize: 44 }}>
            {liberado ? '🔓 5 respostas: resultado liberado' : `🔒 ${respostas} de 5: resultado oculto`}
          </Etiqueta>
        </div>
        <div style={{ marginTop: 34, fontSize: 36, color: COR.suave, opacity: useEntrada(tGrupos) }}>Grupos muito pequenos também ficam ocultos</div>
      </div>

      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', paddingBottom: 170, opacity: fase3 }}>
        <div style={{ width: 1100, background: COR.cartao, borderRadius: 28, padding: '44px 56px', boxShadow: '0 20px 60px rgba(30,36,26,0.12)' }}>
          <div style={{ fontSize: 34, fontWeight: 700, color: COR.suave }}>💬 No comentário</div>
          <div style={{ fontSize: 44, marginTop: 20, lineHeight: 1.4 }}>
            “Conversei com <span style={{ background: '#FDE7E8', textDecoration: 'line-through', textDecorationColor: COR.detrator, textDecorationThickness: 5 }}>o Carlos, do Financeiro</span>, e…”
          </div>
          <div style={{ fontSize: 36, marginTop: 24, color: COR.marcaEscura, fontWeight: 700 }}>Evite nomes e detalhes que identifiquem alguém</div>
        </div>
      </div>
    </div>
  );
};

const FAIXAS = [
  { nome: 'Detratores', de: 0, ate: 6, cor: COR.detrator, trecho: 'detratores' },
  { nome: 'Neutros', de: 7, ate: 8, cor: COR.neutro, trecho: 'neutros' },
  { nome: 'Promotores', de: 9, ate: 10, cor: COR.promotor, trecho: 'promotores' },
];

export const C6Conta: React.FC = () => {
  const frame = useCurrentFrame();
  const tFormula = momento('c6', 'o enps é');
  const tEscala = momento('c6', 'vai de menos 100');
  const tExemplo = momento('c6', 'por exemplo');
  const tResultado = momento('c6', 'dão um enps');
  const formula = useEntrada(tFormula);
  const escala = useEntrada(tEscala);
  const exemplo = useEntrada(tExemplo);
  const resultado = useMola(tResultado);
  const marcador = interpolate(frame, [seg(tResultado), seg(tResultado + 1.2)], [0, 45], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const subir = interpolate(frame, [seg(tFormula - 0.4), seg(tFormula + 0.3)], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const pontos = [...Array(12).fill(COR.promotor), ...Array(5).fill(COR.neutro), ...Array(3).fill(COR.detrator)];

  return (
    <div style={{ position: 'absolute', inset: 0 }}>
      <TituloCena texto="A conta" />
      <div style={{ position: 'absolute', left: 160, right: 160, top: 170 - subir * 30, display: 'flex', gap: 14, transform: `scale(${1 - subir * 0.12})`, transformOrigin: 'top center' }}>
        {FAIXAS.map((f) => {
          const tFaixa = momento('c6', f.trecho);
          const e = interpolate(frame, [seg(tFaixa - 0.6), seg(tFaixa)], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
          return (
            <div key={f.nome} style={{ flex: f.ate - f.de + 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', gap: 10 }}>
                {NOTAS.filter((n) => n >= f.de && n <= f.ate).map((n) => (
                  <div key={n} style={{ flex: 1, height: 92, borderRadius: 16, fontSize: 40, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', background: e > 0.5 ? f.cor : '#FFFFFF', color: e > 0.5 ? '#FFFFFF' : COR.tinta, border: `2px solid ${e > 0.5 ? f.cor : COR.borda}` }}>{n}</div>
                ))}
              </div>
              <div style={{ textAlign: 'center', fontSize: 38, fontWeight: 800, color: f.cor, opacity: e }}>{f.nome}</div>
            </div>
          );
        })}
      </div>

      <div style={{ position: 'absolute', left: 0, right: 0, top: 410, textAlign: 'center', opacity: formula * (1 - exemplo), fontSize: 64, fontWeight: 800 }}>
        eNPS = <span style={{ color: COR.promotor }}>% promotores</span> − <span style={{ color: COR.detrator }}>% detratores</span>
      </div>

      <div style={{ position: 'absolute', left: 0, right: 0, top: 380, display: 'flex', flexDirection: 'column', alignItems: 'center', opacity: exemplo }}>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', width: 1100, justifyContent: 'center' }}>
          {pontos.map((c, i) => {
            const e = interpolate(frame, [seg(tExemplo + i * 0.05), seg(tExemplo + i * 0.05 + 0.3)], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
            return <div key={i} style={{ width: 44, height: 44, borderRadius: 999, background: c, transform: `scale(${e})` }} />;
          })}
        </div>
        <div style={{ fontSize: 60, fontWeight: 800, marginTop: 26 }}>
          <span style={{ color: COR.promotor }}>60%</span> − <span style={{ color: COR.detrator }}>15%</span> = <span style={{ display: 'inline-block', transform: `scale(${0.6 + 0.4 * resultado})`, opacity: resultado, background: COR.marca, padding: '0 22px', borderRadius: 18 }}>45</span>
        </div>
      </div>

      <div style={{ position: 'absolute', left: 260, right: 260, top: 720, opacity: escala }}>
        <div style={{ height: 22, borderRadius: 999, background: `linear-gradient(90deg, ${COR.detrator}, #E9EAEE 50%, ${COR.promotor})` }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 32, fontWeight: 700, marginTop: 10, color: COR.suave }}>
          <span>−100</span><span>0</span><span>+100</span>
        </div>
        <div style={{ position: 'absolute', top: -20, left: `${50 + marcador / 2}%`, transform: 'translateX(-50%)', opacity: exemplo }}>
          <div style={{ fontSize: 34, fontWeight: 800, textAlign: 'center', marginBottom: 6, marginTop: -44 }}>{Math.round(marcador)}</div>
          <div style={{ width: 8, height: 62, borderRadius: 4, background: COR.tinta, margin: '0 auto' }} />
        </div>
      </div>
    </div>
  );
};

export const C9Fechamento: React.FC = () => {
  const logo = useMola(0.2);
  const frase = useEntrada(0.6);
  const pilula = useMola(momento('c9', 'quando a pesquisa'));
  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', paddingBottom: 150 }}>
      <div style={{ transform: `scale(${logo})`, display: 'flex', alignItems: 'center', gap: 32 }}><Logo tamanho={130} /><MarcaBruning largura={380} /></div>
      <div style={{ fontSize: 80, fontWeight: 800, marginTop: 44, textAlign: 'center', lineHeight: 1.15, opacity: frase, transform: `translateY(${(1 - frase) * 24}px)` }}>
        Sua nota sincera faz<br />o número valer.
      </div>
      <div style={{ marginTop: 44, transform: `scale(${pilula})` }}>
        <Etiqueta fundo={COR.marca}>Responda pelo Início do Conecta</Etiqueta>
      </div>
    </div>
  );
};
