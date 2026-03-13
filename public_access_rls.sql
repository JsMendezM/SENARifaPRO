-- ==============================================================================
-- SCRIPT DE SEGURIDAD (RLS): ACCESO PÚBLICO A GRILLAS
-- 
-- Problema: Cuando un cliente abre el enlace de la rifa sin haber iniciado sesión, 
-- Supabase bloquea la descarga de datos por seguridad (Row Level Security).
-- Solución: Crear políticas que permitan a *cualquier persona* (incluso anónimos)
-- VER (SELECT) las rifas y el perfil público del organizador, pero NO modificarlos.
-- ==============================================================================

-- 1. Asegurarnos de que RLS esté activado (por si acaso)
ALTER TABLE public.rifas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 2. Permitir que TODO EL MUNDO pueda VER las Rifas
-- Esto arregla el error "Rifa no encontrada / Cannot coerce to single JSON object"
DROP POLICY IF EXISTS "Permitir lectura publica de rifas" ON public.rifas;
CREATE POLICY "Permitir lectura publica de rifas"
  ON public.rifas
  FOR SELECT
  USING (true); -- true = Todos los usuarios (anónimos y logueados) pueden leer

-- 3. Permitir que TODO EL MUNDO pueda VER el Perfil del Organizador
-- Para que el cliente pueda ver el WhatsApp, Nombre y Cuentas de Nequi del dueño.
DROP POLICY IF EXISTS "Permitir lectura publica de perfiles" ON public.profiles;
CREATE POLICY "Permitir lectura publica de perfiles"
  ON public.profiles
  FOR SELECT
  USING (true);

-- Nota: Las operaciones de INSERT, UPDATE y DELETE siguen protegidas 
-- para que solo el dueño (organizer_id) pueda modificar su rifa o su perfil.
