# Guía de Soporte y Preguntas Frecuentes (FAQ) - RifaPro 🛠️

Este documento está diseñado para ayudar al equipo de atención al cliente de RifaPro o a los desarrolladores a resolver problemas comunes reportados por organizadores o clientes de manera rápida.

---

## 🛑 1. Problemas de Inicio de Sesión y Cuentas

### 1.1 "El usuario olvidó su contraseña"
*   **Causa:** RifaPro delega las credenciales a **Supabase Auth**.
*   **Solución (Nivel 1):** Indicarle al usuario que use la opción "Olvidé mi contraseña" en la pantalla de login (si está habilitada).
*   **Solución (Nivel Admin):** Desde el panel principal de la consola de Supabase (`app.supabase.com`), navegar a `Authentication > Users`, buscar el correo del usuario y enviar un enlace de restablecimiento de contraseña (`Send password recovery`).

### 1.2 "Un usuario fue bloqueado por error"
*   **Causa:** El botón "Banear Usuario" fue pulsado en el `AdminDashboard`.
*   **Solución:** El Super-Administrador puede entrar con el enlace `/admin` y su PIN seguro, buscar la tarjeta del usuario y presionar "Desbloquear".

---

## 💰 2. Problemas con Pagos e Ingresos

### 2.1 "Pagué por Wompi/MercadoPago pero la Rifa sigue en Modo Prueba"
*   **Causa:** El banco debitó, pero el "Webhook" del sistema no recibió la señal (falla de internet, servidores de la pasarela lentos).
*   **Solución (Soporte Manual):** 
    1. Solicitar el recibo de transacción del banco.
    2. El Super-Administrador debe entrar a la Consola `/admin`.
    3. Buscar la rifa afectada y seleccionar **"Activar de Emergencia (Pagar Manualmente)"**. La rifa pasará a `is_paid = true` automáticamente sin necesidad de tocar la base de datos directa.

### 2.2 "Un cliente me dice que otra persona le quitó el número en el último segundo"
*   **Causa:** Es el protocolo de seguridad anti-colisiones actuando de forma correcta. Dos clientes abrieron el modal de pago al instante sobre el mismo número. Quien clickeó primero se lo llevó.
*   **Solución:** El sistema ya muestra una alerta al segundo comprador informándole del error `UNIQUE CONSTRAINT` en un lenguaje amigable. Sólo invítalo a escoger un nuevo número. No hay error en el software.

---

## 📱 3. Problemas de Interfaz (Frontend)

### 3.1 "La grilla pública carga lenta o se congela"
*   **Causa posible:** Problema de batería o navegador muy antiguo que le cuesta mapear objetos O(1).
*   **Solución:** RifaPro está muy optimizado; sin embargo en celulares muy saturados indicarle al usuario desactivar el modo "Ahorro de batería Extremo" ya que deshabilita los JavaScript de carga de la aplicación. O borrar el Caché del Navegador.

### 3.2 "Mis clientes no ven mis números de Nequi/WhatsApp"
*   **Causa:** El perfil del usuario (Anti-Fraude) está vacío.
*   **Solución:** Enviar un tutorial al organizador: Debe abrir "Panel de Control" -> "Perfil y Ajustes", llenar sus cuentas de cobro y guardar antes de compartir el enlace.

---

## 🛠️ 4. Escalado a Sistemas (Para Nivel Avanzado)

Si se reportan caídas generales ("La app me sale en blanco" o Error en Conexión):
1. **Verificar Estado de Supabase:** Revisa `status.supabase.com` para comprobar si hay cortes programados en su nube `PostgreSQL`.
2. **Llaves expiradas:** Revisar que las variables en el `.env` local (`VITE_SUPABASE_URL` y `ANON_KEY`) no hayan sido rotadas recientemente por el jefe de seguridad de la infraestructura. Si es así, solicitar el `.env` actualizado.
