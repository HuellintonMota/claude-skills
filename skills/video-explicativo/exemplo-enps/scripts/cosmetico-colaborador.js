(() => {
  const trocas = [
    ['<Nome completo real>', 'Colaborador'], ['Bom dia, <Primeiro nome>', 'Bom dia!'], ['Boa tarde, <Primeiro nome>', 'Boa tarde!'],
    ['<CARGO REAL>', 'BRUNING'], ['[VÍDEO] eNPS teste', 'eNPS — Outubro/2026'],
  ];
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  let n;
  while ((n = walker.nextNode())) {
    let v = n.nodeValue;
    for (const [de, para] of trocas) v = v.split(de).join(para);
    if (v.trim() === '<INICIAIS>') v = v.replace('<INICIAIS>', 'C');
    if (v !== n.nodeValue) n.nodeValue = v;
  }
  const card = document.querySelector('.espaco-pesquisas');
  if (card) {
    card.querySelectorAll('a.espaco-item').forEach((a) => { if (!a.innerText.includes('eNPS')) a.style.display = 'none'; });
    const pill = card.querySelector('.pill'); if (pill) pill.textContent = '1';
  }
  document.querySelectorAll('.card').forEach((c) => { if (/Minhas pendências/.test(c.innerText) && !c.classList.contains('espaco-pesquisas')) c.style.visibility = 'hidden'; });
  return 'ok';
})()
