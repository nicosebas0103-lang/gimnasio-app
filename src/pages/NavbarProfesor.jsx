export default function NavbarProfesor({ handleLogout }) {
  return (
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            background: '#CCFF00', borderRadius: '10px',
            width: '36px', height: '36px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '18px'
          }}>🏋️</div>
          <div>
            <span style={{
              fontFamily: 'var(--font-titulos)', fontWeight: 900,
              fontSize: '16px', color: '#FFFFFF',
              textTransform: 'uppercase', letterSpacing: '2px'
            }}>Gimnasio App</span>
            <span style={{
              display: 'block', fontSize: '10px', color: '#CCFF00',
              fontFamily: 'var(--font-titulos)', textTransform: 'uppercase',
              letterSpacing: '2px', fontWeight: 700
            }}>Entrenador</span>
          </div>
        </div>

        <button onClick={handleLogout} style={{
          padding: '10px 18px', borderRadius: '10px',
          border: '1px solid #374151', cursor: 'pointer',
          fontFamily: 'var(--font-titulos)', fontWeight: 700,
          fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px',
          background: 'transparent', color: '#f87171'
        }}>🚪 Salir</button>
      </div>
    </div>
  )
}
