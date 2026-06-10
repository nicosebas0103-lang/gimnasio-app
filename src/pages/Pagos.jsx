import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'

const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
]

const METODOS = ['Tarjeta de crédito', 'Tarjeta de débito', 'Transferencia bancaria', 'Efectivo']

export default function Pagos() {
  const [pagosList, setPagosList] = useState([])
  const [mesSeleccionado, setMesSeleccionado] = useState('')
  const [anioSeleccionado, setAnioSeleccionado] = useState(new Date().getFullYear())
  const [metodo, setMetodo] = useState('')
  const [mensaje, setMensaje] = useState('')
  const [userEmail, setUserEmail] = useState('')
  const [userId, setUserId] = useState('')
  const [procesando, setProcesando] = useState(false)

  useEffect(() => {
    cargarDatos()
  }, [])

  async function cargarDatos() {
    const { data: { user } } = await supabase.auth.getUser()
    setUserEmail(user.email)
    setUserId(user.id)
    const { data } = await supabase
      .from('pagos').select('*')
      .eq('usuario_id', user.id)
      .order('anio', { ascending: false })
    setPagosList(data || [])
  }

  function mesesPendientes() {
    const anioActual = new Date().getFullYear()
    const mesActual = new Date().getMonth()
    const pendientes = []
    for (let i = 0; i <= mesActual; i++) {
      const yaPage = pagosList.some(p => p.mes === MESES[i] && p.anio === anioActual)
      if (!yaPage) pendientes.push(MESES[i])
    }
    return pendientes
  }

  async function realizarPago() {
    if (!mesSeleccionado || !metodo) {
      setMensaje('⚠️ Selecciona el mes y método de pago')
      return
    }
    const yaExiste = pagosList.some(p => p.mes === mesSeleccionado && p.anio === anioSeleccionado)
    if (yaExiste) {
      setMensaje('⚠️ Ya pagaste ' + mesSeleccionado + ' ' + anioSeleccionado)
      return
    }
    setProcesando(true)
    await new Promise(r => setTimeout(r, 1500))
    const { error } = await supabase.from('pagos').insert({
      usuario_id: userId, email: userEmail,
      mes: mesSeleccionado, anio: anioSeleccionado,
      metodo_pago: metodo, monto: 30.00
    })
    setProcesando(false)
    if (error) setMensaje('❌ Error al procesar el pago')
    else {
      setMensaje('✅ ¡Pago de ' + mesSeleccionado + ' realizado!')
      setMesSeleccionado('')
      setMetodo('')
      cargarDatos()
    }
  }

  const pendientes = mesesPendientes()

  const selectStyle = {
    width: '100%', padding: '13px 16px', marginBottom: '12px',
    background: '#111111', border: '1.5px solid #374151',
    borderRadius: '10px', fontSize: '14px', color: '#FFFFFF',
    outline: 'none', boxSizing: 'border-box', cursor: 'pointer'
  }

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
            Mis <span style={{ color: '#CCFF00' }}>Pagos</span>
          </h2>
          <p style={{ color: '#9ca3af', fontSize: '14px' }}>Gestiona tus pagos mensuales</p>
        </div>

        {/* Meses pendientes */}
        {pendientes.length > 0 ? (
          <div style={{
            background: 'rgba(204,255,0,0.05)',
            border: '1px solid #CCFF00',
            borderRadius: '16px', padding: '20px', marginBottom: '24px'
          }}>
            <p style={{
              fontFamily: 'var(--font-titulos)', fontWeight: 700,
              fontSize: '13px', color: '#CCFF00',
              textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px'
            }}>⚠️ Pagos pendientes</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {pendientes.map(mes => (
                <span key={mes} style={{
                  background: '#CCFF00', color: '#111111',
                  padding: '4px 14px', borderRadius: '20px',
                  fontSize: '12px', fontWeight: 700,
                  fontFamily: 'var(--font-titulos)', textTransform: 'uppercase'
                }}>{mes}</span>
              ))}
            </div>
          </div>
        ) : (
          <div style={{
            background: 'rgba(204,255,0,0.05)',
            border: '1px solid #CCFF00',
            borderRadius: '16px', padding: '20px', marginBottom: '24px',
            textAlign: 'center'
          }}>
            <p style={{ color: '#CCFF00', fontWeight: 700, fontSize: '15px', margin: 0 }}>
              🎉 ¡Estás al día con todos tus pagos!
            </p>
          </div>
        )}

        {/* Formulario */}
        <div style={{
          background: '#1a1a1a', borderRadius: '16px',
          padding: '30px', marginBottom: '24px',
          border: '1px solid #374151'
        }}>
          <h3 style={{
            fontFamily: 'var(--font-titulos)', fontWeight: 900,
            fontSize: '16px', color: '#FFFFFF',
            textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '20px'
          }}>➕ Realizar pago</h3>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <select value={mesSeleccionado} onChange={e => setMesSeleccionado(e.target.value)} style={selectStyle}>
              <option value="">Mes</option>
              {MESES.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
            <select value={anioSeleccionado} onChange={e => setAnioSeleccionado(parseInt(e.target.value))} style={selectStyle}>
              <option value={2025}>2025</option>
              <option value={2026}>2026</option>
              <option value={2027}>2027</option>
            </select>
          </div>

          <select value={metodo} onChange={e => setMetodo(e.target.value)} style={selectStyle}>
            <option value="">Método de pago</option>
            {METODOS.map(m => <option key={m} value={m}>{m}</option>)}
          </select>

          {/* Resumen */}
          {mesSeleccionado && metodo && (
            <div style={{
              background: '#111111', borderRadius: '10px',
              padding: '16px', marginBottom: '16px',
              border: '1px solid #374151'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ color: '#9ca3af', fontSize: '13px' }}>Período</span>
                <span style={{ color: '#FFFFFF', fontWeight: 600, fontSize: '13px' }}>{mesSeleccionado} {anioSeleccionado}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ color: '#9ca3af', fontSize: '13px' }}>Método</span>
                <span style={{ color: '#FFFFFF', fontWeight: 600, fontSize: '13px' }}>{metodo}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '10px', borderTop: '1px solid #374151' }}>
                <span style={{ color: '#9ca3af', fontSize: '13px' }}>Total</span>
                <span style={{ color: '#CCFF00', fontWeight: 900, fontSize: '20px', fontFamily: 'var(--font-titulos)' }}>$30.00</span>
              </div>
            </div>
          )}

          <button onClick={realizarPago} disabled={procesando} style={{
            width: '100%', padding: '14px',
            background: procesando ? '#374151' : '#CCFF00',
            color: procesando ? '#9ca3af' : '#111111',
            border: 'none', borderRadius: '10px',
            fontFamily: 'var(--font-titulos)',
            fontWeight: 700, fontSize: '14px',
            textTransform: 'uppercase', letterSpacing: '1px',
            cursor: procesando ? 'not-allowed' : 'pointer'
          }}>
            {procesando ? '⏳ Procesando...' : '💳 Confirmar pago'}
          </button>

          {mensaje && (
            <p style={{
              marginTop: '16px', padding: '12px', borderRadius: '8px',
              background: mensaje.includes('✅') ? 'rgba(204,255,0,0.1)' : 'rgba(255,100,100,0.1)',
              border: `1px solid ${mensaje.includes('✅') ? '#CCFF00' : '#f87171'}`,
              color: mensaje.includes('✅') ? '#CCFF00' : '#f87171',
              textAlign: 'center', fontSize: '13px', fontWeight: 600
            }}>{mensaje}</p>
          )}
        </div>

        {/* Historial */}
        <div style={{
          background: '#1a1a1a', borderRadius: '16px',
          padding: '30px', border: '1px solid #374151'
        }}>
          <h3 style={{
            fontFamily: 'var(--font-titulos)', fontWeight: 900,
            fontSize: '16px', color: '#FFFFFF',
            textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '20px'
          }}>🧾 Historial</h3>

          {pagosList.length === 0 && (
            <p style={{ color: '#9ca3af', textAlign: 'center', fontSize: '14px' }}>
              No has realizado ningún pago aún.
            </p>
          )}

          {pagosList.map(pago => (
            <div key={pago.id} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '16px', marginBottom: '10px',
              background: '#111111', borderRadius: '12px',
              border: '1px solid #374151'
            }}>
              <div>
                <p style={{ margin: '0 0 4px', fontWeight: 700, color: '#FFFFFF', fontSize: '14px' }}>
                  📅 {pago.mes} {pago.anio}
                </p>
                <p style={{ margin: 0, fontSize: '12px', color: '#9ca3af' }}>
                  💳 {pago.metodo_pago} · {new Date(pago.fecha_pago).toLocaleDateString('es-EC')}
                </p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ margin: '0 0 4px', fontFamily: 'var(--font-titulos)', fontWeight: 900, color: '#CCFF00', fontSize: '18px' }}>
                  $30.00
                </p>
                <span style={{
                  background: 'rgba(204,255,0,0.1)', color: '#CCFF00',
                  padding: '2px 10px', borderRadius: '20px',
                  fontSize: '11px', fontWeight: 700,
                  fontFamily: 'var(--font-titulos)', textTransform: 'uppercase'
                }}>✅ Pagado</span>
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  )
}
