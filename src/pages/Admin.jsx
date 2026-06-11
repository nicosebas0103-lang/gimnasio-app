import { useEffect, useRef, useState } from 'react'
import { Html5Qrcode } from 'html5-qrcode'
import { supabase } from '../supabaseClient'

const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']

export default function Admin() {
  const [clases, setClases] = useState([])
  const [pagos, setPagos] = useState([])
  const [reservas, setReservas] = useState([])
  const [mensaje, setMensaje] = useState('')
  const [seccion, setSeccion] = useState('dashboard')
  const [form, setForm] = useState({ nombre: '', instructor: '', fecha_hora: '', capacidad_max: '' })
  const [scanResultado, setScanResultado] = useState('')
  const [scanError, setScanError] = useState('')
  const [escaneando, setEscaneando] = useState(false)
  const html5QrRef = useRef(null)

  useEffect(() => {
    cargarClases()
    cargarPagos()
    cargarReservas()
  }, [])

  useEffect(() => {
    return () => {
      if (html5QrRef.current) {
        html5QrRef.current.stop().catch(() => {})
        html5QrRef.current = null
      }
    }
  }, [])

  async function cargarClases() {
    const { data } = await supabase.from('clases').select('*').order('fecha_hora')
    setClases(data || [])
  }

  async function cargarPagos() {
    const { data } = await supabase.from('pagos').select('*').order('fecha_pago', { ascending: false })
    setPagos(data || [])
  }

  async function cargarReservas() {
    const { data } = await supabase.from('reservaciones').select('*, clases(*)')
    setReservas(data || [])
  }

  async function crearClase() {
    if (!form.nombre || !form.instructor || !form.fecha_hora || !form.capacidad_max) {
      setMensaje('⚠️ Completa todos los campos')
      return
    }
    const { error } = await supabase.from('clases').insert({
      nombre: form.nombre, instructor: form.instructor,
      fecha_hora: form.fecha_hora, capacidad_max: parseInt(form.capacidad_max)
    })
    if (error) setMensaje('❌ Error al crear clase')
    else {
      setMensaje('✅ Clase creada')
      setForm({ nombre: '', instructor: '', fecha_hora: '', capacidad_max: '' })
      cargarClases()
    }
  }

  async function eliminarClase(id) {
    if (!window.confirm('¿Eliminar esta clase?')) return
    const { error } = await supabase.from('clases').delete().eq('id', id)
    if (error) setMensaje('❌ Error al eliminar')
    else { setMensaje('✅ Clase eliminada'); cargarClases() }
  }

  async function iniciarScanner() {
    setScanResultado('')
    setScanError('')
    setEscaneando(true)
    try {
      const html5Qr = new Html5Qrcode('qr-reader')
      html5QrRef.current = html5Qr
      await html5Qr.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        async (decodedText) => {
          await html5Qr.stop()
          html5QrRef.current = null
          setEscaneando(false)
          try {
            const datos = JSON.parse(decodedText)
            const { error } = await supabase.from('asistencias').insert({
              usuario_id: datos.usuario_id,
              email: datos.email
            })
            if (error) setScanError('❌ Error al registrar asistencia')
            else setScanResultado(`✅ Asistencia registrada para ${datos.email}`)
          } catch {
            setScanError('❌ QR inválido')
          }
        },
        () => {}
      )
    } catch {
      setScanError('❌ No se pudo acceder a la cámara')
      setEscaneando(false)
    }
  }

  async function detenerScanner() {
    if (html5QrRef.current) {
      await html5QrRef.current.stop().catch(() => {})
      html5QrRef.current = null
    }
    setEscaneando(false)
  }

  // Stats dashboard
  const totalRecaudado = pagos.reduce((acc, p) => acc + parseFloat(p.monto), 0)
  const totalReservas = reservas.length
  const totalClases = clases.length
  const totalUsuarios = [...new Set(reservas.map(r => r.usuario_id))].length

  const reservasPorClase = {}
  reservas.forEach(r => {
    const nombre = r.clases?.nombre || 'Sin nombre'
    const instructor = r.clases?.instructor || '-'
    const fecha = r.clases?.fecha_hora
    const hora = fecha ? new Date(fecha).toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' }) : '-'
    const key = r.clase_id
    if (!reservasPorClase[key]) reservasPorClase[key] = { nombre, instructor, hora, count: 0 }
    reservasPorClase[key].count++
  })
  const rankingClases = Object.values(reservasPorClase).sort((a, b) => b.count - a.count)
  const maxReservas = rankingClases[0]?.count || 1

  const reservasPorInstructor = {}
  reservas.forEach(r => {
    const instructor = r.clases?.instructor || 'Sin instructor'
    if (!reservasPorInstructor[instructor]) reservasPorInstructor[instructor] = 0
    reservasPorInstructor[instructor]++
  })
  const rankingInstructores = Object.entries(reservasPorInstructor).sort((a, b) => b[1] - a[1])

  const reservasPorHora = {}
  reservas.forEach(r => {
    if (r.clases?.fecha_hora) {
      const hora = new Date(r.clases.fecha_hora).getHours()
      const horaStr = `${hora}:00`
      if (!reservasPorHora[horaStr]) reservasPorHora[horaStr] = 0
      reservasPorHora[horaStr]++
    }
  })
  const rankingHoras = Object.entries(reservasPorHora).sort((a, b) => b[1] - a[1])

  const anioActual = new Date().getFullYear()
  const mesActual = new Date().getMonth()
  const mesesTranscurridos = MESES.slice(0, mesActual + 1)
  const emailsQueHanPagado = {}
  pagos.forEach(p => {
    if (!emailsQueHanPagado[p.email]) emailsQueHanPagado[p.email] = []
    if (p.anio === anioActual) emailsQueHanPagado[p.email].push(p.mes)
  })
  const deudores = Object.entries(emailsQueHanPagado).map(([email, mesesPagados]) => ({
    email, mesesPagados,
    pendientes: mesesTranscurridos.filter(m => !mesesPagados.includes(m))
  }))

  const inputStyle = {
    width: '100%', padding: '13px 16px', marginBottom: '12px',
    background: '#111111', border: '1.5px solid #374151',
    borderRadius: '10px', fontSize: '14px', color: '#FFFFFF',
    outline: 'none', boxSizing: 'border-box', fontFamily: 'var(--font-cuerpo)'
  }

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
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>

        <div style={{ marginBottom: '40px' }}>
          <h2 style={{ fontFamily: 'var(--font-titulos)', fontWeight: 900, fontSize: '32px', color: '#FFFFFF', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '8px' }}>
            Panel <span style={{ color: '#CCFF00' }}>Admin</span>
          </h2>
          <p style={{ color: '#9ca3af', fontSize: '14px' }}>Gestiona clases, pagos y estadísticas</p>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '30px', flexWrap: 'wrap' }}>
          <button onClick={() => { setSeccion('dashboard'); detenerScanner() }} style={tabStyle('dashboard')}>📊 Dashboard</button>
          <button onClick={() => { setSeccion('clases'); detenerScanner() }} style={tabStyle('clases')}>🏃 Clases</button>
          <button onClick={() => { setSeccion('pagos'); detenerScanner() }} style={tabStyle('pagos')}>💳 Pagos</button>
          <button onClick={() => { setSeccion('deudores'); detenerScanner() }} style={tabStyle('deudores')}>⚠️ Quiénes deben</button>
          <button onClick={() => { setSeccion('scanner'); setScanResultado(''); setScanError('') }} style={tabStyle('scanner')}>📷 Escanear QR</button>
        </div>

        {/* DASHBOARD */}
        {seccion === 'dashboard' && (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '16px', marginBottom: '30px' }}>
              {[
                { label: 'Total recaudado', valor: `$${totalRecaudado.toFixed(2)}` },
                { label: 'Reservas totales', valor: totalReservas },
                { label: 'Clases activas', valor: totalClases },
                { label: 'Usuarios activos', valor: totalUsuarios },
              ].map((m, i) => (
                <div key={i} style={{ background: '#1a1a1a', borderRadius: '16px', padding: '20px', border: '1px solid #374151', textAlign: 'center' }}>
                  <p style={{ margin: '0 0 8px', color: '#9ca3af', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', fontFamily: 'var(--font-titulos)' }}>{m.label}</p>
                  <p style={{ margin: 0, fontSize: '28px', fontWeight: 900, color: '#CCFF00', fontFamily: 'var(--font-titulos)' }}>{m.valor}</p>
                </div>
              ))}
            </div>

            <div style={{ background: '#1a1a1a', borderRadius: '16px', padding: '24px', marginBottom: '20px', border: '1px solid #374151' }}>
              <h3 style={{ fontFamily: 'var(--font-titulos)', fontWeight: 900, fontSize: '14px', color: '#FFFFFF', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '20px' }}>🏆 Clases más reservadas</h3>
              {rankingClases.length === 0 && <p style={{ color: '#9ca3af', fontSize: '14px' }}>No hay reservas aún.</p>}
              {rankingClases.map((clase, i) => (
                <div key={i} style={{ marginBottom: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', flexWrap: 'wrap', gap: '6px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ background: i === 0 ? '#CCFF00' : '#374151', color: i === 0 ? '#111111' : '#9ca3af', borderRadius: '6px', padding: '2px 10px', fontSize: '12px', fontWeight: 900, fontFamily: 'var(--font-titulos)' }}>#{i + 1}</span>
                      <div>
                        <p style={{ margin: 0, fontWeight: 700, color: '#FFFFFF', fontSize: '14px', fontFamily: 'var(--font-titulos)', textTransform: 'uppercase' }}>{clase.nombre}</p>
                        <p style={{ margin: 0, color: '#9ca3af', fontSize: '12px' }}>👤 {clase.instructor} · 🕐 {clase.hora}</p>
                      </div>
                    </div>
                    <span style={{ fontFamily: 'var(--font-titulos)', fontWeight: 900, color: '#CCFF00', fontSize: '18px' }}>{clase.count} reservas</span>
                  </div>
                  <div style={{ background: '#374151', borderRadius: '4px', height: '6px' }}>
                    <div style={{ height: '6px', borderRadius: '4px', width: `${(clase.count / maxReservas) * 100}%`, background: i === 0 ? '#CCFF00' : '#4b5563', transition: 'width 0.5s' }} />
                  </div>
                </div>
              ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
              <div style={{ background: '#1a1a1a', borderRadius: '16px', padding: '24px', border: '1px solid #374151' }}>
                <h3 style={{ fontFamily: 'var(--font-titulos)', fontWeight: 900, fontSize: '14px', color: '#FFFFFF', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '20px' }}>👤 Instructores</h3>
                {rankingInstructores.length === 0 && <p style={{ color: '#9ca3af', fontSize: '14px' }}>Sin datos aún.</p>}
                {rankingInstructores.map(([instructor, count], i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: '#111111', borderRadius: '10px', marginBottom: '8px', border: '1px solid #374151' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ background: i === 0 ? '#CCFF00' : '#374151', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 900, color: i === 0 ? '#111111' : '#9ca3af', fontFamily: 'var(--font-titulos)' }}>{i + 1}</div>
                      <span style={{ color: '#FFFFFF', fontSize: '13px', fontWeight: 600 }}>{instructor}</span>
                    </div>
                    <span style={{ color: '#CCFF00', fontWeight: 900, fontFamily: 'var(--font-titulos)' }}>{count}</span>
                  </div>
                ))}
              </div>

              <div style={{ background: '#1a1a1a', borderRadius: '16px', padding: '24px', border: '1px solid #374151' }}>
                <h3 style={{ fontFamily: 'var(--font-titulos)', fontWeight: 900, fontSize: '14px', color: '#FFFFFF', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '20px' }}>🕐 Horas populares</h3>
                {rankingHoras.length === 0 && <p style={{ color: '#9ca3af', fontSize: '14px' }}>Sin datos aún.</p>}
                {rankingHoras.map(([hora, count], i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: '#111111', borderRadius: '10px', marginBottom: '8px', border: '1px solid #374151' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ background: i === 0 ? '#CCFF00' : '#374151', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 900, color: i === 0 ? '#111111' : '#9ca3af', fontFamily: 'var(--font-titulos)' }}>{hora}</div>
                      <span style={{ color: '#FFFFFF', fontSize: '13px', fontWeight: 600 }}>{count} reservas</span>
                    </div>
                    <span style={{ color: '#CCFF00', fontWeight: 900, fontFamily: 'var(--font-titulos)' }}>#{i + 1}</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* CLASES */}
        {seccion === 'clases' && (
          <>
            <div style={{ background: '#1a1a1a', borderRadius: '16px', padding: '30px', marginBottom: '20px', border: '1px solid #374151' }}>
              <h3 style={{ fontFamily: 'var(--font-titulos)', fontWeight: 900, fontSize: '16px', color: '#FFFFFF', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '20px' }}>➕ Nueva clase</h3>
              <input placeholder="Nombre de la clase" value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} style={inputStyle} />
              <input placeholder="Instructor" value={form.instructor} onChange={e => setForm({ ...form, instructor: e.target.value })} style={inputStyle} />
              <input type="datetime-local" value={form.fecha_hora} onChange={e => setForm({ ...form, fecha_hora: e.target.value })} style={inputStyle} />
              <input placeholder="Capacidad máxima" type="number" value={form.capacidad_max} onChange={e => setForm({ ...form, capacidad_max: e.target.value })} style={inputStyle} />
              <button onClick={crearClase} style={{ width: '100%', padding: '14px', background: '#CCFF00', color: '#111111', border: 'none', borderRadius: '10px', fontFamily: 'var(--font-titulos)', fontWeight: 700, fontSize: '14px', textTransform: 'uppercase', letterSpacing: '1px' }}>Crear clase</button>
              {mensaje && (
                <p style={{ marginTop: '16px', padding: '12px', borderRadius: '8px', background: mensaje.includes('✅') ? 'rgba(204,255,0,0.1)' : 'rgba(255,100,100,0.1)', border: `1px solid ${mensaje.includes('✅') ? '#CCFF00' : '#f87171'}`, color: mensaje.includes('✅') ? '#CCFF00' : '#f87171', textAlign: 'center', fontSize: '13px', fontWeight: 600 }}>{mensaje}</p>
              )}
            </div>
            <div style={{ background: '#1a1a1a', borderRadius: '16px', padding: '30px', border: '1px solid #374151' }}>
              <h3 style={{ fontFamily: 'var(--font-titulos)', fontWeight: 900, fontSize: '16px', color: '#FFFFFF', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '20px' }}>📋 Clases actuales</h3>
              {clases.length === 0 && <p style={{ color: '#9ca3af', fontSize: '14px' }}>No hay clases creadas.</p>}
              {clases.map(clase => (
                <div key={clase.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', marginBottom: '10px', background: '#111111', borderRadius: '12px', border: '1px solid #374151', flexWrap: 'wrap', gap: '10px' }}>
                  <div>
                    <p style={{ margin: '0 0 4px', fontWeight: 700, color: '#FFFFFF', fontSize: '14px', fontFamily: 'var(--font-titulos)', textTransform: 'uppercase' }}>{clase.nombre}</p>
                    <p style={{ margin: 0, fontSize: '12px', color: '#9ca3af' }}>👤 {clase.instructor} · 🕐 {new Date(clase.fecha_hora).toLocaleString('es-EC')} · 👥 {clase.capacidad_max} cupos</p>
                  </div>
                  <button onClick={() => eliminarClase(clase.id)} style={{ padding: '8px 16px', background: 'transparent', color: '#f87171', border: '1.5px solid #f87171', borderRadius: '8px', fontFamily: 'var(--font-titulos)', fontWeight: 700, fontSize: '12px', textTransform: 'uppercase' }}>🗑️ Eliminar</button>
                </div>
              ))}
            </div>
          </>
        )}

        {/* PAGOS */}
        {seccion === 'pagos' && (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
              <div style={{ background: '#1a1a1a', borderRadius: '16px', padding: '24px', textAlign: 'center', border: '1px solid #374151' }}>
                <p style={{ margin: '0 0 8px', color: '#9ca3af', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '1px' }}>Total recaudado</p>
                <p style={{ margin: 0, fontSize: '32px', fontWeight: 900, color: '#CCFF00', fontFamily: 'var(--font-titulos)' }}>${totalRecaudado.toFixed(2)}</p>
              </div>
              <div style={{ background: '#1a1a1a', borderRadius: '16px', padding: '24px', textAlign: 'center', border: '1px solid #374151' }}>
                <p style={{ margin: '0 0 8px', color: '#9ca3af', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '1px' }}>Total pagos</p>
                <p style={{ margin: 0, fontSize: '32px', fontWeight: 900, color: '#CCFF00', fontFamily: 'var(--font-titulos)' }}>{pagos.length}</p>
              </div>
            </div>
            <div style={{ background: '#1a1a1a', borderRadius: '16px', padding: '30px', border: '1px solid #374151' }}>
              <h3 style={{ fontFamily: 'var(--font-titulos)', fontWeight: 900, fontSize: '16px', color: '#FFFFFF', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '20px' }}>🧾 Todos los pagos</h3>
              {pagos.length === 0 && <p style={{ color: '#9ca3af', fontSize: '14px' }}>No hay pagos registrados.</p>}
              {pagos.map(pago => (
                <div key={pago.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', marginBottom: '10px', background: '#111111', borderRadius: '12px', border: '1px solid #374151', flexWrap: 'wrap', gap: '10px' }}>
                  <div>
                    <p style={{ margin: '0 0 4px', fontWeight: 700, color: '#FFFFFF', fontSize: '14px' }}>{pago.email}</p>
                    <p style={{ margin: 0, fontSize: '12px', color: '#9ca3af' }}>📅 {pago.mes} {pago.anio} · 💳 {pago.metodo_pago} · {new Date(pago.fecha_pago).toLocaleDateString('es-EC')}</p>
                  </div>
                  <span style={{ fontFamily: 'var(--font-titulos)', fontWeight: 900, color: '#CCFF00', fontSize: '18px' }}>${pago.monto}</span>
                </div>
              ))}
            </div>
          </>
        )}

        {/* DEUDORES */}
        {seccion === 'deudores' && (
          <div style={{ background: '#1a1a1a', borderRadius: '16px', padding: '30px', border: '1px solid #374151' }}>
            <h3 style={{ fontFamily: 'var(--font-titulos)', fontWeight: 900, fontSize: '16px', color: '#FFFFFF', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '6px' }}>⚠️ Estado de pagos</h3>
            <p style={{ color: '#9ca3af', fontSize: '12px', marginBottom: '20px' }}>Meses {anioActual}: {mesesTranscurridos.join(', ')}</p>
            {deudores.length === 0 && <p style={{ color: '#9ca3af', fontSize: '14px' }}>No hay información de pagos aún.</p>}
            {deudores.map(({ email, mesesPagados, pendientes }) => (
              <div key={email} style={{ padding: '16px', marginBottom: '12px', background: '#111111', borderRadius: '12px', border: `1px solid ${pendientes.length > 0 ? '#f87171' : '#CCFF00'}` }}>
                <p style={{ margin: '0 0 10px', fontWeight: 700, color: '#FFFFFF', fontSize: '14px' }}>👤 {email}</p>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: mesesPagados.length ? '8px' : 0 }}>
                  {mesesPagados.map(m => (
                    <span key={m} style={{ background: 'rgba(204,255,0,0.15)', color: '#CCFF00', padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 700, fontFamily: 'var(--font-titulos)', textTransform: 'uppercase' }}>✅ {m}</span>
                  ))}
                </div>
                {pendientes.length > 0 && (
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {pendientes.map(m => (
                      <span key={m} style={{ background: 'rgba(248,113,113,0.15)', color: '#f87171', padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 700, fontFamily: 'var(--font-titulos)', textTransform: 'uppercase' }}>❌ {m}</span>
                    ))}
                  </div>
                )}
                {pendientes.length === 0 && <p style={{ margin: '6px 0 0', color: '#CCFF00', fontSize: '12px', fontWeight: 700 }}>🎉 Al día</p>}
              </div>
            ))}
          </div>
        )}

        {/* SCANNER QR */}
        {seccion === 'scanner' && (
          <div style={{ background: '#1a1a1a', borderRadius: '16px', border: '1px solid #374151', padding: '30px' }}>
            <h3 style={{ fontFamily: 'var(--font-titulos)', fontWeight: 900, fontSize: '16px', color: '#FFFFFF', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>📷 Escanear QR de asistencia</h3>
            <p style={{ color: '#9ca3af', fontSize: '13px', marginBottom: '24px' }}>Apunta la cámara al QR del usuario para registrar su asistencia</p>

            <div id="qr-reader" style={{ width: '100%', maxWidth: '400px', margin: '0 auto 24px', borderRadius: '12px', overflow: 'hidden', border: escaneando ? '2px solid #CCFF00' : '2px solid #374151' }} />

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginBottom: '24px' }}>
              {!escaneando ? (
                <button onClick={iniciarScanner} style={{ padding: '14px 32px', background: '#CCFF00', color: '#111111', border: 'none', borderRadius: '10px', fontFamily: 'var(--font-titulos)', fontWeight: 700, fontSize: '14px', textTransform: 'uppercase', letterSpacing: '1px', cursor: 'pointer' }}>📷 Iniciar escáner</button>
              ) : (
                <button onClick={detenerScanner} style={{ padding: '14px 32px', background: 'transparent', color: '#f87171', border: '1.5px solid #f87171', borderRadius: '10px', fontFamily: 'var(--font-titulos)', fontWeight: 700, fontSize: '14px', textTransform: 'uppercase', letterSpacing: '1px', cursor: 'pointer' }}>⏹ Detener</button>
              )}
            </div>

            {scanResultado && (
              <div style={{ padding: '16px', borderRadius: '12px', background: 'rgba(204,255,0,0.1)', border: '1px solid #CCFF00', textAlign: 'center' }}>
                <p style={{ margin: '0 0 12px', color: '#CCFF00', fontWeight: 700, fontSize: '15px' }}>{scanResultado}</p>
                <button onClick={() => { setScanResultado(''); iniciarScanner() }} style={{ padding: '10px 24px', background: '#CCFF00', color: '#111111', border: 'none', borderRadius: '8px', fontFamily: 'var(--font-titulos)', fontWeight: 700, fontSize: '12px', textTransform: 'uppercase', cursor: 'pointer' }}>Escanear otro</button>
              </div>
            )}

            {scanError && (
              <div style={{ padding: '16px', borderRadius: '12px', background: 'rgba(248,113,113,0.1)', border: '1px solid #f87171', textAlign: 'center' }}>
                <p style={{ margin: '0 0 12px', color: '#f87171', fontWeight: 700, fontSize: '15px' }}>{scanError}</p>
                <button onClick={() => { setScanError(''); iniciarScanner() }} style={{ padding: '10px 24px', background: '#f87171', color: '#111111', border: 'none', borderRadius: '8px', fontFamily: 'var(--font-titulos)', fontWeight: 700, fontSize: '12px', textTransform: 'uppercase', cursor: 'pointer' }}>Reintentar</button>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  )
}
