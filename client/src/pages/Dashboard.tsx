import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LogOut, Upload, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
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
}

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const [vendedor, setVendedor] = useState<Vendedor | null>(null);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [meusLeads, setMeusLeads] = useState<Lead[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [processando, setProcessando] = useState(false);
  const [mensagem, setMensagem] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    if (!supabase) return;

    try {
      // Verificar autenticação
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
        // Se não existe, criar
        const { data: newVendedor } = await supabase
          .from('vendedores')
          .insert({
            id: user.id,
            nome: user.email?.split('@')[0] || 'Vendedor',
            email: user.email,
          })
          .select()
          .single();
        
        if (newVendedor) setVendedor(newVendedor);
      } else {
        setVendedor(vendedorData);
        setIsAdmin(vendedorData.is_admin || false);
      }

      // Carregar leads disponíveis (não pegados)
      const { data: leadsData } = await supabase
        .from('leads')
        .select('*')
        .is('claimed_by', null)
        .order('created_at', { ascending: false });

      setLeads(leadsData || []);

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

      // Recarregar dados
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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !supabase) return;

    setProcessando(true);
    setMensagem('');

    try {
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const data = XLSX.utils.sheet_to_json(worksheet);

      // Aqui você pode processar e importar os leads
      // Por enquanto, apenas mostramos uma mensagem
      setMensagem(`✓ Arquivo com ${data.length} linhas pronto para importar`);
      
      // Recarregar leads após importação
      setTimeout(() => carregarDados(), 1000);
    } catch (err) {
      setMensagem('✗ Erro ao processar arquivo');
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
            <TabsTrigger value="leads">Leads Disponíveis ({leads.length})</TabsTrigger>
            <TabsTrigger value="meus">Meus Leads ({meusLeads.length})</TabsTrigger>
            {isAdmin && <TabsTrigger value="importar">Importar</TabsTrigger>}
          </TabsList>

          {/* Leads Disponíveis */}
          <TabsContent value="leads" className="space-y-4">
            <div className="grid gap-4">
              {leads.length === 0 ? (
                <Card>
                  <CardContent className="pt-6 text-center text-slate-600">
                    Nenhum lead disponível no momento
                  </CardContent>
                </Card>
              ) : (
                leads.map(lead => (
                  <Card key={lead.id}>
                    <CardContent className="pt-6">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg">{lead.razao_social}</h3>
                          <div className="grid grid-cols-2 gap-2 mt-2 text-sm text-slate-600">
                            <div>📞 {lead.telefone}</div>
                            <div>🏢 {lead.cnpj}</div>
                            <div>📍 {lead.municipio}, {lead.uf}</div>
                          </div>
                        </div>
                        <Button 
                          onClick={() => pegarLead(lead.id)}
                          className="ml-4"
                        >
                          Pegar Lead
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
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
                  <Card key={lead.id}>
                    <CardContent className="pt-6">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg">{lead.razao_social}</h3>
                          <div className="grid grid-cols-2 gap-2 mt-2 text-sm text-slate-600">
                            <div>📞 {lead.telefone}</div>
                            <div>🏢 {lead.cnpj}</div>
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
                        <span className="text-blue-600 hover:underline">Clique para selecionar</span>
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
                    </div>

                    {processando && (
                      <div className="flex items-center gap-2 text-slate-600">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Processando arquivo...
                      </div>
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
