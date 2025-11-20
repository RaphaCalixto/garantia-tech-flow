-- Adicionar coluna quantidade na tabela equipment_history
ALTER TABLE equipment_history 
ADD COLUMN IF NOT EXISTS quantidade INTEGER DEFAULT 1 NOT NULL;

-- Comentário
COMMENT ON COLUMN equipment_history.quantidade IS 'Quantidade de equipamentos movimentados nesta operação';

