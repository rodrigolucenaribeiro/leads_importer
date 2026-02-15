# 🚀 Deploy no Netlify

## Pré-requisitos

- Conta no Netlify (https://netlify.com)
- Repositório Git (GitHub, GitLab ou Bitbucket)
- Credenciais do Supabase configuradas

## Passo a Passo

### 1. Fazer Push do Código para Git

```bash
# Inicializar repositório (se ainda não tiver)
git init
git add .
git commit -m "Initial commit: Sistema de Importação de Leads"

# Adicionar remote (substitua pela URL do seu repositório)
git remote add origin https://github.com/seu-usuario/leads_importer.git
git push -u origin main
```

### 2. Conectar Netlify ao Repositório

1. Acesse https://app.netlify.com
2. Clique em **"New site from Git"**
3. Escolha seu provedor Git (GitHub, GitLab ou Bitbucket)
4. Autorize o Netlify a acessar seus repositórios
5. Selecione o repositório `leads_importer`

### 3. Configurar Build

Na página de configuração do Netlify:

**Build Command:**
```
pnpm install && pnpm build
```

**Publish Directory:**
```
dist
```

### 4. Adicionar Variáveis de Ambiente

1. Clique em **"Site settings"**
2. Vá em **"Build & deploy"** → **"Environment"**
3. Clique em **"Edit variables"**
4. Adicione as seguintes variáveis:

| Chave | Valor |
|-------|-------|
| `VITE_SUPABASE_URL` | `https://seu-projeto.supabase.co` |
| `VITE_SUPABASE_KEY` | Sua chave anon do Supabase |

### 5. Deploy

1. Clique em **"Deploy site"**
2. Aguarde o build completar (normalmente leva 2-5 minutos)
3. Seu site estará disponível em `https://seu-site.netlify.app`

## Configurações Recomendadas

### Redirecionamentos

Se você quiser usar um domínio customizado:

1. Vá em **"Domain settings"**
2. Clique em **"Add custom domain"**
3. Siga as instruções para configurar o DNS

### Proteção de Senha

Para proteger o acesso ao sistema:

1. Vá em **"Site settings"** → **"Build & deploy"** → **"Post processing"**
2. Ative **"Password protection"**
3. Defina uma senha

## Troubleshooting

### Erro: "Build failed"

- Verifique se todas as variáveis de ambiente estão configuradas
- Verifique se o arquivo `package.json` está correto
- Verifique os logs do build no Netlify

### Erro: "Supabase connection failed"

- Verifique se as credenciais do Supabase estão corretas
- Verifique se as tabelas foram criadas no Supabase
- Verifique se a chave anon tem permissão para acessar as tabelas

### Erro: "CORS error"

- Verifique se o Supabase está configurado para aceitar requisições do seu domínio
- No Supabase, vá em **Project Settings** → **API** → **CORS**

## Monitoramento

Após o deploy:

1. Acesse seu site
2. Teste a funcionalidade de upload
3. Verifique se os dados estão sendo salvos no Supabase
4. Monitore os logs no Netlify

## Atualizações

Para fazer novas atualizações:

1. Faça as alterações no código
2. Commit e push para o Git
3. O Netlify automaticamente fará o deploy

```bash
git add .
git commit -m "Descrição das alterações"
git push
```

## Domínio Customizado

Se você tiver um domínio próprio:

1. Vá em **"Domain settings"** no Netlify
2. Clique em **"Add custom domain"**
3. Digite seu domínio
4. Configure o DNS conforme as instruções do Netlify

## Suporte

Para mais informações:
- [Documentação do Netlify](https://docs.netlify.com)
- [Documentação do Supabase](https://supabase.com/docs)
