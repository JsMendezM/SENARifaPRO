-- Función RPG para verificar el PIN de administrador de forma segura en el servidor
-- IMPORTANTE: Ejecuta esto en el SQL Editor de tu Supabase.
-- Luego, puedes cambiar el valor de 'real_pin' por tu PIN real (ej. '1234') para que no esté expuesto.

CREATE OR REPLACE FUNCTION verify_admin_pin(pin text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER -- Se ejecuta con permisos de administrador para no depender de RLS en el chequeo
AS $$
DECLARE
  real_pin text := '7777'; -- CAMBIA ESTE VALOR POR TU PIN DESEADO
BEGIN
  -- Verificar si el usuario que llama la función tiene la bandera is_admin en su perfil
  -- Esto añade una capa extra: solo un admin real puede pinar.
  IF EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND is_admin = true
  ) THEN
    RETURN pin = real_pin;
  ELSE
    RETURN false;
  END IF;
END;
$$;
