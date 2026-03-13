-- Añadir la columna de número ganador a la tabla de rifas
ALTER TABLE public.rifas 
ADD COLUMN IF NOT EXISTS winning_number TEXT;

-- Asegurar que la columna tenga los mismos permisos de lectura (la gente de la grilla necesita ver quién ganó)
-- y escritura (para que el organizador pueda actualizarlo en el Dashboard)
-- Como las políticas ya aplican a la tabla completa mediante el UPDATE que hicimos antes, 
-- la adición de la columna la hereda directamente.
