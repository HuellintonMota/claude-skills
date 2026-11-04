(() => {
  const nomes = [
    ['[VÍDEO] eNPS teste — rascunho', 'eNPS — Novembro/2026'],
    ['[VÍDEO] eNPS teste — T3', 'eNPS — Julho/2026'],
    ['[VÍDEO] eNPS teste — T2', 'eNPS — Abril/2026'],
    ['[VÍDEO] eNPS teste', 'eNPS — Outubro/2026'],
  ];
  const trocar = (texto) => { for (const [de, para] of nomes) if (texto.includes(de)) return texto.split(de).join(para); return texto; };
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  let n; let trocas = 0;
  while ((n = walker.nextNode())) { const novo = trocar(n.nodeValue); if (novo !== n.nodeValue) { n.nodeValue = novo; trocas++; } }
  document.querySelectorAll('input[type=text]').forEach((i) => { const novo = trocar(i.value); if (novo !== i.value) { i.value = novo; trocas++; } });
  return 'trocas=' + trocas;
})()
