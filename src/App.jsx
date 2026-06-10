import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'
import Login from './pages/Login'
import Clases from './pages/Clases'
import MisReservas from './pages/MisReservas'
import Admin from './pages/Admin'
import Pagos from './pages/Pagos'

const ADMIN_EMAIL = 'sebasfx010307@gmail.com'

export default function App() {
  const [session, setSession] = useState(null)
  const [pagina, setPagina] = useState('clases')

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
    })
    supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })
  }, [])

  async function handleLogout() {
    await supabase.auth.signOut()
    setSession(null)
  }

  if (!session) return <Login onLogin={() => supabase.auth.getSession().then(({ data: { session } }) => setSession(session))} />

  const esAdmin = session.user.email === ADMIN_EMAIL

  const btnNav = (tab, label) => (
    <button onClick={() => setPagina(tab)} style={{
      padding: '10px 20px',
      borderRadius: '10px',
      border: pagina === tab ? 'none' : '1px solid #374151',
      cursor: 'pointer',
      fontFamily: 'var(--font-titulos)',
      fontWeight: 700,
      fontSize: '12px',
      textTransform: 'uppercase',
      letterSpacing: '1px',
      background: pagina === tab ? '#CCFF00' : 'transparent',
      color: pagina === tab ? '#111111' : '#9ca3af',
      transition: 'all 0.2s'
    }}>{label}</button>
  )

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
          padding: '14px 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>

          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              background: '#CCFF00',
              borderRadius: '10px',
              width: '36px', height: '36px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '18px'
            }}>🏋️</div>
            <span style={{
              fontFamily: 'var(--font-titulos)',
              fontWeight: 900,
              fontSize: '18px',
              color: '#FFFFFF',
              textTransform: 'uppercase',
              letterSpacing: '2px'
            }}>Gimnasio App</span>
          </div>

          {/* Botones navegación */}
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
            {btnNav('clases', '🏃 Clases')}
            {btnNav('reservas', '📋 Reservas')}
            {btnNav('pagos', '💳 Pagos')}
            {esAdmin && btnNav('admin', '⚙️ Admin')}

            <button onClick={handleLogout} style={{
              padding: '10px 20px',
              borderRadius: '10px',
              border: '1px solid #374151',
              cursor: 'pointer',
              fontFamily: 'var(--font-titulos)',
              fontWeight: 700,
              fontSize: '12px',
              textTransform: 'uppercase',
              letterSpacing: '1px',
              background: 'transparent',
              color: '#f87171',
              marginLeft: '4px'
            }}>
              🚪 Salir
            </button>
          </div>
        </div>
      </div>

      {/* Contenido */}
      {pagina === 'clases' && <Clases />}
      {pagina === 'reservas' && <MisReservas />}
      {pagina === 'pagos' && <Pagos />}
      {pagina === 'admin' && <Admin />}
    </div>
  )
}
