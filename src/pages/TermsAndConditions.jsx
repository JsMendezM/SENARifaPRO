import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert, ArrowLeft, FileText, Scale } from 'lucide-react';

const TermsAndConditions = () => {
    return (
        <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-main)', color: 'var(--text-main)', padding: '2rem 1rem' }}>
            <div className="container" style={{ maxWidth: '800px', margin: '0 auto' }}>

                {/* Cabecera */}
                <div style={{ marginBottom: '2rem' }}>
                    <Link to="/" className="btn btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginBottom: '1rem' }}>
                        <ArrowLeft size={16} /> Volver al Inicio
                    </Link>
                    <h1 className="premium-gradient-text" style={{ fontSize: '2.5rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <Scale size={36} color="var(--primary-color)" /> Términos y Condiciones
                    </h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>
                        Aviso Legal y Políticas de Uso de la Plataforma RifaPro.
                    </p>
                </div>

                <div className="card" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', lineHeight: '1.6' }}>

                    {/* Alerta Importante */}
                    <div style={{ backgroundColor: 'rgba(255, 107, 107, 0.1)', border: '1px solid rgba(255, 107, 107, 0.3)', borderRadius: '8px', padding: '1.5rem', display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                        <ShieldAlert size={32} color="#ff6b6b" style={{ flexShrink: 0 }} />
                        <div>
                            <h3 style={{ margin: '0 0 0.5rem 0', color: '#ff6b6b' }}>Descargo de Responsabilidad Fundamental</h3>
                            <p style={{ margin: 0, fontSize: '0.95rem' }}>
                                <strong>RifaPro es EXCLUSIVAMENTE un software de gestión visual (SaaS).</strong> No somos una casa de apuestas, no organizamos juegos de suerte y azar, no captamos dinero del público y no tenemos relación con Coljuegos ni con ninguna entidad de beneficencia.
                            </p>
                        </div>
                    </div>

                    <section>
                        <h2 style={{ fontSize: '1.5rem', color: 'var(--primary-color)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <FileText size={20} /> 1. Naturaleza del Servicio
                        </h2>
                        <p>
                            RifaPro actúa únicamente como una herramienta tecnológica (agenda o cuaderno digital avanzado) que permite a personas naturales o jurídicas organizar visualmente sus propias iniciativas de levantamiento de fondos, sorteos comunitarios o rifas personales.
                        </p>
                        <p>
                            Bajo ninguna circunstancia RifaPro opera, administra, patrocina, garantiza ni avala los eventos creados por los usuarios (en adelante "Organizadores").
                        </p>
                    </section>

                    <section>
                        <h2 style={{ fontSize: '1.5rem', color: 'var(--primary-color)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <FileText size={20} /> 2. Responsabilidad de "Organizadores" respecto a Coljuegos
                        </h2>
                        <ul style={{ paddingLeft: '1.5rem', color: 'var(--text-muted)' }}>
                            <li style={{ marginBottom: '0.5rem' }}>Es responsabilidad <strong>única, exclusiva e intransferible</strong> del Organizador cumplir con las normativas locales, departamentales y nacionales respecto a juegos de suerte y azar.</li>
                            <li style={{ marginBottom: '0.5rem' }}>El Organizador debe tramitar y obtener los permisos correspondientes ante <strong>Coljuegos</strong> o las autoridades competentes si su evento así lo requiere legalmente. RifaPro no asesora, no supervisa ni audita el cumplimiento fiscal o legal de ninguna rifa.</li>
                            <li style={{ marginBottom: '0.5rem' }}>Cualquier sanción, multa o repercusión penal derivada de la operación ilícita o irregular de un sorteo recaerá única y exclusivamente sobre el Organizador.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 style={{ fontSize: '1.5rem', color: 'var(--primary-color)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <FileText size={20} /> 3. Transacciones Financieras y Premios
                        </h2>
                        <p>
                            La plataforma RifaPro <strong>NO POSEE pasarela de pago para apuestas</strong>. No procesamos cobros, no guardamos saldos, no recibimos comisiones sobre los premios ni actuamos como intermediarios financieros.
                        </p>
                        <p>
                            Todos los pagos, transferencias (vía Nequi, Daviplata, Bancolombia, etc.) y la eventual entrega de premios son transacciones que ocurren estrictamente fuera de nuestro sistema, entre el Comprador y el Organizador. RifaPro no se hace responsable por estafas, fraude, lavado de activos o impagos de premios generados por Organizadores inescrupulosos.
                        </p>
                    </section>

                    <section>
                        <h2 style={{ fontSize: '1.5rem', color: 'var(--primary-color)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <FileText size={20} /> 4. Uso de la Grilla Pública (Para Compradores)
                        </h2>
                        <p>
                            Al separar un número dentro de cualquier grilla generada por este software, el Comprador entiende que <strong>no está comprando un producto de RifaPro</strong>. Está participando en una dinámica privada administrada por el organizador cuyos datos de contacto aparecen en dicha grilla. Recomendamos verificar la legitimidad del Organizador antes de transferir cualquier dinero.
                        </p>
                    </section>

                </div>
            </div>
        </div>
    );
};

export default TermsAndConditions;
