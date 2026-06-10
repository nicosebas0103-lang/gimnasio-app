import { useState } from 'react'
import { supabase } from '../supabaseClient'

export default function Login({ onLogin }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [mensaje, setMensaje] = useState('')

  async function handleLogin() {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) setMensaje('Error: ' + error.message)
    else onLogin()
  }

  async function handleRegister() {
    const { error } = await supabase.auth.signUp({ email, password })
    if (error) setMensaje('Error: ' + error.message)
    else setMensaje('¡Registro exitoso! Revisa tu correo.')
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: `linear-gradient(rgba(0,0,0,0.82), rgba(0,0,0,0.82)),
        url("https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=1400") center/cover no-repeat`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      fontFamily: 'var(--font-cuerpo)'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '400px',
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div style={{
            display: 'inline-block',
            background: '#CCFF00',
            borderRadius: '16px',
            padding: '14px 18px',
            marginBottom: '20px'
          }}>
            <span style={{ fontSize: '32px' }}>🏋️</span>
          </div>
          <h1 style={{
            fontFamily: 'var(--font-titulos)',
            fontWeight: 900,
            fontSize: '32px',
            color: '#FFFFFF',
            textTransform: 'uppercase',
            letterSpacing: '2px',
            margin: '0 0 8px'
          }}>Gimnasio App</h1>
          <p style={{ color: '#CCFF00', fontSize: '13px', fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase' }}>
            Reserva tu clase favorita
          </p>
        </div>

        {/* Card */}
        <div style={{
          background: '#1a1a1a',
          borderRadius: '16px',
          padding: '36px 30px',
          border: '1px solid #374151'
        }}>
          <input
            placeholder="Correo electrónico"
            onChange={e => setEmail(e.target.value)}
            style={{
              width: '100%', padding: '14px 16px', marginBottom: '12px',
              background: '#111111', border: '1.5px solid #374151',
              borderRadius: '10px', fontSize: '14px', color: '#FFFFFF',
              outline: 'none', boxSizing: 'border-box'
            }}
          />
          <input
            placeholder="Contraseña"
            type="password"
            onChange={e => setPassword(e.target.value)}
            style={{
              width: '100%', padding: '14px 16px', marginBottom: '24px',
              background: '#111111', border: '1.5px solid #374151',
              borderRadius: '10px', fontSize: '14px', color: '#FFFFFF',
              outline: 'none', boxSizing: 'border-box'
            }}
          />

          <button onClick={handleLogin} style={{
            width: '100%', padding: '14px',
            background: '#CCFF00', color: '#111111',
            border: 'none', borderRadius: '10px',
            fontFamily: 'var(--font-titulos)',
            fontWeight: 700, fontSize: '14px',
            textTransform: 'uppercase', letterSpacing: '1px',
            marginBottom: '10px'
          }}>
            Iniciar sesión
          </button>

          <button onClick={handleRegister} style={{
            width: '100%', padding: '14px',
            background: 'transparent', color: '#CCFF00',
            border: '1.5px solid #CCFF00', borderRadius: '10px',
            fontFamily: 'var(--font-titulos)',
            fontWeight: 700, fontSize: '14px',
            textTransform: 'uppercase', letterSpacing: '1px'
          }}>
            Registrarse
          </button>

          {mensaje && (
            <p style={{
              marginTop: '16px', padding: '12px', borderRadius: '8px',
              background: '#374151', color: '#CCFF00',
              textAlign: 'center', fontSize: '13px', fontWeight: 600
            }}>{mensaje}</p>
          )}
        </div>
      </div>
    </div>
  )
}
