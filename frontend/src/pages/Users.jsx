import { useState, useEffect } from 'react'
import axios from 'axios'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import { format } from 'date-fns'

export default function Users() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    if (user?.role !== 'admin') { navigate('/dashboard'); return }
    axios.get('/users').then(r => setUsers(r.data)).finally(() => setLoading(false))
  }, [])

  const filtered = users.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  )

  const admins  = users.filter(u => u.role === 'admin').length
  const members = users.filter(u => u.role === 'member').length

  return (
    <div>
      {/* Header */}
      <div className="animate-fadeUp" style={{ marginBottom:28 }}>
        <h1 style={{ fontFamily:'Syne,sans-serif', fontWeight:800, fontSize:28, color:'var(--text)', letterSpacing:'-0.03em' }}>Users</h1>
        <p style={{ color:'var(--text3)', fontSize:13, marginTop:4 }}>All registered workspace members</p>
      </div>

      {/* Stats row */}
      <div className="animate-fadeUp delay-1" style={{ display:'flex', gap:12, marginBottom:24 }}>
        {[
          { label:'Total Users', value:users.length, color:'var(--text)' },
          { label:'Admins', value:admins, color:'var(--purple)' },
          { label:'Members', value:members, color:'var(--accent)' },
        ].map(s => (
          <div key={s.label} style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:10, padding:'14px 20px', minWidth:100 }}>
            <div style={{ fontFamily:'Syne,sans-serif', fontWeight:700, fontSize:22, color:s.color }}>{s.value}</div>
            <div style={{ fontSize:10, color:'var(--text3)', marginTop:2, letterSpacing:'0.06em', textTransform:'uppercase' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="animate-fadeUp delay-2" style={{ marginBottom:16 }}>
        <input className="input" placeholder="Search by name or email..." value={search} onChange={e => setSearch(e.target.value)} style={{ maxWidth:340 }} />
      </div>

      {loading ? (
        <div style={{ display:'flex', alignItems:'center', gap:10, color:'var(--text3)', fontSize:13, padding:'40px 0' }}>
          <span className="spinner" /> Loading users...
        </div>
      ) : (
        <div className="glass animate-fadeUp delay-3" style={{ overflow:'hidden', padding:0 }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Joined</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={5} style={{ textAlign:'center', padding:'40px', color:'var(--text3)' }}>No users found</td></tr>
              ) : filtered.map((u, i) => (
                <tr key={u.id}>
                  <td style={{ color:'var(--text3)', fontSize:11, width:40 }}>{i + 1}</td>
                  <td>
                    <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                      <div style={{
                        width:30, height:30, borderRadius:8,
                        background:'linear-gradient(135deg, var(--surface2), var(--surface))',
                        border:'1px solid var(--border2)',
                        display:'flex', alignItems:'center', justifyContent:'center',
                        fontSize:11, fontWeight:700, color: u.role === 'admin' ? 'var(--purple)' : 'var(--accent)',
                        fontFamily:'Syne,sans-serif', flexShrink:0,
                      }}>
                        {u.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0,2)}
                      </div>
                      <span style={{ color:'var(--text)', fontSize:13, fontWeight:500 }}>{u.name}</span>
                      {u.id === user?.id && <span className="badge badge-todo" style={{ fontSize:9 }}>You</span>}
                    </div>
                  </td>
                  <td style={{ color:'var(--text3)', fontSize:12 }}>{u.email}</td>
                  <td>
                    <span className={`badge badge-${u.role === 'admin' ? 'admin' : 'member'}`}>
                      {u.role}
                    </span>
                  </td>
                  <td style={{ fontSize:11, color:'var(--text3)' }}>
                    {format(new Date(u.created_at), 'MMM d, yyyy')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
