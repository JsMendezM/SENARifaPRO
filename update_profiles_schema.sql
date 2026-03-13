-- Actualizar la tabla perfiles con la información pública de confianza del organizador
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS full_name TEXT,
ADD COLUMN IF NOT EXISTS whatsapp_number TEXT,
ADD COLUMN IF NOT EXISTS payment_info TEXT;

-- Para garantizar que los participantes en la grilla pública (usuarios anónimos)
-- puedan leer la información pública del organizador (Nombre, Celular, Métodos de Pago),
-- necesitamos una política RLS que permita la lectura de perfiles a todos.
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;

CREATE POLICY "Public profiles are viewable by everyone" 
ON public.profiles FOR SELECT 
USING (true);

-- Permitir a los usuarios actualizar su propio perfil
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

CREATE POLICY "Users can update own profile" 
ON public.profiles FOR UPDATE 
USING (auth.uid() = id);
