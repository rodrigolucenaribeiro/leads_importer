import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { createClient } from '@supabase/supabase-js';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LogOut, Users, MessageCircle, TrendingUp, Calendar } from 'lucide-react';
import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_KEY || '';

const supabase = SUPABASE_URL && SUPABASE_KEY 
  ? createClient(SUPABASE_URL, SUPABASE_KEY)
  : null;

interface VendedorStats {
  id: string;
  nome: string;
  email: string;
  total_leads_reivindicados: number;
  total_mensagens_enviadas: number;
  ultimo_acesso: string;
  is_admin: boolean;
}

interface PeriodoFiltro {
  label: string;
  dias: number;
}

const periodos: PeriodoFiltro[] = [
  { label: 'Hoje', dias: 1 },
  { label: 'Última Semana', dias: 7 },
  { label: 'Último Mês', dias: 30 },
  { label: 'Todos', dias: 9999 }
];

export default function AdminDashboard() {
  const [, setLocation] = useLocation();
  const [vendedores, setVendedores] = useState<VendedorStats[]>([]);
  const [periodoSelecionado, setPeriodoSelecionado] = useState<PeriodoFiltro>(periodos[2]); // Último Mês
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    verificarAdmin();
    carregarEstatisticas();
  }, [periodoSelecionado]);

  const verificarAdmin = async () => {
    if (!supabase) {
      setLocation('/login');
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setLocation('/login');
        return;
      }

      // Verificar se é admin
      const { data: vendedor } = await supabase
        .from('vendedores')
        .select('is_admin')
        .eq('id', user.id)
        .single();

      if (!vendedor?.is_admin) {
        setLocation('/dashboard');
        return;
      }
    } catch (err) {
      console.error('Erro ao verificar admin:', err);
      setLocation('/login');
    }
  };

  const carregarEstatisticas = async () => {
    if (!supabase) return;

    setCarregando(true);
    try {
      const dataLimite = new Date();
      dataLimite.setDate(dataLimite.getDate() - periodoSelecionado.dias);

      // Buscar todos os vendedores
      const { data: vendedoresData } = await supabase
        .from('vendedores')
        .select('*')
        .order('nome');

      if (!vendedoresData) {
        setVendedores([]);
        return;
      }

      // Para cada vendedor, buscar estatísticas
      const stats = await Promise.all(
        vendedoresData.map(async (v) => {
          // Contar leads reivindicados
          const { count: leadsCount } = await supabase
            .from('leads')
            .select('*', { count: 'exact', head: true })
            .eq('claimed_by', v.id)
            .gte('claimed_at', periodoSelecionado.dias === 9999 ? '2000-01-01' : dataLimite.toISOString());

          // Contar mensagens enviadas
          const { count: mensagensCount } = await supabase
            .from('contatos')
            .select('*', { count: 'exact', head: true })
            .eq('vendedor_id', v.id)
            .gte('data_envio', periodoSelecionado.dias === 9999 ? '2000-01-01' : dataLimite.toISOString());

          return {
            id: v.id,
            nome: v.nome,
            email: v.email,
            total_leads_reivindicados: leadsCount || 0,
            total_mensagens_enviadas: mensagensCount || 0,
            ultimo_acesso: v.updated_at || v.created_at,
            is_admin: v.is_admin
          };
        })
      );

      setVendedores(stats);
    } catch (err) {
      console.error('Erro ao carregar estatísticas:', err);
    } finally {
      setCarregando(false);
    }
  };

  const handleLogout = async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
    setLocation('/login');
  };

  const totalLeads = vendedores.reduce((sum, v) => sum + v.total_leads_reivindicados, 0);
  const totalMensagens = vendedores.reduce((sum, v) => sum + v.total_mensagens_enviadas, 0);
  const vendedoresAtivos = vendedores.filter(v => !v.is_admin).length;

  // Dados para gráfico de pizza - Top 5 vendedores por leads
  const top5Vendedores = [...vendedores]
    .filter(v => !v.is_admin)
    .sort((a, b) => b.total_leads_reivindicados - a.total_leads_reivindicados)
    .slice(0, 5);

  const chartData = {
    labels: top5Vendedores.map(v => v.nome),
    datasets: [{
      data: top5Vendedores.map(v => v.total_leads_reivindicados),
      backgroundColor: [
        'rgba(59, 130, 246, 0.8)',
        'rgba(16, 185, 129, 0.8)',
        'rgba(245, 158, 11, 0.8)',
        'rgba(239, 68, 68, 0.8)',
        'rgba(139, 92, 246, 0.8)',
      ],
      borderColor: [
        'rgba(59, 130, 246, 1)',
        'rgba(16, 185, 129, 1)',
        'rgba(245, 158, 11, 1)',
        'rgba(239, 68, 68, 1)',
        'rgba(139, 92, 246, 1)',
      ],
      borderWidth: 2
    }]
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 shadow-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Dashboard Gerencial</h1>
            <p className="text-sm text-slate-600">Vellozia Produtos Hospitalares</p>
          </div>
          <Button onClick={handleLogout} variant="outline" size="sm">
            <LogOut className="w-4 h-4 mr-2" />
            Sair
          </Button>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Filtro de Período */}
        <div className="mb-6 flex gap-2">
          {periodos.map((periodo) => (
            <Button
              key={periodo.label}
              onClick={() => setPeriodoSelecionado(periodo)}
              variant={periodoSelecionado.label === periodo.label ? 'default' : 'outline'}
              size="sm"
            >
              <Calendar className="w-4 h-4 mr-2" />
              {periodo.label}
            </Button>
          ))}
        </div>

        {/* Cards de Resumo */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Vendedores Ativos</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{vendedoresAtivos}</div>
              <p className="text-xs text-muted-foreground">
                Total de vendedores cadastrados
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Leads Reivindicados</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalLeads}</div>
              <p className="text-xs text-muted-foreground">
                {periodoSelecionado.label.toLowerCase()}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Mensagens Enviadas</CardTitle>
              <MessageCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalMensagens}</div>
              <p className="text-xs text-muted-foreground">
                {periodoSelecionado.label.toLowerCase()}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Gráfico e Tabela */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Gráfico de Pizza */}
          <Card>
            <CardHeader>
              <CardTitle>Top 5 Vendedores</CardTitle>
              <CardDescription>Por leads reivindicados ({periodoSelecionado.label.toLowerCase()})</CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center items-center" style={{ height: '300px' }}>
              {top5Vendedores.length > 0 ? (
                <Pie data={chartData} options={{ maintainAspectRatio: false }} />
              ) : (
                <p className="text-slate-500">Nenhum dado disponível</p>
              )}
            </CardContent>
          </Card>

          {/* Tabela de Vendedores */}
          <Card>
            <CardHeader>
              <CardTitle>Detalhes por Vendedor</CardTitle>
              <CardDescription>Consumo e atividade ({periodoSelecionado.label.toLowerCase()})</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-auto max-h-[300px]">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 sticky top-0">
                    <tr>
                      <th className="text-left p-2 font-medium">Vendedor</th>
                      <th className="text-center p-2 font-medium">Leads</th>
                      <th className="text-center p-2 font-medium">Mensagens</th>
                    </tr>
                  </thead>
                  <tbody>
                    {carregando ? (
                      <tr>
                        <td colSpan={3} className="text-center p-4 text-slate-500">
                          Carregando...
                        </td>
                      </tr>
                    ) : vendedores.filter(v => !v.is_admin).length === 0 ? (
                      <tr>
                        <td colSpan={3} className="text-center p-4 text-slate-500">
                          Nenhum vendedor encontrado
                        </td>
                      </tr>
                    ) : (
                      vendedores
                        .filter(v => !v.is_admin)
                        .sort((a, b) => b.total_leads_reivindicados - a.total_leads_reivindicados)
                        .map((v) => (
                          <tr key={v.id} className="border-b border-slate-100 hover:bg-slate-50">
                            <td className="p-2">
                              <div>
                                <div className="font-medium">{v.nome}</div>
                                <div className="text-xs text-slate-500">{v.email}</div>
                              </div>
                            </td>
                            <td className="text-center p-2 font-semibold">{v.total_leads_reivindicados}</td>
                            <td className="text-center p-2 font-semibold">{v.total_mensagens_enviadas}</td>
                          </tr>
                        ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
