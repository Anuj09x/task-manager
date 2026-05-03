import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const set = k => e => setForm(p => ({ ...p, [k]: e.target.value }))

  const submit = async e => {
    e.preventDefault()
    setLoading(true); setError('')
    try { await login(form.email, form.password); navigate('/dashboard') }
    catch (err) { setError(err.response?.data?.detail || 'Invalid credentials') }
    finally { setLoading(false) }
  }

  return (
    <div style={{
      minHeight:'100vh', background:'var(--bg)',
      display:'flex', alignItems:'center', justifyContent:'center',
      position:'relative', overflow:'hidden',
    }}>
      {/* BG glow orbs */}
      <div style={{ position:'absolute', top:'20%', left:'15%', width:400, height:400, borderRadius:'50%', background:'radial-gradient(circle, rgba(56,189,248,0.06) 0%, transparent 70%)', pointerEvents:'none' }} />
      <div style={{ position:'absolute', bottom:'20%', right:'10%', width:300, height:300, borderRadius:'50%', background:'radial-gradient(circle, rgba(167,139,250,0.05) 0%, transparent 70%)', pointerEvents:'none' }} />

      <div style={{ width:'100%', maxWidth:400, padding:'0 20px' }} className="animate-fadeUp">
        {/* Logo */}
        <div style={{ textAlign:'center', marginBottom:36 }}>
          <div style={{
            width:48, height:48, margin:'0 auto 16px',
            background:'linear-gradient(135deg, var(--accent), #0284c7)',
            borderRadius:12, display:'flex', alignItems:'center', justifyContent:'center',
            fontSize:22, fontWeight:800, color:'#050a10', fontFamily:'Syne,sans-serif',
            boxShadow:'0 0 24px rgba(56,189,248,0.35)',
          }}>T</div>
          <h1 style={{ fontFamily:'Syne,sans-serif', fontWeight:700, fontSize:24, color:'var(--text)', letterSpacing:'-0.03em' }}>Welcome back</h1>
          <p style={{ color:'var(--text3)', fontSize:13, marginTop:6 }}>Sign in to your workspace</p>
        </div>

        {/* Card */}
        <div style={{
          background:'var(--bg2)',
          border:'1px solid var(--border)',
          borderRadius:16,
          padding:'28px 28px',
          boxShadow:'0 24px 64px rgba(0,0,0,0.4)',
        }}>
          {error && <div className="error-box" style={{ marginBottom:16 }}>{error}</div>}

          <form onSubmit={submit} style={{ display:'flex', flexDirection:'column', gap:16 }}>
            <div>
              <label className="input-label">Email address</label>
              <input className="input" type="email" placeholder="you@company.com" value={form.email} onChange={set('email')} required autoFocus />
            </div>
            <div>
              <label className="input-label">Password</label>
              <input className="input" type="password" placeholder="••••••••" value={form.password} onChange={set('password')} required />
            </div>
            <button className="btn btn-primary" type="submit" disabled={loading} style={{ width:'100%', justifyContent:'center', padding:'11px 18px', fontSize:13, marginTop:4 }}>
              {loading ? <><span className="spinner" style={{width:14,height:14}} /> Signing in...</> : 'Sign in →'}
            </button>
          </form>
        </div>

        <p style={{ textAlign:'center', color:'var(--text3)', fontSize:12, marginTop:20 }}>
          No account?{' '}
          <Link to="/signup" style={{ color:'var(--accent)', textDecoration:'none', fontWeight:500 }}>Create one</Link>
        </p>
      </div>
    </div>
  )
}
