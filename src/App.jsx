import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { supabase } from './services/supabase';
import { Sun, Moon } from 'lucide-react';

// Importamos las páginas principales de la aplicación
import LandingPage from './pages/LandingPage';
import Login from './pages/Auth/Login';
import Dashboard from './pages/Dashboard';
import PublicGrid from './pages/PublicGrid';
import AdminDashboard from './pages/AdminDashboard'; // [NEW] Panel de Administrador
import RaffleManagement from './pages/RaffleManagement'; // [NEW] Panel de Boletas
import TermsAndConditions from './pages/TermsAndConditions'; // [NEW] Aspecto Legal

/**
 * Componente para alternar entre Modo Oscuro y Modo Claro.
 * Especialmente útil para gente mayor de 40 años que prefiere fondos claros para leer mejor.
 */
function ThemeToggle() {
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  return (
    <button
      onClick={toggleTheme}
      style={{
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        width: '55px',
        height: '55px',
        borderRadius: '50%',
        backgroundColor: 'var(--primary-color)',
        color: 'var(--primary-text)',
        border: 'none',
        boxShadow: '0 4px 12px var(--shadow-color)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        zIndex: 9999,
        transition: 'transform 0.2s ease, background-color 0.3s ease'
      }}
      onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
      onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
      title="Cambiar Contraste (Claro/Oscuro)"
    >
      {theme === 'dark' ? <Sun size={28} /> : <Moon size={28} color="#fff" />}
    </button>
  );
}

/**
 * Componente para Rutas Protegidas Normales (Organizadores Locales)
 */
function PrivateRoute({ children }) {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });
  }, []);

  if (loading) return null;
  return session ? children : <Navigate to="/login" />;
}

/**
 * Componente Principal de la Aplicación (App).
 */
function App() {
  return (
    <BrowserRouter>
      <ThemeToggle />
      <Routes>
        {/* Ruta principal ("/"): Muestra la Landing Page para vender la idea */}
        <Route path="/" element={<LandingPage />} />

        {/* Ruta de Login ("/login"): Donde el Organizador inicia sesión */}
        <Route path="/login" element={<Login />} />

        {/* 
          Ruta del Dashboard ("/dashboard"): Panel de control del Organizador.
          Protegido por PrivateRoute. 
        */}
        <Route path="/dashboard" element={
          <PrivateRoute>
            <Dashboard />
          </PrivateRoute>
        } />

        {/* 
          Ruta de Gestión de Boletas ("/manage/:id"): Panel para ver compradores de una rifa.
          Protegido por PrivateRoute. 
        */}
        <Route path="/manage/:id" element={
          <PrivateRoute>
            <RaffleManagement />
          </PrivateRoute>
        } />

        {/* 
          Ruta de la Grilla Pública ("/rifa/:id"): 
          Esta es la ruta que el Organizador comparte por WhatsApp.
          ":id" es un parámetro dinámico. Permite abrir distintas rifas 
          Ejemplo: rifapro.com/rifa/123456
        */}
        <Route path="/rifa/:id" element={<PublicGrid />} />

        {/* Ruta Panel de Administrador Maestro */}
        <Route path="/admin" element={
          <PrivateRoute>
            <AdminDashboard />
          </PrivateRoute>
        } />

        {/* Ruta de Términos Legales (Coljuegos y Responsabilidades) */}
        <Route path="/terminos" element={<TermsAndConditions />} />

        {/* Ruta comodín (*): Si ponen una URL que no existe, los mandamos al inicio */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
