import React from 'react';
import { AbsoluteFill, Composition, Html5Audio, Sequence, staticFile } from 'remotion';
import { C1Abertura, C2Pergunta, C5Anonimato, C6Conta, C9Fechamento } from './cenasAnimadas';
import { CENAS_CAPTURA } from './cenasCaptura';
import { ANTES_DA_FALA, CORTES, FPS, duracaoDoCorte, legendasDoCorte, montarCorte } from './linhaDoTempo';
import { Cena, LegendaQueimada, tempos } from './ui';

const CENAS: Record<string, React.FC> = { c1: C1Abertura, c2: C2Pergunta, c5: C5Anonimato, c6: C6Conta, c9: C9Fechamento, ...CENAS_CAPTURA };

const Corte: React.FC<{ ids: string[] }> = ({ ids }) => {
  const corte = montarCorte(tempos, ids);
  return (
    <AbsoluteFill style={{ background: '#F4F7F5' }}>
      {corte.map(({ id, inicio, duracao }) => {
        const Conteudo = CENAS[id];
        return (
          <Sequence key={id} from={inicio} durationInFrames={duracao} name={id}>
            <Cena duracao={duracao}><Conteudo /></Cena>
            <Sequence from={Math.round(ANTES_DA_FALA * FPS)} layout="none">
              <Html5Audio src={staticFile(`audio/${id}.mp3`)} />
            </Sequence>
          </Sequence>
        );
      })}
      <LegendaQueimada legendas={legendasDoCorte(tempos, corte)} />
    </AbsoluteFill>
  );
};

const composicao = (id: string, ids: string[]): React.ReactElement => (
  <Composition id={id} component={Corte} defaultProps={{ ids }} durationInFrames={duracaoDoCorte(montarCorte(tempos, ids))} fps={FPS} width={1920} height={1080} />
);

export const Raiz: React.FC = () => (
  <>
    {composicao('Colaboradores', CORTES.Colaboradores)}
    {composicao('RH', CORTES.RH)}
    {Object.keys(CENAS).map((id) => <React.Fragment key={id}>{composicao(`Previa-${id}`, [id])}</React.Fragment>)}
  </>
);
