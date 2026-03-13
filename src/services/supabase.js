import { createClient } from '@supabase/supabase-js';

// ============================================================================
// CONFIGURACIÓN DE SUPABASE (BASE DE DATOS Y AUTENTICACIÓN)
// ============================================================================
// Supabase es una alternativa a Firebase, de código abierto e ideal para Startups.
// Proporciona tanto la base de datos PostgreSQL como el sistema de inicio de sesión.
//
// Usar variables de entorno inyectadas por Vite (import.meta.env)
// Esto evita que las llaves queden estrictamente hardcodeadas en el archivo, permitiendo
// que se usen desde un .env local o desde las variables de entorno de Vercel/Netlify.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

/**
 * Cliente global de Supabase.
 * Exportamos esta variable `supabase` para que cualquier parte de la aplicación
 * (Login, Dashboard, Grilla pública) pueda interactuar de forma segura con la Base de Datos.
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
