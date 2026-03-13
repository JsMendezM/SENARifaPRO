-- 1. Insertar usuarios antiguos en la tabla perfiles (Backfill)
-- Como tu cuenta fue creada ANTES de que hiciéramos la tabla profiles, el Trigger no se ejecutó.
INSERT INTO public.profiles (id, email)
SELECT id, email FROM auth.users
ON CONFLICT (id) DO NOTHING;

-- 2. Asegurar que tienes RLS (Políticas de Seguridad) funcionando para leer perfiles.
DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON public.profiles;
CREATE POLICY "Public profiles are viewable by everyone." 
ON public.profiles FOR SELECT USING (true);

-- 3. Volver a forzar el estado de Administrador en tu correo.
-- REEMPLAZA ESTE CORREO POR EL TUYO REAL ANTES DE CORRER EL SCRIPT:
UPDATE public.profiles 
SET is_admin = true, is_verified = true 
WHERE email = 'sepulvedadlk@gmail.com';
