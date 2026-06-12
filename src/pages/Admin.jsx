import { useEffect, useRef, useState } from 'react'
import { Html5Qrcode } from 'html5-qrcode'
import { supabase } from '../supabaseClient'

const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']

export default function Admin() {
  const [clases, setClases] = useState([])
  const [pagos, setPagos] = useState([])
  const [reservas, setReservas] = useState([])
  const [profesores, setProfesores] = useState([])
  const [registrosProfesores, setRegistrosProfesores] = useState([])
  const [mensaje, setMensaje] = useState('')
  const [mensajeProfesor, setMensajeProfesor] = useState('')
  const [seccion, setSeccion] = useState('dashboard')
  const [form, setForm] = useState({ nombre: '', instructor: '', fecha_hora: '', capacidad_max: '' })
  const [formProfesor, setFormProfesor] = useState({ email: '', nombre: '' })
  const [scanResultado, setScanResultado] = useState('')
  const [scanError, setScanError] = useState('')
  const [escaneando, setEscaneando] = useState(false)
  const [scanMode, setScanMode] = useState('asistencia') // 'asistencia' o 'profesor'
  const [claseDetalle, setClaseDetalle] = useState(null)
  const [usuariosClase, setUsuariosClase] = useState([])
  const [cargandoUsuarios, setCargandoUsuarios] = useState(false)
  const html5QrRef = useRef(null)

  useEffect(() => {
    cargarClases()
    cargarPagos()
    cargarReservas()
    cargarProfesores()
    cargarRegistrosProfesores()
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

  async function cargarProfesores() {
    const { data } = await supabase.from('profesores').select('*').order('created_at', { ascending: false })
    setProfesores(data || [])
  }

  async function cargarRegistrosProfesores() {
    const { data } = await supabase
      .from('registros_profesores')
      .select('*')
      .order('fecha', { ascending: false })
    setRegistrosProfesores(data || [])
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

  async function agregarProfesor() {
    if (!formProfesor.email || !formProfesor.nombre) {
      setMensajeProfesor('⚠️ Completa email y nombre')
      return
    }
    const { error } = await supabase.from('profesores').insert({
      email: formProfesor.email.toLowerCase().trim(),
      nombre: formProfesor.nombre.trim()
    })
    if (error) setMensajeProfesor('❌ Error — ese correo ya existe o hubo un problema')
    else {
      setMensajeProfesor('✅ Profesor agregado')
      setFormProfesor({ email: '', nombre: '' })
      cargarProfesores()
    }
  }

  async function eliminarProfesor(id) {
    if (!window.confirm('¿Quitar acceso a este profesor?')) return
    const { error } = await supabase.from('profesores').delete().eq('id', id)
    if (error) setMensajeProfesor('❌ Error al eliminar')
    else { setMensajeProfesor('✅ Acceso revocado'); cargarProfesores() }
  }

  async function verUsuariosClase(clase) {
    setClaseDetalle(clase)
    setCargandoUsuarios(true)
    const { data } = await supabase
      .from('reservaciones')
      .select('*')
      .eq('clase_id', clase.id)
    setUsuariosClase(data || [])
    setCargandoUsuarios(false)
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

            // QR de profesor
            if (datos.tipo === 'profesor') {
              // Determinar si es entrada o salida
              const hoy = new Date()
              const inicioDia = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate()).toISOString()
              const finDia = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() + 1).toISOString()

              const { data: registrosHoy } = await supabase
                .from('registros_profesores')
                .select('*')
                .eq('profesor_email', datos.email)
                .gte('fecha', inicioDia)
                .lt('fecha', finDia)
                .order('fecha', { ascending: false })

              // Si no hay registros hoy o el último fue salida → entrada
              // Si el último fue entrada → salida
              const ultimoRegistro = registrosHoy?.[0]
              const tipo = !ultimoRegistro || ultimoRegistro.tipo === 'salida' ? 'entrada' : 'salida'

              const { error } = await supabase.from('registros_profesores').insert({
                profesor_email: datos.email,
                tipo
              })
              if (error) setScanError('❌ Error al registrar')
              else {
                setScanResultado(`✅ ${tipo.toUpperCase()} registrada para ${datos.email}`)
                cargarRegistrosProfesores()
              }
              return
            }

            // QR de usuario normal — asistencia
            const hoy = new Date()
            const inicioDia = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate()).toISOString()
            const finDia = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() + 1).toISOString()

            const { data: yaAsistio } = await supabase
              .from('asistencias')
              .select('*')
              .eq('usuario_id', datos.usuario_id)
              .gte('fecha', inicioDia)
              .lt('fecha', finDia)

            if (yaAsistio && yaAsistio.length > 0) {
              setScanError(`⚠️ ${datos.email} ya registró asistencia hoy`)
              return
            }

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

  // Agrupar registros de profesores por email para el dashboard
  const resumenProfesores = {}
  registrosProfesores.forEach(r => {
    if (!resumenProfesores[r.profesor_email]) {
      resumenProfesores[r.profesor_email] = { entradas: 0, salidas: 0, ultimo: null }
    }
    if (r.tipo === 'entrada') resumenProfesores[r.profesor_email].entradas++
    else resumenProfesores[r.profesor_email].salidas++
    if (!resumenProfesores[r.profesor_email].ultimo) {
      resumenProfesores[r.profesor_email].ultimo = r
    }
  })

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
          <p style={{ color: '#9ca3af', fontSize: '14px' }}>Gestiona clases, pagos, entrenadores y estadísticas</p>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '30px', flexWrap: 'wrap' }}>
          <button onClick={() => { setSeccion('dashboard'); detenerScanner() }} style={tabStyle('dashboard')}>📊 Dashboard</button>
          <button onClick={() => { setSeccion('clases'); detenerScanner() }} style={tabStyle('clases')}>🏃 Clases</button>
          <button onClick={() => { setSeccion('entrenadores'); detenerScanner() }} style={tabStyle('entrenadores')}>👤 Entrenadores</button>
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
                { label: 'Entrenadores', valor: profesores.length },
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

        {/* ENTRENADORES */}
        {seccion === 'entrenadores' && (
          <>
            {/* Agregar profesor */}
            <div style={{ background: '#1a1a1a', borderRadius: '16px', padding: '30px', marginBottom: '20px', border: '1px solid #374151' }}>
              <h3 style={{ fontFamily: 'var(--font-titulos)', fontWeight: 900, fontSize: '16px', color: '#FFFFFF', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '20px' }}>➕ Agregar entrenador</h3>
              <input placeholder="Nombre del entrenador" value={formProfesor.nombre} onChange={e => setFormProfesor({ ...formProfesor, nombre: e.target.value })} style={inputStyle} />
              <input placeholder="Correo electrónico" value={formProfesor.email} onChange={e => setFormProfesor({ ...formProfesor, email: e.target.value })} style={inputStyle} />
              <button onClick={agregarProfesor} style={{ width: '100%', padding: '14px', background: '#CCFF00', color: '#111111', border: 'none', borderRadius: '10px', fontFamily: 'var(--font-titulos)', fontWeight: 700, fontSize: '14px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                Dar acceso
              </button>
              {mensajeProfesor && (
                <p style={{ marginTop: '16px', padding: '12px', borderRadius: '8px', background: mensajeProfesor.includes('✅') ? 'rgba(204,255,0,0.1)' : 'rgba(255,100,100,0.1)', border: `1px solid ${mensajeProfesor.includes('✅') ? '#CCFF00' : '#f87171'}`, color: mensajeProfesor.includes('✅') ? '#CCFF00' : '#f87171', textAlign: 'center', fontSize: '13px', fontWeight: 600 }}>{mensajeProfesor}</p>
              )}
            </div>

            {/* Lista de profesores */}
            <div style={{ background: '#1a1a1a', borderRadius: '16px', padding: '30px', marginBottom: '20px', border: '1px solid #374151' }}>
              <h3 style={{ fontFamily: 'var(--font-titulos)', fontWeight: 900, fontSize: '16px', color: '#FFFFFF', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '20px' }}>👤 Entrenadores registrados</h3>
              {profesores.length === 0 && <p style={{ color: '#9ca3af', fontSize: '14px' }}>No hay entrenadores registrados.</p>}
              {profesores.map(prof => (
                <div key={prof.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', marginBottom: '10px', background: '#111111', borderRadius: '12px', border: '1px solid #374151', flexWrap: 'wrap', gap: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ background: '#CCFF00', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-titulos)', fontWeight: 900, fontSize: '16px', color: '#111111' }}>
                      {prof.nombre.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p style={{ margin: '0 0 3px', fontWeight: 700, color: '#FFFFFF', fontSize: '14px' }}>{prof.nombre}</p>
                      <p style={{ margin: 0, fontSize: '12px', color: '#9ca3af' }}>{prof.email}</p>
                    </div>
                  </div>
                  <button onClick={() => eliminarProfesor(prof.id)} style={{ padding: '8px 16px', background: 'transparent', color: '#f87171', border: '1.5px solid #f87171', borderRadius: '8px', fontFamily: 'var(--font-titulos)', fontWeight: 700, fontSize: '12px', textTransform: 'uppercase', cursor: 'pointer' }}>
                    Revocar acceso
                  </button>
                </div>
              ))}
            </div>

            {/* Dashboard entradas/salidas */}
            <div style={{ background: '#1a1a1a', borderRadius: '16px', padding: '30px', border: '1px solid #374151' }}>
              <h3 style={{ fontFamily: 'var(--font-titulos)', fontWeight: 900, fontSize: '16px', color: '#FFFFFF', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '20px' }}>🕐 Registros de entrada/salida</h3>
              {registrosProfesores.length === 0 && <p style={{ color: '#9ca3af', fontSize: '14px' }}>No hay registros aún.</p>}

              {/* Resumen por profesor */}
              {Object.entries(resumenProfesores).map(([email, datos]) => (
                <div key={email} style={{ padding: '16px', marginBottom: '12px', background: '#111111', borderRadius: '12px', border: '1px solid #374151' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
                    <p style={{ margin: 0, fontWeight: 700, color: '#FFFFFF', fontSize: '14px' }}>👤 {email}</p>
                    {datos.ultimo && (
                      <span style={{ background: datos.ultimo.tipo === 'entrada' ? 'rgba(204,255,0,0.1)' : 'rgba(248,113,113,0.1)', color: datos.ultimo.tipo === 'entrada' ? '#CCFF00' : '#f87171', padding: '3px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: 700, fontFamily: 'var(--font-titulos)', textTransform: 'uppercase' }}>
                        Último: {datos.ultimo.tipo} · {new Date(datos.ultimo.fecha).toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <div style={{ background: 'rgba(204,255,0,0.08)', borderRadius: '10px', padding: '10px 16px', flex: 1, textAlign: 'center', border: '1px solid rgba(204,255,0,0.2)' }}>
                      <p style={{ margin: '0 0 4px', color: '#9ca3af', fontSize: '11px', textTransform: 'uppercase', fontFamily: 'var(--font-titulos)' }}>Entradas</p>
                      <p style={{ margin: 0, color: '#CCFF00', fontWeight: 900, fontSize: '22px', fontFamily: 'var(--font-titulos)' }}>{datos.entradas}</p>
                    </div>
                    <div style={{ background: 'rgba(248,113,113,0.08)', borderRadius: '10px', padding: '10px 16px', flex: 1, textAlign: 'center', border: '1px solid rgba(248,113,113,0.2)' }}>
                      <p style={{ margin: '0 0 4px', color: '#9ca3af', fontSize: '11px', textTransform: 'uppercase', fontFamily: 'var(--font-titulos)' }}>Salidas</p>
                      <p style={{ margin: 0, color: '#f87171', fontWeight: 900, fontSize: '22px', fontFamily: 'var(--font-titulos)' }}>{datos.salidas}</p>
                    </div>
                  </div>
                </div>
              ))}

              {/* Historial reciente */}
              <h4 style={{ fontFamily: 'var(--font-titulos)', fontWeight: 900, fontSize: '13px', color: '#FFFFFF', textTransform: 'uppercase', letterSpacing: '1px', margin: '24px 0 12px' }}>Historial reciente</h4>
              {registrosProfesores.slice(0, 15).map(r => (
                <div key={r.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: '#111111', borderRadius: '10px', marginBottom: '6px', border: '1px solid #374151' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '16px' }}>{r.tipo === 'entrada' ? '🟢' : '🔴'}</span>
                    <div>
                      <p style={{ margin: '0 0 2px', color: '#FFFFFF', fontSize: '13px', fontWeight: 600 }}>{r.profesor_email}</p>
                      <p style={{ margin: 0, color: '#9ca3af', fontSize: '11px' }}>{new Date(r.fecha).toLocaleString('es-EC')}</p>
                    </div>
                  </div>
                  <span style={{ background: r.tipo === 'entrada' ? 'rgba(204,255,0,0.1)' : 'rgba(248,113,113,0.1)', color: r.tipo === 'entrada' ? '#CCFF00' : '#f87171', padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 700, fontFamily: 'var(--font-titulos)', textTransform: 'uppercase' }}>
                    {r.tipo}
                  </span>
                </div>
              ))}
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
                <div key={clase.id} style={{ padding: '16px', marginBottom: '10px', background: '#111111', borderRadius: '12px', border: '1px solid #374151' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                    <div>
                      <p style={{ margin: '0 0 4px', fontWeight: 700, color: '#FFFFFF', fontSize: '14px', fontFamily: 'var(--font-titulos)', textTransform: 'uppercase' }}>{clase.nombre}</p>
                      <p style={{ margin: 0, fontSize: '12px', color: '#9ca3af' }}>👤 {clase.instructor} · 🕐 {new Date(clase.fecha_hora).toLocaleString('es-EC')} · 👥 {clase.capacidad_max} cupos</p>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button onClick={() => verUsuariosClase(clase)} style={{ padding: '8px 16px', background: 'rgba(204,255,0,0.1)', color: '#CCFF00', border: '1.5px solid #CCFF00', borderRadius: '8px', fontFamily: 'var(--font-titulos)', fontWeight: 700, fontSize: '12px', textTransform: 'uppercase', cursor: 'pointer' }}>👥 Ver usuarios</button>
                      <button onClick={() => eliminarClase(clase.id)} style={{ padding: '8px 16px', background: 'transparent', color: '#f87171', border: '1.5px solid #f87171', borderRadius: '8px', fontFamily: 'var(--font-titulos)', fontWeight: 700, fontSize: '12px', textTransform: 'uppercase', cursor: 'pointer' }}>🗑️ Eliminar</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Modal usuarios */}
            {claseDetalle && (
              <div style={{ position: 'fixed', inset: 0, zIndex: 999, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
                <div style={{ background: '#1a1a1a', borderRadius: '20px', border: '1px solid #374151', padding: '30px', width: '100%', maxWidth: '500px', maxHeight: '80vh', overflowY: 'auto' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                    <div>
                      <h3 style={{ fontFamily: 'var(--font-titulos)', fontWeight: 900, fontSize: '18px', color: '#CCFF00', textTransform: 'uppercase', letterSpacing: '1px', margin: '0 0 6px' }}>{claseDetalle.nombre}</h3>
                      <p style={{ margin: 0, color: '#9ca3af', fontSize: '13px' }}>👤 {claseDetalle.instructor} · 🕐 {new Date(claseDetalle.fecha_hora).toLocaleString('es-EC')}</p>
                    </div>
                    <button onClick={() => { setClaseDetalle(null); setUsuariosClase([]) }} style={{ background: 'transparent', border: '1px solid #374151', borderRadius: '8px', padding: '6px 12px', color: '#9ca3af', cursor: 'pointer', fontSize: '16px' }}>✕</button>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
                    <div style={{ background: '#111111', borderRadius: '12px', padding: '16px', textAlign: 'center', border: '1px solid #374151' }}>
                      <p style={{ margin: '0 0 4px', color: '#9ca3af', fontSize: '11px', textTransform: 'uppercase', fontFamily: 'var(--font-titulos)' }}>Inscritos</p>
                      <p style={{ margin: 0, fontSize: '28px', fontWeight: 900, color: '#CCFF00', fontFamily: 'var(--font-titulos)' }}>{usuariosClase.length}</p>
                    </div>
                    <div style={{ background: '#111111', borderRadius: '12px', padding: '16px', textAlign: 'center', border: '1px solid #374151' }}>
                      <p style={{ margin: '0 0 4px', color: '#9ca3af', fontSize: '11px', textTransform: 'uppercase', fontFamily: 'var(--font-titulos)' }}>Cupos libres</p>
                      <p style={{ margin: 0, fontSize: '28px', fontWeight: 900, color: claseDetalle.capacidad_max - usuariosClase.length <= 0 ? '#f87171' : '#CCFF00', fontFamily: 'var(--font-titulos)' }}>
                        {Math.max(0, claseDetalle.capacidad_max - usuariosClase.length)}
                      </p>
                    </div>
                  </div>
                  <div style={{ marginBottom: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <span style={{ color: '#9ca3af', fontSize: '12px' }}>Ocupación</span>
                      <span style={{ color: '#CCFF00', fontSize: '12px', fontWeight: 700 }}>{Math.round((usuariosClase.length / claseDetalle.capacidad_max) * 100)}%</span>
                    </div>
                    <div style={{ background: '#374151', borderRadius: '4px', height: '6px' }}>
                      <div style={{ height: '6px', borderRadius: '4px', width: `${Math.min(100, (usuariosClase.length / claseDetalle.capacidad_max) * 100)}%`, background: usuariosClase.length >= claseDetalle.capacidad_max ? '#f87171' : '#CCFF00', transition: 'width 0.3s' }} />
                    </div>
                  </div>
                  <h4 style={{ fontFamily: 'var(--font-titulos)', fontWeight: 900, fontSize: '13px', color: '#FFFFFF', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px' }}>Usuarios inscritos</h4>
                  {cargandoUsuarios && <p style={{ color: '#9ca3af', fontSize: '14px' }}>Cargando...</p>}
                  {!cargandoUsuarios && usuariosClase.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '24px 0' }}>
                      <div style={{ fontSize: '32px', marginBottom: '8px' }}>👻</div>
                      <p style={{ color: '#9ca3af', fontSize: '14px' }}>Nadie inscrito aún</p>
                    </div>
                  )}
                  {usuariosClase.map((reserva, i) => (
                    <div key={reserva.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: '#111111', borderRadius: '10px', marginBottom: '8px', border: '1px solid #374151' }}>
                      <div style={{ background: '#CCFF00', borderRadius: '50%', width: '36px', height: '36px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-titulos)', fontWeight: 900, fontSize: '14px', color: '#111111' }}>{i + 1}</div>
                      <div>
                        <p style={{ margin: '0 0 3px', color: '#FFFFFF', fontSize: '13px', fontWeight: 600 }}>{reserva.email || 'Usuario'}</p>
                        <p style={{ margin: 0, color: '#9ca3af', fontSize: '11px' }}>Reservó el {new Date(reserva.fecha_reserva).toLocaleDateString('es-EC')}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
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
            <h3 style={{ fontFamily: 'var(--font-titulos)', fontWeight: 900, fontSize: '16px', color: '#FFFFFF', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>📷 Escanear QR</h3>
            <p style={{ color: '#9ca3af', fontSize: '13px', marginBottom: '24px' }}>
              Escanea el QR de un usuario para registrar asistencia, o el QR de un entrenador para registrar entrada/salida. El sistema detecta automáticamente el tipo.
            </p>

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
