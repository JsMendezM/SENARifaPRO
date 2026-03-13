import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { LogOut, LayoutGrid, PlusCircle, X, ExternalLink, CalendarDays, Gift, Car, Smartphone, Banknote, MonitorPlay, Trash2, Edit2, ShieldAlert, Trophy, Settings, Users, Save, Loader2, Share2 } from 'lucide-react';

/**
 * Panel de Control (Dashboard) del Organizador.
 * Desde aquí, el dueño administra sus grillas y la lógica para conectarse a Supabase.
 */
function Dashboard() {
    const navigate = useNavigate();
    const [organizerEmail, setOrganizerEmail] = useState('Cargando...');
    const [userId, setUserId] = useState(null); // Nuevo: Guardar el ID para re-uso

    // Pestañas (Tabs)
    const [activeTab, setActiveTab] = useState('raffles'); // 'raffles' | 'settings'

    // Variables para Perfil de Organizador (Anti-Fraude)
    const [profileFullName, setProfileFullName] = useState('');
    const [profileWhatsapp, setProfileWhatsapp] = useState('');
    const [profilePaymentOptions, setProfilePaymentOptions] = useState([]); // Arreglo de pagos ej: [{bank: 'Nequi', number: '300...'}]
    const [profileWaTemplate, setProfileWaTemplate] = useState(''); // Añadido: Plantilla WA
    const [isSavingProfile, setIsSavingProfile] = useState(false);

    // Variables para la lógica de visualización (Estado)
    const [showRaffleForm, setShowRaffleForm] = useState(false); // ¿Se está mostrando el formulario de crear?

    // Variables para las Rifas del usuario
    const [myRaffles, setMyRaffles] = useState([]); // Arreglo que guardará las rifas de la Base de Datos
    const [isLoadingRaffles, setIsLoadingRaffles] = useState(true); // Para mostrar "Cargando rifas..."
    const [isAdminState, setIsAdminState] = useState(false); // [NEW] Verificar si es Admin

    // Variables para los campos del formulario de creación
    const [raffleTitle, setRaffleTitle] = useState('');
    const [raffleDescription, setRaffleDescription] = useState('');
    const [rafflePrice, setRafflePrice] = useState('');
    const [raffleIcon, setRaffleIcon] = useState('gift'); // Nuevo: Icono elegido
    const [raffleLottery, setRaffleLottery] = useState(''); // Text input libre
    const [raffleDate, setRaffleDate] = useState(''); // Nuevo: Fecha de juego
    const [raffleQuantity, setRaffleQuantity] = useState(100); // Nuevo: 100 o 1000 números
    const [isCreating, setIsCreating] = useState(false);
    const [editingId, setEditingId] = useState(null); // Nuevo: ID de la rifa en edición

    // Variables para la Pasarela de Pago
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [raffleToPay, setRaffleToPay] = useState(null);
    const [isProcessingPayment, setIsProcessingPayment] = useState(false);

    // Lista de iconos disponibles para personalización
    const availableIcons = [
        { id: 'gift', icon: <Gift size={24} />, label: 'Regalo' },
        { id: 'car', icon: <Car size={24} />, label: 'Vehículos' },
        { id: 'smartphone', icon: <Smartphone size={24} />, label: 'Celular' },
        { id: 'banknote', icon: <Banknote size={24} />, label: 'Dinero' },
        { id: 'monitor', icon: <MonitorPlay size={24} />, label: 'Tecnología' }
    ];

    // Lista de Loterías de Colombia Agrupadas por Región
    const lotteryGroups = [
        {
            region: 'Nacionales',
            items: [
                { id: 'baloto', label: 'Baloto / Revancha' },
                { id: 'cruz_roja', label: 'Lotería Cruz Roja' },
                { id: 'dorado', label: 'El Dorado (Mañ/Tar)' }
            ]
        },
        {
            region: 'Bogotá y Cundinamarca',
            items: [
                { id: 'bogota', label: 'Lotería de Bogotá' },
                { id: 'cundinamarca', label: 'Lotería de Cundinamarca' }
            ]
        },
        {
            region: 'Antioquia',
            items: [
                { id: 'medellin', label: 'Lotería de Medellín' },
                { id: 'paisita', label: 'Paisita (Día/Noche)' }
            ]
        },
        {
            region: 'Valle del Cauca',
            items: [
                { id: 'valle', label: 'Lotería del Valle' },
                { id: 'chontico', label: 'Chontico (Día/Noche)' }
            ]
        },
        {
            region: 'Boyacá y Santanderes',
            items: [
                { id: 'boyaca', label: 'Lotería de Boyacá' },
                { id: 'santander', label: 'Lotería Santander' },
                { id: 'motilon', label: 'Motilón (Día/Noche)' }
            ]
        },
        {
            region: 'Eje Cafetero y Tolima',
            items: [
                { id: 'risaralda', label: 'Lotería de Risaralda' },
                { id: 'quindio', label: 'Lotería del Quindío' },
                { id: 'tolima', label: 'Lotería de Tolima' },
                { id: 'cafeterito', label: 'Cafeterito' }
            ]
        },
        {
            region: 'Costa Caribe',
            items: [
                { id: 'sino', label: 'Sinuano (Día/Noche)' },
                { id: 'fantastica', label: 'La Fantástica' }
            ]
        }
    ];

    // Función auxiliar para obtener el nombre bonito de la lotería en las tarjetas
    const getLotteryLabel = (id) => {
        for (const group of lotteryGroups) {
            const found = group.items.find(l => l.id === id);
            if (found) return found.label;
        }
        return id;
    };

    // El useEffect se ejecuta una vez al entrar a esta pantalla
    useEffect(() => {
        const checkUserAndFetchRaffles = async () => {
            const { data: { session }, error } = await supabase.auth.getSession();
            if (error || !session) {
                navigate('/login');
                return;
            }
            setOrganizerEmail(session.user.email);
            setUserId(session.user.id);
            fetchMyRaffles(session.user.id);

            // Revisa si es admin velozmente y obtener los datos publicos del perfil
            const { data: profile, error: profileErr } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
            if (profile) {
                if (profile.is_admin) setIsAdminState(true);
                if (profile.full_name) setProfileFullName(profile.full_name);
                if (profile.whatsapp_number) setProfileWhatsapp(profile.whatsapp_number);
                if (profile.payment_info) {
                    try {
                        // Intentar parsear si es JSON, sino usar fallback creando desde texto antiguo (retrocompatibilidad)
                        if (profile.payment_info.startsWith('[')) {
                            setProfilePaymentOptions(JSON.parse(profile.payment_info));
                        } else {
                            // Texto antiguo separado por saltos de línea
                            const lines = profile.payment_info.split('\n').filter(l => l.trim() !== '');
                            const options = lines.map(line => {
                                const parts = line.split(':');
                                return {
                                    bank: parts[0]?.trim() || 'Nequi',
                                    number: parts[1]?.trim() || ''
                                };
                            });
                            setProfilePaymentOptions(options);
                        }
                    } catch (e) {
                        setProfilePaymentOptions([]);
                    }
                }
                if (profile.whatsapp_message_template) setProfileWaTemplate(profile.whatsapp_message_template);
            }
        };
        checkUserAndFetchRaffles();
    }, [navigate]);

    const fetchMyRaffles = async (userId) => {
        setIsLoadingRaffles(true);
        try {
            const { data, error } = await supabase
                .from('rifas')
                .select('*')
                .eq('organizer_id', userId)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setMyRaffles(data || []);
        } catch (error) {
            console.error('Error al descargar rifas:', error.message);
        } finally {
            setIsLoadingRaffles(false);
        }
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        navigate('/');
    };

    const handleCreateRaffle = async (e) => {
        e.preventDefault();
        setIsCreating(true);

        try {
            const { data: { session } } = await supabase.auth.getSession();
            const userId = session?.user?.id;

            if (!userId) {
                throw new Error('No estás logueado. Inicia sesión de nuevo.');
            }

            const payload = {
                organizer_id: userId,
                title: raffleTitle,
                description: raffleDescription,
                ticket_price: parseFloat(rafflePrice),
                icon: raffleIcon,
                lottery_type: raffleLottery,
                ticket_quantity: parseInt(raffleQuantity),
                play_date: raffleDate ? raffleDate : null,
            };

            if (editingId) {
                // Modo Edición
                const { error } = await supabase.from('rifas').update(payload).eq('id', editingId);
                if (error) throw error;
                alert("Rifa actualizada con éxito.");
            } else {
                // Modo Creación
                payload.is_paid = false;
                const { error } = await supabase.from('rifas').insert([payload]);
                if (error) throw error;
                alert("¡Rifa pre-creada con éxito! Revisa tu tarjeta de ventas.");
            }

            // Recargar rifas en lugar de solo meter en el array (más seguro tras editar)
            await fetchMyRaffles(userId);

            setShowRaffleForm(false);
            setEditingId(null);
            setRaffleTitle('');
            setRaffleDescription('');
            setRafflePrice('');
            setRaffleQuantity(100);
            setRaffleIcon('gift');

        } catch (err) {
            alert("Error inesperado: " + err.message);
        } finally {
            setIsCreating(false);
        }
    };

    const handleEditRaffle = (rifa) => {
        setEditingId(rifa.id);
        setRaffleTitle(rifa.title);
        setRaffleDescription(rifa.description);
        setRafflePrice(rifa.ticket_price.toString());
        setRaffleQuantity(rifa.ticket_quantity || 100);
        setRaffleIcon(rifa.icon || 'gift');
        setRaffleLottery(rifa.lottery_type || 'baloto');
        setRaffleDate(rifa.play_date || '');
        setShowRaffleForm(true);
        window.scrollTo(0, 0); // Ir arriba
    };

    const handleDeleteRaffle = async (rifaId, rifaTitle) => {
        if (!window.confirm(`¿Estás seguro de que quieres eliminar la rifa "${rifaTitle}"?\nEsto también borrará todos los números reservados de tus clientes.\nESTA ACCIÓN ES IRREVERSIBLE.`)) {
            return;
        }

        try {
            const { error } = await supabase.from('rifas').delete().eq('id', rifaId);
            if (error) throw error;

            // Actualizar el estado local
            setMyRaffles(myRaffles.filter(r => r.id !== rifaId));
        } catch (err) {
            alert("Error al eliminar la rifa: " + err.message);
        }
    };

    const handleAnnounceWinner = async (rifaId, rifaTitle) => {
        const winningNumber = window.prompt(`¿Cuál fue el número ganador para la rifa "${rifaTitle}"?`);
        if (winningNumber !== null) {
            if (window.confirm(`¿Estás 100% seguro de que el ganador es el número ${winningNumber}? Esto se publicará a todos tus clientes y es irreversible.`)) {
                try {
                    const { error } = await supabase.from('rifas').update({ winning_number: winningNumber }).eq('id', rifaId);
                    if (error) throw error;

                    // Actualizar estado local
                    setMyRaffles(myRaffles.map(r => r.id === rifaId ? { ...r, winning_number: winningNumber } : r));
                    alert("¡Ganador anunciado con éxito!");
                } catch (err) {
                    alert("Error al anunciar ganador: " + err.message);
                }
            }
        }
    };

    const handleShareRaffle = async (rifaId) => {
        const urlToShare = `${window.location.origin}/rifa/${rifaId}`;

        if (navigator.share) {
            try {
                await navigator.share({
                    title: 'Participa en mi Rifa',
                    text: '¡Mira esta rifa en RifaPro y aparta tu número rápidamente!',
                    url: urlToShare
                });
            } catch (error) {
                console.log('Error intentando compartir nativamente:', error);
            }
        } else {
            // Fallback para PCs antiguas
            try {
                await navigator.clipboard.writeText(urlToShare);
                alert("¡Enlace copiado al portapapeles! Ya puedes pegarlo y enviarlo.");
            } catch (err) {
                alert("Error al copiar enlace: " + err);
            }
        }
    };

    /**
     * Helper function to render correct Lucide icon component dynamically
     */
    const renderIcon = (iconString) => {
        switch (iconString) {
            case 'car': return <Car size={20} />;
            case 'smartphone': return <Smartphone size={20} />;
            case 'banknote': return <Banknote size={20} />;
            case 'monitor': return <MonitorPlay size={20} />;
            case 'gift':
            default: return <Gift size={20} />;
        }
    };

    const handleSaveProfile = async (e) => {
        e.preventDefault();
        setIsSavingProfile(true);
        try {
            const { error } = await supabase.from('profiles').update({
                full_name: profileFullName,
                whatsapp_number: profileWhatsapp,
                payment_info: JSON.stringify(profilePaymentOptions), // Guardamos como JSON en la base de datos
                whatsapp_message_template: profileWaTemplate
            }).eq('id', userId);

            if (error) throw error;
            alert("¡Ajustes de perfil guardados correctamente!");
        } catch (err) {
            alert("Error al guardar el perfil: " + err.message);
        } finally {
            setIsSavingProfile(false);
        }
    };

    /**
     * Abrir modal de pago para activar la Rifa (Suscripción/Premium)
     */
    const handlePaymentClick = (rifa) => {
        setRaffleToPay(rifa);
        setShowPaymentModal(true);
    };

    /**
     * Simular el procesamiento de una pasarela real (Wompi/ePayco/MercadoPago)
     */
    const handleProcessPayment = async (method) => {
        setIsProcessingPayment(true);
        // Simulamos el delay de conectarse al servidor bancario
        setTimeout(async () => {
            try {
                // Aquí iría la lógica real de crear una preferencia en MercadoPago o token en Wompi
                // Por ahora, simulamos directamente que el pago es exitoso en DB
                const { error } = await supabase.from('rifas').update({ is_paid: true }).eq('id', raffleToPay.id);
                if (error) throw error;

                alert(`¡Pago con ${method} exitoso! 🎉 Tu Rifa "${raffleToPay.title}" ahora es Premium.`);

                // Actualizar UI
                setMyRaffles(myRaffles.map(r => r.id === raffleToPay.id ? { ...r, is_paid: true } : r));
                setShowPaymentModal(false);
                setRaffleToPay(null);
            } catch (err) {
                alert("Error procesando pago: " + err.message);
            } finally {
                setIsProcessingPayment(false);
            }
        }, 2000);
    };

    return (
        <div className="dashboard-layout">

            {/* BARRA LATERAL (Sidebar) */}
            <aside className="dashboard-sidebar anim-slide-up stagger-1">
                {/* Título Sidebar */}
                <h2 className="premium-gradient-text" style={{ fontSize: '1.5rem', marginBottom: '2rem' }}>
                    Panel RifaPro
                </h2>
                {/* Menú de opciones */}
                <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <button
                        className="btn"
                        style={{ justifyContent: 'flex-start', backgroundColor: activeTab === 'raffles' ? 'var(--primary-color)' : 'transparent', color: activeTab === 'raffles' ? '#000' : 'var(--text-main)', border: activeTab === 'raffles' ? 'none' : '1px solid rgba(255,255,255,0.1)', gap: '8px' }}
                        onClick={() => setActiveTab('raffles')}
                    >
                        <LayoutGrid size={20} /> Mis Rifas
                    </button>

                    <button
                        className="btn"
                        style={{ justifyContent: 'flex-start', backgroundColor: activeTab === 'settings' ? 'var(--primary-color)' : 'transparent', color: activeTab === 'settings' ? '#000' : 'var(--text-main)', border: activeTab === 'settings' ? 'none' : '1px solid rgba(255,255,255,0.1)', gap: '8px' }}
                        onClick={() => setActiveTab('settings')}
                    >
                        <Settings size={20} /> Perfil y Ajustes
                    </button>

                    {/* Mostrar opción de Admin si el perfil lo tiene habilitado */}
                    {isAdminState && (
                        <button
                            className="btn"
                            style={{ justifyContent: 'flex-start', backgroundColor: 'transparent', color: '#ff6b6b', border: '1px solid #ff6b6b', gap: '8px', marginTop: '1rem' }}
                            onClick={() => navigate('/admin')}
                        >
                            <ShieldAlert size={20} /> Consola Admin
                        </button>
                    )}
                </nav>

                {/* Información del usuario al fondo de la barra lateral */}
                <div style={{ marginTop: 'auto', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '1rem' }}>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '0.75rem', wordBreak: 'break-all', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {organizerEmail}
                    </p>
                    <button
                        onClick={handleLogout}
                        className="btn btn-secondary"
                        style={{ width: '100%', gap: '8px', padding: '0.5rem' }}
                    >
                        <LogOut size={18} /> Salir
                    </button>
                </div>
            </aside>

            {/* CONTENIDO PRINCIPAL A LA DERECHA */}
            <main className="dashboard-main anim-slide-up stagger-2">

                {/* CONTENEDOR DE TRANSICIÓN PARA PESTAÑAS (Framer Motion feel) */}
                <div key={activeTab} className="anim-tab-content">
                    {activeTab === 'settings' ? (
                        <div className="card" style={{ maxWidth: '600px', margin: '0 auto' }}>
                            <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Settings size={28} color="var(--primary-color)" /> Ajustes de Perfil Anti-Fraude
                            </h2>
                            <p style={{ color: 'var(--text-muted)', marginBottom: '2rem', fontSize: '0.9rem' }}>
                                Esta información será pública y la verán tus clientes al abrir la grilla de tu rifa. Ayuda a generar confianza antes de que paguen.
                            </p>

                            <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                <div>
                                    <label style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '0.5rem', display: 'block' }}>
                                        Nombre Real del Organizador (Lo verán tus clientes)
                                    </label>
                                    <input
                                        type="text"
                                        className="input-field"
                                        placeholder="Ej: Juan Pérez / RifaPro Oficial"
                                        value={profileFullName}
                                        onChange={(e) => setProfileFullName(e.target.value)}
                                        required
                                    />
                                </div>

                                <div>
                                    <label style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '0.5rem', display: 'block' }}>
                                        Número de Contacto / WhatsApp público
                                    </label>
                                    <input
                                        type="tel"
                                        className="input-field"
                                        placeholder="Ej: +57 300 000 0000"
                                        value={profileWhatsapp}
                                        onChange={(e) => setProfileWhatsapp(e.target.value)}
                                        required
                                    />
                                </div>

                                <div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                        <label style={{ color: 'var(--text-muted)', fontSize: '0.9rem', display: 'block' }}>
                                            Cuentas de Cobro (Dónde te envían el dinero)
                                        </label>
                                        <button
                                            type="button"
                                            onClick={() => setProfilePaymentOptions([...profilePaymentOptions, { bank: 'Nequi', number: '' }])}
                                            style={{ backgroundColor: 'var(--primary-color)', color: '#000', border: 'none', borderRadius: '4px', padding: '0.25rem 0.5rem', fontSize: '0.8rem', cursor: 'pointer', fontWeight: 'bold' }}
                                        >
                                            + Añadir Método
                                        </button>
                                    </div>

                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                        {profilePaymentOptions.length === 0 && (
                                            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontStyle: 'italic', padding: '0.5rem 0' }}>No has agregado medios de pago aún.</p>
                                        )}
                                        {profilePaymentOptions.map((opt, index) => (
                                            <div key={index} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', backgroundColor: 'var(--bg-tertiary)', padding: '0.5rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                                <select
                                                    className="input-field"
                                                    style={{ flex: 1, padding: '0.5rem', margin: 0 }}
                                                    value={opt.bank}
                                                    onChange={(e) => {
                                                        const no = [...profilePaymentOptions];
                                                        no[index].bank = e.target.value;
                                                        setProfilePaymentOptions(no);
                                                    }}
                                                >
                                                    <option value="Nequi">Nequi</option>
                                                    <option value="Daviplata">Daviplata</option>
                                                    <option value="Ahorros Bancolombia">Ahorros Bancolombia</option>
                                                    <option value="NuBank">NuBank</option>
                                                    <option value="Dale!">Dale!</option>
                                                    <option value="Efecty">Efecty</option>
                                                    <option value="Efectivo en Persona">Efectivo en Persona</option>
                                                    <option value="Otro Medio (Transfiya)">Otro Medio (Transfiya)</option>
                                                </select>
                                                <input
                                                    type="text"
                                                    className="input-field"
                                                    style={{ flex: 2, padding: '0.5rem', margin: 0 }}
                                                    placeholder="Ej: 300 000 0000"
                                                    value={opt.number}
                                                    onChange={(e) => {
                                                        const no = [...profilePaymentOptions];
                                                        no[index].number = e.target.value;
                                                        setProfilePaymentOptions(no);
                                                    }}
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        const no = profilePaymentOptions.filter((_, i) => i !== index);
                                                        setProfilePaymentOptions(no);
                                                    }}
                                                    style={{ background: 'none', border: 'none', color: '#ff6b6b', cursor: 'pointer', padding: '0.5rem' }}
                                                    title="Eliminar este método"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div style={{ backgroundColor: 'rgba(34, 211, 238, 0.05)', padding: '1.5rem', borderRadius: '12px', border: '1px solid rgba(34, 211, 238, 0.2)' }}>
                                    <label style={{ color: 'var(--text-main)', fontSize: '1rem', fontWeight: 'bold', marginBottom: '0.5rem', display: 'block' }}>
                                        Mensaje Automático de WhatsApp
                                    </label>
                                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1rem' }}>
                                        Este es el mensaje que se armará automáticamente cuando tu cliente dé clic en el botón de WhatsApp tras reservar.<br />
                                        <strong>Puedes usar estas etiquetas exactas (incluyendo los corchetes) para que se reemplacen solas:</strong><br />
                                        <code style={{ color: 'var(--primary-color)' }}>[NUMERO]</code>, <code style={{ color: 'var(--primary-color)' }}>[RIFA]</code>, <code style={{ color: 'var(--primary-color)' }}>[NOMBRE]</code>, <code style={{ color: 'var(--primary-color)' }}>[MEDIO_PAGO]</code>
                                    </p>
                                    <textarea
                                        className="input-field"
                                        style={{ minHeight: '100px', resize: 'vertical', fontFamily: 'monospace', fontSize: '0.9rem' }}
                                        placeholder='¡Hola! Acabo de reservar el número *[NUMERO]* en tu rifa "[RIFA]". Mi nombre es [NOMBRE]. Aquí te envío el comprobante de pago de [MEDIO_PAGO]:'
                                        value={profileWaTemplate}
                                        onChange={(e) => setProfileWaTemplate(e.target.value)}
                                    />
                                </div>

                                <button
                                    type="submit"
                                    className="btn btn-primary"
                                    disabled={isSavingProfile}
                                    style={{ justifyContent: 'center', padding: '1rem', marginTop: '1rem', gap: '8px' }}
                                >
                                    {isSavingProfile ? <><Loader2 className="animate-spin" size={20} /> Guardando Perfil...</> : <><Save size={20} /> Guardar Ajustes</>}
                                </button>
                            </form>
                        </div>
                    ) : (
                        <>
                            {/* Cabecera del Dashboard principal */}
                            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
                                <div>
                                    <h1 style={{ fontSize: '2rem', fontWeight: 'bold' }}>Mis Rifas (Grillas de 0-99)</h1>
                                    <p style={{ color: 'var(--text-muted)' }}>Administra y controla los números vendidos.</p>
                                </div>

                                {/* Botón para abrir o esconder el formulario de creación */}
                                <button
                                    className={`btn btn-primary ${!showRaffleForm ? 'anim-bounce' : ''}`}
                                    style={{ gap: '8px' }}
                                    onClick={() => {
                                        if (showRaffleForm) {
                                            setShowRaffleForm(false);
                                        } else {
                                            setEditingId(null);
                                            setRaffleTitle('');
                                            setRaffleDescription('');
                                            setRafflePrice('');
                                            setRaffleQuantity(100);
                                            setRaffleDate('');
                                            setShowRaffleForm(true);
                                        }
                                    }}
                                >
                                    {showRaffleForm ? (
                                        // Mostrar "Cerrar" si el formulario está abierto
                                        <><X size={20} /> Cancelar</>
                                    ) : (
                                        // Mostrar el estándar "Crear"
                                        <><PlusCircle size={20} /> Crear Nueva Rifa</>
                                    )}
                                </button>
                            </header>

                            {/* ZONA DINÁMICA */}
                            {showRaffleForm ? (

                                <div className="card" style={{ maxWidth: '600px', margin: '0 auto', animation: 'fadeIn 0.3s ease-in' }}>
                                    <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem' }}>Configura tu nueva Rifa</h2>

                                    <form onSubmit={handleCreateRaffle} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                                        <div>
                                            <label style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '0.5rem', display: 'block' }}>
                                                ¿Qué vas a rifar? (Título corto)
                                            </label>
                                            <input
                                                type="text"
                                                className="input-field"
                                                placeholder="Ej: Moto AKT, Celular Xiaomi, $1M en efectivo..."
                                                value={raffleTitle}
                                                onChange={(e) => setRaffleTitle(e.target.value)}
                                                required
                                            />
                                        </div>

                                        {/* Selector de Íconos para la Rifa */}
                                        <div>
                                            <label style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '0.5rem', display: 'block' }}>
                                                Elige un icono que represente el premio:
                                            </label>
                                            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                                {availableIcons.map((item) => (
                                                    <button
                                                        key={item.id}
                                                        type="button"
                                                        onClick={() => setRaffleIcon(item.id)}
                                                        style={{
                                                            padding: '0.75rem',
                                                            borderRadius: '8px',
                                                            border: `2px solid ${raffleIcon === item.id ? 'var(--primary-color)' : 'rgba(255,255,255,0.1)'}`,
                                                            backgroundColor: raffleIcon === item.id ? 'rgba(34, 211, 238, 0.1)' : 'var(--bg-secondary)',
                                                            color: raffleIcon === item.id ? 'var(--primary-color)' : 'var(--text-primary)',
                                                            cursor: 'pointer',
                                                            display: 'flex',
                                                            flexDirection: 'column',
                                                            alignItems: 'center',
                                                            gap: '0.5rem',
                                                            flex: 1,
                                                            minWidth: '80px',
                                                            transition: 'all 0.2s ease'
                                                        }}
                                                    >
                                                        {item.icon}
                                                        <span style={{ fontSize: '0.75rem' }}>{item.label}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        <div>
                                            <label style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '0.5rem', display: 'block' }}>
                                                Descríbele a tu cliente la dinámica (Sorteo, condiciones)
                                            </label>
                                            <textarea
                                                className="input-field"
                                                style={{ minHeight: '80px', resize: 'vertical' }}
                                                placeholder="Se juega con las 2 últimas cifras del Premio Mayor del Baloto este sábado..."
                                                value={raffleDescription}
                                                onChange={(e) => setRaffleDescription(e.target.value)}
                                                required
                                            />
                                        </div>

                                        <div>
                                            <label style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '0.5rem', display: 'block' }}>
                                                Valor por cada número (00 al 99) en pesos COP.
                                            </label>
                                            <input
                                                type="number"
                                                min="500"
                                                step="500"
                                                className="input-field"
                                                placeholder="Ej: 5000"
                                                value={rafflePrice}
                                                onChange={(e) => setRafflePrice(e.target.value)}
                                                required
                                            />
                                        </div>

                                        <div>
                                            <label style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '0.5rem', display: 'block' }}>
                                                Cantidad de Boletas (Ej. 100, 500, 1000)
                                            </label>
                                            <input
                                                type="number"
                                                min="10"
                                                max="10000"
                                                className="input-field"
                                                placeholder="Ej: 100"
                                                value={raffleQuantity}
                                                onChange={(e) => setRaffleQuantity(e.target.value)}
                                                required
                                            />
                                        </div>

                                        <div>
                                            <label style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '0.5rem', display: 'block' }}>
                                                Lotería con la que Juega
                                            </label>
                                            <input
                                                type="text"
                                                className="input-field"
                                                value={raffleLottery}
                                                onChange={(e) => setRaffleLottery(e.target.value)}
                                                placeholder="Ej. Lotería de Medellín, Sinuano, etc."
                                                required
                                            />
                                        </div>

                                        <div>
                                            <label style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '0.5rem', display: 'block' }}>
                                                Fecha del Sorteo
                                            </label>
                                            <input
                                                type="date"
                                                className="input-field"
                                                value={raffleDate}
                                                onChange={(e) => setRaffleDate(e.target.value)}
                                                required
                                            />
                                        </div>

                                        <div style={{ padding: '1rem', backgroundColor: 'rgba(34, 211, 238, 0.05)', borderRadius: '8px', border: '1px solid rgba(34, 211, 238, 0.2)' }}>
                                            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                                Al crear, ganarás una grilla privada visual de tu rifa. Para activar las ventas públicas completas y pagos, la tarifa es de <strong>$10,000 COP</strong> por grilla que puedes pagar luego ver como queda!
                                            </p>
                                        </div>

                                        <button
                                            type="submit"
                                            className="btn btn-primary"
                                            disabled={isCreating}
                                            style={{ justifyContent: 'center', padding: '1rem', gap: '8px' }}
                                        >
                                            {isCreating ? <><Loader2 className="animate-spin" size={20} /> Guardando en Servidor...</> : 'Guardar y Pre-Ver Mi Grilla'}
                                        </button>
                                    </form>
                                </div>

                            ) : (

                                /* ZONA DE VISUALIZACIÓN DE RIFAS */
                                <div>
                                    {isLoadingRaffles ? (
                                        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                                            Cargando tus rifas desde la base de datos...
                                        </div>
                                    ) : myRaffles.length === 0 ? (
                                        <div className="card" style={{ textAlign: 'center', padding: '4rem 1rem', animation: 'fadeIn 0.3s ease-in' }}>
                                            <LayoutGrid size={48} color="var(--text-muted)" style={{ margin: '0 auto 1rem auto', opacity: 0.5 }} />
                                            <h3>Aún no tienes rifas activas</h3>
                                            <p style={{ color: 'var(--text-muted)', maxWidth: '400px', margin: '0.5rem auto 1.5rem auto' }}>
                                                Haz clic en "Crear Nueva Rifa" arriba para construir tu primera grilla digital (00 al 99).
                                            </p>
                                            <button className="btn btn-primary anim-pulse" onClick={() => setShowRaffleForm(true)}>
                                                Crear mi primera grilla pre-visual
                                            </button>
                                        </div>
                                    ) : (
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem', animation: 'fadeIn 0.3s ease-in' }}>

                                            {myRaffles.map((rifa) => (
                                                <div key={rifa.id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1.5rem', border: rifa.is_paid ? '1px solid var(--primary-color)' : '1px solid rgba(255,255,255,0.05)' }}>
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '0.25rem' }}>
                                                        <h3 style={{ fontSize: '1.25rem', display: 'flex', alignItems: 'flex-start', gap: '8px', margin: 0, wordBreak: 'break-word' }}>
                                                            <span style={{ marginTop: '2px' }}>{renderIcon(rifa.icon)}</span>
                                                            <span>{rifa.title}</span>
                                                        </h3>
                                                        <div style={{ display: 'inline-block' }}>
                                                            {rifa.is_paid ? (
                                                                <span style={{ fontSize: '0.75rem', backgroundColor: 'rgba(34, 211, 238, 0.1)', color: 'var(--primary-color)', padding: '0.25rem 0.5rem', borderRadius: '4px', border: '1px solid rgba(34, 211, 238, 0.2)' }}>
                                                                    Premium (Activa)
                                                                </span>
                                                            ) : (
                                                                <span style={{ fontSize: '0.75rem', backgroundColor: 'rgba(255, 100, 100, 0.1)', color: '#ff6b6b', padding: '0.25rem 0.5rem', borderRadius: '4px', border: '1px solid #ff6b6b' }}>
                                                                    Modo Prueba (Incompleta)
                                                                </span>
                                                            )}
                                                        </div>
                                                        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '0.5rem', marginBottom: 0 }}>
                                                            <CalendarDays size={14} /> Creada: {new Date(rifa.created_at).toLocaleDateString()}
                                                        </p>
                                                    </div>

                                                    <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', flex: 1, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                                        {rifa.description}
                                                    </p>

                                                    <div style={{ backgroundColor: 'var(--bg-primary)', padding: '0.75rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)', textAlign: 'center' }}>
                                                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block' }}>Valor Boleta</span>
                                                        <strong style={{ fontSize: '1.1rem', color: 'var(--text-primary)' }}>
                                                            ${parseFloat(rifa.ticket_price).toLocaleString('es-CO')} COP
                                                        </strong>
                                                    </div>

                                                    {rifa.play_date && (
                                                        <p style={{ fontSize: '0.85rem', color: 'var(--text-primary)', backgroundColor: 'rgba(34, 211, 238, 0.1)', padding: '0.5rem', borderRadius: '4px', textAlign: 'center', border: '1px solid rgba(34, 211, 238, 0.2)' }}>
                                                            Sorteo con <strong>{getLotteryLabel(rifa.lottery_type)}</strong> el {new Date(rifa.play_date + 'T00:00:00').toLocaleDateString()}
                                                        </p>
                                                    )}

                                                    {/* Nuevo: Muestra el ganador si existe */}
                                                    {rifa.winning_number && (
                                                        <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.15)', padding: '0.75rem', borderRadius: '8px', border: '1px solid #10b981', textAlign: 'center', animation: 'pulse 2s infinite' }}>
                                                            <span style={{ fontSize: '0.8rem', color: '#10b981', display: 'block', fontWeight: 'bold' }}>🎉 NÚMERO GANADOR 🎉</span>
                                                            <strong style={{ fontSize: '1.5rem', color: '#10b981' }}>
                                                                {rifa.winning_number}
                                                            </strong>
                                                        </div>
                                                    )}

                                                    {/* Enlace visible para copiar de inmediato */}
                                                    <div style={{ backgroundColor: 'rgba(0,0,0,0.2)', padding: '0.75rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)', marginTop: '1rem', width: '100%', overflow: 'hidden' }}>
                                                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>Enlace de Compra para Clientes:</span>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                            <input
                                                                type="text"
                                                                readOnly
                                                                value={`${window.location.origin}/rifa/${rifa.id}`}
                                                                style={{ flex: 1, backgroundColor: 'transparent', border: 'none', color: 'var(--primary-color)', fontSize: '0.85rem', outline: 'none', cursor: 'text' }}
                                                                onClick={(e) => e.target.select()}
                                                            />
                                                            <button
                                                                className="btn"
                                                                style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-main)' }}
                                                                onClick={() => {
                                                                    navigator.clipboard.writeText(`${window.location.origin}/rifa/${rifa.id}`);
                                                                    alert("¡Enlace copiado!");
                                                                }}
                                                            >
                                                                Copiar
                                                            </button>
                                                        </div>
                                                    </div>

                                                    {/* Acciones */}
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '1rem' }}>
                                                        {!rifa.is_paid && (
                                                            <button
                                                                className="btn"
                                                                style={{ width: '100%', backgroundColor: '#ff6b6b', color: '#fff', justifyContent: 'center', padding: '0.85rem', fontWeight: 'bold' }}
                                                                onClick={() => handlePaymentClick(rifa)}
                                                            >
                                                                Pagar para Activar Rifa ($10.000)
                                                            </button>
                                                        )}

                                                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                                            <button
                                                                className="btn"
                                                                style={{ flex: '1 1 45%', border: '1px solid var(--primary-color)', color: 'var(--primary-color)', backgroundColor: 'transparent', gap: '8px', justifyContent: 'center', padding: '0.75rem' }}
                                                                onClick={() => navigate(`/rifa/${rifa.id}`)}
                                                            >
                                                                <ExternalLink size={16} /> Ver Vista
                                                            </button>
                                                            <button
                                                                className="btn"
                                                                style={{ flex: '1 1 45%', backgroundColor: 'var(--primary-color)', color: '#000', gap: '8px', justifyContent: 'center', padding: '0.75rem', fontWeight: 'bold' }}
                                                                onClick={() => handleShareRaffle(rifa.id)}
                                                            >
                                                                <Share2 size={16} /> Compartir
                                                            </button>
                                                        </div>

                                                        {/* Nuevos botones de Edición/Borrado */}
                                                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                                            {rifa.is_paid ? (
                                                                <>
                                                                    <button
                                                                        className="btn"
                                                                        style={{ flex: '1 1 100%', backgroundColor: 'var(--primary-color)', color: '#000', justifyContent: 'center', gap: '8px', padding: '0.75rem', fontWeight: 'bold' }}
                                                                        onClick={() => navigate(`/manage/${rifa.id}`)}
                                                                    >
                                                                        <Users size={16} /> Gestionar Boletas
                                                                    </button>
                                                                    <button
                                                                        className="btn"
                                                                        style={{ flex: '1 1 45%', backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-main)', justifyContent: 'center', gap: '8px' }}
                                                                        onClick={() => handleEditRaffle(rifa)}
                                                                    >
                                                                        <Edit2 size={16} /> Editar
                                                                    </button>
                                                                </>
                                                            ) : (
                                                                <div style={{ flex: '1 1 100%', textAlign: 'center', padding: '0.5rem', backgroundColor: 'rgba(255, 107, 107, 0.1)', color: '#ff6b6b', borderRadius: '8px', border: '1px solid rgba(255, 107, 107, 0.2)', fontSize: '0.85rem' }}>
                                                                    🔒 Paga para desbloquear Configuración y Gestión de Boletas
                                                                </div>
                                                            )}

                                                            <button
                                                                className="btn"
                                                                style={{ flex: rifa.is_paid ? '1 1 45%' : '1 1 100%', backgroundColor: 'rgba(255, 107, 107, 0.1)', color: '#ff6b6b', border: '1px solid rgba(255, 107, 107, 0.2)', justifyContent: 'center', gap: '8px' }}
                                                                onClick={() => handleDeleteRaffle(rifa.id, rifa.title)}
                                                            >
                                                                <Trash2 size={16} /> Eliminar
                                                            </button>

                                                            {/* Botón de anunciar ganador (Solo si es premium y no hay ganador aún) */}
                                                            {rifa.is_paid && !rifa.winning_number && (
                                                                <button
                                                                    className="btn"
                                                                    style={{ flex: '1 1 100%', backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.3)', justifyContent: 'center', gap: '8px', marginTop: '0.25rem' }}
                                                                    onClick={() => handleAnnounceWinner(rifa.id, rifa.title)}
                                                                >
                                                                    <Trophy size={16} /> Anunciar Ganador
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}

                                        </div>
                                    )}
                                </div>

                            )}
                        </>
                    )}
                </div>

                {/* ======= MODAL DE PASARELA DE PAGOS ======= */}
                {showPaymentModal && raffleToPay && (
                    <div className="modal-overlay" onClick={() => !isProcessingPayment && setShowPaymentModal(false)}>
                        <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '400px', textAlign: 'center' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                                <h3 style={{ margin: 0, fontSize: '1.25rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <ShieldAlert size={20} color="var(--primary-color)" /> Pasarela Segura
                                </h3>
                                {!isProcessingPayment && (
                                    <button onClick={() => setShowPaymentModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.5rem' }}>
                                        &times;
                                    </button>
                                )}
                            </div>

                            <div style={{ backgroundColor: 'rgba(34, 211, 238, 0.05)', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(34, 211, 238, 0.2)', marginBottom: '1.5rem' }}>
                                <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', margin: 0 }}>Vas a activar la rifa:</p>
                                <strong style={{ fontSize: '1.2rem', color: 'var(--text-primary)', display: 'block', marginTop: '0.5rem' }}>{raffleToPay.title}</strong>
                                <hr style={{ border: 'none', borderTop: '1px solid rgba(255,255,255,0.05)', margin: '1rem 0' }} />
                                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Monto a pagar:</span>
                                <h2 style={{ color: 'var(--primary-color)', fontSize: '2rem', margin: '0.25rem 0 0 0' }}>$10.000 <small style={{ fontSize: '1rem' }}>COP</small></h2>
                            </div>

                            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1rem' }}>Selecciona tu método de pago preferido para conectarte a la pasarela real:</p>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                <button className="btn" disabled={isProcessingPayment} onClick={() => handleProcessPayment('Wompi')} style={{ justifyContent: 'center', backgroundColor: '#09083c', color: '#fff', padding: '1rem', fontWeight: 'bold' }}>
                                    {isProcessingPayment ? <Loader2 className="animate-spin" size={20} /> : 'Pagar con Wompi (Nequi / PSE)'}
                                </button>
                                <button className="btn" disabled={isProcessingPayment} onClick={() => handleProcessPayment('MercadoPago')} style={{ justifyContent: 'center', backgroundColor: '#009ee3', color: '#fff', padding: '1rem', fontWeight: 'bold' }}>
                                    {isProcessingPayment ? <Loader2 className="animate-spin" size={20} /> : 'Pagar con MercadoPago'}
                                </button>

                                <button className="btn btn-secondary" disabled={isProcessingPayment} onClick={() => setShowPaymentModal(false)} style={{ justifyContent: 'center', marginTop: '0.5rem' }}>
                                    Cancelar
                                </button>
                            </div>
                        </div>
                    </div>
                )}

            </main>
        </div>
    );
}

export default Dashboard;
