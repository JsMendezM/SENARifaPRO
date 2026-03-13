import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Ticket, ArrowRight, ShieldCheck, Smartphone, Download } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

/**
 * Landing Page (Página de Inicio).
 * Es lo primero que ven los organizadores al entrar a la web.
 * Se diseñó para ser persuasiva, fácil de entender y con colores premium.
 */
function LandingPage() {
    const navigate = useNavigate(); // Herramienta para mover al usuario de una página a otra
    const { isInstallable, promptInstall } = usePWAInstall(); // Hook PWA

    return (
        <div>
            {/* MENÚ SUPERIOR (Navbar) */}
            <nav className="anim-slide-up stagger-1" style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '1.5rem 5%',
                borderBottom: '1px solid rgba(255,255,255,0.05)'
            }}>
                {/* LOGO */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Ticket color="var(--primary-color)" size={32} />
                    <h1 className="premium-gradient-text" style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
                        RifaPro
                    </h1>
                </div>

                {/* BOTÓN PARA INICIAR SESIÓN / INSTALAR */}
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    {isInstallable && (
                        <button
                            onClick={promptInstall}
                            className="btn"
                            style={{ backgroundColor: 'var(--primary-color)', color: '#000', fontWeight: 'bold' }}
                        >
                            <Download size={18} /> Instalar App
                        </button>
                    )}
                    <button
                        onClick={() => navigate('/login')}
                        className="btn btn-secondary"
                    >
                        Iniciar Sesión
                    </button>
                </div>
            </nav>

            {/* SECCIÓN PRINCIPAL (Hero Section) */}
            {/* La clase container (en index.css) asegura que el contenido no sea muy ancho en PC */}
            <main className="container" style={{ textAlign: 'center', padding: '5rem 0' }}>

                {/* Etiqueta animada llamativa */}
                <div className="anim-slide-up stagger-2" style={{
                    display: 'inline-block',
                    backgroundColor: 'rgba(34, 211, 238, 0.1)',
                    color: 'var(--primary-color)',
                    padding: '0.5rem 1rem',
                    borderRadius: '50px',
                    fontWeight: '500',
                    marginBottom: '1.5rem',
                    border: '1px solid rgba(34, 211, 238, 0.2)'
                }}>
                    La rifa tradicional de papel, ahora digitalizada.
                </div>

                {/* Título Principal Gigante */}
                <h2 className="anim-slide-up stagger-3" style={{
                    fontSize: 'clamp(2.5rem, 5vw, 4rem)', // clamp hace que el tamaño se ajuste al celular o PC automáticamente
                    lineHeight: '1.1',
                    marginBottom: '1.5rem',
                    fontWeight: '800'
                }}>
                    Gestiona tus rifas <br />
                    con la <span className="premium-gradient-text">máxima seguridad</span>
                </h2>

                {/* Texto Explicativo Corto */}
                <p className="anim-slide-up stagger-4" style={{
                    color: 'var(--text-muted)',
                    fontSize: '1.2rem',
                    maxWidth: '600px',
                    margin: '0 auto 3rem auto',
                    lineHeight: '1.6'
                }}>
                    Crea tu grilla de 0 a 99 en segundos. Tus participantes pueden reservar números por Nequi o Daviplata sin necesidad de instalar nada.
                </p>

                {/* Botón de Llamado a la Acción (CTA) */}
                <div className="anim-slide-up stagger-5">
                    <button
                        onClick={() => navigate('/login')}
                        className="btn btn-primary anim-bounce"
                        style={{ padding: '1rem 2.5rem', fontSize: '1.2rem', gap: '8px' }}
                    >
                        Comenzar mi primera Rifa <ArrowRight size={20} />
                    </button>
                </div>

                {/* SECCIÓN DE CARACTERÍSTICAS (Beneficios) */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', // Se adapta a celular (1 columna) o PC (varias)
                    gap: '2rem',
                    marginTop: '5rem',
                    textAlign: 'left'
                }}>

                    {/* Tarjeta de Beneficio 1 */}
                    <div className="card">
                        <div style={{ backgroundColor: 'rgba(34, 211, 238, 0.1)', width: '48px', height: '48px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
                            <Smartphone color="var(--primary-color)" size={24} />
                        </div>
                        <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>Especial para WhatsApp</h3>
                        <p style={{ color: 'var(--text-muted)' }}>Te damos un enlace web directo. Al enviarlo por WhatsApp, tus clientes abrirán la grilla sin instalar apps complejas.</p>
                    </div>

                    {/* Tarjeta de Beneficio 2 */}
                    <div className="card">
                        <div style={{ backgroundColor: 'rgba(34, 211, 238, 0.1)', width: '48px', height: '48px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
                            <ShieldCheck color="var(--primary-color)" size={24} />
                        </div>
                        <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>Seguridad Total (Startup Grade)</h3>
                        <p style={{ color: 'var(--text-muted)' }}>Todo funciona con una base de datos segura y cuentas encriptadas. Ni tú ni tus participantes corren riesgos de pérdida de datos.</p>
                    </div>

                </div>

            </main>

            {/* PIE DE PÁGINA (Footer Legal) */}
            <footer style={{
                textAlign: 'center',
                padding: '2rem 1rem',
                borderTop: '1px solid rgba(255,255,255,0.05)',
                marginTop: 'auto'
            }}>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: '0 0 1rem 0' }}>
                    &copy; {new Date().getFullYear()} RifaPro. Herramienta de Gestión Administrativa.
                </p>
                <Link to="/terminos" style={{ color: 'var(--primary-color)', textDecoration: 'none', fontSize: '0.9rem', fontWeight: 'bold' }}>
                    Términos, Condiciones y Aviso Legal (Coljuegos)
                </Link>
            </footer>
        </div>
    );
}

export default LandingPage;
