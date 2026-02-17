export const gerarMensagemWhatsApp = (razaoSocial: string, municipio: string, nomeFantasia?: string) => {
  // Extrair nome da empresa para personalização
  const nomeEmpresa = nomeFantasia || razaoSocial.split(' ')[0];
  
  // Mensagens profissionais, sem spam, com CTA eficiente
  const mensagens = [
    // Mensagem 1 - Apresentação com proposta de valor
    `Olá ${nomeEmpresa},\n\nSomos a Vellozia Produtos Hospitalares, distribuidora especializada em toxinas, preenchedores e bioestimuladores para harmonização facial e corporal.\n\nAtendemos consultórios em ${municipio} com suporte técnico diferenciado.\n\nQual é seu fornecedor atual? Podemos oferecer melhores condições.\n\nVellozia Produtos Hospitalares\n@velloziaoficial`,
    
    // Mensagem 2 - Foco em economia e volume
    `${nomeEmpresa}, tudo bem?\n\nVellozia Produtos Hospitalares aqui. Consultórios em ${municipio} que trabalham conosco reduzem custos em até 30% sem perder qualidade.\n\nTem interesse em conhecer nossas propostas?\n\nVellozia Produtos Hospitalares\n@velloziaoficial`,
    
    // Mensagem 3 - Pergunta estratégica sobre volume
    `Olá ${nomeEmpresa},\n\nSou da Vellozia Produtos Hospitalares. Qual é seu volume mensal em procedimentos com toxinas e preenchedores?\n\nTemos portfólio completo com suporte 24/7 para clínicas em ${municipio}.\n\nPodemos conversar?\n\nVellozia Produtos Hospitalares\n@velloziaoficial`,
    
    // Mensagem 4 - Oferta com prazo
    `${nomeEmpresa}, boa notícia!\n\nVellozia Produtos Hospitalares tem promoção especial em preenchedores e bioestimuladores esta semana para clínicas em ${municipio}.\n\nGostaria de conhecer nossas ofertas?\n\nVellozia Produtos Hospitalares\n@velloziaoficial`,
    
    // Mensagem 5 - Prova social com diferencial de filiais
    `Olá ${nomeEmpresa},\n\nMuitos consultórios em ${municipio} já trabalham com a Vellozia. Somos distribuidora com 9 filiais pelo Brasil.\n\nQual seria o melhor momento para conversarmos sobre uma parceria?\n\nVellozia Produtos Hospitalares\n@velloziaoficial`,
    
    // Mensagem 6 - Suporte como diferencial
    `${nomeEmpresa}, tudo bem?\n\nVellozia Produtos Hospitalares oferece não só produtos de qualidade, mas também consultoria e acompanhamento técnico.\n\nVocês buscam um fornecedor com esse tipo de suporte?\n\nVellozia Produtos Hospitalares\n@velloziaoficial`,
    
    // Mensagem 7 - Segurança e rastreabilidade
    `Olá ${nomeEmpresa},\n\nSomos Vellozia Produtos Hospitalares - distribuidora com certificação internacional. Todos os produtos são 100% originais e rastreáveis.\n\nQual é seu principal critério na escolha de fornecedores?\n\nVellozia Produtos Hospitalares\n@velloziaoficial`,
    
    // Mensagem 8 - Urgência moderada com estoque
    `${nomeEmpresa}, atenção!\n\nVellozia Produtos Hospitalares tem estoque limitado de produtos premium para harmonização. Preços especiais apenas esta semana.\n\nTem interesse em garantir os melhores preços?\n\nVellozia Produtos Hospitalares\n@velloziaoficial`,
    
    // Mensagem 9 - Referência de clientes satisfeitos
    `Olá ${nomeEmpresa},\n\nVários consultórios em ${municipio} já confiam na Vellozia Produtos Hospitalares. Podemos compartilhar referências de clientes satisfeitos.\n\nGostaria de conhecer por que eles nos escolhem?\n\nVellozia Produtos Hospitalares\n@velloziaoficial`,
    
    // Mensagem 10 - Parceria com benefícios progressivos
    `${nomeEmpresa}, tudo bem?\n\nVellozia Produtos Hospitalares oferece programa especial para consultórios em ${municipio}: descontos progressivos e suporte dedicado.\n\nPodemos conversar sobre uma parceria?\n\nVellozia Produtos Hospitalares\n@velloziaoficial`,
  ];

  return mensagens[Math.floor(Math.random() * mensagens.length)];
};
