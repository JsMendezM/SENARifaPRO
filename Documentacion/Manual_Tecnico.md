# Manual Técnico y de Desarrollo - RifaPro 💻

Este documento detalla la arquitectura, el código base y las mejores prácticas de desarrollo implementadas en RifaPro. Está dirigido a Ingenieros de Software y administradores de sistemas.

---

## 1. Arquitectura del Sistema
**Stack Principal (Frontend):**
*   **Framework:** React 19 + Vite.
*   **Enrutamiento:** `react-router-dom` v6.
*   **Estilos:** CSS Vanilla (`index.css`) con variables CSS para temas (Dark/Light).
*   **Iconos:** `lucide-react`.

**Stack Backend (BaaS):**
*   **Proveedor:** Supabase.
*   **Base de Datos:** PostgreSQL.
*   **Autenticación:** Supabase Auth (Email/Password).

---

## 2. Estructura de Directorios Clave (`scr/`)
*   `/pages`: Contiene las vistas principales (rutas completas del navegador).
    *   `LandingPage.jsx`: Vista de inicio pública (Marketing).
    *   `Dashboard.jsx`: Panel de control principal para organizadores (protegido).
    *   `PublicGrid.jsx`: Vista dinámica de grilla para clientes (Pública generada por `/rifa/:id`).
    *   `RaffleManagement.jsx`: Vista para gestionar las boletas reservadas/pagadas.
    *   `AdminDashboard.jsx`: Consola de Super-Administrador del SaaS.
*   `/services`:
    *   `supabase.js`: Inicializador del cliente global de Supabase usando variables de entorno `.env`.

---

## 3. Seguridad y Variables de Entorno
### Archivo `.env` (Obligatorio)
El proyecto requiere un archivo `.env` en la raíz por seguridad:
```env
VITE_SUPABASE_URL=tu_url_de_proyecto
VITE_SUPABASE_ANON_KEY=tu_anon_key_publica
```
*Atención: Nunca realices commits de este archivo; ya está agregado a `.gitignore`.*

### Seguridad de Base de Datos (Row Level Security - RLS)
Para evitar que organizadores borren rifas de otros organizadores, Supabase debe tener RLS activado.
- *Tabla Rifas:* `organizer_id` debe coincidir con `auth.uid()`.
- *Tabla Tickets:* Cualquiera puede insertar (INSERT), pero solo el `organizer_id` dueño de la rifa puede actualizar (UPDATE) el estado a "pagado".

---

## 4. Funciones Críticas (Backend Supabase)

### Autenticación de Super Administrador (RPC Seguro)
El login del Super Admin **no** hardcodea el PIN en el Frontend. Depende de un script SQL (Función RPC de PostgreSQL) que debe correrse en Supabase.
**Script (`secure_admin_rpc.sql`):**
```sql
CREATE OR REPLACE FUNCTION verify_admin_pin(pin text) RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  real_pin text := '7777'; -- Valor seguro en backend
BEGIN
  IF EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true) THEN
    RETURN pin = real_pin;
  ELSE
    RETURN false;
  END IF;
END;
$$;
```

---

## 5. Decisiones de Rendimiento Algorítmico (O(1))
### Renderizado de Grillas Masivas
En lugar de iterar con `.find()` 100 veces sobre miles de tickets (`O(N^2)`), en `PublicGrid.jsx` los tickets extraídos de la BD se transforman en memoria en un **Hash Map** (`ticketsMap`) usando `useMemo()`. Esto permite la validación visual de la grilla en tiempo constante de ejecución `O(N)`.

---

## 6. Pasarela de Pagos (Fase Implementación Webhook)
El sistema actual incluye el *Stub Visual* para pagos. Para escalar a producción con dinero real:
1. Conectar los botones Wompi/MercadoPago en `Dashboard.jsx` para generar una "Preferencia" vía API.
2. Levantar un Node Server / Edge Function que escuche los Webhooks bancarios.
3. Al recibir pago `APPROVED`, ejecutar en servidor la consulta: `UPDATE rifas SET is_paid = true WHERE id = transaccion_id`.
