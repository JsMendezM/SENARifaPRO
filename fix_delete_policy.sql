-- 1. Agregar Política para Permitir al ORGANIZADOR Borrar su Rifa
-- (Soluciona el problema donde el botón de "Eliminar" no hacía nada por falta de permisos RLS).
CREATE POLICY "Organizers can delete their own raffles"
ON public.rifas FOR DELETE
-- Verifica que el usuario intentando borrar sea el que la creó (organizer_id)
USING (auth.uid() = organizer_id);

-- 2. Asegurar que las eliminaciones se propaguen en cascada a los tickets.
-- Si borras una Rifa, la BD debe auto-borrar todos los tickets asociados para no dejar boletas fantasmas.
-- (Probablemente ya lo tenga por el CASCADE de la clave foránea, pero es bueno asegurarlo visualmente si toca recrearla,
-- aunque en nuestro schema original lo configuramos con ON DELETE CASCADE).
