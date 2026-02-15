# 🚀 Como Fazer Upload no Netlify (Método Drag & Drop)

## Passo 1: Preparar os Arquivos

Você recebeu um arquivo `leads_importer_dist.zip` com todos os arquivos prontos.

1. Extraia o ZIP em uma pasta
2. Dentro da pasta extraída, você verá uma pasta chamada `dist`
3. Abra a pasta `dist` - lá estão todos os arquivos que você vai fazer upload

## Passo 2: Acessar Netlify

1. Acesse https://app.netlify.com
2. Faça login com sua conta (ou crie uma se não tiver)

## Passo 3: Fazer Upload

### Opção A: Drag & Drop (Mais Fácil)

1. Na página inicial do Netlify, você verá uma área que diz **"Drag and drop your site output folder here"**
2. Abra a pasta `dist` no seu computador
3. Selecione **TODOS** os arquivos dentro da pasta `dist`
4. Arraste e solte na área do Netlify

### Opção B: Botão de Upload

1. Clique em **"New site"** → **"Deploy manually"**
2. Clique em **"Upload your site folder"**
3. Selecione a pasta `dist`
4. Clique em **"Open"**

## Passo 4: Adicionar Variáveis de Ambiente

Após o upload começar, o Netlify vai pedir para configurar as variáveis de ambiente:

1. Clique em **"Site settings"**
2. Vá em **"Build & deploy"** → **"Environment"**
3. Clique em **"Edit variables"**
4. Adicione as seguintes variáveis:

| Chave | Valor |
|-------|-------|
| `VITE_SUPABASE_URL` | `https://lwytniudykyozyhimcnp.supabase.co` |
| `VITE_SUPABASE_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx3eXRuaXVkeWt5b3p5aGltY25wIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzExMzU5NDAsImV4cCI6MjA4NjcxMTk0MH0.6EXulwQLtefzHYAOV6Afz3EfDMRd9q6ktL9chFqz1F4` |

5. Clique em **"Save"**

## Passo 5: Aguardar Deploy

1. O Netlify vai processar os arquivos
2. Você verá uma barra de progresso
3. Quando terminar, você receberá um link do tipo: `https://seu-site-aleatorio.netlify.app`

## Passo 6: Testar

1. Clique no link gerado
2. A aplicação deve abrir
3. Faça upload de um arquivo XLSX para testar
4. Verifique se está funcionando

## Estrutura da Pasta `dist`

A pasta `dist` contém:

```
dist/
├── public/
│   ├── assets/
│   │   ├── index-D6dhl49e.css    (CSS compilado)
│   │   └── index-sR5KC2fd.js     (JavaScript compilado)
│   ├── index.html                (HTML principal)
│   └── __manus__/
│       └── debug-collector.js
└── index.js                      (Servidor Node.js)
```

## ⚠️ Importante

- **Não modifique** os arquivos dentro de `dist`
- **Não renomeie** os arquivos
- **Faça upload de TODOS** os arquivos, não só alguns

## Troubleshooting

### Erro: "Site not found"
- Aguarde alguns minutos para o deploy completar
- Recarregue a página (F5)

### Erro: "Supabase connection failed"
- Verifique se as variáveis de ambiente estão corretas
- Verifique se as tabelas foram criadas no Supabase

### Erro: "CORS error"
- Configure CORS no Supabase
- Vá em **Project Settings** → **API** → **CORS**
- Adicione o domínio do Netlify

## Domínio Customizado (Opcional)

Se você tiver um domínio próprio:

1. No Netlify, vá em **"Domain settings"**
2. Clique em **"Add custom domain"**
3. Digite seu domínio
4. Configure o DNS conforme as instruções

## Suporte

- [Documentação Netlify](https://docs.netlify.com)
- [Documentação Supabase](https://supabase.com/docs)
