import { useEffect, useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { supabase } from '../supabaseClient'

const DIAS_SEMANA = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
const MESES_NOMBRES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']

export default function ProfesorView({ session }) {
  const [clases, setClases] = useState([])
  const [registros, setRegistros] = useState([])
  const [mesActual, setMesActual] = useState(new Date().getMonth())
  const [anioActual, setAnioActual] = useState(new Date().getFullYear())
  const [diaSeleccionado, setDiaSeleccionado] = useState(null)
  const [seccion, setSeccion] = useState('calendario')

  const email = session.user.email
  const qrData = JSON.stringify({ tipo: 'profesor', email, usuario_id: session.user.id })

  useEffect(() => {
    cargarClases()
    cargarRegistros()
  }, [])

  async function cargarClases() {
    const ahora = new Date().toISOString()
    const { data } = await supabase
      .from('clases')
      .select('*')
      .eq('instructor', email)
      .gte('fecha_hora', ahora)
      .order('fecha_hora')
    setClases(data || [])
  }

  async function cargarRegistros() {
    const { data } = await supabase
      .from('registros_profesores')
      .select('*')
      .eq('profesor_email', email)
      .order('fecha', { ascending: false })
      .limit(20)
    setRegistros(data || [])
  }

  function getDiasDelMes() {
    const primerDia = new Date(anioActual, mesActual, 1).getDay()
    const totalDias = new Date(anioActual, mesActual + 1, 0).getDate()
    const dias = []
    for (let i = 0; i < primerDia; i++) dias.push(null)
    for (let i = 1; i <= totalDias; i++) dias.push(i)
    return dias
  }

  function clasesDelDia(dia) {
    if (!dia) return []
    return clases.filter(c => {
      const fecha = new Date(c.fecha_hora)
      return fecha.getDate() === dia &&
        fecha.getMonth() === mesActual &&
        fecha.getFullYear() === anioActual
    })
  }

  function mesAnterior() {
    if (mesActual === 0) { setMesActual(11); setAnioActual(a => a - 1) }
    else setMesActual(m => m - 1)
    setDiaSeleccionado(null)
  }

  function mesSiguiente() {
    if (mesActual === 11) { setMesActual(0); setAnioActual(a => a + 1) }
    else setMesActual(m => m + 1)
    setDiaSeleccionado(null)
  }

  const dias = getDiasDelMes()
  const clasesDiaSeleccionado = diaSeleccionado ? clasesDelDia(diaSeleccionado) : []

  const tabStyle = (tab) => ({
    padding: '10px 20px', borderRadius: '10px',
    cursor: 'pointer', fontWeight: 700, fontSize: '12px',
    fontFamily: 'var(--font-titulos)', textTransform: 'uppercase', letterSpacing: '1px',
    background: seccion === tab ? '#CCFF00' : '#1a1a1a',
    color: seccion === tab ? '#111111' : '#9ca3af',
    border: seccion === tab ? 'none' : '1px solid #374151'
  })

  return (
    <div style={{ minHeight: '100vh', background: '#111111', padding: '40px 20px', fontFamily: 'var(--font-cuerpo)' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>

        {/* Header */}
        <div style={{ marginBottom: '40px' }}>
          <h2 style={{ fontFamily: 'var(--font-titulos)', fontWeight: 900, fontSize: '32px', color: '#FFFFFF', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '8px' }}>
            Portal <span style={{ color: '#CCFF00' }}>Entrenador</span>
          </h2>
          <p style={{ color: '#9ca3af', fontSize: '14px' }}>{email}</p>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '30px', flexWrap: 'wrap' }}>
          <button onClick={() => setSeccion('calendario')} style={tabStyle('calendario')}>📅 Mis clases</button>
          <button onClick={() => setSeccion('qr')} style={tabStyle('qr')}>📷 Mi QR</button>
          <button onClick={() => setSeccion('historial')} style={tabStyle('historial')}>🕐 Historial</button>
        </div>

        {/* CALENDARIO */}
        {seccion === 'calendario' && (
          <>
            <div style={{ background: '#1a1a1a', borderRadius: '16px', border: '1px solid #374151', padding: '24px', marginBottom: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <button onClick={mesAnterior} style={{ background: 'transparent', border: '1px solid #374151', borderRadius: '8px', padding: '8px 14px', color: '#CCFF00', fontSize: '16px', cursor: 'pointer' }}>‹</button>
                <h3 style={{ fontFamily: 'var(--font-titulos)', fontWeight: 900, fontSize: '16px', color: '#FFFFFF', textTransform: 'uppercase', letterSpacing: '1px', margin: 0 }}>
                  {MESES_NOMBRES[mesActual]} {anioActual}
                </h3>
                <button onClick={mesSiguiente} style={{ background: 'transparent', border: '1px solid #374151', borderRadius: '8px', padding: '8px 14px', color: '#CCFF00', fontSize: '16px', cursor: 'pointer' }}>›</button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', marginBottom: '8px' }}>
                {DIAS_SEMANA.map(d => (
                  <div key={d} style={{ textAlign: 'center', fontSize: '11px', color: '#9ca3af', fontWeight: 700, fontFamily: 'var(--font-titulos)', textTransform: 'uppercase', padding: '4px 0' }}>{d}</div>
                ))}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px' }}>
                {dias.map((dia, i) => {
                  const tieneClase = dia && clasesDelDia(dia).length > 0
                  const esSeleccionado = dia === diaSeleccionado
                  const esHoy = dia && new Date().getDate() === dia && new Date().getMonth() === mesActual && new Date().getFullYear() === anioActual

                  return (
                    <div key={i} onClick={() => dia && setDiaSeleccionado(dia === diaSeleccionado ? null : dia)} style={{
                      aspectRatio: '1', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column',
                      borderRadius: '8px', cursor: dia ? 'pointer' : 'default',
                      background: esSeleccionado ? '#CCFF00' : tieneClase ? 'rgba(204,255,0,0.1)' : 'transparent',
                      border: esHoy && !esSeleccionado ? '1px solid #CCFF00' : '1px solid transparent',
                      transition: 'all 0.15s'
                    }}>
                      <span style={{ fontSize: '13px', fontWeight: esHoy ? 700 : 400, color: esSeleccionado ? '#111111' : dia ? '#FFFFFF' : 'transparent' }}>{dia}</span>
                      {tieneClase && !esSeleccionado && <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#CCFF00', marginTop: '2px' }} />}
                    </div>
                  )
                })}
              </div>

              <div style={{ display: 'flex', gap: '16px', marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #374151' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#CCFF00' }} />
                  <span style={{ fontSize: '11px', color: '#9ca3af' }}>Tienes clase</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{ width: '14px', height: '14px', borderRadius: '4px', border: '1px solid #CCFF00' }} />
                  <span style={{ fontSize: '11px', color: '#9ca3af' }}>Hoy</span>
                </div>
              </div>
            </div>

            {/* Clases del día seleccionado */}
            {diaSeleccionado && (
              <div style={{ background: '#1a1a1a', borderRadius: '16px', border: '1px solid #CCFF00', padding: '24px', marginBottom: '24px' }}>
                <h3 style={{ fontFamily: 'var(--font-titulos)', fontWeight: 900, fontSize: '14px', color: '#CCFF00', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '16px' }}>
                  {diaSeleccionado} de {MESES_NOMBRES[mesActual]}
                </h3>
                {clasesDiaSeleccionado.length === 0 ? (
                  <p style={{ color: '#9ca3af', fontSize: '14px' }}>No tienes clases este día</p>
                ) : (
                  clasesDiaSeleccionado.map(clase => (
                    <div key={clase.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px', background: '#111111', borderRadius: '12px', border: '1px solid #374151', marginBottom: '10px' }}>
                      <div style={{ background: '#CCFF00', borderRadius: '10px', width: '44px', height: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', flexShrink: 0 }}>🏋️</div>
                      <div>
                        <p style={{ margin: '0 0 4px', fontWeight: 700, color: '#FFFFFF', fontSize: '14px', fontFamily: 'var(--font-titulos)', textTransform: 'uppercase' }}>{clase.nombre}</p>
                        <p style={{ margin: 0, color: '#9ca3af', fontSize: '12px' }}>
                          🕐 {new Date(clase.fecha_hora).toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' })} · 👥 {clase.capacidad_max} cupos
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Próximas clases */}
            <div style={{ background: '#1a1a1a', borderRadius: '16px', border: '1px solid #374151', padding: '24px' }}>
              <h3 style={{ fontFamily: 'var(--font-titulos)', fontWeight: 900, fontSize: '14px', color: '#FFFFFF', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '16px' }}>
                Próximas clases
              </h3>
              {clases.length === 0 && (
                <div style={{ textAlign: 'center', padding: '30px 0' }}>
                  <div style={{ fontSize: '36px', marginBottom: '12px' }}>📭</div>
                  <p style={{ color: '#9ca3af', fontSize: '14px' }}>No tienes clases programadas</p>
                </div>
              )}
              {clases.slice(0, 5).map(clase => (
                <div key={clase.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px', background: '#111111', borderRadius: '12px', border: '1px solid #374151', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
                  <div>
                    <p style={{ margin: '0 0 4px', fontWeight: 700, color: '#FFFFFF', fontSize: '14px', fontFamily: 'var(--font-titulos)', textTransform: 'uppercase' }}>{clase.nombre}</p>
                    <p style={{ margin: 0, color: '#9ca3af', fontSize: '12px' }}>🕐 {new Date(clase.fecha_hora).toLocaleString('es-EC')}</p>
                  </div>
                  <span style={{ background: 'rgba(204,255,0,0.1)', color: '#CCFF00', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 700, fontFamily: 'var(--font-titulos)', textTransform: 'uppercase' }}>
                    👥 {clase.capacidad_max} cupos
                  </span>
                </div>
              ))}
            </div>
          </>
        )}

        {/* QR */}
        {seccion === 'qr' && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '24px' }}>
            <div style={{ background: '#1a1a1a', borderRadius: '16px', border: '1px solid #374151', padding: '30px', width: '100%', maxWidth: '360px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
              <h3 style={{ fontFamily: 'var(--font-titulos)', fontWeight: 900, fontSize: '14px', color: '#FFFFFF', textTransform: 'uppercase', letterSpacing: '1px', margin: 0 }}>
                Tu QR de asistencia
              </h3>
              <div style={{ background: 'white', padding: '16px', borderRadius: '12px' }}>
                <QRCodeSVG value={qrData} size={200} bgColor="#ffffff" fgColor="#111111" level="H" />
              </div>
              <p style={{ color: '#9ca3af', fontSize: '12px', textAlign: 'center', margin: 0 }}>{email}</p>
            </div>

            <div style={{ background: '#1a1a1a', borderRadius: '16px', border: '1px solid #374151', padding: '24px', width: '100%', maxWidth: '360px' }}>
              <p style={{ color: '#9ca3af', fontSize: '13px', textAlign: 'center', lineHeight: '1.6', margin: 0 }}>
                Muestra este QR al administrador al <span style={{ color: '#CCFF00', fontWeight: 700 }}>entrar</span> y al <span style={{ color: '#CCFF00', fontWeight: 700 }}>salir</span> del gimnasio para registrar tu horario.
              </p>
            </div>
          </div>
        )}

        {/* HISTORIAL */}
        {seccion === 'historial' && (
          <div style={{ background: '#1a1a1a', borderRadius: '16px', border: '1px solid #374151', padding: '24px' }}>
            <h3 style={{ fontFamily: 'var(--font-titulos)', fontWeight: 900, fontSize: '14px', color: '#FFFFFF', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '20px' }}>
              🕐 Mis registros de entrada/salida
            </h3>
            {registros.length === 0 && (
              <div style={{ textAlign: 'center', padding: '30px 0' }}>
                <div style={{ fontSize: '36px', marginBottom: '12px' }}>📭</div>
                <p style={{ color: '#9ca3af', fontSize: '14px' }}>No hay registros aún</p>
              </div>
            )}
            {registros.map(r => (
              <div key={r.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px', background: '#111111', borderRadius: '12px', border: '1px solid #374151', marginBottom: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ background: r.tipo === 'entrada' ? 'rgba(204,255,0,0.15)' : 'rgba(248,113,113,0.15)', borderRadius: '8px', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>
                    {r.tipo === 'entrada' ? '🟢' : '🔴'}
                  </div>
                  <div>
                    <p style={{ margin: '0 0 3px', color: '#FFFFFF', fontWeight: 600, fontSize: '14px', textTransform: 'capitalize' }}>{r.tipo}</p>
                    <p style={{ margin: 0, color: '#9ca3af', fontSize: '12px' }}>
                      {new Date(r.fecha).toLocaleDateString('es-EC')} · {new Date(r.fecha).toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
                <span style={{ background: r.tipo === 'entrada' ? 'rgba(204,255,0,0.1)' : 'rgba(248,113,113,0.1)', color: r.tipo === 'entrada' ? '#CCFF00' : '#f87171', padding: '4px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: 700, fontFamily: 'var(--font-titulos)', textTransform: 'uppercase' }}>
                  {r.tipo}
                </span>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  )
}
