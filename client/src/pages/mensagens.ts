export const gerarMensagemWhatsApp = (razaoSocial: string, municipio: string, nomeFantasia?: string) => {
  // Extrair nome da empresa para personalização
  const nomeEmpresa = nomeFantasia || razaoSocial.split(' ')[0];
  
  // 20 Mensagens profissionais para prospecção cliente frio
  const mensagens = [
    // Mensagem 1 - Apresentação consultiva
    `Olá ${nomeEmpresa}!\n\nSomos a Vellozia Produtos Hospitalares. Atendemos clínicas e consultórios em ${municipio} com toxinas, preenchedores e bioestimuladores.\n\nPosso fazer uma pergunta rápida? Qual linha de produtos tem maior giro na clínica?\n\nVellozia Produtos Hospitalares\n@velloziaoficial`,
    
    // Mensagem 2 - Pergunta sobre fornecedor fixo
    `Oi ${nomeEmpresa}!\n\nSou da Vellozia Produtos Hospitalares.\n\nVocês já possuem fornecedor fixo ou costumam avaliar novas condições comerciais?\n\nVellozia Produtos Hospitalares\n@velloziaoficial`,
    
    // Mensagem 3 - Diagnóstico de necessidade
    `Olá ${nomeEmpresa}!\n\nAqui é da Vellozia Produtos Hospitalares. Posso entender quais produtos têm maior giro aí na clínica?\n\nVellozia Produtos Hospitalares\n@velloziaoficial`,
    
    // Mensagem 4 - Segmentação por produto
    `Oi ${nomeEmpresa}!\n\nSou da Vellozia Produtos Hospitalares.\n\nVocês trabalham mais com toxinas, preenchedores ou bioestimuladores?\n\nVellozia Produtos Hospitalares\n@velloziaoficial`,
    
    // Mensagem 5 - Oferta de portfólio
    `Olá ${nomeEmpresa}!\n\nSomos a Vellozia Produtos Hospitalares.\n\nPosso te enviar nosso portfólio ou prefere que eu entenda primeiro o perfil da clínica?\n\nVellozia Produtos Hospitalares\n@velloziaoficial`,
    
    // Mensagem 6 - Prioridades de compra
    `Oi ${nomeEmpresa}!\n\nAqui é da Vellozia Produtos Hospitalares.\n\nVocês priorizam mais preço, prazo ou marca na hora de escolher fornecedor?\n\nVellozia Produtos Hospitalares\n@velloziaoficial`,
    
    // Mensagem 7 - Abertura comercial
    `Olá ${nomeEmpresa}!\n\nSomos a Vellozia Produtos Hospitalares. Atendemos várias clínicas em ${municipio}.\n\nVocês estão abertos a conhecer novas oportunidades comerciais?\n\nVellozia Produtos Hospitalares\n@velloziaoficial`,
    
    // Mensagem 8 - Proposta estratégica
    `Oi ${nomeEmpresa}!\n\nSou da Vellozia Produtos Hospitalares.\n\nPosso te enviar algumas condições estratégicas para avaliação?\n\nVellozia Produtos Hospitalares\n@velloziaoficial`,
    
    // Mensagem 9 - Modelo de compra
    `Olá ${nomeEmpresa}!\n\nAqui é da Vellozia Produtos Hospitalares.\n\nVocês compram sob demanda ou trabalham com estoque?\n\nVellozia Produtos Hospitalares\n@velloziaoficial`,
    
    // Mensagem 10 - Rotina de compras
    `Oi ${nomeEmpresa}!\n\nSou da Vellozia Produtos Hospitalares.\n\nPosso entender rapidamente como funciona a rotina de compras de vocês?\n\nVellozia Produtos Hospitalares\n@velloziaoficial`,
    
    // Mensagem 11 - Foco em rentabilidade
    `Olá ${nomeEmpresa}!\n\nSomos a Vellozia Produtos Hospitalares. Atendemos clínicas que buscavam melhorar margens.\n\nVocês estão focados em reduzir custos ou aumentar rentabilidade?\n\nVellozia Produtos Hospitalares\n@velloziaoficial`,
    
    // Mensagem 12 - Custo-benefício
    `Oi ${nomeEmpresa}!\n\nAqui é da Vellozia Produtos Hospitalares.\n\nPosso te enviar os produtos com melhor custo-benefício disponíveis agora?\n\nVellozia Produtos Hospitalares\n@velloziaoficial`,
    
    // Mensagem 13 - Ofertas estratégicas
    `Olá ${nomeEmpresa}!\n\nSou da Vellozia Produtos Hospitalares.\n\nVocês gostam de receber ofertas estratégicas quando surgem boas oportunidades?\n\nVellozia Produtos Hospitalares\n@velloziaoficial`,
    
    // Mensagem 14 - Primeira compra
    `Oi ${nomeEmpresa}!\n\nAqui é da Vellozia Produtos Hospitalares.\n\nPosso te enviar uma condição especial para primeira compra?\n\nVellozia Produtos Hospitalares\n@velloziaoficial`,
    
    // Mensagem 15 - Marcas reconhecidas
    `Olá ${nomeEmpresa}!\n\nSomos a Vellozia Produtos Hospitalares. Trabalhamos com várias marcas reconhecidas.\n\nQual é a marca principal que vocês trabalham hoje?\n\nVellozia Produtos Hospitalares\n@velloziaoficial`,
    
    // Mensagem 16 - Oportunidades de giro
    `Oi ${nomeEmpresa}!\n\nSou da Vellozia Produtos Hospitalares.\n\nPosso te mostrar algumas oportunidades que estão girando forte nas clínicas de ${municipio}?\n\nVellozia Produtos Hospitalares\n@velloziaoficial`,
    
    // Mensagem 17 - Tabela ou análise
    `Olá ${nomeEmpresa}!\n\nAqui é da Vellozia Produtos Hospitalares.\n\nPosso te enviar nossa tabela ou prefere uma análise personalizada para sua clínica?\n\nVellozia Produtos Hospitalares\n@velloziaoficial`,
    
    // Mensagem 18 - Avaliação de fornecedores
    `Oi ${nomeEmpresa}!\n\nSou da Vellozia Produtos Hospitalares.\n\nVocês costumam avaliar novos fornecedores quando aparecem boas condições?\n\nVellozia Produtos Hospitalares\n@velloziaoficial`,
    
    // Mensagem 19 - Sem compromisso
    `Olá ${nomeEmpresa}!\n\nAqui é da Vellozia Produtos Hospitalares.\n\nPosso te enviar algumas oportunidades comerciais sem nenhum compromisso?\n\nVellozia Produtos Hospitalares\n@velloziaoficial`,
    
    // Mensagem 20 - Identificar decisor
    `Oi ${nomeEmpresa}!\n\nSou da Vellozia Produtos Hospitalares.\n\nVocê é a pessoa responsável pelas compras ou posso falar com alguém do setor?\n\nVellozia Produtos Hospitalares\n@velloziaoficial`,
  ];

  return mensagens[Math.floor(Math.random() * mensagens.length)];
};
