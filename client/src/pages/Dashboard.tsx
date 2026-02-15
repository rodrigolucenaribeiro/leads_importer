import { useState, useEffect, useMemo } from 'react';
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
  razao_social: string;
  telefone: string;
  municipio: string;
  uf: string;
  claimed_by: string | null;
  claimed_at: string | null;
  status: string;
}

interface Vendedor {
  id: string;
  nome: string;
  email: string;
  is_admin?: boolean;
}

interface RelatorioImportacao {
  total: number;
  novos: number;
  atualizados: number;
  duplicados: number;
  erros: number;
  detalhes: string[];
}

interface Filtros {
  busca: string;
  uf: string;
  ddd: string;
  municipio: string;
}

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const [vendedor, setVendedor] = useState<Vendedor | null>(null);
  const [todosLeads, setTodosLeads] = useState<Lead[]>([]);
  const [meusLeads, setMeusLeads] = useState<Lead[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [processando, setProcessando] = useState(false);
  const [mensagem, setMensagem] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [arquivoSelecionado, setArquivoSelecionado] = useState<File | null>(null);
  const [relatorio, setRelatorio] = useState<RelatorioImportacao | null>(null);
  const [filtros, setFiltros] = useState<Filtros>({
    busca: '',
    uf: '',
    ddd: '',
    municipio: ''
  });
  const [pagina, setPagina] = useState(1);
  const ITENS_POR_PAGINA = 50;

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    if (!supabase) return;

    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        setLocation('/login');
        return;
      }

      // Carregar dados do vendedor
      const { data: vendedorData, error: vendedorError } = await supabase
        .from('vendedores')
        .select('*')
        .eq('id', user.id)
        .single();

      if (vendedorError) {
        const { data: newVendedor } = await supabase
          .from('vendedores')
          .insert({
            id: user.id,
            nome: user.email?.split('@')[0] || 'Vendedor',
            email: user.email,
            is_admin: false,
          })
          .select()
          .single();
        
        if (newVendedor) {
          setVendedor(newVendedor);
          setIsAdmin(false);
        }
      } else {
        setVendedor(vendedorData);
        setIsAdmin(vendedorData.is_admin || false);
      }

      // Carregar TODOS os leads disponíveis
      const { data: leadsData } = await supabase
        .from('leads')
        .select('*')
        .is('claimed_by', null)
        .order('created_at', { ascending: false });

      setTodosLeads(leadsData || []);
      setPagina(1);

      // Carregar meus leads
      if (user.id) {
        const { data: meusLeadsData } = await supabase
          .from('leads')
          .select('*')
          .eq('claimed_by', user.id)
          .order('claimed_at', { ascending: false });

        setMeusLeads(meusLeadsData || []);
      }
    } catch (err) {
      console.error('Erro ao carregar dados:', err);
    } finally {
      setCarregando(false);
    }
  };

  // Filtrar leads baseado nos critérios
  const leadsFiltrados = useMemo(() => {
    return todosLeads.filter(lead => {
      // Filtro por busca (razão social)
      if (filtros.busca && !lead.razao_social.toLowerCase().includes(filtros.busca.toLowerCase())) {
        return false;
      }

      // Filtro por UF
      if (filtros.uf && lead.uf !== filtros.uf) {
        return false;
      }

      // Filtro por DDD (primeiros 2 dígitos do telefone)
      if (filtros.ddd && !lead.telefone?.startsWith(filtros.ddd)) {
        return false;
      }

      // Filtro por município
      if (filtros.municipio && lead.municipio !== filtros.municipio) {
        return false;
      }

      return true;
    });
  }, [todosLeads, filtros]);

  // Paginação
  const leadsExibidos = leadsFiltrados.slice(0, pagina * ITENS_POR_PAGINA);
  const temMais = leadsExibidos.length < leadsFiltrados.length;

  // Extrair UFs e municípios únicos para dropdowns
  const ufs = useMemo(() => {
    const set = new Set(todosLeads.map(l => l.uf).filter(Boolean));
    return Array.from(set).sort();
  }, [todosLeads]);

  const municipios = useMemo(() => {
    const set = new Set(
      todosLeads
        .filter(l => !filtros.uf || l.uf === filtros.uf)
        .map(l => l.municipio)
        .filter(Boolean)
    );
    return Array.from(set).sort();
  }, [todosLeads, filtros.uf]);

  const pegarLead = async (leadId: number) => {
    if (!supabase) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('leads')
        .update({
          claimed_by: user.id,
          claimed_at: new Date().toISOString(),
          status: 'contatado'
        })
        .eq('id', leadId);

      if (error) throw error;

      await carregarDados();
      setMensagem('✓ Lead pegado com sucesso!');
      setTimeout(() => setMensagem(''), 3000);
    } catch (err) {
      setMensagem('✗ Erro ao pegar lead');
    }
  };

  const handleLogout = async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
    setLocation('/login');
  };

  const abrirWhatsApp = (telefone: string, razaoSocial: string) => {
    if (!telefone) return;
    const numeroLimpo = telefone.replace(/\D/g, '');
    const mensagem = `Ola! Sou vendedor e gostaria de conversar com ${razaoSocial}`;
    const url = `https://wa.me/55${numeroLimpo}?text=${encodeURIComponent(mensagem)}`;
    window.open(url, '_blank');
  };

  const normalizarTelefone = (telefone: string): string => {
    if (!telefone) return '';
    const apenasNumeros = telefone.replace(/\D/g, '');
    return apenasNumeros.slice(-11) || apenasNumeros;
  };

  const normalizarCNPJ = (cnpj: string): string => {
    if (!cnpj) return '';
    return cnpj.replace(/\D/g, '').slice(0, 14);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !supabase) return;

    setArquivoSelecionado(file);
    setMensagem(`✓ Arquivo com ${file.name} carregado. Clique em "Importar Agora" para processar.`);
  };

  const importarArquivo = async () => {
    if (!arquivoSelecionado || !supabase) return;

    setProcessando(true);
    setMensagem('');

    try {
      const arrayBuffer = await arquivoSelecionado.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const dados = XLSX.utils.sheet_to_json(worksheet);

      const relatorio: RelatorioImportacao = {
        total: dados.length,
        novos: 0,
        atualizados: 0,
        duplicados: 0,
        erros: 0,
        detalhes: []
      };

      const leadsParaInserir: any[] = [];
      const cnpjsExistentes = new Set<string>();
      const telefonesExistentes = new Set<string>();

      // Buscar CNPJs e telefones existentes
      const { data: leadsExistentes } = await supabase
        .from('leads')
        .select('cnpj, telefone');

      if (leadsExistentes) {
        leadsExistentes.forEach(lead => {
          if (lead.cnpj) cnpjsExistentes.add(lead.cnpj);
          if (lead.telefone) telefonesExistentes.add(lead.telefone);
        });
      }

      // Processar cada linha
      for (const row of dados as any[]) {
        try {
          const razaoSocial = (row as any)['Razão Social'] || (row as any)['razao_social'] || '';
          const cnpj = normalizarCNPJ((row as any)['CNPJ'] || (row as any)['cnpj'] || '');
          const telefone = normalizarTelefone((row as any)['Telefone'] || (row as any)['telefone'] || '');

          if (!razaoSocial) {
            relatorio.erros++;
            relatorio.detalhes.push('Razão social vazia');
            continue;
          }

          // Verificar duplicação
          if (cnpj && cnpjsExistentes.has(cnpj)) {
            relatorio.duplicados++;
            relatorio.detalhes.push(`Duplicado: CNPJ ${cnpj}`);
            continue;
          }

          if (telefone && telefonesExistentes.has(telefone)) {
            relatorio.duplicados++;
            relatorio.detalhes.push(`Duplicado: Telefone ${telefone}`);
            continue;
          }

          // Preparar lead para inserção
          leadsParaInserir.push({
            cnpj: cnpj || null,
            telefone: telefone || null,
            razao_social: razaoSocial,
            nome_fantasia: (row as any)['Nome Fantasia'] || (row as any)['nome_fantasia'] || null,
            email: (row as any)['Email'] || (row as any)['email'] || null,
            logradouro: (row as any)['Logradouro'] || (row as any)['logradouro'] || null,
            numero: (row as any)['Número'] || (row as any)['numero'] || null,
            bairro: (row as any)['Bairro'] || (row as any)['bairro'] || null,
            cep: (row as any)['CEP'] || (row as any)['cep'] || null,
            municipio: (row as any)['Município'] || (row as any)['municipio'] || null,
            uf: ((row as any)['UF'] || (row as any)['uf'] || '').toUpperCase(),
            data_abertura: (row as any)['Data Abertura'] || (row as any)['data_abertura'] || null,
            natureza_juridica: (row as any)['Natureza Jurídica'] || (row as any)['natureza_juridica'] || null,
            situacao: (row as any)['Situação'] || (row as any)['situacao'] || null,
            atividade_principal: (row as any)['Atividade Principal'] || (row as any)['atividade_principal'] || null,
            capital_social: (row as any)['Capital Social'] || (row as any)['capital_social'] || null,
            tipo: (row as any)['Tipo'] || (row as any)['tipo'] || null,
            status: 'novo'
          });

          if (cnpj) cnpjsExistentes.add(cnpj);
          if (telefone) telefonesExistentes.add(telefone);
          relatorio.novos++;
        } catch (err) {
          relatorio.erros++;
          relatorio.detalhes.push(`Erro ao processar linha: ${err}`);
        }
      }

      // Inserir leads em lotes
      if (leadsParaInserir.length > 0) {
        const { error: insertError } = await supabase
          .from('leads')
          .insert(leadsParaInserir);

        if (insertError) throw insertError;
      }

      setRelatorio(relatorio);
      setMensagem(`✓ Importação concluída! ${relatorio.novos} novos leads adicionados.`);
      setArquivoSelecionado(null);

      // Recarregar dados
      setTimeout(() => carregarDados(), 1000);
    } catch (err) {
      console.error('Erro ao importar:', err);
      setMensagem(`✗ Erro ao importar arquivo: ${err}`);
    } finally {
      setProcessando(false);
    }
  };

  if (carregando) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
          <p>Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Importador de Leads</h1>
            <p className="text-slate-600">Bem-vindo, {vendedor?.nome}!</p>
          </div>
          <Button variant="outline" onClick={handleLogout}>
            <LogOut className="w-4 h-4 mr-2" />
            Sair
          </Button>
        </div>
      </div>

      {/* Conteúdo */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {mensagem && (
          <div className={`mb-6 p-4 rounded-lg border ${
            mensagem.startsWith('✓') 
              ? 'bg-green-50 border-green-200 text-green-700'
              : 'bg-red-50 border-red-200 text-red-700'
          }`}>
            {mensagem}
          </div>
        )}

        <Tabs defaultValue="leads" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="leads">Leads Disponíveis ({leadsFiltrados.length})</TabsTrigger>
            <TabsTrigger value="meus">Meus Leads ({meusLeads.length})</TabsTrigger>
            {isAdmin && <TabsTrigger value="importar">Importar</TabsTrigger>}
          </TabsList>

          {/* Leads Disponíveis com Filtros */}
          <TabsContent value="leads" className="space-y-4">
            {/* Filtros */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Filtros Avançados</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Busca por Nome */}
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
            <div className="grid gap-4">
              {leadsExibidos.length === 0 ? (
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
                                onClick={() => abrirWhatsApp(lead.telefone, lead.razao_social)}
                                variant="outline"
                                className="flex-1 sm:flex-none text-green-600 border-green-600 hover:bg-green-50"
                              >
                                <MessageCircle className="w-4 h-4 mr-2" />
                                WhatsApp
                              </Button>
                            )}
                            <Button 
                              onClick={() => pegarLead(lead.id)}
                              className="flex-1 sm:flex-none"
                            >
                              Pegar Lead
                            </Button>
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
              {meusLeads.length === 0 ? (
                <Card>
                  <CardContent className="pt-6 text-center text-slate-600">
                    Você ainda não pegou nenhum lead
                  </CardContent>
                </Card>
              ) : (
                meusLeads.map(lead => (
                  <Card key={lead.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="pt-6">
                      <div>
                        <h3 className="font-semibold text-lg">{lead.razao_social}</h3>
                        <div className="grid grid-cols-2 gap-2 mt-2 text-sm text-slate-600">
                          <div>📞 {lead.telefone || 'N/A'}</div>
                          <div>🏢 {lead.cnpj || 'N/A'}</div>
                          <div>📍 {lead.municipio}, {lead.uf}</div>
                          <div>📅 {new Date(lead.claimed_at || '').toLocaleDateString('pt-BR')}</div>
                        </div>
                        <div className="mt-2">
                          <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                            lead.status === 'novo' ? 'bg-blue-100 text-blue-700' :
                            lead.status === 'contatado' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-green-100 text-green-700'
                          }`}>
                            {lead.status}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          {/* Importar (Admin) */}
          {isAdmin && (
            <TabsContent value="importar">
              <Card>
                <CardHeader>
                  <CardTitle>Importar Leads</CardTitle>
                  <CardDescription>
                    Selecione um arquivo XLSX com dados de leads
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="border-2 border-dashed rounded-lg p-8 text-center">
                      <Upload className="w-8 h-8 mx-auto mb-2 text-slate-400" />
                      <Label htmlFor="file" className="cursor-pointer">
                        <span className="text-blue-600 hover:underline font-medium">Clique para selecionar</span>
                        {' '}ou arraste um arquivo
                      </Label>
                      <Input
                        id="file"
                        type="file"
                        accept=".xlsx"
                        onChange={handleFileUpload}
                        disabled={processando}
                        className="hidden"
                      />
                      <p className="text-sm text-slate-500 mt-2">Apenas arquivos .xlsx</p>
                      {arquivoSelecionado && (
                        <p className="text-sm text-green-600 mt-2 font-medium">
                          ✓ {arquivoSelecionado.name}
                        </p>
                      )}
                    </div>

                    {arquivoSelecionado && (
                      <Button 
                        onClick={importarArquivo}
                        disabled={processando}
                        className="w-full"
                        size="lg"
                      >
                        {processando ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Importando...
                          </>
                        ) : (
                          <>
                            <Download className="w-4 h-4 mr-2" />
                            Importar Agora
                          </>
                        )}
                      </Button>
                    )}

                    {relatorio && (
                      <Card className="bg-slate-50">
                        <CardHeader>
                          <CardTitle className="text-lg">Relatório de Importação</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2 text-sm">
                          <div>Total de linhas: <strong>{relatorio.total}</strong></div>
                          <div className="text-green-600">Novos inseridos: <strong>{relatorio.novos}</strong></div>
                          <div className="text-yellow-600">Duplicados: <strong>{relatorio.duplicados}</strong></div>
                          <div className="text-red-600">Erros: <strong>{relatorio.erros}</strong></div>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  );
}
