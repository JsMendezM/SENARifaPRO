import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { Gift, Car, Smartphone, Banknote, MonitorPlay, ArrowLeft, CheckCircle2, Lock, Trophy, ShieldCheck, CreditCard, Loader2, Download, Share2 } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import confetti from 'canvas-confetti'; // Animación visual

/**
 * Grilla Pública (Vista para los participantes).
 * Esta es la pantalla que ve el cliente cuando se le pasa el enlace.
 */
function PublicGrid() {
    const { id } = useParams(); // Obtenemos el ID de la rifa de la URL

    // Estado de la Rifa
    const [rifa, setRifa] = useState(null);
    const [tickets, setTickets] = useState([]); // Nuevo: Boletas ya tomadas
    const [organizerProfile, setOrganizerProfile] = useState(null); // Nuevo: Datos Anti-Fraude
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    // Estado del número seleccionado por el usuario
    const [selectedNumber, setSelectedNumber] = useState(null);
    const [buyerName, setBuyerName] = useState('');
    const [buyerPhone, setBuyerPhone] = useState('');
    const [paymentMethod, setPaymentMethod] = useState(''); // Añadido: Método de Pago
    const [isReserving, setIsReserving] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);

    // PWA Install Hook
    const { isInstallable, promptInstall } = usePWAInstall();

    // Cantidad dinámica de números y rellenado con ceros según la configuración de la rifa
    const ticketQty = rifa?.ticket_quantity || 100;
    const padLength = Math.max(2, String(ticketQty - 1).length);
    const numbers = Array.from({ length: ticketQty }, (_, i) => i.toString().padStart(padLength, '0'));

    // Lista de Loterías de Colombia para formatear visualmente
    const lotteries = [
        { id: 'baloto', label: 'Baloto' },
        { id: 'cruz_roja', label: 'Lotería Cruz Roja' },
        { id: 'bogota', label: 'Lotería de Bogotá' },
        { id: 'medellin', label: 'Lotería de Medellín' },
        { id: 'valle', label: 'Lotería del Valle' },
        { id: 'boyaca', label: 'Lotería de Boyacá' },
        { id: 'chontico', label: 'Chontico (Día/Noche)' },
        { id: 'dorado', label: 'El Dorado' },
        { id: 'cafeterito', label: 'Cafeterito' },
        { id: 'paisita', label: 'Paisita' }
    ];

    /**
     * MEJORA DE RENDIMIENTO:
     * Convertir el arreglo de tickets en un Diccionario (Hash Map) para búsquedas O(1).
     * Evita iterar sobre todo el arreglo 100 veces, pasando de O(N^2) a O(N).
     * React.useMemo asegura que solo se recalcule si cambia la variable `tickets`.
     */
    const ticketsMap = React.useMemo(() => {
        const dictionary = {};
        for (const ticket of tickets) {
            dictionary[ticket.number] = ticket;
        }
        return dictionary;
    }, [tickets]);

    const fetchRifaDetails = async () => {
        setIsLoading(true);
        try {
            // 1. Cargar la configuración de la Rifa
            const { data: rifaData, error: rifaError } = await supabase
                .from('rifas')
                .select('*')
                .eq('id', id)
                .single();

            if (rifaError) throw rifaError;
            if (!rifaData) throw new Error("Rifa no encontrada");

            setRifa(rifaData);

            // 2. Cargar perfil del organizador
            const { data: profileData } = await supabase
                .from('profiles')
                .select('full_name, whatsapp_number, payment_info, is_verified, whatsapp_message_template') // Añadido: template
                .eq('id', rifaData.organizer_id)
                .single();

            if (profileData) {
                setOrganizerProfile(profileData);
            }

            // 3. Cargar los números ya apartados de esta rifa
            const { data: ticketsData, error: ticketsError } = await supabase
                .from('tickets')
                .select('*')
                .eq('rifa_id', id);

            if (ticketsError) throw ticketsError;
            setTickets(ticketsData || []);

        } catch (err) {
            console.error("Error cargando la rifa:", err);
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchRifaDetails();
    }, [id]);

    // Disparar confeti cuando exista un número ganador
    useEffect(() => {
        if (rifa?.winning_number) {
            confetti({
                particleCount: 150,
                spread: 80,
                origin: { y: 0.6 },
                colors: ['#10b981', '#ffffff', '#22d3ee']
            });
        }
    }, [rifa?.winning_number]);

    const renderIcon = (iconString) => {
        switch (iconString) {
            case 'car': return <Car size={48} color="var(--primary-color)" />;
            case 'smartphone': return <Smartphone size={48} color="var(--primary-color)" />;
            case 'banknote': return <Banknote size={48} color="var(--primary-color)" />;
            case 'monitor': return <MonitorPlay size={48} color="var(--primary-color)" />;
            case 'gift':
            default: return <Gift size={48} color="var(--primary-color)" />;
        }
    };

    const handleSelectNumber = (num) => {
        setSelectedNumber(num);
        setShowSuccess(false);
    };

    const handleReserveAndPay = async (e) => {
        e.preventDefault();
        setIsReserving(true);

        try {
            // Guardar en la DB
            const { error: reserveError } = await supabase.from('tickets').insert([{
                rifa_id: rifa.id,
                number: selectedNumber,
                buyer_name: buyerName,
                buyer_phone: buyerPhone,
                payment_method: paymentMethod, // Añadido: Guardar método de pago
                status: 'reserved',
                created_at: new Date().toISOString() // Añadimos fecha exacta para evitar Invalid Date
            }]);

            if (reserveError) {
                // Si el error es de UNIQUE Constraint (El número ya se tomó hace un milisegundo)
                if (reserveError.code === '23505') {
                    throw new Error("¡Lo sentimos! Alguien más acaba de separar este número exactamente al mismo tiempo que tú. Por favor elige otro.");
                }
                throw reserveError;
            }

            // Actualizar la grilla local inmediatamente sin recargar
            setTickets([...tickets, {
                number: selectedNumber,
                status: 'reserved',
                buyer_name: buyerName,
                payment_method: paymentMethod,
                created_at: new Date().toISOString()
            }]);
            setShowSuccess(true);

            // Redirección Automática a WhatsApp
            if (organizerProfile?.whatsapp_number) {
                let cleanPhone = organizerProfile.whatsapp_number.replace(/\D/g, '');
                if (cleanPhone.length === 10) cleanPhone = '57' + cleanPhone;

                // Armar el mensaje usando la plantilla del organizador, o usar una por defecto
                const template = organizerProfile.whatsapp_message_template || '¡Hola! Acabo de reservar el número *[NUMERO]* en tu rifa "[RIFA]". Mi nombre es [NOMBRE]. Aquí te envío el comprobante de pago de [MEDIO_PAGO]:';

                const customMessage = template
                    .replace(/\[NUMERO\]/g, selectedNumber)
                    .replace(/\[RIFA\]/g, rifa?.title || 'Rifa')
                    .replace(/\[NOMBRE\]/g, buyerName)
                    .replace(/\[MEDIO_PAGO\]/g, paymentMethod || 'Traspaso');

                // api.whatsapp.com/send es el enlace universal que detecta automáticamente:
                // 1. Si estás en celular -> Abre la app
                // 2. Si estás en PC -> Abre la app de escritorio (si la tienes) o te da el botón de "WhatsApp Web"
                // REMOVIDO window.open automático por petición del usuario - ahora el cliente presiona el botón en la tarjeta de éxito
            }

        } catch (err) {
            console.error("Error reservando:", err);
            alert(err.message || "Ocurrió un error separando tu boleta.");
        } finally {
            setIsReserving(false);
        }
    };

    const handleShareRaffle = async () => {
        const urlToShare = window.location.href;

        if (navigator.share) {
            try {
                await navigator.share({
                    title: rifa?.title || 'Participa en mi Rifa',
                    text: '¡Mira esta rifa en RifaPro y aparta tu número rápidamente!',
                    url: urlToShare
                });
            } catch (error) {
                console.log('Error compartiendo nativamente:', error);
            }
        } else {
            try {
                await navigator.clipboard.writeText(urlToShare);
                alert("¡Enlace copiado al portapapeles! Ya puedes pegarlo y enviarlo.");
            } catch (err) {
                alert("Error al copiar enlace: " + err);
            }
        }
    };

    if (isLoading) return <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>Cargando grilla...</div>;

    if (error) return (
        <div style={{ textAlign: 'center', padding: '4rem' }}>
            <h2>🚫 Rifa no encontrada</h2>
            <p style={{ color: 'var(--text-muted)' }}>{error}</p>
            <Link to="/" style={{ color: 'var(--primary-color)', marginTop: '1rem', display: 'inline-block' }}>Volver al inicio</Link>
        </div>
    );

    return (
        <div className="container" style={{ padding: '2rem 1rem', maxWidth: '800px' }}>

            {/* Banner superior opcional para Instalar la PWA */}
            {isInstallable && (
                <div className="anim-slide-up" style={{ backgroundColor: 'rgba(34, 211, 238, 0.1)', border: '1px solid var(--primary-color)', borderRadius: '8px', padding: '0.75rem', marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Download size={20} color="var(--primary-color)" />
                        <span style={{ fontSize: '0.9rem', color: 'var(--text-main)' }}>Prueba nuestra app <strong>RifaPro</strong></span>
                    </div>
                    <button onClick={promptInstall} className="btn btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}>
                        Instalar Gratis
                    </button>
                </div>
            )}

            {/* Aviso de Modo Prueba si la rifa no ha sido activada por el organizador */}
            {!rifa.is_paid && (
                <div style={{ backgroundColor: 'rgba(255, 100, 100, 0.1)', border: '1px solid #ff6b6b', borderRadius: '8px', padding: '1rem', marginBottom: '2rem', textAlign: 'center' }}>
                    <p style={{ color: '#ff6b6b', fontWeight: 'bold', margin: 0 }}>⚠️ MODO DE PRUEBA ACTIVO</p>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '0.5rem 0 0 0' }}>El organizador aún no ha activado los pagos de esta rifa. Esta es una vista previa de cómo la verá el cliente.</p>
                </div>
            )}

            {/* Cabecera Pública de la Rifa - Ocultar si hay ganador */}
            {!rifa.winning_number && (
                <header className="anim-slide-up stagger-1" style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
                        {renderIcon(rifa.icon)}
                    </div>
                    <h1 className="premium-gradient-text" style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>
                        {rifa.title}
                    </h1>
                    <p style={{ fontSize: '1.2rem', color: 'var(--text-main)', maxWidth: '600px', margin: '0 auto' }}>
                        {rifa.description}
                    </p>

                    {rifa.play_date && (
                        <div style={{ marginTop: '1rem' }}>
                            <span style={{ fontSize: '0.9rem', color: 'var(--primary-color)', backgroundColor: 'rgba(34, 211, 238, 0.1)', padding: '0.5rem 1rem', borderRadius: '50px', border: '1px solid rgba(34, 211, 238, 0.2)' }}>
                                🎉 Juega con <strong>{lotteries.find(l => l.id === rifa.lottery_type)?.label || rifa.lottery_type}</strong> el {new Date(rifa.play_date + 'T00:00:00').toLocaleDateString()}
                            </span>
                        </div>
                    )}

                    <div style={{ display: 'inline-block', backgroundColor: 'var(--bg-secondary)', padding: '0.5rem 1.5rem', borderRadius: '20px', marginTop: '1.5rem', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <p style={{ color: 'var(--text-muted)', margin: 0, fontWeight: 'bold' }}>
                            Valor boleta: <span style={{ color: 'var(--primary-color)' }}>${parseFloat(rifa.ticket_price).toLocaleString('es-CO')} COP</span>
                        </p>
                    </div>

                    <div style={{ marginTop: '1.5rem' }}>
                        <button
                            onClick={handleShareRaffle}
                            className="btn"
                            style={{ backgroundColor: 'rgba(34, 211, 238, 0.1)', color: 'var(--primary-color)', border: '1px solid rgba(34, 211, 238, 0.3)', padding: '0.5rem 1.5rem', fontSize: '0.9rem', gap: '8px', margin: '0 auto' }}
                        >
                            <Share2 size={16} /> Compartir esta Rifa
                        </button>
                    </div>
                </header>
            )}

            {/* Formulario/Modal Flotante de Compra (AHORA ES UN POP-UP) */}
            {selectedNumber && !showSuccess && (
                <div className="modal-overlay" onClick={() => { setShowSuccess(false); setSelectedNumber(null); }}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                            <h3 style={{ margin: 0, fontSize: '1.25rem' }}>
                                Apartar el número <strong style={{ color: 'var(--primary-color)', fontSize: '1.5rem' }}>{selectedNumber}</strong>
                            </h3>
                            <button onClick={() => { setShowSuccess(false); setSelectedNumber(null); }} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.5rem', lineHeight: 1 }}>
                                &times;
                            </button>
                        </div>

                        <form onSubmit={handleReserveAndPay} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div>
                                <input type="text" className="input-field" placeholder="Tu Nombre Completo" required value={buyerName} onChange={(e) => setBuyerName(e.target.value)} />
                            </div>
                            <div>
                                <input type="tel" className="input-field" placeholder="Tu WhatsApp (Ej. 300...)" required value={buyerPhone} onChange={(e) => setBuyerPhone(e.target.value)} />
                            </div>
                            <div>
                                <select className="input-field" required value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
                                    <option value="" disabled>Selecciona cómo vas a pagar</option>

                                    {/* MÉTODOS DE PAGO DINÁMICOS DESDE EL PERFIL DEL ORGANIZADOR */}
                                    {organizerProfile?.payment_info ? (
                                        (() => {
                                            try {
                                                // Try parsing JSON format first
                                                let options = [];
                                                if (organizerProfile.payment_info.startsWith('[')) {
                                                    options = JSON.parse(organizerProfile.payment_info);
                                                } else {
                                                    // Fallback to legacy text
                                                    const lines = organizerProfile.payment_info.split('\n').filter(l => l.trim() !== '');
                                                    options = lines.map(line => {
                                                        const parts = line.split(':');
                                                        return { bank: parts[0]?.trim() || 'Nequi', number: parts[1]?.trim() || '' };
                                                    });
                                                }
                                                return options.map((opt, index) => (
                                                    <option key={index} value={opt.bank}>{opt.bank}</option>
                                                ));
                                            } catch (e) {
                                                return <option value="Otro">Otro medio de pago</option>;
                                            }
                                        })()
                                    ) : (
                                        // MÉTODOS DE FALLBACK SI NO CONFIGURÓ NADA
                                        <>
                                            <option value="Nequi">Nequi</option>
                                            <option value="Daviplata">Daviplata</option>
                                            <option value="Bancolombia">Transferencia Bancolombia</option>
                                            <option value="Efectivo">Pago en Efectivo</option>
                                            <option value="Otro">Otro medio de pago</option>
                                        </>
                                    )}
                                </select>
                            </div>

                            <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                                <button type="submit" className="btn btn-primary" style={{ flex: 1, justifyContent: 'center', padding: '1rem', fontSize: '1.1rem', gap: '8px' }} disabled={isReserving}>
                                    {isReserving ? <><Loader2 className="animate-spin" size={20} /> Procesando...</> : `Confirmar y Pagar Boleta`}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Mensaje de Compra Exitosa (Fase Demostración - AHORA ES UN POP-UP) */}
            {showSuccess && (
                <div className="modal-overlay" onClick={() => { setShowSuccess(false); setSelectedNumber(null); }}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ textAlign: 'center', borderColor: '#10b981' }}>
                        <CheckCircle2 color="#10b981" size={48} style={{ margin: '0 auto 1rem auto' }} />
                        <h3 style={{ color: '#10b981', margin: '0 0 0.5rem 0' }}>¡Número {selectedNumber} Reservado!</h3>
                        <p style={{ color: 'var(--text-main)', margin: '0 0 1rem 0' }}>Para completarlo deberás realizar el pago por los medios que el organizador indica.</p>

                        {/* Mostrar Métodos de Pago aquí si existen */}
                        {organizerProfile?.payment_info && (
                            <div style={{ backgroundColor: 'rgba(34, 211, 238, 0.05)', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(34, 211, 238, 0.2)', marginBottom: '1.5rem', textAlign: 'left' }}>
                                <strong style={{ fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '0.5rem' }}><CreditCard size={18} /> Opciones de Pago (Nequi/Banco):</strong>
                                <p style={{ fontSize: '0.9rem', margin: 0, whiteSpace: 'pre-wrap', color: 'var(--text-main)', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                    {(() => {
                                        try {
                                            if (organizerProfile.payment_info.startsWith('[')) {
                                                const opts = JSON.parse(organizerProfile.payment_info);
                                                return opts.map((o, i) => (
                                                    <span key={i}><strong>{o.bank}:</strong> {o.number}</span>
                                                ));
                                            }
                                            return organizerProfile.payment_info;
                                        } catch (e) {
                                            return organizerProfile.payment_info;
                                        }
                                    })()}
                                </p>
                            </div>
                        )}

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1rem' }}>
                            {organizerProfile?.whatsapp_number && (() => {
                                let cleanPhone = organizerProfile.whatsapp_number.replace(/\D/g, '');
                                if (cleanPhone.length === 10) cleanPhone = '57' + cleanPhone;

                                const template = organizerProfile.whatsapp_message_template || '¡Hola! Acabo de reservar el número *[NUMERO]* en tu rifa "[RIFA]". Mi nombre es [NOMBRE]. Aquí te envío el comprobante de pago de [MEDIO_PAGO]:';
                                const customMessage = template
                                    .replace(/\[NUMERO\]/g, selectedNumber)
                                    .replace(/\[RIFA\]/g, rifa?.title || 'Rifa')
                                    .replace(/\[NOMBRE\]/g, buyerName)
                                    .replace(/\[MEDIO_PAGO\]/g, paymentMethod || 'Traspaso');

                                const waLink = `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(customMessage)}`;
                                return (
                                    <a
                                        href={waLink}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="btn btn-primary"
                                        onClick={() => { setShowSuccess(false); setSelectedNumber(null); }}
                                        style={{ width: '100%', justifyContent: 'center', backgroundColor: '#25D366', color: '#fff', border: 'none', fontWeight: 'bold' }}
                                    >
                                        WhatsApp: Enviar Comprobante de Pago
                                    </a>
                                );
                            })()}
                            <button onClick={() => { setShowSuccess(false); setSelectedNumber(null); }} className="btn btn-secondary" style={{ width: '100%', justifyContent: 'center' }}>
                                Cerrar y ver grilla
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Explicación Sencilla */}
            {!selectedNumber && !showSuccess && !rifa.winning_number && (
                <div className="card anim-slide-up stagger-2" style={{ marginBottom: '2rem', textAlign: 'center', backgroundColor: 'rgba(34, 211, 238, 0.05)', borderColor: 'rgba(34, 211, 238, 0.2)' }}>
                    <p style={{ margin: 0 }}>
                        {rifa.is_paid
                            ? "👇 Toca un número libre en la grilla para apartarlo y pagarlo a tu nombre."
                            : "⚠️ MODO DEMO: Esta rifa aún no ha sido activada por el organizador. Las compras están deshabilitadas."}
                    </p>
                </div>
            )}

            {/* Información del Organizador (Anti-Fraude) - Ocultar si hay ganador */}
            {organizerProfile && !rifa.winning_number && (
                <div className="card anim-slide-up stagger-3" style={{ marginBottom: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem', border: '1px solid rgba(16, 185, 129, 0.2)', backgroundImage: 'linear-gradient(to right, rgba(16, 185, 129, 0.05), transparent)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <ShieldCheck size={24} color="#10b981" />
                        <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#10b981' }}>Organizador de la Rifa</h3>
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <p style={{ margin: '0 0 0.25rem 0', color: 'var(--text-muted)', fontSize: '0.85rem' }}>Nombre del Responsable</p>
                            <p style={{ margin: 0, fontWeight: 'bold' }}>{organizerProfile.full_name || 'No proporcionado'}</p>
                        </div>
                        {organizerProfile.whatsapp_number && (
                            <div>
                                <a href={`https://wa.me/${organizerProfile.whatsapp_number.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="btn btn-secondary" style={{ padding: '0.25rem 0.5rem', backgroundColor: '#25D366', color: '#fff', border: 'none', fontWeight: 'bold', gap: '4px' }}>
                                    📱 Contactar por WhatsApp
                                </a>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Si ya hay un ganador, mostrar la celebración destacada con clase de animación extra */}
            {rifa.winning_number && (
                <div className="anim-slide-up" style={{ backgroundColor: 'rgba(16, 185, 129, 0.15)', border: '2px solid #10b981', borderRadius: '12px', padding: '4rem 2rem', marginTop: '4rem', marginBottom: '2rem', textAlign: 'center', animation: 'pulse 2s infinite' }}>
                    <h2 style={{ color: '#10b981', fontSize: '2.5rem', margin: '0 0 1rem 0', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '15px' }}>
                        <Trophy size={50} /> ¡TENEMOS UN GANADOR! <Trophy size={50} />
                    </h2>
                    <h1 style={{ color: 'var(--text-main)', fontSize: '2rem', marginBottom: '2rem', wordBreak: 'break-word' }}>Rifa: {rifa.title}</h1>
                    <p style={{ color: 'var(--primary-color)', fontSize: '1.5rem', marginBottom: '1rem' }}>El boleto afortunado del sorteo fue:</p>
                    <div style={{ fontSize: '7rem', fontWeight: 'bold', color: '#10b981', textShadow: '0 0 40px rgba(16, 185, 129, 0.8)' }}>
                        {rifa.winning_number}
                    </div>
                    {/* Botón de contactar organizador */}
                    {organizerProfile?.whatsapp_number && (
                        <div style={{ marginTop: '3rem' }}>
                            <a href={`https://wa.me/${organizerProfile.whatsapp_number.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="btn btn-secondary" style={{ padding: '1rem 2rem', backgroundColor: '#25D366', color: '#fff', border: 'none', fontWeight: 'bold', gap: '8px', fontSize: '1.2rem', display: 'inline-flex' }}>
                                📱 Reclamar Premio por WhatsApp
                            </a>
                        </div>
                    )}
                </div>
            )}

            {/* La Grilla de 00-99. Oculta completamente si ya hay un ganador */}
            {!rifa.winning_number && (
                <div className="anim-slide-up stagger-5" style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(60px, 1fr))',
                    gap: '10px',
                    opacity: selectedNumber || showSuccess ? 0.3 : 1, // Opacar si hay un número seleccionado
                    pointerEvents: selectedNumber || showSuccess || rifa.winning_number || !rifa.is_paid ? 'none' : 'auto', // Deshabilitar clics si hay ganador, comprando, o no está pagada
                    transition: 'all 0.3s ease'
                }}>
                    {numbers.map((num) => {
                        // MEJORA: Verificamos en el diccionario O(1) en lugar de usar un .find O(N)
                        const ticketData = ticketsMap[num];
                        const isTaken = !!ticketData;
                        const isWinner = rifa.winning_number === num;

                        return (
                            <button
                                key={num}
                                onClick={() => !isTaken && handleSelectNumber(num)}
                                className="btn anim-slide-up"
                                disabled={isTaken || rifa.winning_number}
                                style={{
                                    animationDelay: `${num * 0.015}s`,
                                    animationFillMode: 'both',
                                    backgroundColor: isWinner ? '#10b981' : (isTaken ? 'rgba(255, 107, 107, 0.1)' : 'var(--bg-tertiary)'),
                                    border: isWinner ? '2px solid #fff' : (isTaken ? '1px solid rgba(255, 107, 107, 0.3)' : '1px solid rgba(255,255,255,0.1)'),
                                    padding: '1rem 0',
                                    fontSize: '1.2rem',
                                    fontWeight: 'bold',
                                    borderRadius: '8px',
                                    cursor: isTaken || rifa.winning_number ? 'not-allowed' : 'pointer',
                                    color: isWinner ? '#fff' : (isTaken ? '#ff6b6b' : 'var(--text-main)'),
                                    justifyContent: 'center',
                                    transition: 'all 0.2s ease',
                                    transform: isWinner ? 'scale(1.15)' : 'scale(1)',
                                    zIndex: isWinner ? 10 : 1,
                                    boxShadow: isWinner ? '0 0 25px rgba(16, 185, 129, 0.8)' : 'none'
                                }}
                                onMouseEnter={(e) => {
                                    if (!isTaken && !rifa.winning_number) {
                                        e.target.style.backgroundColor = 'var(--primary-color)';
                                        e.target.style.color = '#000';
                                        e.target.style.transform = 'scale(1.15) translateY(-5px)';
                                        e.target.style.boxShadow = '0 10px 20px rgba(34, 211, 238, 0.3)';
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    if (!isTaken && !rifa.winning_number) {
                                        e.target.style.backgroundColor = 'var(--bg-tertiary)';
                                        e.target.style.color = 'var(--text-main)';
                                        e.target.style.transform = 'scale(1)';
                                        e.target.style.boxShadow = 'none';
                                    }
                                }}
                                title={isWinner ? '¡NÚMERO GANADOR!' : (isTaken ? `Separado por ${ticketData.buyer_name}` : 'Click para apartar')}
                            >
                                {isWinner ? <><Trophy size={16} style={{ marginRight: '2px' }} /> {num}</> : (isTaken ? <Lock size={20} /> : num)}
                            </button>
                        );
                    })}
                </div>
            )}

            <div style={{ textAlign: 'center', marginTop: '3rem', paddingBottom: '2rem' }}>
                <div style={{ marginBottom: '1.5rem', padding: '1rem', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '0 0 0.5rem 0', lineHeight: '1.4' }}>
                        Al participar, aceptas que RifaPro es únicamente un software de gestión y no interviene, recauda ni garantiza el pago de premios de los eventos creados por terceros.
                    </p>
                    <Link to="/terminos" target="_blank" style={{ color: 'var(--primary-color)', textDecoration: 'underline', fontSize: '0.8rem' }}>
                        Leer Aviso Legal y Términos de Uso
                    </Link>
                </div>

                <Link to="/dashboard" style={{ color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none' }}>
                    <ArrowLeft size={16} /> Volver al panel de control
                </Link>
            </div>

        </div>
    );
}

export default PublicGrid;
