-- Añadir columnas faltantes a la tabla rifas si no existen
ALTER TABLE public.rifas ADD COLUMN IF NOT EXISTS icon TEXT DEFAULT 'gift';
ALTER TABLE public.rifas ADD COLUMN IF NOT EXISTS is_paid BOOLEAN DEFAULT false;
