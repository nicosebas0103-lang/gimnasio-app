import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'
import Login from './pages/Login'
import Clases from './pages/Clases'
import MisReservas from './pages/MisReservas'
import Admin from './pages/Admin'
import Pagos from './pages/Pagos'
import Asistencia from './pages/Asistencia'

const ADMIN_EMAIL = 'sebasfx010307@gmail.com'

export default function App() {
  const [session, setSession] = useState(null)
  const [pagina, setPagina] = useState('clases')
  const [menuAbierto, setMenuAbierto] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session))
    supabase.auth.onAuthStateChange((_event, session) => setSession(session))
  }, [])

  async function handleLogout() {
    await supabase.auth.signOut()
    setSession(null)
  }

  function navegar(tab) {
    setPagina(tab)
    setMenuAbierto(false)
  }

  if (!session) return <Login onLogin={() => supabase.auth.getSession().then(({ data: { session } }) => setSession(session))} />

  const esAdmin = session.user.email === ADMIN_EMAIL

  const items = [
    { tab: 'clases', label: '🏃 Clases' },
    { tab: 'reservas', label: '📋 Reservas' },
    { tab: 'pagos', label: '💳 Pagos' },
    { tab: 'asistencia', label: '✅ Asistencia' },
    ...(esAdmin ? [{ tab: 'admin', label: '⚙️ Admin' }] : [])
  ]

  const btnStyle = (tab) => ({
    padding: '10px 18px', borderRadius: '10px',
    border: pagina === tab ? 'none' : '1px solid #374151',
    cursor: 'pointer',
    fontFamily: 'var(--font-titulos)', fontWeight: 700,
    fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px',
    background: pagina === tab ? '#CCFF00' : 'transparent',
    color: pagina === tab ? '#111111' : '#9ca3af',
    transition: 'all 0.2s'
  })

  return (
    <div style={{ fontFamily: 'var(--font-cuerpo)' }}>

      {/* NAVBAR */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: '#111111',
        borderBottom: '1px solid #374151',
        boxShadow: '0 4px 24px rgba(0,0,0,0.5)'
      }}>
        <div style={{
          maxWidth: '1100px', margin: '0 auto',
          padding: '14px 20px',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center'
        }}>

          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              background: '#CCFF00', borderRadius: '10px',
              width: '36px', height: '36px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '18px'
            }}>🏋️</div>
            <span style={{
              fontFamily: 'var(--font-titulos)', fontWeight: 900,
              fontSize: '16px', color: '#FFFFFF',
              textTransform: 'uppercase', letterSpacing: '2px'
            }}>Gimnasio App</span>
          </div>

          {/* Botones desktop */}
          <div className="desktop-nav" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            {items.map(item => (
              <button key={item.tab} onClick={() => navegar(item.tab)} style={btnStyle(item.tab)}>
                {item.label}
              </button>
            ))}
            <button onClick={handleLogout} style={{
              padding: '10px 18px', borderRadius: '10px',
              border: '1px solid #374151', cursor: 'pointer',
              fontFamily: 'var(--font-titulos)', fontWeight: 700,
              fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px',
              background: 'transparent', color: '#f87171', marginLeft: '4px'
            }}>🚪 Salir</button>
          </div>

          {/* Botón hamburguesa móvil */}
          <button
            onClick={() => setMenuAbierto(!menuAbierto)}
            className="mobile-nav"
            style={{
              background: 'transparent', border: '1px solid #374151',
              borderRadius: '8px', padding: '8px 12px',
              cursor: 'pointer', color: '#CCFF00', fontSize: '18px'
            }}>
            {menuAbierto ? '✕' : '☰'}
          </button>
        </div>

        {/* Menú móvil desplegable */}
        {menuAbierto && (
          <div className="mobile-nav" style={{
            background: '#1a1a1a',
            borderTop: '1px solid #374151',
            padding: '12px 20px'
          }}>
            {items.map(item => (
              <button key={item.tab} onClick={() => navegar(item.tab)} style={{
                display: 'block', width: '100%',
                padding: '14px 16px', marginBottom: '8px',
                borderRadius: '10px', cursor: 'pointer', textAlign: 'left',
                fontFamily: 'var(--font-titulos)', fontWeight: 700,
                fontSize: '13px', textTransform: 'uppercase', letterSpacing: '1px',
                background: pagina === item.tab ? '#CCFF00' : 'transparent',
                color: pagina === item.tab ? '#111111' : '#9ca3af',
                border: pagina === item.tab ? 'none' : '1px solid #374151'
              }}>{item.label}</button>
            ))}
            <button onClick={handleLogout} style={{
              display: 'block', width: '100%',
              padding: '14px 16px', borderRadius: '10px',
              border: '1px solid #374151', cursor: 'pointer', textAlign: 'left',
              fontFamily: 'var(--font-titulos)', fontWeight: 700,
              fontSize: '13px', textTransform: 'uppercase', letterSpacing: '1px',
              background: 'transparent', color: '#f87171'
            }}>🚪 Cerrar sesión</button>
          </div>
        )}
      </div>

      {/* Contenido */}
      {pagina === 'clases' && <Clases />}
      {pagina === 'reservas' && <MisReservas />}
      {pagina === 'pagos' && <Pagos />}
      {pagina === 'asistencia' && <Asistencia />}
      {pagina === 'admin' && <Admin />}
    </div>
  )
}
