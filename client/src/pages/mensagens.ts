export const gerarMensagemWhatsApp = (razaoSocial: string, municipio: string, nomeFantasia?: string) => {
  // Extrair nome da empresa para personalização
  const nomeEmpresa = nomeFantasia || razaoSocial.split(' ')[0];
  
  // Mensagens profissionais, sem spam, com CTA eficiente
  const mensagens = [
    // Mensagem 1 - Direto e profissional
    `Olá ${nomeEmpresa},\n\nSomos a Vellozia Produtos Hospitalares, distribuidora especializada em produtos para harmonização facial e corporal. Atendemos consultórios em ${municipio} com suporte técnico diferenciado.\n\nQual é seu fornecedor atual? Podemos oferecer melhores condições.\n\nInstagram: @velloziaoficial`,
    
    // Mensagem 2 - Foco em economia
    `${nomeEmpresa}, tudo bem?\n\nVellozia aqui. Consultórios em ${municipio} que trabalham conosco reduzem custos em até 30% sem perder qualidade.\n\nTem interesse em conhecer nossas propostas?\n\nInstagram: @velloziaoficial`,
    
    // Mensagem 3 - Pergunta estratégica
    `Olá ${nomeEmpresa},\n\nSou da Vellozia Produtos Hospitalares. Qual é seu volume mensal em procedimentos com toxinas e preenchedores?\n\nTemos portfólio completo com suporte 24/7 para clínicas em ${municipio}.\n\nPodemos conversar?\n\nInstagram: @velloziaoficial`,
    
    // Mensagem 4 - Oferta com prazo
    `${nomeEmpresa}, boa notícia!\n\nVellozia tem promoção especial em preenchedores e bioestimuladores esta semana para clínicas em ${municipio}.\n\nGostaria de conhecer nossas ofertas?\n\nInstagram: @velloziaoficial`,
    
    // Mensagem 5 - Prova social
    `Olá ${nomeEmpresa},\n\nMuitos consultórios em ${municipio} já trabalham com a Vellozia. Somos distribuidora com 9 filiais pelo Brasil.\n\nQual seria o melhor momento para conversarmos sobre uma parceria?\n\nInstagram: @velloziaoficial`,
    
    // Mensagem 6 - Suporte como diferencial
    `${nomeEmpresa}, tudo bem?\n\nVellozia oferece não só produtos de qualidade, mas também consultoria e acompanhamento técnico.\n\nVocês buscam um fornecedor com esse tipo de suporte?\n\nInstagram: @velloziaoficial`,
    
    // Mensagem 7 - Segurança e rastreabilidade
    `Olá ${nomeEmpresa},\n\nSomos Vellozia - distribuidora com certificação internacional. Todos os produtos são 100% originais e rastreáveis.\n\nQual é seu principal critério na escolha de fornecedores?\n\nInstagram: @velloziaoficial`,
    
    // Mensagem 8 - Urgência moderada
    `${nomeEmpresa}, atenção!\n\nVellozia tem estoque limitado de produtos premium para harmonização. Preços especiais apenas esta semana.\n\nTem interesse em garantir os melhores preços?\n\nInstagram: @velloziaoficial`,
    
    // Mensagem 9 - Referência de clientes
    `Olá ${nomeEmpresa},\n\nVários consultórios em ${municipio} já confiam na Vellozia. Podemos compartilhar referências de clientes satisfeitos.\n\nGostaria de conhecer por que eles nos escolhem?\n\nInstagram: @velloziaoficial`,
    
    // Mensagem 10 - Parceria com benefícios
    `${nomeEmpresa}, tudo bem?\n\nVellozia oferece programa especial para consultórios em ${municipio}: descontos progressivos e suporte dedicado.\n\nPodemos conversar sobre uma parceria?\n\nInstagram: @velloziaoficial`,
  ];

  return mensagens[Math.floor(Math.random() * mensagens.length)];
};
