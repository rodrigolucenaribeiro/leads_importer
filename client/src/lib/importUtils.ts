/**
 * Utilitários para importação de leads via XLSX
 * - Leitura de arquivos Excel
 * - Normalização de dados (CNPJ, Telefone, UF)
 * - Deduplicação inteligente (CNPJ → Telefone → Razão Social + Cidade + UF)
 * - Merge de dados (atualizar campos vazios)
 */

export interface RawLeadData {
  [key: string]: any;
}

export interface NormalizedLead {
  cnpj: string | null;
  telefone: string | null;
  razao_social: string;
  nome_fantasia: string | null;
  email: string | null;
  logradouro: string | null;
  numero: string | null;
  bairro: string | null;
  cep: string | null;
  municipio: string | null;
  uf: string | null;
  data_abertura: string | null;
  natureza_juridica: string | null;
  situacao: string | null;
  atividade_principal: string | null;
  capital_social: string | null;
  tipo: string | null;
  [key: string]: any;
}

export interface ImportReport {
  total_linhas: number;
  novos_inseridos: number;
  duplicados_ignorados: number;
  duplicados_atualizados: number;
  erros_total: number;
  erros_detalhes: ErrorDetail[];
  tempo_processamento_ms: number;
}

export interface ErrorDetail {
  linha: number;
  razao: string;
  dados?: RawLeadData;
}

/**
 * Normaliza CNPJ removendo caracteres especiais
 */
export function normalizarCNPJ(cnpj: any): string | null {
  if (!cnpj) return null;
  const limpo = String(cnpj).replace(/\D/g, '');
  return limpo.length >= 11 ? limpo : null;
}

/**
 * Normaliza telefone removendo caracteres especiais
 * Valida se tem pelo menos 10 dígitos (DDD + número)
 */
export function normalizarTelefone(telefone: any): string | null {
  if (!telefone) return null;
  const limpo = String(telefone).replace(/\D/g, '');
  // Válido se tiver 10 ou 11 dígitos (DDD + número)
  return limpo.length >= 10 && limpo.length <= 11 ? limpo : null;
}

/**
 * Normaliza UF para uppercase
 */
export function normalizarUF(uf: any): string | null {
  if (!uf) return null;
  const normalizado = String(uf).toUpperCase().trim();
  return normalizado.length === 2 ? normalizado : null;
}

/**
 * Normaliza string removendo espaços extras
 */
export function normalizarString(str: any): string | null {
  if (!str) return null;
  return String(str).trim() || null;
}

/**
 * Normaliza CEP removendo caracteres especiais
 */
export function normalizarCEP(cep: any): string | null {
  if (!cep) return null;
  const limpo = String(cep).replace(/\D/g, '');
  return limpo.length === 8 ? limpo : null;
}

/**
 * Converte linha do Excel para lead normalizado
 */
export function normalizarLead(row: RawLeadData, linhaNumero: number): { lead: NormalizedLead | null; erro: ErrorDetail | null } {
  try {
    const cnpj = normalizarCNPJ(row.CNPJ);
    const telefone = normalizarTelefone(row.Telefone);
    const razao_social = normalizarString(row['Razão Social']);

    // Validações obrigatórias
    if (!razao_social) {
      return {
        lead: null,
        erro: {
          linha: linhaNumero,
          razao: 'Razão Social vazia',
          dados: row,
        },
      };
    }

    // Se não tem CNPJ e não tem telefone válido, rejeita
    if (!cnpj && !telefone) {
      return {
        lead: null,
        erro: {
          linha: linhaNumero,
          razao: 'CNPJ e Telefone vazios ou inválidos',
          dados: row,
        },
      };
    }

    const lead: NormalizedLead = {
      cnpj,
      telefone,
      razao_social,
      nome_fantasia: normalizarString(row['Nome Fantasia']),
      email: normalizarString(row.Email),
      logradouro: normalizarString(row.Logradouro),
      numero: normalizarString(row.Número),
      bairro: normalizarString(row.Bairro),
      cep: normalizarCEP(row.CEP),
      municipio: normalizarString(row.Município),
      uf: normalizarUF(row.UF),
      data_abertura: normalizarString(row['Data de Abertura']),
      natureza_juridica: normalizarString(row['Natureza Jurídica']),
      situacao: normalizarString(row.Situação),
      atividade_principal: normalizarString(row['Atividade Principal']),
      capital_social: normalizarString(row['Capital Social']),
      tipo: normalizarString(row.Tipo),
    };

    return { lead, erro: null };
  } catch (error) {
    return {
      lead: null,
      erro: {
        linha: linhaNumero,
        razao: `Erro ao processar linha: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
        dados: row,
      },
    };
  }
}

/**
 * Gera chave de deduplicação com base em CNPJ, Telefone ou Razão Social + Cidade + UF
 */
export function gerarChaveDeduplicacao(lead: NormalizedLead): {
  chave: string;
  tipo: 'cnpj' | 'telefone' | 'razao_social_cidade_uf';
} {
  // Prioridade 1: CNPJ
  if (lead.cnpj) {
    return { chave: `cnpj:${lead.cnpj}`, tipo: 'cnpj' };
  }

  // Prioridade 2: Telefone
  if (lead.telefone) {
    return { chave: `telefone:${lead.telefone}`, tipo: 'telefone' };
  }

  // Prioridade 3: Razão Social + Cidade + UF (fallback)
  const razao = lead.razao_social?.toUpperCase().trim() || '';
  const cidade = lead.municipio?.toUpperCase().trim() || '';
  const uf = lead.uf || '';
  return {
    chave: `razao_cidade_uf:${razao}|${cidade}|${uf}`,
    tipo: 'razao_social_cidade_uf',
  };
}

/**
 * Faz merge inteligente entre lead existente e novo
 * Atualiza apenas campos vazios no lead existente
 */
export function fazerMerge(
  leadExistente: NormalizedLead,
  leadNovo: NormalizedLead
): NormalizedLead {
  const merged = { ...leadExistente };

  // Campos que podem ser atualizados (se vazios no existente)
  const camposAtualizaveis: (keyof NormalizedLead)[] = [
    'nome_fantasia',
    'email',
    'logradouro',
    'numero',
    'bairro',
    'cep',
    'municipio',
    'uf',
    'natureza_juridica',
    'situacao',
    'atividade_principal',
    'capital_social',
    'tipo',
    'data_abertura',
  ];

  for (const campo of camposAtualizaveis) {
    // Se campo está vazio no existente e preenchido no novo, atualiza
    if (!merged[campo] && leadNovo[campo]) {
      merged[campo] = leadNovo[campo];
    }
  }

  // Nunca atualiza CNPJ e Telefone (chaves de deduplicação)
  // Nunca atualiza claimed_by, claimed_at, status, histórico (campos de negócio)

  return merged;
}

/**
 * Lê arquivo XLSX e retorna array de dados brutos
 */
export async function lerArquivoXLSX(file: File): Promise<RawLeadData[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        const bstr = event.target?.result as string;
        // @ts-ignore - XLSX é carregado globalmente via CDN
        const wb = (window as any).XLSX.read(bstr, { type: 'binary' });
        // @ts-ignore
        const ws = wb.Sheets[wb.SheetNames[0]];
        // @ts-ignore
        const dados = (window as any).XLSX.utils.sheet_to_json(ws);
        resolve(dados);
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = () => {
      reject(new Error('Erro ao ler arquivo'));
    };

    reader.readAsBinaryString(file);
  });
}

/**
 * Gera CSV com erros de importação
 */
export function gerarCSVErros(erros: ErrorDetail[]): string {
  if (erros.length === 0) return '';

  const headers = ['Linha', 'Razão do Erro', 'Dados'];
  const rows = erros.map((erro) => [
    erro.linha,
    erro.razao,
    erro.dados ? JSON.stringify(erro.dados) : '',
  ]);

  const csv = [
    headers.join(','),
    ...rows.map((row) =>
      row
        .map((cell) => `"${String(cell).replace(/"/g, '""')}"`)
        .join(',')
    ),
  ].join('\n');

  return csv;
}

/**
 * Faz download de arquivo CSV
 */
export function downloadCSV(conteudo: string, nomeArquivo: string): void {
  const blob = new Blob([conteudo], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', nomeArquivo);
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
