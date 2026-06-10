import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'

export default function MisReservas() {
  const [reservas, setReservas] = useState([])
  const [mensaje, setMensaje] = useState('')

  useEffect(() => {
    cargarReservas()
  }, [])

  async function cargarReservas() {
    const { data: { user } } = await supabase.auth.getUser()
    const { data } = await supabase
      .from('reservaciones')
      .select('*, clases(*)')
      .eq('usuario_id', user.id)
    setReservas(data || [])
  }

  async function cancelar(reservaId) {
    const { error } = await supabase
      .from('reservaciones')
      .delete()
      .eq('id', reservaId)
    if (error) setMensaje('❌ Error al cancelar')
    else {
      setMensaje('✅ Reserva cancelada')
      cargarReservas()
    }
  }

  const iconos = { 'Spinning': '🚴', 'Yoga': '🧘', 'Funcional': '💪', 'Zumba': '💃' }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#111111',
      padding: '40px 20px',
      fontFamily: 'var(--font-cuerpo)'
    }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>

        {/* Header */}
        <div style={{ marginBottom: '40px' }}>
          <h2 style={{
            fontFamily: 'var(--font-titulos)', fontWeight: 900,
            fontSize: '32px', color: '#FFFFFF',
            textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '8px'
          }}>
            Mis <span style={{ color: '#CCFF00' }}>Reservas</span>
          </h2>
          <p style={{ color: '#9ca3af', fontSize: '14px' }}>
            Gestiona tus clases reservadas
          </p>
        </div>

        {/* Mensaje */}
        {mensaje && (
          <div style={{
            padding: '14px 20px', borderRadius: '10px', marginBottom: '24px',
            background: mensaje.includes('✅') ? 'rgba(204,255,0,0.1)' : 'rgba(255,100,100,0.1)',
            border: `1px solid ${mensaje.includes('✅') ? '#CCFF00' : '#f87171'}`,
            color: mensaje.includes('✅') ? '#CCFF00' : '#f87171',
            fontWeight: 600, fontSize: '14px'
          }}>{mensaje}</div>
        )}

        {/* Sin reservas */}
        {reservas.length === 0 && (
          <div style={{
            textAlign: 'center', padding: '60px 20px',
            background: '#1a1a1a', borderRadius: '16px',
            border: '1px solid #374151'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>📋</div>
            <p style={{ color: '#9ca3af', fontSize: '15px' }}>No tienes reservas activas</p>
            <p style={{ color: '#374151', fontSize: '13px', marginTop: '8px' }}>
              Ve a Clases y reserva tu lugar
            </p>
          </div>
        )}

        {/* Lista de reservas */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {reservas.map(reserva => (
            <div key={reserva.id} style={{
              background: '#1a1a1a',
              borderRadius: '16px',
              border: '1px solid #374151',
              overflow: 'hidden',
              display: 'flex'
            }}>
              {/* Franja lateral lima */}
              <div style={{
                width: '6px',
                background: '#CCFF00',
                flexShrink: 0
              }} />

              {/* Contenido */}
              <div style={{
                padding: '20px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                width: '100%',
                flexWrap: 'wrap',
                gap: '12px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{
                    background: '#CCFF00',
                    borderRadius: '12px',
                    width: '50px', height: '50px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '24px', flexShrink: 0
                  }}>
                    {iconos[reserva.clases?.nombre] || '🏃'}
                  </div>
                  <div>
                    <h3 style={{
                      fontFamily: 'var(--font-titulos)',
                      fontWeight: 900, fontSize: '16px',
                      color: '#FFFFFF', textTransform: 'uppercase',
                      letterSpacing: '1px', margin: '0 0 6px'
                    }}>{reserva.clases?.nombre}</h3>
                    <p style={{ margin: '0 0 3px', color: '#9ca3af', fontSize: '13px' }}>
                      👤 {reserva.clases?.instructor}
                    </p>
                    <p style={{ margin: 0, color: '#9ca3af', fontSize: '13px' }}>
                      🕐 {new Date(reserva.clases?.fecha_hora).toLocaleString('es-EC')}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => cancelar(reserva.id)}
                  style={{
                    padding: '10px 20px',
                    background: 'transparent',
                    color: '#f87171',
                    border: '1.5px solid #f87171',
                    borderRadius: '10px',
                    fontFamily: 'var(--font-titulos)',
                    fontWeight: 700, fontSize: '12px',
                    textTransform: 'uppercase', letterSpacing: '1px'
                  }}
                >
                  Cancelar
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
