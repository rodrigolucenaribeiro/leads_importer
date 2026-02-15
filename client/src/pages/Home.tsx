import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, CheckCircle2, AlertCircle, FileText, Loader2 } from 'lucide-react';
import { lerArquivoXLSX, normalizarLead, gerarChaveDeduplicacao, fazerMerge, gerarCSVErros, downloadCSV, ImportReport, ErrorDetail } from '@/lib/importUtils';
import { createClient } from '@supabase/supabase-js';

/**
 * Design: Sistema de Importação de Leads
 * - Layout: Sidebar + Main content (admin panel style)
 * - Cores: Azul profissional (#2563EB) com neutros
 * - Tipografia: Títulos em bold, corpo em regular
 * - Interações: Upload drag-and-drop, relatório detalhado, download de erros
 */

// Inicializar Supabase (você precisa adicionar as credenciais)
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_KEY || '';

const supabase = SUPABASE_URL && SUPABASE_KEY 
  ? createClient(SUPABASE_URL, SUPABASE_KEY)
  : null;

export default function Home() {
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [carregando, setCarregando] = useState(false);
  const [relatorio, setRelatorio] = useState<ImportReport | null>(null);
  const [erros, setErros] = useState<ErrorDetail[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleArquivoSelecionado = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.name.endsWith('.xlsx')) {
      setArquivo(file);
    } else {
      alert('Por favor, selecione um arquivo .xlsx válido');
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.currentTarget.classList.add('border-blue-500', 'bg-blue-50');
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.currentTarget.classList.remove('border-blue-500', 'bg-blue-50');
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.currentTarget.classList.remove('border-blue-500', 'bg-blue-50');
    const file = e.dataTransfer.files?.[0];
    if (file && file.name.endsWith('.xlsx')) {
      setArquivo(file);
    }
  };

  const processarImportacao = async () => {
    if (!arquivo || !supabase) {
      alert('Arquivo não selecionado ou Supabase não configurado');
      return;
    }

    setCarregando(true);
    const inicioProcessamento = Date.now();
    const errosProcessamento: ErrorDetail[] = [];
    let novosInseridos = 0;
    let duplicadosIgnorados = 0;
    let duplicadosAtualizados = 0;

    try {
      // 1. Ler arquivo XLSX
      const dadosRaw = await lerArquivoXLSX(arquivo);

      // 2. Normalizar dados
      const leadsNormalizados = [];
      for (let i = 0; i < dadosRaw.length; i++) {
        const { lead, erro } = normalizarLead(dadosRaw[i], i + 2); // +2 porque linha 1 é header
        if (erro) {
          errosProcessamento.push(erro);
        } else if (lead) {
          leadsNormalizados.push(lead);
        }
      }

      // 3. Processar cada lead normalizado
      const chavesDuplicadas = new Map();

      for (const leadNovo of leadsNormalizados) {
        const { chave, tipo } = gerarChaveDeduplicacao(leadNovo);

        // Verificar se já foi processado neste lote
        if (chavesDuplicadas.has(chave)) {
          duplicadosIgnorados++;
          continue;
        }

        // Buscar no banco se já existe
        let leadExistente = null;

        if (tipo === 'cnpj' && leadNovo.cnpj) {
          const { data } = await supabase
            .from('leads')
            .select('*')
            .eq('cnpj', leadNovo.cnpj)
            .single();
          leadExistente = data;
        } else if (tipo === 'telefone' && leadNovo.telefone) {
          const { data } = await supabase
            .from('leads')
            .select('*')
            .eq('telefone', leadNovo.telefone)
            .single();
          leadExistente = data;
        } else if (tipo === 'razao_social_cidade_uf') {
          const { data } = await supabase
            .from('leads')
            .select('*')
            .eq('razao_social', leadNovo.razao_social)
            .eq('municipio', leadNovo.municipio)
            .eq('uf', leadNovo.uf)
            .single();
          leadExistente = data;
        }

        if (leadExistente) {
          // Fazer merge
          const leadMerged = fazerMerge(leadExistente, leadNovo);
          await supabase
            .from('leads')
            .update(leadMerged)
            .eq('id', leadExistente.id);
          duplicadosAtualizados++;
        } else {
          // Inserir novo
          await supabase
            .from('leads')
            .insert([leadNovo]);
          novosInseridos++;
        }

        chavesDuplicadas.set(chave, true);
      }

      // 4. Registrar importação no log de auditoria
      await supabase
        .from('import_logs')
        .insert([
          {
            arquivo_nome: arquivo.name,
            total_linhas: dadosRaw.length,
            novos_inseridos: novosInseridos,
            duplicados_ignorados: duplicadosIgnorados,
            duplicados_atualizados: duplicadosAtualizados,
            erros_total: errosProcessamento.length,
            tempo_processamento_ms: Date.now() - inicioProcessamento,
            criado_em: new Date().toISOString(),
          },
        ]);

      // 5. Gerar relatório
      const relatorioFinal: ImportReport = {
        total_linhas: dadosRaw.length,
        novos_inseridos: novosInseridos,
        duplicados_ignorados: duplicadosIgnorados,
        duplicados_atualizados: duplicadosAtualizados,
        erros_total: errosProcessamento.length,
        erros_detalhes: errosProcessamento,
        tempo_processamento_ms: Date.now() - inicioProcessamento,
      };

      setRelatorio(relatorioFinal);
      setErros(errosProcessamento);
      setArquivo(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (error) {
      alert(`Erro ao processar importação: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
      console.error(error);
    } finally {
      setCarregando(false);
    }
  };

  const downloadErros = () => {
    if (erros.length === 0) return;
    const csv = gerarCSVErros(erros);
    downloadCSV(csv, `erros-importacao-${new Date().toISOString().split('T')[0]}.csv`);
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
              <p className="mt-4 text-sm">Veja o arquivo .env.example para mais informações.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-6xl mx-auto px-6 py-6">
          <h1 className="text-3xl font-bold text-slate-900">Importador de Leads</h1>
          <p className="text-slate-600 mt-1">Sistema inteligente de importação com deduplicação automática</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Upload Section */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="w-5 h-5" />
                  Selecionar Arquivo
                </CardTitle>
                <CardDescription>
                  Faça upload de um arquivo .xlsx com os dados dos leads
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Drag and Drop Area */}
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className="border-2 border-dashed border-slate-300 rounded-lg p-12 text-center hover:border-blue-500 transition-colors cursor-pointer bg-slate-50"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                  <p className="text-slate-700 font-medium mb-1">
                    Clique ou arraste um arquivo aqui
                  </p>
                  <p className="text-slate-500 text-sm">
                    Apenas arquivos .xlsx são aceitos
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx"
                    onChange={handleArquivoSelecionado}
                    className="hidden"
                  />
                </div>

                {/* Arquivo Selecionado */}
                {arquivo && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center gap-3">
                    <FileText className="w-5 h-5 text-blue-600" />
                    <div>
                      <p className="font-medium text-blue-900">{arquivo.name}</p>
                      <p className="text-sm text-blue-700">
                        {(arquivo.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                )}

                {/* Botão Processar */}
                <Button
                  onClick={processarImportacao}
                  disabled={!arquivo || carregando}
                  className="w-full h-11 text-base font-medium"
                >
                  {carregando ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Processando...
                    </>
                  ) : (
                    'Processar e Importar'
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Info Panel */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Regras de Deduplicação</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div>
                  <p className="font-medium text-slate-900">1. CNPJ</p>
                  <p className="text-slate-600">Se encontrado, atualiza dados vazios</p>
                </div>
                <div>
                  <p className="font-medium text-slate-900">2. Telefone</p>
                  <p className="text-slate-600">Se CNPJ vazio, usa telefone normalizado</p>
                </div>
                <div>
                  <p className="font-medium text-slate-900">3. Razão Social + Cidade + UF</p>
                  <p className="text-slate-600">Fallback para casos especiais</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Informações</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-slate-600">
                <p>✓ Nunca deleta registros existentes</p>
                <p>✓ Merge inteligente de dados</p>
                <p>✓ Relatório detalhado</p>
                <p>✓ Log de auditoria</p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Relatório */}
        {relatorio && (
          <div className="mt-8 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                  Relatório da Importação
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <div className="bg-slate-50 p-4 rounded-lg">
                    <p className="text-slate-600 text-sm font-medium">Total de Linhas</p>
                    <p className="text-2xl font-bold text-slate-900 mt-1">
                      {relatorio.total_linhas}
                    </p>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <p className="text-green-700 text-sm font-medium">Novos Inseridos</p>
                    <p className="text-2xl font-bold text-green-700 mt-1">
                      {relatorio.novos_inseridos}
                    </p>
                  </div>
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <p className="text-blue-700 text-sm font-medium">Atualizados (Merge)</p>
                    <p className="text-2xl font-bold text-blue-700 mt-1">
                      {relatorio.duplicados_atualizados}
                    </p>
                  </div>
                  <div className="bg-yellow-50 p-4 rounded-lg">
                    <p className="text-yellow-700 text-sm font-medium">Duplicados Ignorados</p>
                    <p className="text-2xl font-bold text-yellow-700 mt-1">
                      {relatorio.duplicados_ignorados}
                    </p>
                  </div>
                  <div className="bg-red-50 p-4 rounded-lg">
                    <p className="text-red-700 text-sm font-medium">Erros</p>
                    <p className="text-2xl font-bold text-red-700 mt-1">
                      {relatorio.erros_total}
                    </p>
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t border-slate-200">
                  <p className="text-sm text-slate-600">
                    Tempo de processamento: <span className="font-medium">{relatorio.tempo_processamento_ms}ms</span>
                  </p>
                </div>

                {relatorio.erros_total > 0 && (
                  <Button
                    onClick={downloadErros}
                    variant="outline"
                    className="mt-6 w-full"
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    Download CSV de Erros
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Erros Detalhados */}
            {erros.length > 0 && (
              <Card className="border-red-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-red-900">
                    <AlertCircle className="w-5 h-5" />
                    Erros Encontrados ({erros.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {erros.slice(0, 10).map((erro, idx) => (
                      <div key={idx} className="bg-red-50 p-3 rounded border border-red-200">
                        <p className="text-sm font-medium text-red-900">
                          Linha {erro.linha}: {erro.razao}
                        </p>
                      </div>
                    ))}
                    {erros.length > 10 && (
                      <p className="text-sm text-slate-600 text-center py-2">
                        ... e mais {erros.length - 10} erros (veja o CSV completo)
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Reset Button */}
            <Button
              onClick={() => {
                setRelatorio(null);
                setErros([]);
              }}
              variant="outline"
              className="w-full"
            >
              Nova Importação
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
