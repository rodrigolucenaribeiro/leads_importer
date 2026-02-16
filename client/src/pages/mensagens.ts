export const gerarMensagemWhatsApp = (razaoSocial: string, municipio: string) => {
  // Mensagens profissionais com call-to-action claro que geram diálogo
  const mensagens = [
    // Mensagem 1 - Pergunta sobre fornecedor atual
    `Olá! 👋\n\nSomos Vellozia Produtos Hospitalares - distribuidora de toxinas, preenchedores e bioestimuladores com 9 filiais pelo Brasil.\n\nVi que vocês atuam em ${municipio}. Qual é o seu fornecedor atual de produtos para harmonização?\n\nTemos condições especiais e suporte técnico diferenciado.\n\n📱 Posso enviar nossa tabela de preços?\n\nInstagram: @velloziaoficial`,
    
    // Mensagem 2 - Proposta de economia
    `Olá! 👋\n\nVellozia Produtos Hospitalares aqui.\n\nTrabalhamos com consultórios e clínicas em ${municipio} oferecendo produtos premium com melhor custo-benefício.\n\nVocês gostariam de conhecer alternativas que reduzem custos sem perder qualidade?\n\n📱 Posso agendar uma conversa breve?\n\nInstagram: @velloziaoficial`,
    
    // Mensagem 3 - Pergunta sobre volume
    `Olá! 👋\n\nSou da Vellozia Produtos Hospitalares. Somos especialistas em distribuição de produtos para harmonização facial e corporal.\n\nQual é o seu volume mensal de procedimentos com toxinas e preenchedores em ${municipio}?\n\nTemos portfólio completo e suporte técnico 24/7.\n\n📱 Podemos conversar sobre uma parceria?\n\nInstagram: @velloziaoficial`,
    
    // Mensagem 4 - Urgência com benefício
    `Olá! 👋\n\nVellozia Produtos Hospitalares - Distribuidora com 9 filiais pelo Brasil.\n\nEste mês temos promoção especial em preenchedores e bioestimuladores para clínicas em ${municipio}.\n\nVocês têm interesse em conhecer nossas ofertas?\n\n📱 Posso enviar o catálogo completo com preços?\n\nInstagram: @velloziaoficial`,
    
    // Mensagem 5 - Comparação com concorrência
    `Olá! 👋\n\nSou da Vellozia Produtos Hospitalares.\n\nMuitos consultórios em ${municipio} já trabalham conosco e conseguem reduzir custos em até 30%.\n\nVocês estariam abertos a uma proposta comercial personalizada?\n\n📱 Qual seria o melhor momento para conversar?\n\nInstagram: @velloziaoficial`,
    
    // Mensagem 6 - Suporte técnico como diferencial
    `Olá! 👋\n\nVellozia Produtos Hospitalares aqui.\n\nAlém de produtos de qualidade, oferecemos suporte técnico diferenciado para consultórios em ${municipio}.\n\nVocês buscam um fornecedor com consultoria e acompanhamento?\n\n📱 Posso passar mais detalhes sobre nossos serviços?\n\nInstagram: @velloziaoficial`,
    
    // Mensagem 7 - Certificação e segurança
    `Olá! 👋\n\nSou da Vellozia Produtos Hospitalares - Distribuidora com certificação internacional.\n\nTrabalhamos com produtos 100% originais e rastreáveis para procedimentos em ${municipio}.\n\nQual é seu principal critério na escolha de fornecedores?\n\n📱 Gostaria de conhecer nossos diferenciais?\n\nInstagram: @velloziaoficial`,
    
    // Mensagem 8 - Urgência com oferta limitada
    `Olá! 👋\n\nVellozia Produtos Hospitalares.\n\nTemos estoque limitado de produtos premium para harmonização em ${municipio}.\n\nVocês têm interesse em garantir preços especiais antes que se esgotem?\n\n📱 Posso agendar uma ligação rápida amanhã?\n\nInstagram: @velloziaoficial`,
    
    // Mensagem 9 - Referência social
    `Olá! 👋\n\nSou da Vellozia Produtos Hospitalares.\n\nVários consultórios em ${municipio} já confiam em nossos produtos e suporte.\n\nVocês gostariam de saber por que eles escolhem a Vellozia?\n\n📱 Posso enviar referências de clientes satisfeitos?\n\nInstagram: @velloziaoficial`,
    
    // Mensagem 10 - Desconto por indicação
    `Olá! 👋\n\nVellozia Produtos Hospitalares aqui.\n\nPara consultórios em ${municipio}, oferecemos desconto especial se vocês indicarem colegas.\n\nVocês estariam interessados em uma parceria com benefícios mútuos?\n\n📱 Qual seria o melhor horário para uma conversa?\n\nInstagram: @velloziaoficial`,
  ];

  return mensagens[Math.floor(Math.random() * mensagens.length)];
};
