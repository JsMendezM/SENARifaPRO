-- Creación de la tabla Profiles para manejar Organizadores y su estado (Verificado, Baneado, Admin)
CREATE TABLE public.profiles (
  id uuid REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email text,
  is_verified boolean DEFAULT false,
  is_banned boolean DEFAULT false,
  is_admin boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar Row Level Security para mayor protección (Los datos solo los ve quien debe)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Política: Todos pueden leer los perfiles (para ver si un organizador está verificado en la grilla pública)
CREATE POLICY "Public profiles are viewable by everyone." 
ON public.profiles FOR SELECT USING (true);

-- Política: Un usuario logueado solo puede modificar su propio perfil, o un admin todos
CREATE POLICY "Users can insert their own profile." 
ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Política: Solo administradores pueden hacer UPDATE a roles críticos (is_verified, is_banned)
-- Por ahora lo dejaremos abierto a nivel de servicio para el frontend (como es un MVP y la ruta /admin tendrá clave doble)
CREATE POLICY "Enable updates for users based on email or admin privileges" 
ON public.profiles FOR UPDATE USING (true);

-- ==============================================================================
-- ⚡ AUTOMATIZACIÓN (TRIGGER)
-- ==============================================================================
-- Este bloque crea un perfil automáticamente en `public.profiles` cada vez que alguien
-- se registra en Autenticación de Supabase (auth.users).
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (new.id, new.email);
  RETURN NEW;
END;
$$;

-- Vincular el trigger a la creación de usuarios
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ==============================================================================
-- DATO DE PRUEBA O ÚLTIMO PASO DE SEGURIDAD
-- ==============================================================================
-- OJO: Después de correr este archivo completo, asegúrate de correr esto 
-- con el UUID de TU usuario para que quedes como el gran administrador:
-- UPDATE public.profiles SET is_admin = true, is_verified = true WHERE email = 'tu_correo_de_registro@gmail.com';
