# 📖 Guia Completo - Sistema de Importação de Leads

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Como Usar](#como-usar)
3. [Estrutura de Dados](#estrutura-de-dados)
4. [Regras de Deduplicação](#regras-de-deduplicação)
5. [Troubleshooting](#troubleshooting)
6. [Próximas Melhorias](#próximas-melhorias)

---

## 🎯 Visão Geral

O **Sistema de Importação de Leads** é uma aplicação web que permite:

- ✅ Importar bases de leads via arquivos XLSX
- ✅ Deduplica automaticamente usando CNPJ, Telefone ou Razão Social
- ✅ Faz merge inteligente (atualiza apenas campos vazios)
- ✅ Nunca deleta registros existentes
- ✅ Gera relatório detalhado com estatísticas
- ✅ Permite download de CSV com erros
- ✅ Mantém log de auditoria de todas as importações

---

## 🚀 Como Usar

### 1. Acessar a Aplicação

Acesse a URL do seu site no Netlify (ex: `https://seu-site-aleatorio.netlify.app`)

### 2. Preparar o Arquivo XLSX

O arquivo deve conter as seguintes colunas:

| Coluna | Obrigatória | Descrição |
|--------|-------------|-----------|
| CNPJ | Não* | CNPJ da empresa (chave de deduplicação) |
| Razão Social | Sim | Nome da empresa |
| Telefone | Não* | Telefone da empresa (chave de deduplicação) |
| Email | Não | Email para contato |
| Logradouro | Não | Endereço |
| Número | Não | Número do endereço |
| Bairro | Não | Bairro |
| CEP | Não | CEP (8 dígitos) |
| Município | Não | Cidade |
| UF | Não | Estado (2 letras) |
| Data Abertura | Não | Data de abertura da empresa |
| Natureza Jurídica | Não | Tipo de empresa |
| Situação | Não | Situação cadastral |
| Atividade Principal | Não | Descrição da atividade |
| Capital Social | Não | Capital social |
| Tipo | Não | MATRIZ ou FILIAL |

*Pelo menos um de CNPJ ou Telefone deve estar preenchido

### 3. Fazer Upload

1. Clique na área de upload ou arraste o arquivo
2. Selecione seu arquivo XLSX
3. Clique em **"Processar e Importar"**

### 4. Acompanhar o Processamento

O sistema mostrará:
- Barra de progresso
- Quantidade de linhas processadas
- Status atual

### 5. Visualizar Relatório

Após o processamento, você verá:

**Estatísticas:**
- Total de linhas no arquivo
- Novos leads inseridos
- Leads atualizados (merge)
- Duplicados ignorados
- Erros encontrados

**Ações:**
- Download do CSV com erros (se houver)
- Visualizar detalhes de cada erro

---

## 📊 Estrutura de Dados

### Tabela: `leads`

Armazena todos os leads importados.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | BIGSERIAL | ID único do lead |
| cnpj | VARCHAR(14) | CNPJ (único, chave de deduplicação) |
| telefone | VARCHAR(11) | Telefone normalizado (único, chave de deduplicação) |
| razao_social | VARCHAR(255) | Razão social da empresa |
| nome_fantasia | VARCHAR(255) | Nome fantasia |
| email | VARCHAR(255) | Email para contato |
| logradouro | VARCHAR(255) | Endereço |
| numero | VARCHAR(10) | Número do endereço |
| bairro | VARCHAR(100) | Bairro |
| cep | VARCHAR(8) | CEP (8 dígitos) |
| municipio | VARCHAR(100) | Município |
| uf | VARCHAR(2) | UF (2 letras) |
| data_abertura | VARCHAR(10) | Data de abertura |
| natureza_juridica | VARCHAR(255) | Natureza jurídica |
| situacao | VARCHAR(50) | Situação cadastral |
| atividade_principal | TEXT | Atividade principal |
| capital_social | VARCHAR(100) | Capital social |
| tipo | VARCHAR(50) | MATRIZ ou FILIAL |
| claimed_by | UUID | ID do usuário que "pegou" o lead |
| claimed_at | TIMESTAMP | Data/hora que foi "pego" |
| status | VARCHAR(50) | Status (novo/contatado/convertido/etc) |
| created_at | TIMESTAMP | Data de criação |
| updated_at | TIMESTAMP | Data da última atualização |

### Tabela: `import_logs`

Registra histórico de todas as importações.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | BIGSERIAL | ID único do log |
| arquivo_nome | VARCHAR(255) | Nome do arquivo importado |
| total_linhas | INTEGER | Total de linhas no arquivo |
| novos_inseridos | INTEGER | Quantidade de novos leads |
| duplicados_ignorados | INTEGER | Duplicados dentro do arquivo |
| duplicados_atualizados | INTEGER | Duplicados que foram atualizados |
| erros_total | INTEGER | Total de erros |
| tempo_processamento_ms | INTEGER | Tempo em milissegundos |
| criado_em | TIMESTAMP | Data/hora da importação |
| criado_por | UUID | ID do usuário que fez a importação |
| created_at | TIMESTAMP | Data de criação do registro |

---

## 🔍 Regras de Deduplicação

O sistema detecta duplicados usando estas regras em ordem de prioridade:

### 1. CNPJ (Prioridade Alta)

Se o CNPJ já existe no banco de dados, é considerado **duplicado**.

**Exemplo:**
- Arquivo: CNPJ `12345678000190`
- Banco: Já existe `12345678000190`
- **Resultado**: Merge inteligente (atualiza campos vazios)

### 2. Telefone (Prioridade Média)

Se o CNPJ está vazio ou inválido, usa o **telefone normalizado**.

**Normalização:**
- Remove caracteres especiais: `(11) 99999-9999` → `11999999999`
- Valida: Deve ter 10-11 dígitos
- Único no banco de dados

**Exemplo:**
- Arquivo: Telefone `11 99999-9999`
- Banco: Já existe `11999999999`
- **Resultado**: Merge inteligente

### 3. Razão Social + Cidade + UF (Prioridade Baixa)

Fallback para casos especiais quando CNPJ e telefone não estão disponíveis.

**Exemplo:**
- Arquivo: `Empresa XYZ` em `São Paulo, SP`
- Banco: Já existe `Empresa XYZ` em `São Paulo, SP`
- **Resultado**: Merge inteligente

---

## 🔄 Merge Inteligente

Quando um duplicado é encontrado, o sistema faz um **merge inteligente**:

### ✅ Atualiza:
- Campos vazios no lead existente
- Email (se vazio)
- Telefone (se vazio)
- Endereço (se vazio)
- Dados da empresa (se vazios)

### ❌ Nunca Altera:
- `claimed_by` - Quem "pegou" o lead
- `claimed_at` - Quando foi "pego"
- `status` - Status do lead (novo/contatado/etc)
- Histórico de contatos
- Qualquer campo já preenchido

**Objetivo**: Enriquecer dados sem perder informações importantes ou histórico de negócio.

---

## 📥 Validações

O sistema valida cada linha durante a importação:

| Validação | Regra | Erro |
|-----------|-------|------|
| Razão Social | Obrigatória | "Razão social vazia" |
| CNPJ | 11+ dígitos (se preenchido) | "CNPJ inválido" |
| Telefone | 10-11 dígitos (se preenchido) | "Telefone inválido" |
| UF | 2 caracteres (se preenchido) | "UF inválida" |
| CEP | 8 dígitos (se preenchido) | "CEP inválido" |
| Duplicado dentro do arquivo | Primeira ocorrência é mantida | "Duplicado no arquivo" |

---

## 📊 Relatório de Importação

Após cada importação, você recebe um relatório com:

### Estatísticas Gerais
- **Total de linhas**: Quantidade de linhas no arquivo
- **Novos inseridos**: Leads que não existiam no banco
- **Atualizados (Merge)**: Leads existentes que foram enriquecidos
- **Duplicados ignorados**: Duplicados dentro do próprio arquivo
- **Erros**: Linhas que não puderam ser processadas

### Detalhes de Erros
Se houver erros, você pode:
- Visualizar a lista de erros
- Baixar um arquivo CSV com detalhes
- Corrigir e reimportar

### Log de Auditoria
O sistema registra:
- Nome do arquivo
- Data e hora da importação
- Usuário que fez a importação
- Todas as estatísticas acima

---

## 🐛 Troubleshooting

### Erro: "Supabase connection failed"

**Causa**: Variáveis de ambiente não configuradas corretamente

**Solução**:
1. Verifique se `VITE_SUPABASE_URL` está correto
2. Verifique se `VITE_SUPABASE_KEY` está correto
3. Reinicie o servidor

### Erro: "Tabelas não encontradas"

**Causa**: Tabelas não foram criadas no Supabase

**Solução**:
1. Acesse o SQL Editor do Supabase
2. Execute o script SQL (ver SETUP.md)
3. Verifique se as tabelas foram criadas

### Erro: "Telefone inválido"

**Causa**: Telefone não tem 10-11 dígitos

**Solução**:
1. Verifique o arquivo XLSX
2. Corrija os telefones
3. Reimporte

### Erro: "CORS error"

**Causa**: Supabase não aceita requisições do seu domínio

**Solução**:
1. No Supabase, vá em **Project Settings** → **API** → **CORS**
2. Adicione o domínio do Netlify
3. Salve e tente novamente

### Erro: "Build failed no Netlify"

**Causa**: Problema durante o build

**Solução**:
1. Verifique os logs do Netlify
2. Verifique se todas as variáveis de ambiente estão configuradas
3. Verifique se o `package.json` está correto

---

## 🚀 Próximas Melhorias

### Curto Prazo
- [ ] Adicionar autenticação de usuários
- [ ] Visualizar histórico de importações
- [ ] Editar leads manualmente
- [ ] Filtrar leads por status

### Médio Prazo
- [ ] Dashboard com gráficos e analytics
- [ ] Integração com CRM (Pipedrive, HubSpot)
- [ ] API para consultar leads
- [ ] Exportar leads em diferentes formatos

### Longo Prazo
- [ ] Machine learning para deduplicação
- [ ] Validação de endereços via API
- [ ] Sincronização em tempo real
- [ ] App mobile

---

## 📞 Suporte

Para dúvidas ou problemas:

1. **Consulte a documentação**:
   - README.md - Visão geral
   - SETUP.md - Configuração inicial
   - DEPLOY.md - Deploy no Netlify
   - GUIA_COMPLETO.md - Este arquivo

2. **Verifique os logs**:
   - Abra o console do navegador (F12)
   - Verifique os logs do Netlify
   - Verifique os logs do Supabase

3. **Contate o suporte**:
   - Supabase: https://supabase.com/docs
   - Netlify: https://docs.netlify.com
   - React: https://react.dev

---

## 📝 Changelog

### v1.0.0 (2026-02-15)
- ✅ Sistema completo de importação
- ✅ Deduplicação inteligente
- ✅ Merge automático
- ✅ Relatório detalhado
- ✅ Log de auditoria
- ✅ Interface moderna

---

**Desenvolvido com ❤️ para importação inteligente de leads**
