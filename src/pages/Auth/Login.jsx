import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../services/supabase';
import { Lock, Mail } from 'lucide-react';

/**
 * Pantalla de Inicio de Sesión / Registro para Organizadores.
 * Permite a los organizadores entrar a su cuenta usando Supabase Auth de forma segura.
 */
function Login() {
    // HOOKS DE ESTADO (State Hooks)
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState(null);
    const [isRegistering, setIsRegistering] = useState(false); // Variable que controla si estamos en "Login" o "Registro"

    const navigate = useNavigate();

    // Función para Iniciar Sesión o Registrarse
    const handleAuth = async (e) => {
        e.preventDefault();
        setLoading(true);
        setErrorMsg(null);

        if (isRegistering) {
            // Flujo de REGISTRO (Sign Up)
            const { data, error } = await supabase.auth.signUp({
                email,
                password,
            });

            if (error) {
                console.error('Error Registro:', error.message);
                // Mostrar el error real que devuelve Supabase para saber qué falla (ej: correo ya existe)
                setErrorMsg(`Error al registrarse: ${error.message}`);
            } else {
                if (data?.session) {
                    alert("¡Cuenta creada exitosamente! Iniciando sesión...");
                    navigate('/dashboard');
                } else {
                    alert("¡Cuenta creada! Por favor, revisa tu correo electrónico para confirmar tu cuenta antes de iniciar sesión.");
                    setIsRegistering(false); // Cambiar a la vista de login
                }
            }

        } else {
            // Flujo de INICIAR SESIÓN (Sign In)
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) {
                console.error('Error Login:', error.message);
                setErrorMsg('Correo o contraseña incorrectos. Intenta de nuevo.');
            } else {
                navigate('/dashboard');
            }
        }

        setLoading(false);
    };

    return (
        <div className="flex-center" style={{ minHeight: '100vh', padding: '1rem' }}>

            <div className="card anim-slide-up stagger-1" style={{ width: '100%', maxWidth: '400px' }}>

                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <h2 className="premium-gradient-text" style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>
                        RifaPro
                    </h2>
                    <p style={{ color: 'var(--text-muted)' }}>
                        {isRegistering ? 'Crea tu cuenta de Organizador' : 'Acceso seguro para Organizadores'}
                    </p>
                </div>

                {errorMsg && (
                    <div style={{
                        backgroundColor: 'rgba(239, 68, 68, 0.1)',
                        border: '1px solid var(--danger)',
                        color: 'var(--danger)',
                        padding: '1rem',
                        borderRadius: '8px',
                        marginBottom: '1.5rem',
                        textAlign: 'center'
                    }}>
                        {errorMsg}
                    </div>
                )}

                {/* Formulario de Auth */}
                <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

                    <div>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                            <Mail size={18} /> Correo Electrónico
                        </label>
                        <input
                            type="email"
                            className="input-field"
                            placeholder="tu@correo.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>

                    <div>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                            <Lock size={18} /> Contraseña
                        </label>
                        <input
                            type="password"
                            className="input-field"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        className="btn btn-primary"
                        disabled={loading}
                        style={{ marginTop: '1rem', width: '100%' }}
                    >
                        {loading ? 'Cargando...' : isRegistering ? 'Crear Cuenta' : 'Entrar al Dashboard'}
                    </button>
                </form>

                {/* Enlace para cambiar entre Login y Registro */}
                <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
                    <button
                        type="button"
                        autoFocus={false}
                        onClick={() => {
                            setIsRegistering(!isRegistering);
                            setErrorMsg(null);
                        }}
                        style={{
                            background: 'none',
                            border: 'none',
                            color: 'var(--primary-color)',
                            cursor: 'pointer',
                            textDecoration: 'underline',
                            fontSize: '0.9rem'
                        }}
                    >
                        {isRegistering ? '¿Ya tienes cuenta? Inicia sesión aquí' : '¿No tienes cuenta? Registrate aquí'}
                    </button>
                </div>

                <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    Esta plataforma está protegida y encriptada, tus datos están seguros con nosotros.
                </p>
            </div>
        </div>
    );
}

export default Login;
