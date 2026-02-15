# 📊 Sistema de Importação de Leads

Um sistema web completo e inteligente para importar, deduplica e gerenciar bases de leads via arquivos XLSX.

## ✨ Características

- ✅ **Upload de XLSX** - Interface drag-and-drop para upload de arquivos
- ✅ **Deduplicação Inteligente** - Detecta duplicados por CNPJ, Telefone ou Razão Social + Cidade + UF
- ✅ **Merge Inteligente** - Atualiza apenas campos vazios, nunca sobrescreve dados
- ✅ **Nunca Deleta** - Registros existentes são sempre preservados
- ✅ **Relatório Detalhado** - Visualiza estatísticas completas da importação
- ✅ **Download de Erros** - CSV com detalhes de linhas com erro
- ✅ **Log de Auditoria** - Registra todas as importações com data, hora e usuário
- ✅ **Responsivo** - Funciona em desktop, tablet e mobile
- ✅ **Deploy Fácil** - Pronto para deploy no Netlify

## 🚀 Quick Start

### 1. Clonar o Repositório

```bash
git clone https://github.com/seu-usuario/leads_importer.git
cd leads_importer
```

### 2. Instalar Dependências

```bash
pnpm install
```

### 3. Configurar Supabase

1. Crie uma conta em https://supabase.com
2. Crie um novo projeto
3. Copie a URL e a chave anon
4. Crie um arquivo `.env.local`:

```bash
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_KEY=sua-chave-anon-aqui
```

### 4. Criar Tabelas no Supabase

Veja o arquivo [SETUP.md](./SETUP.md) para instruções detalhadas.

### 5. Iniciar o Servidor

```bash
pnpm dev
```

Acesse http://localhost:3000

## 📋 Como Usar

### 1. Preparar o Arquivo XLSX

O arquivo deve ter as seguintes colunas:
- CNPJ
- Razão Social
- Telefone
- Email (opcional)
- Logradouro (opcional)
- Número (opcional)
- Bairro (opcional)
- CEP (opcional)
- Município (opcional)
- UF (opcional)
- E outras colunas que serão importadas

### 2. Fazer Upload

1. Acesse a aplicação
2. Clique na área de upload ou arraste um arquivo
3. Selecione seu arquivo XLSX

### 3. Processar Importação

1. Clique em "Processar e Importar"
2. Aguarde o processamento
3. Visualize o relatório com estatísticas

### 4. Analisar Resultados

O relatório mostra:
- **Total de linhas** - Quantidade de linhas no arquivo
- **Novos inseridos** - Leads que não existiam no banco
- **Atualizados (Merge)** - Leads existentes que tiveram campos atualizados
- **Duplicados ignorados** - Duplicados dentro do próprio arquivo
- **Erros** - Linhas com problemas (sem telefone, dados inválidos, etc)

### 5. Download de Erros (opcional)

Se houver erros, clique em "Download CSV de Erros" para obter um arquivo com detalhes.

## 🔍 Regras de Deduplicação

O sistema detecta duplicados usando as seguintes regras (em ordem de prioridade):

### 1. CNPJ (Prioridade Alta)
Se o CNPJ já existe no banco, é considerado duplicado e será atualizado (merge).

### 2. Telefone (Prioridade Média)
Se o CNPJ está vazio ou inválido, usa o telefone normalizado para detectar duplicados.

### 3. Razão Social + Cidade + UF (Prioridade Baixa)
Fallback para casos especiais quando CNPJ e telefone não estão disponíveis.

## 🔄 Merge Inteligente

Quando um duplicado é encontrado:

✅ **Atualiza:**
- Campos vazios no lead existente
- Informações de contato (email, telefone)
- Dados de endereço
- Informações da empresa

❌ **Nunca altera:**
- `claimed_by` - Quem "pegou" o lead
- `claimed_at` - Quando foi "pego"
- `status` - Status do lead
- Histórico de contatos

## 📊 Estrutura de Dados

### Tabela `leads`

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | BIGSERIAL | ID único |
| cnpj | VARCHAR(14) | CNPJ (chave de deduplicação) |
| telefone | VARCHAR(11) | Telefone normalizado |
| razao_social | VARCHAR(255) | Razão social |
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
| claimed_by | UUID | ID do usuário que "pegou" |
| claimed_at | TIMESTAMP | Data que foi "pego" |
| status | VARCHAR(50) | Status (novo/contatado/etc) |
| created_at | TIMESTAMP | Data de criação |
| updated_at | TIMESTAMP | Data da última atualização |

### Tabela `import_logs`

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | BIGSERIAL | ID único |
| arquivo_nome | VARCHAR(255) | Nome do arquivo |
| total_linhas | INTEGER | Total de linhas |
| novos_inseridos | INTEGER | Novos leads |
| duplicados_ignorados | INTEGER | Duplicados ignorados |
| duplicados_atualizados | INTEGER | Duplicados atualizados |
| erros_total | INTEGER | Total de erros |
| tempo_processamento_ms | INTEGER | Tempo em ms |
| criado_em | TIMESTAMP | Data/hora da importação |
| criado_por | UUID | ID do usuário |
| created_at | TIMESTAMP | Data de criação |

## 🛠️ Tecnologias

- **Frontend**: React 19 + TypeScript + Tailwind CSS
- **UI Components**: shadcn/ui
- **Backend**: Supabase (PostgreSQL + REST API)
- **File Processing**: XLSX.js
- **Build**: Vite
- **Deploy**: Netlify

## 📦 Instalação Completa

### Pré-requisitos

- Node.js 18+
- pnpm (ou npm/yarn)
- Conta no Supabase
- Conta no Netlify (para deploy)

### Setup Local

```bash
# 1. Clonar
git clone https://github.com/seu-usuario/leads_importer.git
cd leads_importer

# 2. Instalar dependências
pnpm install

# 3. Configurar variáveis de ambiente
echo 'VITE_SUPABASE_URL=https://seu-projeto.supabase.co' > .env.local
echo 'VITE_SUPABASE_KEY=sua-chave-anon' >> .env.local

# 4. Criar tabelas no Supabase (ver SETUP.md)

# 5. Iniciar servidor
pnpm dev
```

## 🚀 Deploy

### Deploy no Netlify

```bash
# 1. Push para Git
git add .
git commit -m "Initial commit"
git push

# 2. Conectar no Netlify
# Acesse https://app.netlify.com
# Clique em "New site from Git"
# Selecione seu repositório
# Configure as variáveis de ambiente
# Deploy!
```

Veja [DEPLOY.md](./DEPLOY.md) para instruções detalhadas.

## 📝 Validações

- **CNPJ**: Deve ter 11+ dígitos (após normalização)
- **Telefone**: Deve ter 10-11 dígitos
- **Razão Social**: Obrigatória
- **UF**: Deve ter 2 caracteres
- **CEP**: Deve ter 8 dígitos

## 🐛 Troubleshooting

### Erro: "Supabase não configurado"
Verifique se as variáveis `VITE_SUPABASE_URL` e `VITE_SUPABASE_KEY` estão corretas.

### Erro: "Tabelas não encontradas"
Execute o script SQL no Supabase (ver SETUP.md).

### Erro: "Telefone inválido"
Verifique se o arquivo tem telefones com 10-11 dígitos.

### Erro: "CORS"
Configure CORS no Supabase (Project Settings → API → CORS).

## 📚 Documentação

- [SETUP.md](./SETUP.md) - Guia de configuração inicial
- [DEPLOY.md](./DEPLOY.md) - Guia de deploy no Netlify
- [Documentação Supabase](https://supabase.com/docs)
- [Documentação React](https://react.dev)

## 📄 Licença

MIT

## 👨‍💻 Autor

Desenvolvido com ❤️ para importação inteligente de leads.

## 🤝 Suporte

Para dúvidas ou problemas:
1. Verifique a documentação
2. Consulte os logs do navegador (F12)
3. Verifique os logs do Supabase
4. Abra uma issue no repositório

---

**Pronto para começar?** Siga o [Quick Start](#-quick-start) acima!
