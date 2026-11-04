import React from 'react';
import { interpolate, useCurrentFrame } from 'remotion';
import { Captura, type Passo } from './Captura';
import { TituloCena, momento, seg } from './ui';

// Mostra a captura só dentro da janela [de, ate) da cena, com transição cruzada.
const Janela: React.FC<{ de: number; ate?: number; children: React.ReactNode }> = ({ de, ate, children }) => {
  const frame = useCurrentFrame();
  const entra = interpolate(frame, [seg(de - 0.25), seg(de + 0.25)], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const sai = ate === undefined ? 1 : interpolate(frame, [seg(ate - 0.25), seg(ate + 0.25)], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  return <div style={{ position: 'absolute', inset: 0, opacity: Math.min(entra, sai) }}>{children}</div>;
};

const Camadas: React.FC<{ titulo: string; partes: { nome: string; de: number; ate?: number; passos: Passo[] }[] }> = ({ titulo, partes }) => (
  <>
    {partes.map((p, i) => (
      <Janela key={`${p.nome}-${i}`} de={p.de} ate={p.ate}>
        <Captura nome={p.nome} entrada={p.de} passos={p.passos} />
      </Janela>
    ))}
    <TituloCena texto={titulo} em={0} ate={Math.min(...partes.flatMap((p) => p.passos.map((passo) => passo.em))) - 0.2} />
  </>
);

const C3Inicio: React.FC = () => (
  <Camadas titulo="Onde responder" partes={[{
    nome: 'inicio', de: 0.1, passos: [
      { em: momento('c3', 'em pesquisas pendentes'), foco: 'card', destaque: 'card', rotulo: 'Início › Pesquisas pendentes' },
      { em: momento('c3', 'é só clicar'), foco: 'card', destaque: 'item', rotulo: 'Clique para responder' },
    ],
  }]} />
);

const C4Responder: React.FC = () => (
  <Camadas titulo="Respondendo" partes={[{
    nome: 'responder', de: 0.1, passos: [
      { em: momento('c4', 'toque na nota'), foco: 'regua', destaque: 'regua', rotulo: 'Escolha a nota de 0 a 10' },
      { em: momento('c4', 'escreva um comentário'), foco: 'comentario', destaque: 'comentario', rotulo: 'Comentário opcional' },
      { em: momento('c4', 'e envie'), destaque: 'enviar', rotulo: 'Enviar respostas' },
      { em: momento('c4', 'cada pessoa'), destaque: 'aviso', rotulo: 'Uma resposta por pessoa, anônima' },
    ],
  }]} />
);

const C7Criar: React.FC = () => {
  const tCadastro = momento('c7', 'do tipo enps');
  const tDuplicar = momento('c7', 'na próxima rodada');
  return (
    <Camadas titulo="Para o RH · criar" partes={[
      { nome: 'lista', de: 0.1, ate: tCadastro - 0.2, passos: [
        { em: momento('c7', 'crie uma pesquisa'), foco: 'nova', destaque: 'nova', rotulo: 'Engajamento › Pesquisas › Nova pesquisa' },
      ] },
      { nome: 'cadastro', de: tCadastro - 0.2, ate: tDuplicar - 0.2, passos: [
        { em: tCadastro, foco: 'tipo', destaque: 'tipo', rotulo: 'Tipo: eNPS' },
        { em: momento('c7', 'adicione uma pergunta'), foco: 'pergunta', destaque: 'pergunta', rotulo: '1 pergunta NPS (0 a 10) por pesquisa' },
        { em: momento('c7', 'deixe a opção anônima'), foco: 'tipo', destaque: 'tipo', rotulo: 'Anônima ligada' },
        { em: momento('c7', 'defina o início'), foco: 'periodo', destaque: 'periodo', rotulo: 'Período de respostas' },
        { em: momento('c7', 'e abra a pesquisa'), foco: 'abrir', destaque: 'abrir', rotulo: 'Salvar e abrir' },
      ] },
      { nome: 'lista', de: tDuplicar - 0.2, passos: [
        { em: tDuplicar + 0.2, foco: 'lista', destaque: 'duplicar', rotulo: 'Duplicar para a próxima rodada' },
      ] },
    ]} />
  );
};

const C8Ler: React.FC = () => {
  const tIndicadores = momento('c8', 'em indicadores');
  return (
    <Camadas titulo="Para o RH · resultados" partes={[
      { nome: 'resultado', de: 0.1, ate: tIndicadores - 0.2, passos: [
        { em: momento('c8', 'a participação'), foco: 'participacao', destaque: 'participacao', rotulo: 'Participação' },
        { em: momento('c8', 'os três grupos'), foco: 'grupos', destaque: 'grupos', rotulo: 'Promotores, neutros e detratores' },
        { em: momento('c8', 'o enps e os'), foco: 'grupos', destaque: 'nps', rotulo: 'eNPS da pesquisa' },
        { em: momento('c8', 'os comentários'), foco: 'comentarios', destaque: 'comentarios', rotulo: 'Comentários, sem nome e embaralhados' },
        { em: momento('c8', 'e pode filtrar'), foco: 'recorte', destaque: 'recorte', rotulo: 'Um recorte por vez' },
      ] },
      { nome: 'indicadores', de: tIndicadores - 0.2, passos: [
        { em: momento('c8', 'na aba clima'), foco: 'aba', destaque: 'aba', rotulo: 'Indicadores › Clima (e-NPS)' },
        { em: momento('c8', 'aparece por trimestre'), foco: 'grafico', destaque: 'grafico', rotulo: 'eNPS por trimestre' },
        { em: momento('c8', 'meta de 70'), foco: 'grafico', destaque: 'meta', rotulo: 'Meta 70' },
        { em: momento('c8', 'gestores também'), destaque: 'atual', rotulo: 'RH e Gestores veem o eNPS da empresa' },
      ] },
    ]} />
  );
};

export const CENAS_CAPTURA: Record<string, React.FC> = { c3: C3Inicio, c4: C4Responder, c7: C7Criar, c8: C8Ler };
