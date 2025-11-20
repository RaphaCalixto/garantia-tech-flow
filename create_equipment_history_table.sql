-- Tabela para histórico de movimentações de equipamentos (entrada/saída)
CREATE TABLE IF NOT EXISTS equipment_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  equipment_id UUID NOT NULL REFERENCES equipments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tipo_movimentacao TEXT NOT NULL CHECK (tipo_movimentacao IN ('entrada', 'saida')),
  cliente_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  data_movimentacao TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_equipment_history_equipment_id ON equipment_history(equipment_id);
CREATE INDEX IF NOT EXISTS idx_equipment_history_user_id ON equipment_history(user_id);
CREATE INDEX IF NOT EXISTS idx_equipment_history_data_movimentacao ON equipment_history(data_movimentacao DESC);

-- RLS (Row Level Security)
ALTER TABLE equipment_history ENABLE ROW LEVEL SECURITY;

-- Política: usuários só podem ver seu próprio histórico
CREATE POLICY "Users can view their own equipment history"
  ON equipment_history
  FOR SELECT
  USING (auth.uid() = user_id);

-- Política: usuários só podem inserir histórico para seus próprios equipamentos
CREATE POLICY "Users can insert their own equipment history"
  ON equipment_history
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Política: usuários só podem atualizar seu próprio histórico
CREATE POLICY "Users can update their own equipment history"
  ON equipment_history
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Política: usuários só podem deletar seu próprio histórico
CREATE POLICY "Users can delete their own equipment history"
  ON equipment_history
  FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_equipment_history_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_equipment_history_updated_at
  BEFORE UPDATE ON equipment_history
  FOR EACH ROW
  EXECUTE FUNCTION update_equipment_history_updated_at();

-- Comentários
COMMENT ON TABLE equipment_history IS 'Histórico de movimentações (entrada/saída) de equipamentos';
COMMENT ON COLUMN equipment_history.tipo_movimentacao IS 'Tipo de movimentação: entrada (equipamento retorna) ou saida (equipamento é vendido/entregue)';
COMMENT ON COLUMN equipment_history.cliente_id IS 'Cliente relacionado à movimentação (NULL se for entrada ou se pertencer à empresa)';

