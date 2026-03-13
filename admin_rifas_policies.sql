-- Políticas para permitir a los administradores modificar y eliminar cualquier Rifa

DROP POLICY IF EXISTS "Admins can update all rifas" ON public.rifas;
CREATE POLICY "Admins can update all rifas" 
ON public.rifas FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.is_admin = true
  )
);

DROP POLICY IF EXISTS "Admins can delete all rifas" ON public.rifas;
CREATE POLICY "Admins can delete all rifas" 
ON public.rifas FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.is_admin = true
  )
);

-- Y también permitimos explícitamente a los admins actualizar la tabla perfiles (profiles) 
-- para bannear usuarios o verificarlos de manera segura
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
CREATE POLICY "Admins can update all profiles" 
ON public.profiles FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p2 
    WHERE p2.id = auth.uid() 
    AND p2.is_admin = true
  )
);
