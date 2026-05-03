import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'
import { useAuth } from '../context/AuthContext'

function Modal({ initial, onClose, onSaved }) {
  const [form, setForm] = useState({ name: initial?.name || '', description: initial?.description || '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const set = k => e => setForm(p => ({ ...p, [k]: e.target.value }))

  const submit = async e => {
    e.preventDefault(); setLoading(true)
    try {
      initial ? await axios.put(`/projects/${initial.id}`, form) : await axios.post('/projects', form)
      onSaved()
    } catch (err) { setError(err.response?.data?.detail || 'Failed') }
    finally { setLoading(false) }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>
        <div style={{ marginBottom:20 }}>
          <h2 style={{ fontFamily:'Syne,sans-serif', fontWeight:700, fontSize:18, color:'var(--text)' }}>
            {initial ? 'Edit Project' : 'New Project'}
          </h2>
          <p style={{ color:'var(--text3)', fontSize:12, marginTop:4 }}>
            {initial ? 'Update project details' : 'Create a new project for your team'}
          </p>
        </div>
        {error && <div className="error-box" style={{ marginBottom:16 }}>{error}</div>}
        <form onSubmit={submit} style={{ display:'flex', flexDirection:'column', gap:16 }}>
          <div>
            <label className="input-label">Project Name</label>
            <input className="input" value={form.name} onChange={set('name')} required placeholder="e.g. Alpha Trading Engine" autoFocus />
          </div>
          <div>
            <label className="input-label">Description</label>
            <textarea className="input" value={form.description} onChange={set('description')} placeholder="What is this project about?" style={{ height:90, resize:'vertical' }} />
          </div>
          <div style={{ display:'flex', gap:10, marginTop:4 }}>
            <button className="btn btn-primary" type="submit" disabled={loading} style={{ flex:1, justifyContent:'center' }}>
              {loading ? <><span className="spinner" style={{width:13,height:13}}/> Saving...</> : (initial ? 'Save Changes' : 'Create Project')}
            </button>
            <button className="btn btn-ghost" type="button" onClick={onClose}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  )
}

const PROJECT_COLORS = ['var(--accent)', 'var(--green)', 'var(--purple)', 'var(--yellow)', 'var(--red)']

export default function Projects() {
  const { user } = useAuth()
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null)
  const [search, setSearch] = useState('')

  const fetch = () => axios.get('/projects').then(r => setProjects(r.data)).finally(() => setLoading(false))
  useEffect(() => { fetch() }, [])

  const del = async id => {
    if (!confirm('Delete this project and all its tasks?')) return
    await axios.delete(`/projects/${id}`); fetch()
  }

  const filtered = projects.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.description || '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div>
      {/* Header */}
      <div className="animate-fadeUp" style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:28, flexWrap:'wrap', gap:16 }}>
        <div>
          <h1 style={{ fontFamily:'Syne,sans-serif', fontWeight:800, fontSize:28, color:'var(--text)', letterSpacing:'-0.03em' }}>Projects</h1>
          <p style={{ color:'var(--text3)', fontSize:13, marginTop:4 }}>{projects.length} project{projects.length !== 1 ? 's' : ''} in workspace</p>
        </div>
        {user?.role === 'admin' && (
          <button className="btn btn-primary" onClick={() => setModal('new')}>+ New Project</button>
        )}
      </div>

      {/* Search */}
      <div className="animate-fadeUp delay-1" style={{ marginBottom:24 }}>
        <input
          className="input"
          placeholder="Search projects..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ maxWidth:340 }}
        />
      </div>

      {loading ? (
        <div style={{ display:'flex', alignItems:'center', gap:10, color:'var(--text3)', fontSize:13, padding:'40px 0' }}>
          <span className="spinner" /> Loading projects...
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state animate-fadeUp">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1"><path d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V7z"/></svg>
          <span>{search ? 'No projects match your search' : 'No projects yet'}</span>
          {user?.role === 'admin' && !search && (
            <button className="btn btn-primary" onClick={() => setModal('new')} style={{ marginTop:8 }}>Create first project</button>
          )}
        </div>
      ) : (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(300px, 1fr))', gap:16 }}>
          {filtered.map((p, i) => {
            const color = PROJECT_COLORS[i % PROJECT_COLORS.length]
            const done = p.tasks?.filter(t => t.status === 'done').length ?? 0
            const total = p.task_count ?? 0
            const pct = total > 0 ? Math.round((done / total) * 100) : 0
            return (
              <div key={p.id} className="glass glass-hover animate-fadeUp" style={{ animationDelay:`${i*0.05}s`, padding:'22px', position:'relative', overflow:'hidden' }}>
                {/* Color bar */}
                <div style={{ position:'absolute', top:0, left:0, right:0, height:2, background:`linear-gradient(90deg, ${color}, transparent)` }} />
                {/* Glow */}
                <div style={{ position:'absolute', top:0, left:0, width:60, height:60, borderRadius:'0 0 100% 0', background:`radial-gradient(circle, ${color}15, transparent)`, pointerEvents:'none' }} />

                <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:12 }}>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6 }}>
                      <div style={{ width:8, height:8, borderRadius:'50%', background:color, boxShadow:`0 0 6px ${color}` }} />
                      <span style={{ fontSize:10, color:'var(--text3)', letterSpacing:'0.06em' }}>PROJECT</span>
                    </div>
                    <Link to={`/projects/${p.id}`} style={{ textDecoration:'none' }}>
                      <h3 style={{ fontFamily:'Syne,sans-serif', fontWeight:700, fontSize:16, color:'var(--text)', letterSpacing:'-0.02em', lineHeight:1.2, transition:'color 0.2s' }}
                        onMouseEnter={e => e.target.style.color = color}
                        onMouseLeave={e => e.target.style.color = 'var(--text)'}
                      >{p.name}</h3>
                    </Link>
                  </div>
                  {user?.role === 'admin' && (
                    <div style={{ display:'flex', gap:6, flexShrink:0 }}>
                      <button className="btn-icon" onClick={() => setModal(p)} title="Edit">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                      </button>
                      <button className="btn-icon" onClick={() => del(p.id)} title="Delete" style={{ borderColor:'rgba(248,113,113,0.2)', color:'var(--red)' }}>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6M10 11v6M14 11v6M9 6V4h6v2"/></svg>
                      </button>
                    </div>
                  )}
                </div>

                {p.description && (
                  <p style={{ color:'var(--text3)', fontSize:12, lineHeight:1.6, marginBottom:16, display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden' }}>
                    {p.description}
                  </p>
                )}

                {/* Progress */}
                <div style={{ marginBottom:16 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6, fontSize:11, color:'var(--text3)' }}>
                    <span>Progress</span><span style={{ color }}>{pct}%</span>
                  </div>
                  <div className="progress-track">
                    <div className="progress-fill" style={{ width:`${pct}%`, background:color }} />
                  </div>
                </div>

                {/* Footer */}
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                  <div style={{ display:'flex', gap:12, fontSize:11, color:'var(--text3)' }}>
                    <span>{total} tasks</span>
                    <span>·</span>
                    <span>{p.members?.length ?? 0} members</span>
                  </div>
                  <Link to={`/projects/${p.id}`} className="btn btn-ghost" style={{ fontSize:11, padding:'5px 12px' }}>Open →</Link>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {modal && (
        <Modal
          initial={modal === 'new' ? null : modal}
          onClose={() => setModal(null)}
          onSaved={() => { setModal(null); fetch() }}
        />
      )}
    </div>
  )
}
