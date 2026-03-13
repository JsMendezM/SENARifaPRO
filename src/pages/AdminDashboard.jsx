import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { ShieldAlert, Users, LayoutGrid, CheckCircle, Ban, ArrowLeft, Trash2, CheckCircle2 } from 'lucide-react';

/**
 * Panel de Administración Maestro.
 * Protegido por bandera is_admin en la tabla profiles y una doble verificación local (PIN).
 */
function AdminDashboard() {
    const navigate = useNavigate();

    // Verificación
    const [isCheckingAuth, setIsCheckingAuth] = useState(true);
    const [isAuthenticatedAdmin, setIsAuthenticatedAdmin] = useState(false);
    const [pinUnlocked, setPinUnlocked] = useState(false);
    const [pinInput, setPinInput] = useState('');
    const [isVerifyingPin, setIsVerifyingPin] = useState(false); // Estado de carga del PIN

    // Datos
    const [profiles, setProfiles] = useState([]);
    const [rifas, setRifas] = useState([]);

    // Tabs
    const [activeTab, setActiveTab] = useState('users');

    useEffect(() => {
        const checkAdminPrivileges = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession();

                if (!session) {
                    navigate('/login');
                    return;
                }

                // Verificar si el perfil dice que es admin
                const { data: profileData, error } = await supabase
                    .from('profiles')
                    .select('is_admin')
                    .eq('id', session.user.id)
                    .single();

                if (error || !profileData?.is_admin) {
                    // Si no es admin o no existe, patita a la calle
                    navigate('/dashboard');
                    return;
                }

                setIsAuthenticatedAdmin(true);

                // Cargar todo
                loadDashboardData();

            } catch (error) {
                console.error("Auth check failed", error);
                navigate('/dashboard');
            } finally {
                setIsCheckingAuth(false);
            }
        };

        checkAdminPrivileges();
    }, [navigate]);

    const loadDashboardData = async () => {
        // Cargar perfiles
        const { data: pData } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
        if (pData) setProfiles(pData);

        // Cargar todas las rifas
        const { data: rData } = await supabase.from('rifas').select('*').order('created_at', { ascending: false });
        if (rData) setRifas(rData);
    };

    const handlePinSubmit = async (e) => {
        e.preventDefault();
        setIsVerifyingPin(true);
        try {
            // Llamamos a la función segura en el backend de Supabase
            // Evita exponer el PIN real en el código fuente de la página.
            const { data: isValid, error } = await supabase.rpc('verify_admin_pin', { pin: pinInput });

            if (error) throw error;

            if (isValid === true) {
                setPinUnlocked(true);
            } else {
                alert("PIN de seguridad incorrecto.");
                setPinInput('');
            }
        } catch (err) {
            console.error("Error validando PIN:", err);
            alert("Error al validar el PIN. Asegúrate de haber ejecutado el script SQL en Supabase o revisa tu conexión.");
        } finally {
            setIsVerifyingPin(false);
        }
    };

    // ==========================================
    // ACCIONES SOBRE USUARIOS (PROFILES)
    // ==========================================
    const toggleVerification = async (userId, currentStatus) => {
        const { error } = await supabase.from('profiles').update({ is_verified: !currentStatus }).eq('id', userId);
        if (!error) {
            setProfiles(profiles.map(p => p.id === userId ? { ...p, is_verified: !currentStatus } : p));
        } else {
            alert("Error al verificar: " + error.message);
        }
    };

    const toggleBan = async (userId, currentStatus) => {
        const { error } = await supabase.from('profiles').update({ is_banned: !currentStatus }).eq('id', userId);
        if (!error) {
            setProfiles(profiles.map(p => p.id === userId ? { ...p, is_banned: !currentStatus } : p));
        } else {
            alert("Error al banear: " + error.message);
        }
    };

    // ==========================================
    // ACCIONES SOBRE RIFAS
    // ==========================================
    const togglePaidStatus = async (rifaId, currentStatus) => {
        const { error } = await supabase.from('rifas').update({ is_paid: !currentStatus }).eq('id', rifaId);
        if (!error) {
            setRifas(rifas.map(r => r.id === rifaId ? { ...r, is_paid: !currentStatus } : r));
        } else {
            alert("Error al actualizar pago: " + error.message);
        }
    };

    const deleteRifaAdmin = async (rifaId, rifaTitle) => {
        if (window.confirm(`💥 CUIDADO: Vas a borrar la rifa: "${rifaTitle}". ¡Se borrará de toda la web!`)) {
            const { error } = await supabase.from('rifas').delete().eq('id', rifaId);
            if (!error) {
                setRifas(rifas.filter(r => r.id !== rifaId));
            } else {
                alert("Error al borrar: " + error.message);
            }
        }
    };

    if (isCheckingAuth) {
        return <div style={{ textAlign: 'center', padding: '5rem', color: 'var(--text-muted)' }}>Verificando credenciales de administrador...</div>;
    }

    if (!isAuthenticatedAdmin) return null; // Component failsafe

    // -------------------------------------------------------------
    // PANTALLA: VERIFICACIÓN DE PIN (2FA)
    // -------------------------------------------------------------
    if (!pinUnlocked) {
        return (
            <div className="container" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <form onSubmit={handlePinSubmit} className="card" style={{ maxWidth: '400px', width: '100%', textAlign: 'center', border: '1px solid #ff6b6b' }}>
                    <ShieldAlert size={48} color="#ff6b6b" style={{ margin: '0 auto 1rem auto' }} />
                    <h2 style={{ marginBottom: '1rem', color: '#ff6b6b' }}>Bloqueo de Seguridad</h2>
                    <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
                        Estás entrando al núcleo de la base de datos. Ingresa el PIN maestro para continuar.
                    </p>
                    <input
                        type="password"
                        className="input-field"
                        placeholder="PIN Maestro (Pista: 7...)"
                        value={pinInput}
                        onChange={(e) => setPinInput(e.target.value)}
                        required
                        style={{ textAlign: 'center', letterSpacing: '0.5rem', fontSize: '1.5rem', marginBottom: '1rem' }}
                    />
                    <button type="submit" className="btn" disabled={isVerifyingPin} style={{ width: '100%', justifyContent: 'center', backgroundColor: '#ff6b6b', color: '#fff', fontWeight: 'bold' }}>
                        {isVerifyingPin ? 'Verificando con Seguridad Global...' : 'Desbloquear Consola'}
                    </button>

                    <Link to="/dashboard" style={{ color: 'var(--text-muted)', display: 'block', marginTop: '1.5rem', fontSize: '0.8rem' }}>
                        Pánico: Volver a mi panel normal
                    </Link>
                </form>
            </div>
        );
    }

    // -------------------------------------------------------------
    // PANTALLA: PANEL DE ADMINISTRACIÓN
    // -------------------------------------------------------------
    return (
        <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-primary)', display: 'flex', flexDirection: 'column' }}>
            {/* Header Admin */}
            <header style={{ padding: '1rem 2rem', backgroundColor: '#1a101f', borderBottom: '2px solid #ff6b6b', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <ShieldAlert color="#ff6b6b" />
                    <div>
                        <h1 style={{ fontSize: '1.2rem', margin: 0, color: '#ff6b6b' }}>Cortex Admin: RifaPro</h1>
                        <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>Conectado a la bóveda principal</p>
                    </div>
                </div>
                <Link to="/dashboard" className="btn btn-secondary" style={{ gap: '0.5rem' }}>
                    <ArrowLeft size={16} /> Salir a Dashboard
                </Link>
            </header>

            <main style={{ padding: '2rem', flex: 1, maxWidth: '1200px', margin: '0 auto', width: '100%' }}>

                {/* Selector de Pestañas */}
                <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
                    <button
                        className="btn"
                        style={{ flex: 1, justifyContent: 'center', backgroundColor: activeTab === 'users' ? 'var(--primary-color)' : 'var(--bg-secondary)', color: activeTab === 'users' ? '#000' : 'var(--text-main)', border: activeTab === 'users' ? 'none' : '1px solid rgba(255,255,255,0.1)' }}
                        onClick={() => setActiveTab('users')}
                    >
                        <Users size={20} /> Organizadores / Cuentas
                    </button>
                    <button
                        className="btn"
                        style={{ flex: 1, justifyContent: 'center', backgroundColor: activeTab === 'rifas' ? 'var(--primary-color)' : 'var(--bg-secondary)', color: activeTab === 'rifas' ? '#000' : 'var(--text-main)', border: activeTab === 'rifas' ? 'none' : '1px solid rgba(255,255,255,0.1)' }}
                        onClick={() => setActiveTab('rifas')}
                    >
                        <LayoutGrid size={20} /> Todas las Rifas Creadas
                    </button>
                </div>

                {/* CONTENIDO USUARIOS */}
                {activeTab === 'users' && (
                    <div style={{ animation: 'fadeIn 0.3s ease' }}>
                        <h2 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>Gestión de Perfiles ({profiles.length})</h2>
                        <div style={{ overflowX: 'auto', backgroundColor: 'var(--bg-secondary)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '800px' }}>
                                <thead>
                                    <tr style={{ backgroundColor: 'rgba(0,0,0,0.2)', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                                        <th style={{ padding: '1rem' }}>Email / Usuario</th>
                                        <th style={{ padding: '1rem' }}>Admin / Dueño</th>
                                        <th style={{ padding: '1rem' }}>Verificado ✅</th>
                                        <th style={{ padding: '1rem' }}>Castigado 🚫</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {profiles.map(profile => (
                                        <tr key={profile.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                            <td style={{ padding: '1rem' }}>{profile.email}</td>
                                            <td style={{ padding: '1rem' }}>{profile.is_admin ? <span style={{ color: '#ff6b6b', fontWeight: 'bold' }}>Sí (Peligro)</span> : 'No'}</td>

                                            <td style={{ padding: '1rem' }}>
                                                <button
                                                    onClick={() => toggleVerification(profile.id, profile.is_verified)}
                                                    style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: profile.is_verified ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255,255,255,0.05)', color: profile.is_verified ? '#10b981' : 'var(--text-muted)', border: 'none', padding: '0.5rem 1rem', borderRadius: '4px', cursor: 'pointer', transition: 'all 0.2s', width: '120px', justifyContent: 'center' }}
                                                >
                                                    {profile.is_verified ? <CheckCircle2 size={16} /> : 'Falso'}
                                                    {profile.is_verified ? 'Activado' : 'Activar'}
                                                </button>
                                            </td>

                                            <td style={{ padding: '1rem' }}>
                                                <button
                                                    onClick={() => toggleBan(profile.id, profile.is_banned)}
                                                    style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: profile.is_banned ? 'rgba(255, 107, 107, 0.2)' : 'rgba(255,255,255,0.05)', color: profile.is_banned ? '#ff6b6b' : 'var(--text-muted)', border: 'none', padding: '0.5rem 1rem', borderRadius: '4px', cursor: 'pointer', transition: 'all 0.2s', width: '120px', justifyContent: 'center' }}
                                                >
                                                    {profile.is_banned ? <Ban size={16} /> : ''}
                                                    {profile.is_banned ? 'BANEADO' : 'Banear'}
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* CONTENIDO RIFAS GLOBALES */}
                {activeTab === 'rifas' && (
                    <div style={{ animation: 'fadeIn 0.3s ease' }}>
                        <h2 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>Escaner de Rifas Globals ({rifas.length})</h2>
                        <div style={{ overflowX: 'auto', backgroundColor: 'var(--bg-secondary)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '800px' }}>
                                <thead>
                                    <tr style={{ backgroundColor: 'rgba(0,0,0,0.2)', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                                        <th style={{ padding: '1rem' }}>Regalo/Premio</th>
                                        <th style={{ padding: '1rem' }}>Precio Boleta</th>
                                        <th style={{ padding: '1rem' }}>Estado de Pago (Tuyo)</th>
                                        <th style={{ padding: '1rem' }}>ZAP (Borrar)</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {rifas.map(rifa => (
                                        <tr key={rifa.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                            <td style={{ padding: '1rem' }}>
                                                <strong>{rifa.title}</strong><br />
                                                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Lotería: {rifa.lottery_type}</span>
                                            </td>
                                            <td style={{ padding: '1rem' }}>${rifa.ticket_price} COP</td>

                                            <td style={{ padding: '1rem' }}>
                                                <button
                                                    onClick={() => togglePaidStatus(rifa.id, rifa.is_paid)}
                                                    style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: rifa.is_paid ? 'rgba(34, 211, 238, 0.2)' : 'rgba(255, 107, 107, 0.1)', color: rifa.is_paid ? 'var(--primary-color)' : '#ff6b6b', border: '1px solid', borderColor: rifa.is_paid ? 'rgba(34, 211, 238, 0.5)' : '#ff6b6b', padding: '0.5rem 1rem', borderRadius: '4px', cursor: 'pointer', transition: 'all 0.2s', width: '150px', justifyContent: 'center', fontSize: '0.8rem' }}
                                                >
                                                    {rifa.is_paid ? <CheckCircle size={14} /> : '⚠️'}
                                                    {rifa.is_paid ? 'Rifa Premium' : 'Esquivó Pago'}
                                                </button>
                                            </td>

                                            <td style={{ padding: '1rem' }}>
                                                <button
                                                    onClick={() => deleteRifaAdmin(rifa.id, rifa.title)}
                                                    className="btn"
                                                    style={{ backgroundColor: 'transparent', border: '1px solid #ff6b6b', color: '#ff6b6b', padding: '0.5rem' }}
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}

export default AdminDashboard;
