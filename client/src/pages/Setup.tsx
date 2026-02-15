import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

/**
 * Página de Setup para criar tabelas no Supabase
 */

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_KEY || '';

const supabase = SUPABASE_URL && SUPABASE_KEY 
  ? createClient(SUPABASE_URL, SUPABASE_KEY)
  : null;

export default function Setup() {
  const [carregando, setCarregando] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [mensagem, setMensagem] = useState('');

  const criarTabelas = async () => {
    if (!supabase) {
      setStatus('error');
      setMensagem('Supabase não configurado');
      return;
    }

    setCarregando(true);
    setStatus('idle');

    try {
      // Script SQL para criar tabelas
      const sqlScript = `
-- Criar tabela de leads
CREATE TABLE IF NOT EXISTS leads (
  id BIGSERIAL PRIMARY KEY,
  cnpj VARCHAR(14) UNIQUE,
  telefone VARCHAR(11) UNIQUE,
  razao_social VARCHAR(255) NOT NULL,
  nome_fantasia VARCHAR(255),
  email VARCHAR(255),
  logradouro VARCHAR(255),
  numero VARCHAR(10),
  bairro VARCHAR(100),
  cep VARCHAR(8),
  municipio VARCHAR(100),
  uf VARCHAR(2),
  data_abertura VARCHAR(10),
  natureza_juridica VARCHAR(255),
  situacao VARCHAR(50),
  atividade_principal TEXT,
  capital_social VARCHAR(100),
  tipo VARCHAR(50),
  claimed_by UUID,
  claimed_at TIMESTAMP,
  status VARCHAR(50) DEFAULT 'novo',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_leads_cnpj ON leads(cnpj);
CREATE INDEX IF NOT EXISTS idx_leads_telefone ON leads(telefone);
CREATE INDEX IF NOT EXISTS idx_leads_razao_social ON leads(razao_social);
CREATE INDEX IF NOT EXISTS idx_leads_municipio_uf ON leads(municipio, uf);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_claimed_by ON leads(claimed_by);

CREATE TABLE IF NOT EXISTS import_logs (
  id BIGSERIAL PRIMARY KEY,
  arquivo_nome VARCHAR(255) NOT NULL,
  total_linhas INTEGER NOT NULL,
  novos_inseridos INTEGER NOT NULL,
  duplicados_ignorados INTEGER NOT NULL,
  duplicados_atualizados INTEGER NOT NULL,
  erros_total INTEGER NOT NULL,
  tempo_processamento_ms INTEGER NOT NULL,
  criado_em TIMESTAMP NOT NULL,
  criado_por UUID,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_import_logs_criado_em ON import_logs(criado_em);

ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE import_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read on leads" ON leads
  FOR SELECT USING (true);

CREATE POLICY "Allow public read on import_logs" ON import_logs
  FOR SELECT USING (true);
      `;

      // Tentar executar via RPC (se disponível) ou via REST
      const { error } = await supabase.rpc('exec_sql', { sql: sqlScript });

      if (error && error.code !== 'PGRST108') { // PGRST108 = function not found
        throw error;
      }

      setStatus('success');
      setMensagem('✓ Tabelas criadas com sucesso! Você pode agora usar o sistema de importação.');
    } catch (error) {
      console.error('Erro ao criar tabelas:', error);
      setStatus('error');
      setMensagem(`Erro: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    } finally {
      setCarregando(false);
    }
  };

  if (!supabase) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
        <div className="max-w-2xl mx-auto">
          <Card className="border-red-200 bg-red-50">
            <CardHeader>
              <CardTitle className="text-red-900">Configuração Necessária</CardTitle>
            </CardHeader>
            <CardContent className="text-red-800">
              <p>Você precisa configurar as variáveis de ambiente do Supabase:</p>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li><code className="bg-red-100 px-2 py-1 rounded">VITE_SUPABASE_URL</code></li>
                <li><code className="bg-red-100 px-2 py-1 rounded">VITE_SUPABASE_KEY</code></li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-2xl mx-auto px-6 py-12">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Configuração Inicial</CardTitle>
            <CardDescription>
              Crie as tabelas necessárias no Supabase para começar a usar o sistema
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-blue-900 text-sm">
                Este é o primeiro acesso ao sistema. Você precisa criar as tabelas de banco de dados antes de começar a importar leads.
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="font-semibold text-slate-900">O que será criado:</h3>
              <ul className="space-y-2 text-sm text-slate-600">
                <li className="flex items-start gap-2">
                  <span className="text-green-600 font-bold">✓</span>
                  <span><strong>Tabela leads</strong> - Armazena dados dos leads importados</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 font-bold">✓</span>
                  <span><strong>Tabela import_logs</strong> - Registra histórico de importações</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 font-bold">✓</span>
                  <span><strong>Índices</strong> - Para melhor performance nas buscas</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 font-bold">✓</span>
                  <span><strong>Políticas RLS</strong> - Para segurança dos dados</span>
                </li>
              </ul>
            </div>

            {status === 'success' && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-green-900">{mensagem}</p>
                </div>
              </div>
            )}

            {status === 'error' && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-red-900">{mensagem}</p>
                  <p className="text-sm text-red-800 mt-1">
                    Se o erro persistir, crie as tabelas manualmente no SQL Editor do Supabase.
                  </p>
                </div>
              </div>
            )}

            <Button
              onClick={criarTabelas}
              disabled={carregando || status === 'success'}
              className="w-full h-11 text-base font-medium"
            >
              {carregando ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Criando tabelas...
                </>
              ) : status === 'success' ? (
                <>
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Tabelas criadas com sucesso
                </>
              ) : (
                'Criar Tabelas'
              )}
            </Button>

            {status === 'success' && (
              <Button
                onClick={() => window.location.href = '/'}
                variant="outline"
                className="w-full"
              >
                Ir para Importação de Leads
              </Button>
            )}
          </CardContent>
        </Card>

        <div className="mt-8 text-center text-sm text-slate-600">
          <p>Precisa de ajuda? Consulte a documentação do Supabase</p>
        </div>
      </div>
    </div>
  );
}
