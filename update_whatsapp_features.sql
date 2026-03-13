-- ==============================================================================
-- ACTUALIZACIÓN DE BASE DE DATOS: MENSAJES PERSONALIZADOS Y MEDIOS DE PAGO
-- ==============================================================================

-- 1. Añadir columna a `profiles` para guardar el mensaje personalizado del Organizador
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS whatsapp_message_template TEXT DEFAULT '¡Hola! Acabo de reservar el número *[NUMERO]* en tu rifa "[RIFA]". Mi nombre es [NOMBRE]. Aquí te envío el comprobante de pago de [MEDIO_PAGO]:';

-- 2. Añadir columna a `tickets` para guardar con qué pagó el Cliente
ALTER TABLE public.tickets
ADD COLUMN IF NOT EXISTS payment_method TEXT;
