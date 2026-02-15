# 🚀 Setup - Sistema de Importação de Leads

## Pré-requisitos

- Conta no Supabase (https://supabase.com)
- Node.js 18+ instalado
- npm ou pnpm

## 1. Criar Projeto no Supabase

1. Acesse https://supabase.com/dashboard
2. Clique em "New Project"
3. Preencha os dados e crie o projeto
4. Aguarde a criação (pode levar alguns minutos)

## 2. Obter Credenciais

1. No dashboard do Supabase, acesse seu projeto
2. Vá em **Project Settings** (engrenagem no canto inferior esquerdo)
3. Clique em **API** na barra lateral
4. Copie:
   - **Project URL** (ex: `https://seu-projeto.supabase.co`)
   - **anon public** (a chave que começa com `eyJ...`)

## 3. Configurar Variáveis de Ambiente

1. Na raiz do projeto, crie um arquivo `.env.local`:

```bash
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_KEY=sua-chave-anon-aqui
```

2. Substitua pelos valores copiados no passo anterior

## 4. Instalar Dependências

```bash
pnpm install
```

## 5. Criar Tabelas no Supabase

### Opção A: Automática (via SQL Editor)

1. No dashboard do Supabase, vá em **SQL Editor**
2. Clique em **New Query**
3. Cole o script SQL abaixo:

```sql
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
```

4. Clique em **Run** (ou Ctrl+Enter)
5. Pronto! As tabelas foram criadas

## 6. Iniciar o Servidor de Desenvolvimento

```bash
pnpm dev
```

O servidor será iniciado em `http://localhost:3000`

## 7. Usar o Sistema

1. Acesse http://localhost:3000
2. Selecione um arquivo XLSX com dados de leads
3. Clique em "Processar e Importar"
4. Visualize o relatório de importação

## Estrutura de Dados

### Tabela `leads`

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | BIGSERIAL | ID único |
| cnpj | VARCHAR(14) | CNPJ (chave de deduplicação primária) |
| telefone | VARCHAR(11) | Telefone normalizado (chave de deduplicação secundária) |
| razao_social | VARCHAR(255) | Razão social da empresa |
| nome_fantasia | VARCHAR(255) | Nome fantasia |
| email | VARCHAR(255) | Email |
| logradouro | VARCHAR(255) | Endereço |
| numero | VARCHAR(10) | Número |
| bairro | VARCHAR(100) | Bairro |
| cep | VARCHAR(8) | CEP |
| municipio | VARCHAR(100) | Município |
| uf | VARCHAR(2) | UF |
| data_abertura | VARCHAR(10) | Data de abertura |
| natureza_juridica | VARCHAR(255) | Natureza jurídica |
| situacao | VARCHAR(50) | Situação |
| atividade_principal | TEXT | Atividade principal |
| capital_social | VARCHAR(100) | Capital social |
| tipo | VARCHAR(50) | Tipo (MATRIZ/FILIAL) |
| claimed_by | UUID | ID do usuário que "pegou" o lead |
| claimed_at | TIMESTAMP | Data/hora que o lead foi "pego" |
| status | VARCHAR(50) | Status do lead (novo/contatado/convertido/etc) |
| created_at | TIMESTAMP | Data de criação |
| updated_at | TIMESTAMP | Data da última atualização |

### Tabela `import_logs`

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | BIGSERIAL | ID único |
| arquivo_nome | VARCHAR(255) | Nome do arquivo importado |
| total_linhas | INTEGER | Total de linhas no arquivo |
| novos_inseridos | INTEGER | Quantidade de novos leads inseridos |
| duplicados_ignorados | INTEGER | Quantidade de duplicados ignorados |
| duplicados_atualizados | INTEGER | Quantidade de duplicados atualizados (merge) |
| erros_total | INTEGER | Total de erros |
| tempo_processamento_ms | INTEGER | Tempo de processamento em ms |
| criado_em | TIMESTAMP | Data/hora da importação |
| criado_por | UUID | ID do usuário que fez a importação |
| created_at | TIMESTAMP | Data de criação do registro |

## Regras de Deduplicação

O sistema usa as seguintes regras para detectar duplicados (em ordem de prioridade):

1. **CNPJ** - Se o CNPJ já existe no banco, é considerado duplicado
2. **Telefone** - Se CNPJ está vazio, usa telefone normalizado
3. **Razão Social + Cidade + UF** - Fallback para casos especiais

## Merge Inteligente

Quando um duplicado é encontrado, o sistema faz um **merge inteligente**:

- Atualiza apenas campos vazios no lead existente
- Nunca sobrescreve dados já preenchidos
- Nunca altera `claimed_by`, `claimed_at`, `status` (campos de negócio)

## Validações

- **Telefone obrigatório**: Se não tiver CNPJ válido, o telefone é obrigatório
- **Razão Social obrigatória**: Sempre necessária
- **Normalização**: CNPJ, Telefone, UF e CEP são normalizados automaticamente

## Deploy no Netlify

1. Faça commit e push do código para um repositório Git
2. Acesse https://app.netlify.com
3. Clique em "New site from Git"
4. Selecione seu repositório
5. Configure as variáveis de ambiente:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_KEY`
6. Clique em "Deploy"

## Troubleshooting

### Erro: "Supabase não configurado"

- Verifique se as variáveis `VITE_SUPABASE_URL` e `VITE_SUPABASE_KEY` estão corretas
- Reinicie o servidor de desenvolvimento

### Erro: "Tabelas não encontradas"

- Verifique se o script SQL foi executado com sucesso
- Acesse SQL Editor no Supabase e verifique se as tabelas existem

### Erro: "Telefone inválido"

- O telefone deve ter entre 10 e 11 dígitos
- Verifique se o arquivo XLSX tem telefones válidos

## Suporte

Para mais informações, consulte:
- [Documentação do Supabase](https://supabase.com/docs)
- [Documentação do React](https://react.dev)
- [Documentação do Tailwind CSS](https://tailwindcss.com)
