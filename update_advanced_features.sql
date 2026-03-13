-- ==============================================================================
-- ACTUALIZACIÓN DE BASE DE DATOS: GESTIÓN AVANZADA (CANTIDAD Y FECHA DE PAGO)
-- ==============================================================================

-- 1. Añadir columna a `rifas` para guardar de cuántos números es cada rifa (100, 1000, etc.)
ALTER TABLE public.rifas 
ADD COLUMN IF NOT EXISTS ticket_quantity INT DEFAULT 100;

-- 2. Añadir columna a `tickets` para llevar registro exacto de cuándo se confirmó el pago
ALTER TABLE public.tickets 
ADD COLUMN IF NOT EXISTS paid_at TIMESTAMP WITH TIME ZONE;
