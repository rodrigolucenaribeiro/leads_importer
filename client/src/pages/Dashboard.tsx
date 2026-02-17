import React, { useState, useEffect } from 'react';
import { gerarMensagemWhatsApp } from './mensagens';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LogOut, Upload, Loader2, Download, X, MessageCircle, Phone } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';
import { useLocation } from 'wouter';
import * as XLSX from 'xlsx';
import html2pdf from 'html2pdf.js';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Pie } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend);

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

interface LeadNote {
  id: number;
  lead_id: number;
  vendedor_id: string;
  nota: string;
  created_at: string;
}

interface LeadHistory {
  id: number;
  lead_id: number;
  vendedor_id: string;
  status_anterior: string;
  status_novo: string;
  proxima_acao: string;
  created_at: string;
}

interface Contato {
  id: number;
  lead_id: number;
  vendedor_id: string;
  tipo: 'whatsapp' | 'email' | 'ligacao';
  mensagem: string;
  data_envio: string;
  status: 'enviado' | 'lido' | 'respondido';
}




export default function Dashboard() {
  const [, setLocation] = useLocation();
  const [vendedor, setVendedor] = useState<Vendedor | null>(null);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [meuLeads, setMeuLeads] = useState<Lead[]>([]);
  const [leadSelecionado, setLeadSelecionado] = useState<Lead | null>(null);
  const [notas, setNotas] = useState<LeadNote[]>([]);
  const [historico, setHistorico] = useState<LeadHistory[]>([]);
  const [contatos, setContatos] = useState<Contato[]>([]);
  const [novaNota, setNovaNota] = useState('');
  const [proximaAcao, setProximaAcao] = useState('');
  const [whatsappChoice, setWhatsappChoice] = useState<{show: boolean; telefone: string; razaoSocial: string; municipio: string; leadId: number} | null>(null);
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [carregando, setCarregando] = useState(false);
  const [mensagem, setMensagem] = useState('');
  const [relatorio, setRelatorio] = useState<any>(null);
  const [preview, setPreview] = useState<any[]>([]);
  const [pagina, setPagina] = useState(1);
  const [filtros, setFiltros] = useState({ busca: '', uf: '', ddd: '', municipio: '', cnpj: '', email: '', telefone: '', status: '' });
  const [ufs, setUfs] = useState<string[]>([]);
  const [municipios, setMunicipios] = useState<string[]>([]);
  const [filaImportacao, setFilaImportacao] = useState<any[]>([]);
  const [processandoFila, setProcessandoFila] = useState(false);

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
        .order('id', { ascending: false });

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
          const ufsUnicos = Array.from(new Set(ufsData.map(l => l.uf))).sort();
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
            const municipiosUnicos = Array.from(new Set(municipiosData.map(l => l.municipio))).sort();
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



  const abrirWhatsApp = (telefone: string, razaoSocial: string, municipio: string, nomeFantasia?: string) => {
    if (!telefone) return;
    const numeroLimpo = telefone.replace(/\D/g, '');
    const mensagem = gerarMensagemWhatsApp(razaoSocial, municipio, nomeFantasia);
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

  const abrirWhatsAppEPegarLead = async (telefone: string, razaoSocial: string, municipio: string, leadId: number, nomeFantasia?: string) => {
    if (!telefone) return;
    
    // Primeiro pega o lead
    await pegarLead(leadId);
    
    // Depois abre o WhatsApp imediatamente (sem delay)
    const numeroLimpo = telefone.replace(/\D/g, '');
    const mensagem = gerarMensagemWhatsApp(razaoSocial, municipio, nomeFantasia);
    
    // Registrar contato
    await registrarContato(leadId, 'whatsapp', mensagem);
    
    // Detectar se é mobile
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    if (isMobile) {
      // Mobile: usar protocolo whatsapp:// para abrir app
      const url = `whatsapp://send?phone=55${numeroLimpo}&text=${encodeURIComponent(mensagem)}`;
      window.location.href = url;
    } else {
      // Desktop: abrir WhatsApp Web
      const url = `https://web.whatsapp.com/send?phone=55${numeroLimpo}&text=${encodeURIComponent(mensagem)}`;
      window.open(url, '_blank');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const file = e.target.files[0];
      setArquivo(file);
      setMensagem('');
      
      // Gerar preview das primeiras 5 linhas
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const arrayBuffer = event.target?.result as ArrayBuffer;
          const workbook = XLSX.read(arrayBuffer, { type: 'array' });
          const worksheet = workbook.Sheets[workbook.SheetNames[0]];
          const dados = XLSX.utils.sheet_to_json(worksheet);
          setPreview(dados.slice(0, 5));
        } catch (error) {
          console.error('Erro ao ler arquivo:', error);
        }
      };
      reader.readAsArrayBuffer(file);
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
      const BATCH_SIZE = 500; // Aumentado para 500 para arquivos grandes

      // Buscar TODOS os leads existentes uma vez (não 19.400 vezes!)
      const { data: leadsExistentes } = await supabase
        .from('leads')
        .select('cnpj, telefone');

      const cnpjsExistentes = new Set((leadsExistentes || []).map(l => l.cnpj).filter(Boolean));
      const telefonesExistentes = new Set((leadsExistentes || []).map(l => l.telefone).filter(Boolean));

      // Preparar lotes para inserção
      const leadsParaInserir: any[] = [];

      for (const row of dados as any[]) {
        const cnpj = String((row as any).CNPJ || '').replace(/\D/g, '').slice(0, 14);
        // Pegar apenas o primeiro telefone se houver múltiplos separados por /
        let telefoneBruto = String((row as any).Telefone || '').split('/')[0].trim();
        let telefone = telefoneBruto.replace(/\D/g, '');
        // Se tiver mais de 11 dígitos, remover os primeiros (provavelmente +55)
        if (telefone.length > 11) {
          telefone = telefone.slice(-11);
        }
        const razaoSocial = String((row as any)['Razão Social'] || '').trim();
        const municipio = String((row as any).Município || '').trim().toUpperCase();
        const uf = String((row as any).UF || '').trim().toUpperCase();

        if (!telefone) {
          erros.push({ linha: (row as any), motivo: 'Telefone vazio' });
          continue;
        }

        // Verificar duplicatas em memória
        let duplicado = false;

        if (cnpj && cnpjsExistentes.has(cnpj)) {
          duplicado = true;
          duplicadosIgnorados++;
        } else if (telefonesExistentes.has(telefone)) {
          duplicado = true;
          duplicadosIgnorados++;
        }

        if (!duplicado) {
          leadsParaInserir.push({
            cnpj: cnpj || null,
            telefone,
            razao_social: razaoSocial,
            nome_fantasia: String((row as any)['Nome Fantasia'] || '').trim() || null,
            email: String((row as any).Email || '').trim() || null,
            logradouro: String((row as any).Logradouro || '').trim() || null,
            numero: String((row as any).Número || '').trim() || null,
            bairro: String((row as any).Bairro || '').trim() || null,
            cep: String((row as any).CEP || '').replace(/\D/g, '') || null,
            municipio,
            uf,
            data_abertura: String((row as any)['Data Abertura'] || '').trim() || null,
            natureza_juridica: String((row as any)['Natureza Jurídica'] || '').trim() || null,
            situacao: String((row as any).Situação || '').trim() || null,
            atividade_principal: String((row as any)['Atividade Principal'] || '').trim() || null,
            capital_social: String((row as any)['Capital Social'] || '').trim() || null,
            tipo: String((row as any).Tipo || '').trim() || null,
            status: 'novo'
          });
        }
      }

      // Inserir em lotes de 500 (muito mais rápido)
      for (let i = 0; i < leadsParaInserir.length; i += BATCH_SIZE) {
        const batch = leadsParaInserir.slice(i, i + BATCH_SIZE);
        
        // Filtrar batch para remover duplicatas DENTRO do lote
        const batchFiltrado = batch.filter(lead => {
          if (lead.cnpj && cnpjsExistentes.has(lead.cnpj)) {
            duplicadosIgnorados++;
            return false;
          }
          if (lead.telefone && telefonesExistentes.has(lead.telefone)) {
            duplicadosIgnorados++;
            return false;
          }
          // Adicionar ao Set para evitar duplicatas dentro do mesmo lote
          if (lead.cnpj) cnpjsExistentes.add(lead.cnpj);
          if (lead.telefone) telefonesExistentes.add(lead.telefone);
          return true;
        });
        
        if (batchFiltrado.length === 0) continue;
        
        try {
          // Verificar quais leads já existem no banco
          const cnpjsVerificar = batchFiltrado.filter(l => l.cnpj).map(l => l.cnpj);
          const telefonesVerificar = batchFiltrado.filter(l => l.telefone).map(l => l.telefone);
          
          let existentes = new Set();
          if (cnpjsVerificar.length > 0) {
            const { data: cnpjExistentes } = await supabase
              .from('leads')
              .select('cnpj')
              .in('cnpj', cnpjsVerificar);
            cnpjExistentes?.forEach(l => existentes.add(l.cnpj));
          }
          if (telefonesVerificar.length > 0) {
            const { data: telefonesExistentes } = await supabase
              .from('leads')
              .select('telefone')
              .in('telefone', telefonesVerificar);
            telefonesExistentes?.forEach(l => existentes.add(l.telefone));
          }
          
          // Filtrar apenas leads que não existem
          const leadsNovos = batchFiltrado.filter(lead => {
            if (lead.cnpj && existentes.has(lead.cnpj)) {
              duplicadosIgnorados++;
              return false;
            }
            if (lead.telefone && existentes.has(lead.telefone)) {
              duplicadosIgnorados++;
              return false;
            }
            return true;
          });
          
          // Inserir apenas os novos
          if (leadsNovos.length > 0) {
            const { error } = await supabase
              .from('leads')
              .insert(leadsNovos);
            
            if (!error) {
              novosInseridos += leadsNovos.length;
            } else {
              erros.push({ motivo: `Erro ao inserir lote: ${error.message}` });
            }
          }
        } catch (error: any) {
          console.error('Erro ao processar lote:', error);
          erros.push({ motivo: `Erro ao processar lote ${Math.floor(i / BATCH_SIZE) + 1}: ${error?.message || 'Erro desconhecido'}` });
        }
        
        // Atualizar progresso
        const progresso = Math.min(100, Math.round((i + BATCH_SIZE) / leadsParaInserir.length * 100));
        setMensagem(`Processando arquivo... ${progresso}%`);
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

  const adicionarFilaImportacao = (arquivo: File) => {
    const novoItem = {
      id: Date.now(),
      arquivo: arquivo,
      status: 'pendente',
      criado_em: new Date().toLocaleString('pt-BR')
    };
    setFilaImportacao([...filaImportacao, novoItem]);
  };

  const processarFila = async () => {
    if (filaImportacao.length === 0) return;
    
    setProcessandoFila(true);
    for (let i = 0; i < filaImportacao.length; i++) {
      const item = filaImportacao[i];
      
      // Atualizar status
      setFilaImportacao(prev => 
        prev.map(x => x.id === item.id ? {...x, status: 'processando'} : x)
      );
      
      // Simular processamento
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Marcar como concluído
      setFilaImportacao(prev => 
        prev.map(x => x.id === item.id ? {...x, status: 'concluído'} : x)
      );
    }
    setProcessandoFila(false);
  };


  const exportarRelatorioPDF = () => {
    if (!relatorio) return;
    
    const element = document.createElement('div');
    element.innerHTML = `
      <div style="padding: 20px; font-family: Arial, sans-serif;">
        <h1>Relatório de Importação de Leads</h1>
        <p><strong>Data:</strong> ${new Date().toLocaleString('pt-BR')}</p>
        <p><strong>Vendedor:</strong> ${vendedor?.nome || 'N/A'}</p>
        
        <h2>Resumo</h2>
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <tr style="background-color: #f0f0f0;">
            <td style="border: 1px solid #ddd; padding: 10px;"><strong>Total de linhas</strong></td>
            <td style="border: 1px solid #ddd; padding: 10px;">${relatorio.totalLinhas}</td>
          </tr>
          <tr>
            <td style="border: 1px solid #ddd; padding: 10px;"><strong>Novos inseridos</strong></td>
            <td style="border: 1px solid #ddd; padding: 10px; color: green;">${relatorio.novosInseridos}</td>
          </tr>
          <tr style="background-color: #f0f0f0;">
            <td style="border: 1px solid #ddd; padding: 10px;"><strong>Duplicados ignorados</strong></td>
            <td style="border: 1px solid #ddd; padding: 10px; color: orange;">${relatorio.duplicadosIgnorados}</td>
          </tr>
          <tr>
            <td style="border: 1px solid #ddd; padding: 10px;"><strong>Erros</strong></td>
            <td style="border: 1px solid #ddd; padding: 10px; color: red;">${relatorio.errosTotal}</td>
          </tr>
          <tr style="background-color: #f0f0f0;">
            <td style="border: 1px solid #ddd; padding: 10px;"><strong>Taxa de sucesso</strong></td>
            <td style="border: 1px solid #ddd; padding: 10px;"><strong>${relatorio.totalLinhas > 0 ? (relatorio.novosInseridos / relatorio.totalLinhas * 100).toFixed(1) : 0}%</strong></td>
          </tr>
        </table>
      </div>
    `;
    
    const opt = {
      margin: 10,
      filename: `relatorio-importacao-${new Date().toISOString().split('T')[0]}.pdf`,
      image: { type: 'png' as const, quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { orientation: 'portrait' as const, unit: 'mm', format: 'a4' }
    };
    
    html2pdf().set(opt).from(element).save();
  };


  const registrarContato = async (leadId: number, tipo: 'whatsapp' | 'email' | 'ligacao', mensagem: string) => {
    if (!supabase || !vendedor) return;
    
    const novoContato: Contato = {
      id: Date.now(),
      lead_id: leadId,
      vendedor_id: vendedor.id,
      tipo: tipo,
      mensagem: mensagem,
      data_envio: new Date().toLocaleString('pt-BR'),
      status: 'enviado'
    };
    
    setContatos([...contatos, novoContato]);
    
    // Salvar no Supabase (opcional)
    try {
      await supabase.from('contatos').insert([{
        lead_id: leadId,
        vendedor_id: vendedor.id,
        tipo: tipo,
        mensagem: mensagem,
        status: 'enviado'
      }]);
    } catch (error) {
      console.error('Erro ao salvar contato:', error);
    }
  };


  const leadsFiltrados = leads;

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
                      setFiltros({ busca: '', uf: '', ddd: '', municipio: '', cnpj: '', email: '', telefone: '', status: '' });
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
                  {leads.map(lead => (
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
                                onClick={() => abrirWhatsAppEPegarLead(lead.telefone, lead.razao_social, lead.municipio, lead.id, lead.nome_fantasia)}
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


                </>
              )}
            </div>
          </TabsContent>

          {/* Meus Leads com CRM */}
          <TabsContent value="meus" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Lista de Leads */}
              <div className="lg:col-span-1">
                <Card>
                  <CardHeader>
                    <CardTitle>Meus Leads ({meuLeads.length})</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 max-h-96 overflow-y-auto">
                    {meuLeads.length === 0 ? (
                      <p className="text-sm text-slate-600">Nenhum lead capturado</p>
                    ) : (
                      meuLeads.map(lead => (
                        <button
                          key={lead.id}
                          onClick={() => setLeadSelecionado(lead)}
                          className={`w-full text-left p-3 rounded-lg border transition-colors ${
                            leadSelecionado?.id === lead.id
                              ? 'bg-blue-50 border-blue-300'
                              : 'bg-white border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          <p className="font-semibold text-sm">{lead.razao_social}</p>
                          <p className="text-xs text-slate-600">{lead.municipio}, {lead.uf}</p>
                          <p className="text-xs text-blue-600 mt-1">{lead.status}</p>
                        </button>
                      ))
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Detalhes do Lead Selecionado */}
              {leadSelecionado && (
                <div className="lg:col-span-2 space-y-4">
                  {/* Informações Básicas */}
                  <Card>
                    <CardHeader>
                      <CardTitle>{leadSelecionado.razao_social}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-slate-600">CNPJ</p>
                          <p className="font-semibold">{leadSelecionado.cnpj || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-slate-600">Telefone</p>
                          <p className="font-semibold">{normalizarTelefone(leadSelecionado.telefone)}</p>
                        </div>
                        <div>
                          <p className="text-slate-600">Email</p>
                          <p className="font-semibold">{leadSelecionado.email || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-slate-600">Município</p>
                          <p className="font-semibold">{leadSelecionado.municipio}, {leadSelecionado.uf}</p>
                        </div>
                        <div className="col-span-2">
                          <p className="text-slate-600">Endereço</p>
                          <p className="font-semibold">
                            {leadSelecionado.logradouro}, {leadSelecionado.numero} - {leadSelecionado.bairro}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Status e Próximo Contato */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Gerenciar Lead</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="status">Status</Label>
                        <select
                          id="status"
                          value={leadSelecionado.status}
                          onChange={(e) => {
                            const novoStatus = e.target.value;
                            setLeadSelecionado({ ...leadSelecionado, status: novoStatus });
                            // Aqui você pode adicionar lógica para salvar no banco
                          }}
                          className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm"
                        >
                          <option value="novo">Novo</option>
                          <option value="contatado">Contatado</option>
                          <option value="interessado">Interessado</option>
                          <option value="proposta">Proposta Enviada</option>
                          <option value="convertido">Convertido</option>
                          <option value="descartado">Descartado</option>
                        </select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="proxima-acao">Próximo Contato</Label>
                        <input
                          id="proxima-acao"
                          type="datetime-local"
                          value={proximaAcao}
                          onChange={(e) => setProximaAcao(e.target.value)}
                          className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm"
                        />
                      </div>

                      <Button className="w-full" variant="outline">
                        💬 Abrir WhatsApp
                      </Button>
                    </CardContent>
                  </Card>

                  {/* Notas */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Notas</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <textarea
                        value={novaNota}
                        onChange={(e) => setNovaNota(e.target.value)}
                        placeholder="Adicione uma nota sobre este lead..."
                        className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm resize-none h-24"
                      />
                      <Button className="w-full" size="sm">
                        Adicionar Nota
                      </Button>

                      {notas.length > 0 && (
                        <div className="mt-4 space-y-2 max-h-40 overflow-y-auto">
                          {notas.map(nota => (
                            <div key={nota.id} className="bg-slate-50 p-2 rounded text-sm">
                              <p className="text-slate-700">{nota.nota}</p>
                              <p className="text-xs text-slate-500 mt-1">
                                {new Date(nota.created_at).toLocaleDateString('pt-BR')}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
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

              {preview.length > 0 && (
                <Card className="border-blue-200 bg-blue-50">
                  <CardHeader>
                    <CardTitle className="text-blue-900">Preview dos Dados</CardTitle>
                    <CardDescription>Primeiras 5 linhas do arquivo</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b">
                            {preview[0] && Object.keys(preview[0]).map((col) => (
                              <th key={col} className="text-left p-2 font-semibold text-blue-900">{col}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {preview.map((row, idx) => (
                            <tr key={idx} className="border-b hover:bg-blue-100">
                              {Object.values(row).map((val: any, i) => (
                                <td key={i} className="p-2 text-slate-700">{String(val).substring(0, 30)}</td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              )}

                </CardContent>
              </Card>

              {relatorio && (
                <Card className="border-green-200 bg-green-50">
                  <CardHeader>
                    <CardTitle className="text-green-900">Relatório de Importação</CardTitle>
                  </CardHeader>
                  <div className="px-6 py-2 border-b flex gap-2">
                    <Button 
                      onClick={exportarRelatorioPDF}
                      variant="outline"
                      size="sm"
                      className="gap-2"
                    >
                      <Download className="w-4 h-4" />
                      Exportar PDF
                    </Button>
                  </div>

                  <CardContent className="space-y-2 text-sm">
                    <div className="flex justify-center">
                      <div className="w-64 h-64">
                        <Pie
                          data={{
                            labels: ['Novos', 'Duplicados', 'Erros'],
                            datasets: [{
                              data: [relatorio.novosInseridos, relatorio.duplicadosIgnorados, relatorio.errosTotal],
                              backgroundColor: ['#22c55e', '#eab308', '#ef4444'],
                              borderColor: ['#16a34a', '#ca8a04', '#dc2626'],
                              borderWidth: 2
                            }]
                          }}
                          options={{
                            responsive: true,
                            maintainAspectRatio: true,
                            plugins: {
                              legend: {
                                position: 'bottom'
                              }
                            }
                          }}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-white rounded-lg p-4">
                        <p className="text-slate-600 text-sm">Total de linhas</p>
                        <p className="text-3xl font-bold text-slate-900">{relatorio.totalLinhas}</p>
                      </div>
                      <div className="bg-white rounded-lg p-4">
                        <p className="text-slate-600 text-sm">Novos inseridos</p>
                        <p className="text-3xl font-bold text-green-700">{relatorio.novosInseridos}</p>
                      </div>
                      <div className="bg-white rounded-lg p-4">
                        <p className="text-slate-600 text-sm">Duplicados ignorados</p>
                        <p className="text-3xl font-bold text-yellow-700">{relatorio.duplicadosIgnorados}</p>
                      </div>
                      <div className="bg-white rounded-lg p-4">
                        <p className="text-slate-600 text-sm">Erros</p>
                        <p className="text-3xl font-bold text-red-700">{relatorio.errosTotal}</p>
                      </div>
                    </div>

                    <div className="bg-white rounded-lg p-4">
                      <p className="text-slate-600 text-sm mb-2">Taxa de sucesso</p>
                      <div className="w-full bg-slate-200 rounded-full h-3">
                        <div
                          className="bg-green-500 h-3 rounded-full transition-all duration-500"
                          style={{
                            width: relatorio.totalLinhas > 0 ? (relatorio.novosInseridos / relatorio.totalLinhas * 100) + '%' : '0%'
                          }}
                        />
                      </div>
                      <p className="text-right text-sm text-slate-600 mt-1">
                        {relatorio.totalLinhas > 0 ? (relatorio.novosInseridos / relatorio.totalLinhas * 100).toFixed(1) : 0}%
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}

              {filaImportacao.length > 0 && (
                <Card className="border-purple-200 bg-purple-50">
                  <CardHeader>
                    <CardTitle className="text-purple-900">Fila de Importação</CardTitle>
                    <CardDescription>{filaImportacao.length} arquivo(s) na fila</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      {filaImportacao.map((item) => (
                        <div key={item.id} className="flex items-center justify-between bg-white p-3 rounded-lg border">
                          <div className="flex-1">
                            <p className="font-medium text-slate-900">{item.arquivo.name}</p>
                            <p className="text-xs text-slate-500">{item.criado_em}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                              item.status === 'pendente' ? 'bg-yellow-100 text-yellow-800' :
                              item.status === 'processando' ? 'bg-blue-100 text-blue-800' :
                              'bg-green-100 text-green-800'
                            }`}>
                              {item.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                    <Button 
                      onClick={processarFila}
                      disabled={processandoFila || filaImportacao.every(x => x.status === 'concluído')}
                      className="w-full"
                    >
                      {processandoFila ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                      {processandoFila ? 'Processando fila...' : 'Processar Fila'}
                    </Button>
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
// Force rebuild
