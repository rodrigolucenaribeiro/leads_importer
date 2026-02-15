import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LogOut, Upload, Loader2, Download, X, MessageCircle, Phone } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';
import { useLocation } from 'wouter';
import * as XLSX from 'xlsx';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_KEY || '';

const supabase = SUPABASE_URL && SUPABASE_KEY 
  ? createClient(SUPABASE_URL, SUPABASE_KEY)
  : null;

interface Lead {
  id: number;
  cnpj: string;
  telefone: string;
  razao_social: string;
  nome_fantasia: string;
  email: string;
  logradouro: string;
  numero: string;
  bairro: string;
  cep: string;
  municipio: string;
  uf: string;
  data_abertura: string;
  natureza_juridica: string;
  situacao: string;
  atividade_principal: string;
  capital_social: string;
  tipo: string;
  claimed_by: string;
  claimed_at: string;
  status: string;
}

interface Vendedor {
  id: string;
  nome: string;
  email: string;
  is_admin: boolean;
}

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const [vendedor, setVendedor] = useState<Vendedor | null>(null);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [meuLeads, setMeuLeads] = useState<Lead[]>([]);
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [carregando, setCarregando] = useState(false);
  const [mensagem, setMensagem] = useState('');
  const [relatorio, setRelatorio] = useState<any>(null);
  const [pagina, setPagina] = useState(1);
  const [filtros, setFiltros] = useState({ busca: '', uf: '', ddd: '', municipio: '' });
  const [ufs, setUfs] = useState<string[]>([]);
  const [municipios, setMunicipios] = useState<string[]>([]);

  useEffect(() => {
    verificarAutenticacao();
  }, []);

  useEffect(() => {
    if (vendedor) {
      carregarLeads();
      carregarMeuLeads();
    }
  }, [vendedor, filtros, pagina]);

  const verificarAutenticacao = async () => {
    if (!supabase) {
      setMensagem('✗ Erro: Supabase não configurado');
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLocation('/login');
        return;
      }

      const { data: vendedorData } = await supabase
        .from('vendedores')
        .select('*')
        .eq('id', user.id)
        .single();

      if (vendedorData) {
        setVendedor(vendedorData);
      }
    } catch (error) {
      console.error('Erro ao verificar autenticação:', error);
      setLocation('/login');
    }
  };

  const carregarLeads = async () => {
    if (!supabase || !vendedor) return;

    try {
      let query = supabase
        .from('leads')
        .select('*')
        .is('claimed_by', null)
        .order('id', { ascending: false })
        .range((pagina - 1) * 50, pagina * 50 - 1);

      if (filtros.busca) {
        query = query.ilike('razao_social', `%${filtros.busca}%`);
      }
      if (filtros.uf) {
        query = query.eq('uf', filtros.uf);
      }
      if (filtros.ddd) {
        query = query.ilike('telefone', `${filtros.ddd}%`);
      }
      if (filtros.municipio) {
        query = query.eq('municipio', filtros.municipio);
      }

      const { data } = await query;
      if (data) {
        setLeads(data);
        
        // Carregar UFs únicos
        const { data: ufsData } = await supabase
          .from('leads')
          .select('uf')
          .neq('uf', null);
        
        if (ufsData) {
          const ufsUnicos = [...new Set(ufsData.map(l => l.uf))].sort();
          setUfs(ufsUnicos);
        }

        // Carregar municípios do UF selecionado
        if (filtros.uf) {
          const { data: municipiosData } = await supabase
            .from('leads')
            .select('municipio')
            .eq('uf', filtros.uf)
            .neq('municipio', null);
          
          if (municipiosData) {
            const municipiosUnicos = [...new Set(municipiosData.map(l => l.municipio))].sort();
            setMunicipios(municipiosUnicos);
          }
        }
      }
    } catch (error) {
      console.error('Erro ao carregar leads:', error);
    }
  };

  const carregarMeuLeads = async () => {
    if (!supabase || !vendedor) return;

    try {
      const { data } = await supabase
        .from('leads')
        .select('*')
        .eq('claimed_by', vendedor.id)
        .order('claimed_at', { ascending: false });

      if (data) {
        setMeuLeads(data);
      }
    } catch (error) {
      console.error('Erro ao carregar meus leads:', error);
    }
  };

  const handleLogout = async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
    setLocation('/login');
  };

  const gerarMensagemWhatsApp = (razaoSocial: string, municipio: string, nomeVendedor: string) => {
    // Saudações profissionais
    const saudacoes = [
      'Olá',
      'Bom dia',
      'Boa tarde',
      'Boa noite'
    ];

    // Introduções profissionais
    const introducoes = [
      `Sou ${nomeVendedor}, representante da Vellozia`,
      `Meu nome é ${nomeVendedor}, trabalho com a Vellozia`,
      `Aqui é ${nomeVendedor} da Vellozia`,
      `${nomeVendedor} aqui, representante da Vellozia`
    ];

    // Contextualizações
    const contextos = [
      `Identificamos que vocês atuam em ${municipio} com procedimentos estéticos`,
      `Vi que vocês oferecem serviços de estética em ${municipio}`,
      `Notei que vocês trabalham com procedimentos em ${municipio}`,
      `Vocês atuam em ${municipio}, correto?`
    ];

    // Propostas de valor (foco em benefícios concretos)
    const propostas = [
      'Trabalho com fornecedores de toxinas e preenchedores com melhor custo-benefício do mercado',
      'Temos acesso a produtos com certificação internacional e prazos de entrega otimizados',
      'Oferecemos soluções em bioestimuladores e preenchedores com excelente relação qualidade-preço',
      'Posso apresentar alternativas de fornecimento que reduzem custos operacionais',
      'Temos portfólio de produtos premium com suporte técnico diferenciado',
      'Oferecemos condições especiais para consultórios e clínicas estabelecidas'
    ];

    // Perguntas diagnósticas (profissionais)
    const perguntas = [
      'Qual é seu principal fornecedor de toxinas e preenchedores atualmente?',
      'Vocês têm interesse em conhecer alternativas com melhor custo-benefício?',
      'Qual é o seu volume mensal de procedimentos com esses produtos?',
      'Vocês buscam fornecedores com suporte técnico e consultoria?',
      'Qual é seu principal critério na escolha de fornecedores?',
      'Vocês estariam abertos a uma proposta comercial personalizada?'
    ];

    // Chamadas para ação diretas
    const ctas = [
      'Posso enviar nossa tabela de preços?',
      'Gostaria de agendar uma conversa breve?',
      'Posso passar mais detalhes sobre nossas soluções?',
      'Qual seria o melhor momento para conversar?',
      'Posso compartilhar nosso catálogo de produtos?',
      'Quando você teria disponibilidade para uma conversa rápida?'
    ];

    // Variações de estrutura (profissional)
    const estruturas = [
      // Estrutura 1: Apresentação + Contexto + Proposta + Pergunta
      `${saudacoes[Math.floor(Math.random() * saudacoes.length)]},\n\n${introducoes[Math.floor(Math.random() * introducoes.length)]}.\n\n${contextos[Math.floor(Math.random() * contextos.length)]}.\n\n${propostas[Math.floor(Math.random() * propostas.length)]}.\n\n${perguntas[Math.floor(Math.random() * perguntas.length)]}?`,
      
      // Estrutura 2: Apresentação + Pergunta + Proposta
      `${saudacoes[Math.floor(Math.random() * saudacoes.length)]},\n\n${introducoes[Math.floor(Math.random() * introducoes.length)]}.\n\n${perguntas[Math.floor(Math.random() * perguntas.length)]}?\n\n${propostas[Math.floor(Math.random() * propostas.length)]}.\n\n${ctas[Math.floor(Math.random() * ctas.length)]}`,
      
      // Estrutura 3: Consultiva direta
      `${saudacoes[Math.floor(Math.random() * saudacoes.length)]},\n\n${introducoes[Math.floor(Math.random() * introducoes.length)]}.\n\n${contextos[Math.floor(Math.random() * contextos.length)]}.\n\n${perguntas[Math.floor(Math.random() * perguntas.length)]}?`,
      
      // Estrutura 4: Proposta + Contexto + CTA
      `${saudacoes[Math.floor(Math.random() * saudacoes.length)]},\n\n${propostas[Math.floor(Math.random() * propostas.length)]}.\n\n${introducoes[Math.floor(Math.random() * introducoes.length)]}.\n\n${ctas[Math.floor(Math.random() * ctas.length)]}`,
    ];

    return estruturas[Math.floor(Math.random() * estruturas.length)];
  };

  const abrirWhatsApp = (telefone: string, razaoSocial: string, municipio: string) => {
    if (!telefone) return;
    const numeroLimpo = telefone.replace(/\D/g, '');
    const mensagem = gerarMensagemWhatsApp(razaoSocial, municipio, vendedor?.nome || 'Vendedor');
    const url = `https://wa.me/55${numeroLimpo}?text=${encodeURIComponent(mensagem)}`;
    window.open(url, '_blank');
  };

  const normalizarTelefone = (telefone: string): string => {
    if (!telefone) return '';
    const apenasNumeros = telefone.replace(/\D/g, '');
    if (apenasNumeros.length === 11) {
      return `(${apenasNumeros.slice(0, 2)}) ${apenasNumeros.slice(2, 7)}-${apenasNumeros.slice(7)}`;
    }
    return apenasNumeros;
  };

  const pegarLead = async (leadId: number) => {
    if (!supabase || !vendedor) return;

    try {
      const { error } = await supabase
        .from('leads')
        .update({
          claimed_by: vendedor.id,
          claimed_at: new Date().toISOString(),
          status: 'contatado'
        })
        .eq('id', leadId);

      if (error) throw error;

      setMensagem('✓ Lead capturado com sucesso!');
      await carregarLeads();
      await carregarMeuLeads();
      setTimeout(() => setMensagem(''), 3000);
    } catch (error) {
      console.error('Erro ao pegar lead:', error);
      setMensagem('✗ Erro ao capturar lead');
    }
  };

  const abrirWhatsAppEPegarLead = async (telefone: string, razaoSocial: string, municipio: string, leadId: number) => {
    if (!telefone) return;
    
    // Primeiro pega o lead
    await pegarLead(leadId);
    
    // Depois abre o WhatsApp
    setTimeout(() => {
      const numeroLimpo = telefone.replace(/\D/g, '');
      const mensagem = gerarMensagemWhatsApp(razaoSocial, municipio, vendedor?.nome || 'Vendedor');
      const url = `https://wa.me/55${numeroLimpo}?text=${encodeURIComponent(mensagem)}`;
      window.open(url, '_blank');
    }, 500);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setArquivo(e.target.files[0]);
      setMensagem('');
    }
  };

  const processarImportacao = async () => {
    if (!arquivo || !supabase || !vendedor || !vendedor.is_admin) {
      setMensagem('✗ Erro: Arquivo não selecionado ou sem permissão');
      return;
    }

    setCarregando(true);
    setMensagem('Processando arquivo...');

    try {
      const arrayBuffer = await arquivo.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const dados = XLSX.utils.sheet_to_json(worksheet);

      const totalLinhas = dados.length;
      let novosInseridos = 0;
      let duplicadosIgnorados = 0;
      let duplicadosAtualizados = 0;
      let erros: any[] = [];

      for (const row of dados) {
        const cnpj = String(row.CNPJ || '').replace(/\D/g, '');
        const telefone = String(row.Telefone || '').replace(/\D/g, '');
        const razaoSocial = String(row['Razão Social'] || '').trim();
        const municipio = String(row.Município || '').trim().toUpperCase();
        const uf = String(row.UF || '').trim().toUpperCase();

        if (!telefone) {
          erros.push({ linha: row, motivo: 'Telefone vazio' });
          continue;
        }

        try {
          // Verificar duplicatas
          let duplicado = false;

          if (cnpj) {
            const { data: existeCnpj } = await supabase
              .from('leads')
              .select('id')
              .eq('cnpj', cnpj)
              .limit(1);

            if (existeCnpj && existeCnpj.length > 0) {
              duplicado = true;
              duplicadosIgnorados++;
              continue;
            }
          }

          if (!duplicado && telefone) {
            const { data: existeTelefone } = await supabase
              .from('leads')
              .select('id')
              .eq('telefone', telefone)
              .limit(1);

            if (existeTelefone && existeTelefone.length > 0) {
              duplicado = true;
              duplicadosIgnorados++;
              continue;
            }
          }

          if (!duplicado) {
            const { error } = await supabase
              .from('leads')
              .insert({
                cnpj: cnpj || null,
                telefone,
                razao_social: razaoSocial,
                nome_fantasia: String(row['Nome Fantasia'] || '').trim() || null,
                email: String(row.Email || '').trim() || null,
                logradouro: String(row.Logradouro || '').trim() || null,
                numero: String(row.Número || '').trim() || null,
                bairro: String(row.Bairro || '').trim() || null,
                cep: String(row.CEP || '').replace(/\D/g, '') || null,
                municipio,
                uf,
                data_abertura: String(row['Data Abertura'] || '').trim() || null,
                natureza_juridica: String(row['Natureza Jurídica'] || '').trim() || null,
                situacao: String(row.Situação || '').trim() || null,
                atividade_principal: String(row['Atividade Principal'] || '').trim() || null,
                capital_social: String(row['Capital Social'] || '').trim() || null,
                tipo: String(row.Tipo || '').trim() || null,
                status: 'novo'
              });

            if (!error) {
              novosInseridos++;
            }
          }
        } catch (error) {
          console.error('Erro ao processar linha:', error);
          erros.push({ linha: row, motivo: 'Erro ao processar' });
        }
      }

      const relatorioFinal = {
        totalLinhas,
        novosInseridos,
        duplicadosIgnorados,
        duplicadosAtualizados,
        errosTotal: erros.length,
        erros
      };

      setRelatorio(relatorioFinal);
      setMensagem(`✓ Importação concluída! ${novosInseridos} novos leads adicionados.`);

      // Salvar log
      await supabase.from('import_logs').insert({
        arquivo_nome: arquivo.name,
        total_linhas: totalLinhas,
        novos_inseridos: novosInseridos,
        duplicados_ignorados: duplicadosIgnorados,
        duplicados_atualizados: duplicadosAtualizados,
        erros_total: erros.length,
        tempo_processamento_ms: 0,
        criado_em: new Date().toISOString(),
        criado_por: vendedor.id
      });

      await carregarLeads();
    } catch (error) {
      console.error('Erro ao importar:', error);
      setMensagem('✗ Erro ao importar arquivo');
    } finally {
      setCarregando(false);
    }
  };

  const leadsExibidos = leads.slice(0, 50);
  const leadsFiltrados = leads;
  const temMais = leadsFiltrados.length > leadsExibidos.length;

  if (!vendedor) {
    return <div className="flex items-center justify-center min-h-screen">Carregando...</div>;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Importador de Leads</h1>
            <p className="text-sm text-slate-600">Bem-vindo, {vendedor.nome}!</p>
          </div>
          <Button variant="outline" onClick={handleLogout}>
            <LogOut className="w-4 h-4 mr-2" />
            Sair
          </Button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {mensagem && (
          <Card className={mensagem.startsWith('✓') ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}>
            <CardContent className="pt-6">
              <p className={mensagem.startsWith('✓') ? 'text-green-700' : 'text-red-700'}>
                {mensagem}
              </p>
            </CardContent>
          </Card>
        )}

        <Tabs defaultValue="leads" className="mt-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="leads">Leads Disponíveis ({leads.length})</TabsTrigger>
            <TabsTrigger value="meus">Meus Leads ({meuLeads.length})</TabsTrigger>
            {vendedor.is_admin && <TabsTrigger value="importar">Importar</TabsTrigger>}
          </TabsList>

          {/* Leads Disponíveis */}
          <TabsContent value="leads" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Filtros</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Filtro Busca */}
                  <div className="space-y-2">
                    <Label htmlFor="busca">Buscar por Nome</Label>
                    <Input
                      id="busca"
                      placeholder="Ex: estética, salão..."
                      value={filtros.busca}
                      onChange={(e) => {
                        setFiltros({ ...filtros, busca: e.target.value });
                        setPagina(1);
                      }}
                    />
                  </div>

                  {/* Filtro UF */}
                  <div className="space-y-2">
                    <Label htmlFor="uf">Estado (UF)</Label>
                    <select
                      id="uf"
                      value={filtros.uf}
                      onChange={(e) => {
                        setFiltros({ ...filtros, uf: e.target.value, municipio: '' });
                        setPagina(1);
                      }}
                      className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm"
                    >
                      <option value="">Todos os estados</option>
                      {ufs.map(uf => (
                        <option key={uf} value={uf}>{uf}</option>
                      ))}
                    </select>
                  </div>

                  {/* Filtro Município */}
                  <div className="space-y-2">
                    <Label htmlFor="municipio">Município</Label>
                    <select
                      id="municipio"
                      value={filtros.municipio}
                      onChange={(e) => {
                        setFiltros({ ...filtros, municipio: e.target.value });
                        setPagina(1);
                      }}
                      className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm"
                    >
                      <option value="">Todos os municípios</option>
                      {municipios.map(municipio => (
                        <option key={municipio} value={municipio}>{municipio}</option>
                      ))}
                    </select>
                  </div>

                  {/* Filtro DDD */}
                  <div className="space-y-2">
                    <Label htmlFor="ddd">DDD (Telefone)</Label>
                    <Input
                      id="ddd"
                      placeholder="Ex: 11, 21, 31..."
                      value={filtros.ddd}
                      onChange={(e) => {
                        setFiltros({ ...filtros, ddd: e.target.value });
                        setPagina(1);
                      }}
                      maxLength={2}
                    />
                  </div>
                </div>

                {/* Botão Limpar Filtros */}
                {(filtros.busca || filtros.uf || filtros.ddd || filtros.municipio) && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setFiltros({ busca: '', uf: '', ddd: '', municipio: '' });
                      setPagina(1);
                    }}
                    className="mt-4"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Limpar Filtros
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Lista de Leads */}
            <div className="space-y-4">
              {leads.length === 0 ? (
                <Card>
                  <CardContent className="pt-6 text-center text-slate-600">
                    {leadsFiltrados.length === 0 
                      ? 'Nenhum lead encontrado com esses filtros'
                      : 'Nenhum lead disponível no momento'
                    }
                  </CardContent>
                </Card>
              ) : (
                <>
                  {leadsExibidos.map(lead => (
                    <Card key={lead.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="pt-6">
                        <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                          <div className="flex-1">
                            <h3 className="font-semibold text-lg">{lead.razao_social}</h3>
                            <div className="grid grid-cols-2 gap-2 mt-2 text-sm text-slate-600">
                              <div>🏢 {lead.cnpj || 'N/A'}</div>
                              <div>📍 {lead.municipio}, {lead.uf}</div>
                            </div>
                          </div>
                          <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
                            {lead.telefone && (
                              <Button
                                onClick={() => abrirWhatsAppEPegarLead(lead.telefone, lead.razao_social, lead.municipio, lead.id)}
                                className="flex-1 sm:flex-none bg-green-600 hover:bg-green-700 text-white"
                              >
                                <MessageCircle className="w-4 h-4 mr-2" />
                                Pegar & WhatsApp
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}

                  {/* Botão Carregar Mais */}
                  {temMais && (
                    <Button
                      onClick={() => setPagina(pagina + 1)}
                      variant="outline"
                      className="w-full"
                    >
                      Carregar Mais ({leadsExibidos.length} de {leadsFiltrados.length})
                    </Button>
                  )}
                </>
              )}
            </div>
          </TabsContent>

          {/* Meus Leads */}
          <TabsContent value="meus" className="space-y-4">
            <div className="grid gap-4">
              {meuLeads.length === 0 ? (
                <Card>
                  <CardContent className="pt-6 text-center text-slate-600">
                    Você ainda não capturou nenhum lead
                  </CardContent>
                </Card>
              ) : (
                meuLeads.map(lead => (
                  <Card key={lead.id}>
                    <CardContent className="pt-6">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-semibold text-lg">{lead.razao_social}</h3>
                          <div className="grid grid-cols-2 gap-2 mt-2 text-sm text-slate-600">
                            <div>📞 {normalizarTelefone(lead.telefone)}</div>
                            <div>🏢 {lead.cnpj || 'N/A'}</div>
                            <div>📍 {lead.municipio}, {lead.uf}</div>
                            <div>⏰ {new Date(lead.claimed_at).toLocaleDateString('pt-BR')}</div>
                          </div>
                        </div>
                        <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                          {lead.status}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          {/* Importar */}
          {vendedor.is_admin && (
            <TabsContent value="importar" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Importar Leads</CardTitle>
                  <CardDescription>Selecione um arquivo XLSX com dados de leads</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center">
                    <input
                      type="file"
                      accept=".xlsx"
                      onChange={handleFileChange}
                      className="hidden"
                      id="file-input"
                    />
                    <label htmlFor="file-input" className="cursor-pointer">
                      <Upload className="w-8 h-8 mx-auto mb-2 text-slate-400" />
                      <p className="text-sm font-medium text-slate-700">
                        {arquivo ? arquivo.name : 'Clique para selecionar ou arraste um arquivo'}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">Apenas arquivos .xlsx</p>
                    </label>
                  </div>

                  <Button 
                    onClick={processarImportacao}
                    disabled={!arquivo || carregando}
                    className="w-full"
                  >
                    {carregando ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
                    {carregando ? 'Processando...' : 'Importar Agora'}
                  </Button>
                </CardContent>
              </Card>

              {relatorio && (
                <Card className="border-green-200 bg-green-50">
                  <CardHeader>
                    <CardTitle className="text-green-900">Relatório de Importação</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-slate-600">Total de linhas</p>
                        <p className="text-2xl font-bold text-green-700">{relatorio.totalLinhas}</p>
                      </div>
                      <div>
                        <p className="text-slate-600">Novos inseridos</p>
                        <p className="text-2xl font-bold text-green-700">{relatorio.novosInseridos}</p>
                      </div>
                      <div>
                        <p className="text-slate-600">Duplicados ignorados</p>
                        <p className="text-2xl font-bold text-yellow-700">{relatorio.duplicadosIgnorados}</p>
                      </div>
                      <div>
                        <p className="text-slate-600">Erros</p>
                        <p className="text-2xl font-bold text-red-700">{relatorio.errosTotal}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  );
}
