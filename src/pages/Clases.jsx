import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'

export default function Clases() {
  const [clases, setClases] = useState([])
  const [reservasCount, setReservasCount] = useState({})
  const [mensaje, setMensaje] = useState('')

  useEffect(() => {
    cargarClases()
  }, [])

  async function cargarClases() {
    const { data: clasesData } = await supabase.from('clases').select('*').order('fecha_hora')
    setClases(clasesData || [])
    const { data: reservasData } = await supabase.from('reservaciones').select('clase_id')
    const conteo = {}
    reservasData?.forEach(r => {
      conteo[r.clase_id] = (conteo[r.clase_id] || 0) + 1
    })
    setReservasCount(conteo)
  }

  async function reservar(claseId, capacidadMax) {
    const { data: { user } } = await supabase.auth.getUser()
    const ocupados = reservasCount[claseId] || 0
    if (ocupados >= capacidadMax) {
      setMensaje('❌ No hay cupos disponibles')
      return
    }
    const { data: yaReservo } = await supabase
      .from('reservaciones').select('*')
      .eq('usuario_id', user.id).eq('clase_id', claseId)
    if (yaReservo.length > 0) {
      setMensaje('⚠️ Ya tienes una reserva en esta clase')
      return
    }
    const { error } = await supabase.from('reservaciones').insert({
      usuario_id: user.id, clase_id: claseId
    })
    if (error) setMensaje('❌ Error al reservar')
    else {
      setMensaje('✅ ¡Reserva realizada con éxito!')
      cargarClases()
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
      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>

        {/* Header */}
        <div style={{ marginBottom: '40px' }}>
          <h2 style={{
            fontFamily: 'var(--font-titulos)', fontWeight: 900,
            fontSize: '32px', color: '#FFFFFF',
            textTransform: 'uppercase', letterSpacing: '2px',
            marginBottom: '8px'
          }}>
            Clases <span style={{ color: '#CCFF00' }}>Disponibles</span>
          </h2>
          <p style={{ color: '#9ca3af', fontSize: '14px' }}>
            Elige tu clase y reserva tu lugar
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

        {/* Grid de clases */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
          gap: '20px'
        }}>
          {clases.map(clase => {
            const ocupados = reservasCount[clase.id] || 0
            const disponibles = clase.capacidad_max - ocupados
            const lleno = disponibles <= 0
            const porcentaje = (ocupados / clase.capacidad_max) * 100

            return (
              <div key={clase.id} style={{
                background: '#1a1a1a',
                borderRadius: '16px',
                overflow: 'hidden',
                border: '1px solid #374151',
                transition: 'border-color 0.2s',
              }}>
                {/* Banner */}
                <div style={{
                  background: lleno ? '#374151' : '#CCFF00',
                  padding: '28px 20px',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '40px', marginBottom: '8px' }}>
                    {iconos[clase.nombre] || '🏃'}
                  </div>
                  <h3 style={{
                    fontFamily: 'var(--font-titulos)',
                    fontWeight: 900, fontSize: '18px',
                    color: lleno ? '#9ca3af' : '#111111',
                    textTransform: 'uppercase', letterSpacing: '1px',
                    margin: 0
                  }}>{clase.nombre}</h3>
                </div>

                {/* Info */}
                <div style={{ padding: '20px' }}>
                  <div style={{ marginBottom: '8px', color: '#9ca3af', fontSize: '13px' }}>
                    👤 <span style={{ color: '#FFFFFF' }}>{clase.instructor}</span>
                  </div>
                  <div style={{ marginBottom: '16px', color: '#9ca3af', fontSize: '13px' }}>
                    🕐 <span style={{ color: '#FFFFFF' }}>{new Date(clase.fecha_hora).toLocaleString('es-EC')}</span>
                  </div>

                  {/* Barra de cupos */}
                  <div style={{ marginBottom: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <span style={{ fontSize: '12px', color: '#9ca3af' }}>Cupos</span>
                      <span style={{
                        fontSize: '12px', fontWeight: 700,
                        color: lleno ? '#f87171' : disponibles <= 3 ? '#fbbf24' : '#CCFF00'
                      }}>
                        {lleno ? 'LLENO' : `${disponibles} / ${clase.capacidad_max}`}
                      </span>
                    </div>
                    <div style={{ background: '#374151', borderRadius: '4px', height: '6px' }}>
                      <div style={{
                        height: '6px', borderRadius: '4px',
                        width: `${porcentaje}%`,
                        background: lleno ? '#f87171' : disponibles <= 3 ? '#fbbf24' : '#CCFF00',
                        transition: 'width 0.3s'
                      }} />
                    </div>
                  </div>

                  <button
                    onClick={() => reservar(clase.id, clase.capacidad_max)}
                    disabled={lleno}
                    style={{
                      width: '100%', padding: '12px',
                      background: lleno ? '#374151' : '#CCFF00',
                      color: lleno ? '#9ca3af' : '#111111',
                      border: 'none', borderRadius: '10px',
                      fontFamily: 'var(--font-titulos)',
                      fontWeight: 700, fontSize: '13px',
                      textTransform: 'uppercase', letterSpacing: '1px',
                      cursor: lleno ? 'not-allowed' : 'pointer'
                    }}
                  >
                    {lleno ? 'Clase llena' : 'Reservar clase'}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
