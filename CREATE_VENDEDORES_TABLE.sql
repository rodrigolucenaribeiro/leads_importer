-- Criar tabela de vendedores
CREATE TABLE IF NOT EXISTS vendedores (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nome VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  is_admin BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Criar índice para email
CREATE INDEX IF NOT EXISTS idx_vendedores_email ON vendedores(email);

-- Habilitar RLS
ALTER TABLE vendedores ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Vendedores podem ver seu próprio perfil" ON vendedores
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Vendedores podem atualizar seu próprio perfil" ON vendedores
  FOR UPDATE USING (auth.uid() = id);

-- Atualizar tabela leads para adicionar coluna claimed_by se não existir
ALTER TABLE leads ADD COLUMN IF NOT EXISTS claimed_by UUID REFERENCES vendedores(id) ON DELETE SET NULL;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS claimed_at TIMESTAMP;

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_leads_claimed_by ON leads(claimed_by);
CREATE INDEX IF NOT EXISTS idx_leads_claimed_at ON leads(claimed_at);

-- Criar view para leads disponíveis
CREATE OR REPLACE VIEW leads_disponiveis AS
SELECT * FROM leads WHERE claimed_by IS NULL;

-- Criar view para meus leads
CREATE OR REPLACE VIEW meus_leads AS
SELECT l.* FROM leads l
WHERE l.claimed_by = auth.uid();
