import { useEffect, useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { supabase } from '../supabaseClient'

const MESES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']

export default function Asistencia() {
  const [usuario, setUsuario] = useState(null)
  const [asistencias, setAsistencias] = useState([])

  useEffect(() => {
    cargarDatos()
  }, [])

  async function cargarDatos() {
    const { data: { user } } = await supabase.auth.getUser()
    setUsuario(user)
    const { data } = await supabase
      .from('asistencias')
      .select('*')
      .eq('usuario_id', user.id)
      .order('fecha', { ascending: false })
    setAsistencias(data || [])
  }

  if (!usuario) return null

  const qrData = JSON.stringify({ usuario_id: usuario.id, email: usuario.email })

  return (
    <div style={{
      minHeight: '100vh', background: '#111111',
      padding: '40px 20px', fontFamily: 'var(--font-cuerpo)'
    }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>

        {/* Header */}
        <div style={{ marginBottom: '40px' }}>
          <h2 style={{
            fontFamily: 'var(--font-titulos)', fontWeight: 900,
            fontSize: '32px', color: '#FFFFFF',
            textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '8px'
          }}>
            Mi <span style={{ color: '#CCFF00' }}>Asistencia</span>
          </h2>
          <p style={{ color: '#9ca3af', fontSize: '14px' }}>
            Muestra tu QR al admin para registrar tu asistencia
          </p>
        </div>

        {/* QR + contador */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: '20px', marginBottom: '30px'
        }}>
          {/* QR */}
          <div style={{
            background: '#1a1a1a', borderRadius: '16px',
            border: '1px solid #374151', padding: '30px',
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', gap: '20px'
          }}>
            <h3 style={{
              fontFamily: 'var(--font-titulos)', fontWeight: 900,
              fontSize: '14px', color: '#FFFFFF',
              textTransform: 'uppercase', letterSpacing: '1px', margin: 0
            }}>Tu código QR</h3>

            <div style={{
              background: 'white', padding: '16px',
              borderRadius: '12px'
            }}>
              <QRCodeSVG
                value={qrData}
                size={180}
                bgColor="#ffffff"
                fgColor="#111111"
                level="H"
              />
            </div>

            <p style={{ color: '#9ca3af', fontSize: '12px', textAlign: 'center', margin: 0 }}>
              {usuario.email}
            </p>
          </div>

          {/* Contador */}
          <div style={{
            background: '#1a1a1a', borderRadius: '16px',
            border: '1px solid #374151', padding: '30px',
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', gap: '12px'
          }}>
            <h3 style={{
              fontFamily: 'var(--font-titulos)', fontWeight: 900,
              fontSize: '14px', color: '#FFFFFF',
              textTransform: 'uppercase', letterSpacing: '1px', margin: 0
            }}>Total de asistencias</h3>

            <div style={{
              background: '#CCFF00', borderRadius: '50%',
              width: '100px', height: '100px',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <span style={{
                fontFamily: 'var(--font-titulos)', fontWeight: 900,
                fontSize: '42px', color: '#111111'
              }}>{asistencias.length}</span>
            </div>

            <p style={{ color: '#9ca3af', fontSize: '13px', margin: 0 }}>
              clases registradas
            </p>

            {/* Asistencias este mes */}
            <div style={{
              background: '#111111', borderRadius: '10px',
              padding: '12px 20px', border: '1px solid #374151',
              textAlign: 'center', width: '100%'
            }}>
              <p style={{ margin: '0 0 4px', color: '#9ca3af', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                Este mes
              </p>
              <p style={{
                margin: 0, fontFamily: 'var(--font-titulos)',
                fontWeight: 900, fontSize: '24px', color: '#CCFF00'
              }}>
                {asistencias.filter(a => {
                  const fecha = new Date(a.fecha)
                  const hoy = new Date()
                  return fecha.getMonth() === hoy.getMonth() &&
                    fecha.getFullYear() === hoy.getFullYear()
                }).length}
              </p>
            </div>
          </div>
        </div>

        {/* Historial */}
        <div style={{
          background: '#1a1a1a', borderRadius: '16px',
          border: '1px solid #374151', padding: '24px'
        }}>
          <h3 style={{
            fontFamily: 'var(--font-titulos)', fontWeight: 900,
            fontSize: '14px', color: '#FFFFFF',
            textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '20px'
          }}>📋 Historial</h3>

          {asistencias.length === 0 && (
            <div style={{ textAlign: 'center', padding: '30px 0' }}>
              <div style={{ fontSize: '36px', marginBottom: '12px' }}>📭</div>
              <p style={{ color: '#9ca3af', fontSize: '14px' }}>
                Aún no tienes asistencias registradas
              </p>
            </div>
          )}

          {asistencias.map((a, i) => {
            const fecha = new Date(a.fecha)
            return (
              <div key={a.id} style={{
                display: 'flex', justifyContent: 'space-between',
                alignItems: 'center', padding: '14px',
                background: '#111111', borderRadius: '12px',
                border: '1px solid #374151', marginBottom: '8px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div style={{
                    background: '#CCFF00', borderRadius: '8px',
                    width: '36px', height: '36px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: 'var(--font-titulos)', fontWeight: 900,
                    fontSize: '13px', color: '#111111'
                  }}>
                    {asistencias.length - i}
                  </div>
                  <div>
                    <p style={{ margin: '0 0 3px', color: '#FFFFFF', fontWeight: 600, fontSize: '14px' }}>
                      {fecha.getDate()} de {MESES[fecha.getMonth()]} {fecha.getFullYear()}
                    </p>
                    <p style={{ margin: 0, color: '#9ca3af', fontSize: '12px' }}>
                      🕐 {fecha.toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
                <span style={{
                  background: 'rgba(204,255,0,0.1)', color: '#CCFF00',
                  padding: '4px 12px', borderRadius: '20px',
                  fontSize: '11px', fontWeight: 700,
                  fontFamily: 'var(--font-titulos)', textTransform: 'uppercase'
                }}>✅ Presente</span>
              </div>
            )
          })}
        </div>

      </div>
    </div>
  )
}
