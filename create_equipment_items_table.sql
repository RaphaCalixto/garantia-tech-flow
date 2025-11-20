-- Tabela para unidades individuais de equipamentos
-- Permite que cada unidade tenha sua própria garantia, número de série, etc.
CREATE TABLE IF NOT EXISTS equipment_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  equipment_id UUID NOT NULL REFERENCES equipments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  numero_serie TEXT,
  garantia_validade DATE,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  localizacao TEXT,
  status TEXT DEFAULT 'disponivel' CHECK (status IN ('disponivel', 'vendido', 'em_manutencao', 'reservado')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_equipment_items_equipment_id ON equipment_items(equipment_id);
CREATE INDEX IF NOT EXISTS idx_equipment_items_user_id ON equipment_items(user_id);
CREATE INDEX IF NOT EXISTS idx_equipment_items_customer_id ON equipment_items(customer_id);
CREATE INDEX IF NOT EXISTS idx_equipment_items_status ON equipment_items(status);
CREATE INDEX IF NOT EXISTS idx_equipment_items_garantia_validade ON equipment_items(garantia_validade);

-- RLS (Row Level Security)
ALTER TABLE equipment_items ENABLE ROW LEVEL SECURITY;

-- Política: usuários só podem ver seus próprios itens
CREATE POLICY "Users can view their own equipment items"
  ON equipment_items
  FOR SELECT
  USING (auth.uid() = user_id);

-- Política: usuários só podem inserir itens para seus próprios equipamentos
CREATE POLICY "Users can insert their own equipment items"
  ON equipment_items
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Política: usuários só podem atualizar seus próprios itens
CREATE POLICY "Users can update their own equipment items"
  ON equipment_items
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Política: usuários só podem deletar seus próprios itens
CREATE POLICY "Users can delete their own equipment items"
  ON equipment_items
  FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_equipment_items_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_equipment_items_updated_at
  BEFORE UPDATE ON equipment_items
  FOR EACH ROW
  EXECUTE FUNCTION update_equipment_items_updated_at();

-- Comentários
COMMENT ON TABLE equipment_items IS 'Unidades individuais de equipamentos, cada uma com sua própria garantia e características';
COMMENT ON COLUMN equipment_items.equipment_id IS 'Referência ao equipamento (modelo/tipo)';
COMMENT ON COLUMN equipment_items.garantia_validade IS 'Data de validade da garantia específica desta unidade';
COMMENT ON COLUMN equipment_items.status IS 'Status da unidade: disponivel, vendido, em_manutencao, reservado';

-- Atualizar tabela equipment_history para referenciar equipment_items ao invés de equipments
-- (opcional, mas recomendado para rastreamento mais preciso)
ALTER TABLE equipment_history 
ADD COLUMN IF NOT EXISTS equipment_item_id UUID REFERENCES equipment_items(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_equipment_history_equipment_item_id ON equipment_history(equipment_item_id);

