import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { ArrowLeft, CheckCircle2, Trash2, ShieldAlert, MessageSquare, LayoutGrid, List, Filter, CalendarDays } from 'lucide-react';

/**
 * Panel de Gestión de Boletas de una Rifa específica.
 * Uso exclusivo del organizador.
 */
function RaffleManagement() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [rifa, setRifa] = useState(null);
    const [tickets, setTickets] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [viewMode, setViewMode] = useState('list'); // 'list' o 'grid'
    const [filter, setFilter] = useState('all'); // 'all', 'reserved', 'paid'

    useEffect(() => {
        const fetchDetails = async () => {
            setIsLoading(true);
            try {
                // Verificar sesión del usuario
                const { data: { session }, error: authError } = await supabase.auth.getSession();
                if (authError || !session) {
                    navigate('/login');
                    return;
                }

                // Cargar la Rifa
                const { data: rifaData, error: rifaErr } = await supabase
                    .from('rifas')
                    .select('*')
                    .eq('id', id)
                    .single();

                if (rifaErr) throw rifaErr;
                if (!rifaData) throw new Error("Rifa no encontrada");

                // Seguridad: Verificar que el usuario que intenta ver esto sea el dueño de la rifa
                if (rifaData.organizer_id !== session.user.id) {
                    // Check admin override just in case
                    const { data: profile } = await supabase.from('profiles').select('is_admin').eq('id', session.user.id).single();
                    if (!profile?.is_admin) {
                        throw new Error("No tienes permisos para gestionar esta rifa.");
                    }
                }

                if (!rifaData.is_paid) {
                    throw new Error("🔒 Debes activar (pagar) tu rifa primero en el Dashboard para desbloquear la gestión de boletas.");
                }

                setRifa(rifaData);

                // Cargar los Tickets (Boletas)
                const { data: ticketsData, error: ticketsErr } = await supabase
                    .from('tickets')
                    .select('*')
                    .eq('rifa_id', id)
                    .order('number', { ascending: true });

                if (ticketsErr) throw ticketsErr;
                setTickets(ticketsData || []);

            } catch (err) {
                console.error("Error validando Rifa:", err);
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        };

        fetchDetails();
    }, [id, navigate]);

    // Función para marcar un número como Pagado
    const handleMarkAsPaid = async (ticketId, ticketNumber) => {
        if (!window.confirm(`¿Confirmas que recibiste el pago para el número ${ticketNumber}?`)) return;

        try {
            const paidAt = new Date().toISOString();
            const { error } = await supabase
                .from('tickets')
                .update({ status: 'paid', paid_at: paidAt })
                .eq('id', ticketId);

            if (error) throw error;

            // Actualizar localmente
            setTickets(tickets.map(t => t.id === ticketId ? { ...t, status: 'paid', paid_at: paidAt } : t));
        } catch (err) {
            alert("Error al actualizar el pago: " + err.message);
        }
    };

    // Función para liberar un número (Borrar de la BD si no pagó)
    const handleFreeTicket = async (ticketId, ticketNumber) => {
        if (!window.confirm(`¿Estás seguro de liberar el número ${ticketNumber}? \nEsto lo borrará de la lista y cualquier persona podrá agarrarlo de nuevo en la grilla pública.`)) return;

        try {
            const { error } = await supabase
                .from('tickets')
                .delete()
                .eq('id', ticketId);

            if (error) throw error;

            // Actualizar localmente
            setTickets(tickets.filter(t => t.id !== ticketId));
        } catch (err) {
            alert("Error al liberar el número: " + err.message);
        }
    };

    if (isLoading) return <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>Cargando datos de las boletas...</div>;

    if (error) return (
        <div style={{ textAlign: 'center', padding: '4rem' }}>
            <ShieldAlert size={64} color="#ff6b6b" style={{ margin: '0 auto 1rem auto' }} />
            <h2>🚫 Acceso Denegado / Error</h2>
            <p style={{ color: 'var(--text-muted)' }}>{error}</p>
            <Link to="/dashboard" className="btn btn-secondary" style={{ marginTop: '1rem', display: 'inline-block' }}>Volver al Panel</Link>
        </div>
    );

    // Calcular estadísticas
    const totalTickets = tickets.length;
    const paidTickets = tickets.filter(t => t.status === 'paid').length;
    const pendingTickets = totalTickets - paidTickets;
    const totalRevenue = paidTickets * (rifa.ticket_price || 0);

    return (
        <div className="container" style={{ padding: '2rem 1rem', maxWidth: '900px' }}>
            {/* Cabecera */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
                <Link to="/dashboard" className="btn btn-secondary" style={{ padding: '0.5rem 1rem' }}>
                    <ArrowLeft size={16} /> Volver
                </Link>
                <h1 style={{ margin: 0, fontSize: '1.75rem' }}>Gestión de Boletas</h1>
            </div>

            <div className="card" style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <h2 style={{ fontSize: '1.25rem', margin: '0 0 0.5rem 0' }}>{rifa.title}</h2>
                    <p style={{ color: 'var(--text-muted)', margin: 0 }}>Precio unitario: ${parseFloat(rifa.ticket_price).toLocaleString('es-CO')}</p>
                </div>
                <div style={{ display: 'flex', gap: '1.5rem', textAlign: 'center' }}>
                    <div>
                        <span style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)' }}>Separados Pendientes</span>
                        <strong style={{ fontSize: '1.25rem', color: '#f59e0b' }}>{pendingTickets}</strong>
                    </div>
                    <div>
                        <span style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)' }}>Pagados (Recaudado)</span>
                        <strong style={{ fontSize: '1.25rem', color: '#10b981' }}>{paidTickets} (${totalRevenue.toLocaleString('es-CO')})</strong>
                    </div>
                </div>
            </div>

            {/* Barra de Filtros y Vistas */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem', backgroundColor: 'var(--bg-secondary)', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Filter size={18} color="var(--text-muted)" />
                    <select
                        className="input-field"
                        style={{ padding: '0.5rem', width: 'auto', margin: 0, border: 'none', backgroundColor: 'var(--bg-primary)' }}
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                    >
                        <option value="all">Todas las Boletas</option>
                        <option value="reserved">Solo Separadas (Pendientes)</option>
                        <option value="paid">Solo Pagadas</option>
                    </select>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                        className="btn"
                        style={{ padding: '0.5rem', backgroundColor: viewMode === 'list' ? 'var(--primary-color)' : 'transparent', color: viewMode === 'list' ? '#000' : 'var(--text-main)', border: viewMode === 'list' ? 'none' : '1px solid rgba(255,255,255,0.1)' }}
                        onClick={() => setViewMode('list')}
                        title="Vista de Lista Detallada"
                    >
                        <List size={20} />
                    </button>
                    <button
                        className="btn"
                        style={{ padding: '0.5rem', backgroundColor: viewMode === 'grid' ? 'var(--primary-color)' : 'transparent', color: viewMode === 'grid' ? '#000' : 'var(--text-main)', border: viewMode === 'grid' ? 'none' : '1px solid rgba(255,255,255,0.1)' }}
                        onClick={() => setViewMode('grid')}
                        title="Vista de Cuadrícula Compacta"
                    >
                        <LayoutGrid size={20} />
                    </button>
                </div>
            </div>

            {(() => {
                const filteredTickets = tickets.filter(t => {
                    if (filter === 'all') return true;
                    if (filter === 'paid') return t.status === 'paid';
                    if (filter === 'reserved') return t.status === 'reserved';
                    return true;
                });

                if (filteredTickets.length === 0) {
                    return (
                        <div style={{ textAlign: 'center', padding: '3rem', backgroundColor: 'var(--bg-secondary)', borderRadius: '8px', border: '1px dashed rgba(255,255,255,0.2)' }}>
                            <p style={{ color: 'var(--text-muted)', margin: 0 }}>No hay boletas que coincidan con el filtro actual.</p>
                        </div>
                    );
                }

                return (
                    <div className="anim-slide-up" style={{
                        display: 'grid',
                        gap: viewMode === 'list' ? '1rem' : '10px',
                        gridTemplateColumns: viewMode === 'list' ? 'repeat(auto-fill, minmax(300px, 1fr))' : 'repeat(auto-fill, minmax(80px, 1fr))'
                    }}>
                        {filteredTickets.map(ticket => (
                            viewMode === 'list' ? (
                                <div key={ticket.id} style={{
                                    backgroundColor: 'var(--bg-secondary)',
                                    border: ticket.status === 'paid' ? '1px solid #10b981' : '1px solid rgba(255,255,255,0.1)',
                                    borderRadius: '8px',
                                    padding: '1rem',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '0.75rem'
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                        <div style={{ fontSize: '2rem', fontWeight: 'bold', color: ticket.status === 'paid' ? '#10b981' : 'var(--primary-color)' }}>
                                            {ticket.number}
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            <span style={{
                                                fontSize: '0.75rem',
                                                padding: '0.2rem 0.5rem',
                                                borderRadius: '4px',
                                                backgroundColor: ticket.status === 'paid' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                                                color: ticket.status === 'paid' ? '#10b981' : '#f59e0b',
                                                border: ticket.status === 'paid' ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(245, 158, 11, 0.3)'
                                            }}>
                                                {ticket.status === 'paid' ? 'Pagado' : 'Pendiente Reservado'}
                                            </span>
                                        </div>
                                    </div>

                                    <div>
                                        <p style={{ margin: '0 0 0.25rem 0', fontWeight: '500' }}>👤 {ticket.buyer_name}</p>
                                        <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.9rem' }}>📱 {ticket.buyer_phone}</p>
                                        {ticket.payment_method && (
                                            <p style={{ margin: '0.25rem 0 0 0', color: 'var(--primary-color)', fontSize: '0.85rem' }}>💳 {ticket.payment_method}</p>
                                        )}
                                    </div>

                                    {/* Fechas */}
                                    <div style={{ backgroundColor: 'rgba(0,0,0,0.2)', padding: '0.5rem', borderRadius: '6px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: ticket.paid_at ? '4px' : '0' }}>
                                            <CalendarDays size={12} /> <span style={{ fontWeight: 'bold' }}>Fecha de apartado:</span> {new Date(ticket.created_at).toLocaleString()}
                                        </div>
                                        {ticket.paid_at && (
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#10b981' }}>
                                                <CheckCircle2 size={12} /> <span style={{ fontWeight: 'bold' }}>Fecha de Pago:</span> {new Date(ticket.paid_at).toLocaleString()}
                                            </div>
                                        )}
                                    </div>

                                    {/* Botones de acción */}
                                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: 'auto', paddingTop: '0.5rem', borderTop: '1px solid rgba(255,255,255,0.05)', flexWrap: 'wrap' }}>
                                        {ticket.buyer_phone && (() => {
                                            let cleanPhone = ticket.buyer_phone.replace(/\D/g, '');
                                            if (cleanPhone.length === 10) cleanPhone = '57' + cleanPhone;

                                            // Determine message based on status
                                            let textMsg = '';
                                            if (ticket.status === 'paid') {
                                                textMsg = `¡Hola ${ticket.buyer_name}! Te escribo para confirmar que hemos recibido tu pago por la boleta número *${ticket.number}* de la rifa "${rifa?.title}".\n\n¡Muchas gracias por tu compra y muchísima suerte en el sorteo! 🍀🎉`;
                                            } else {
                                                textMsg = `¡Hola ${ticket.buyer_name}! Noté que separaste el número *${ticket.number}* para la rifa "${rifa?.title}" pero aún aparece pendiente de pago.\n\nRecuerda realizar el pago mediante ${ticket.payment_method || 'el método acordado'} para poder confirmar oficialmente tu participación. ¡Gracias!`;
                                            }

                                            const waLink = `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(textMsg)}`;
                                            return (
                                                <a
                                                    href={waLink}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="btn btn-secondary"
                                                    style={{ flex: '1 1 100%', justifyContent: 'center', padding: '0.5rem', fontSize: '0.85rem', backgroundColor: '#25D366', color: '#fff', border: 'none', fontWeight: 'bold', marginBottom: '0.25rem' }}
                                                    title={ticket.status === 'paid' ? "Enviar Recibo Oficial" : "Enviar Recordatorio de Cobro"}
                                                >
                                                    <MessageSquare size={16} /> {ticket.status === 'paid' ? 'Enviar Recibo' : 'Cobrar por WhatsApp'}
                                                </a>
                                            );
                                        })()}

                                        {ticket.status !== 'paid' && (
                                            <button
                                                className="btn btn-primary"
                                                style={{ flex: 1, justifyContent: 'center', padding: '0.5rem', fontSize: '0.85rem' }}
                                                onClick={() => handleMarkAsPaid(ticket.id, ticket.number)}
                                                title="Confirmar recepción del dinero"
                                            >
                                                <CheckCircle2 size={16} /> Pagado
                                            </button>
                                        )}

                                        <button
                                            className="btn"
                                            style={{ flex: ticket.status === 'paid' ? 1 : 'none', backgroundColor: 'transparent', color: '#ff6b6b', border: '1px solid #ff6b6b', justifyContent: 'center', padding: '0.5rem', fontSize: '0.85rem' }}
                                            onClick={() => handleFreeTicket(ticket.id, ticket.number)}
                                            title="Liberar número si no te pagaron"
                                        >
                                            <Trash2 size={16} /> {ticket.status === 'paid' ? 'Deshacer' : 'Liberar'}
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                // ==== VISTA DE CUADRÍCULA ====
                                <div key={ticket.id} style={{
                                    backgroundColor: ticket.status === 'paid' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                                    border: ticket.status === 'paid' ? '1px solid #10b981' : '1px solid #f59e0b',
                                    borderRadius: '8px',
                                    padding: '0.75rem 0.25rem',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    gap: '0.25rem',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease',
                                    textAlign: 'center'
                                }}
                                    title={`${ticket.buyer_name}\n📱 ${ticket.buyer_phone}\n📅 Fecha de apartado: ${new Date(ticket.created_at).toLocaleString()}\n${ticket.paid_at ? `✅ Fecha de Pago: ${new Date(ticket.paid_at).toLocaleString()}` : '⏳ Pendiente'}`}
                                    onClick={() => {
                                        if (ticket.status === 'paid') {
                                            handleFreeTicket(ticket.id, ticket.number);
                                        } else {
                                            handleMarkAsPaid(ticket.id, ticket.number);
                                        }
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.transform = 'scale(1.05)';
                                        e.currentTarget.style.boxShadow = `0 4px 12px ${ticket.status === 'paid' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(245, 158, 11, 0.3)'}`;
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.transform = 'scale(1)';
                                        e.currentTarget.style.boxShadow = 'none';
                                    }}
                                >
                                    <span style={{ fontSize: '1.25rem', fontWeight: 'bold', color: ticket.status === 'paid' ? '#10b981' : '#f59e0b', lineHeight: 1 }}>{ticket.number}</span>
                                    <span style={{ fontSize: '0.65rem', textTransform: 'uppercase', color: ticket.status === 'paid' ? '#10b981' : '#f59e0b', maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', padding: '0 4px' }}>
                                        {ticket.buyer_name.split(' ')[0]}
                                    </span>
                                </div>
                            )
                        ))}
                    </div>
                );
            })()}
        </div>
    );
}

export default RaffleManagement;
