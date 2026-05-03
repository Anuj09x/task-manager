import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'
import { useAuth } from '../context/AuthContext'

const STAT_CONFIG = [
  { key:'total_projects', label:'Total Projects',  color:'var(--accent)',  accent:'rgba(56,189,248,0.15)',  top:'var(--accent)' },
  { key:'total_tasks',    label:'Total Tasks',     color:'var(--text)',    accent:'rgba(226,232,240,0.08)', top:'var(--border2)' },
  { key:'todo',           label:'To Do',           color:'#94a3b8',        accent:'rgba(148,163,184,0.08)', top:'#475569' },
  { key:'in_progress',    label:'In Progress',     color:'var(--accent)',  accent:'rgba(56,189,248,0.1)',   top:'var(--accent)' },
  { key:'done',           label:'Completed',       color:'var(--green)',   accent:'rgba(74,222,128,0.1)',   top:'var(--green)' },
  { key:'overdue',        label:'Overdue',         color:'var(--red)',     accent:'rgba(248,113,113,0.1)',  top:'var(--red)' },
]

function StatCard({ config, value, index }) {
  return (
    <div className="stat-card animate-fadeUp" style={{ animationDelay:`${index*0.06}s` }}>
      <div style={{
        position:'absolute', top:0, left:0, right:0, height:2,
        background:`linear-gradient(90deg, transparent, ${config.top}, transparent)`,
        borderRadius:'12px 12px 0 0', opacity: 0.8,
      }} />
      <div style={{
        position:'absolute', inset:0, borderRadius:12,
        background:`radial-gradient(circle at top left, ${config.accent}, transparent 70%)`,
        pointerEvents:'none',
      }} />
      <div style={{ fontSize:32, fontFamily:'Syne,sans-serif', fontWeight:800, color:config.color, lineHeight:1, marginBottom:8, position:'relative' }}>
        {value ?? 0}
      </div>
      <div style={{ fontSize:11, color:'var(--text3)', letterSpacing:'0.06em', textTransform:'uppercase', position:'relative' }}>
        {config.label}
      </div>
    </div>
  )
}

export default function Dashboard() {
  const { user } = useAuth()
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    axios.get('/dashboard').then(r => setStats(r.data)).finally(() => setLoading(false))
  }, [])

  const completion = stats ? (stats.total_tasks > 0 ? Math.round((stats.done / stats.total_tasks) * 100) : 0) : 0
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  return (
    <div>
      {/* Header */}
      <div className="animate-fadeUp" style={{ marginBottom:32 }}>
        <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', flexWrap:'wrap', gap:16 }}>
          <div>
            <p style={{ fontSize:12, color:'var(--text3)', marginBottom:6, letterSpacing:'0.06em', textTransform:'uppercase' }}>{greeting}</p>
            <h1 style={{ fontFamily:'Syne,sans-serif', fontWeight:800, fontSize:30, color:'var(--text)', letterSpacing:'-0.03em', lineHeight:1.1 }}>
              {user?.name}
              <span style={{ display:'block', fontFamily:'Instrument Serif,serif', fontStyle:'italic', fontWeight:400, fontSize:18, color:'var(--text3)', marginTop:4 }}>
                Here's your workspace overview
              </span>
            </h1>
          </div>
          <div style={{ display:'flex', gap:10 }}>
            <Link to="/projects" className="btn btn-ghost">View Projects</Link>
            {user?.role === 'admin' && <Link to="/projects" className="btn btn-primary">+ New Project</Link>}
          </div>
        </div>
      </div>

      {/* Stats grid */}
      {loading ? (
        <div style={{ display:'flex', alignItems:'center', gap:10, color:'var(--text3)', fontSize:13, padding:'40px 0' }}>
          <span className="spinner" /> Loading stats...
        </div>
      ) : (
        <>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(160px, 1fr))', gap:14, marginBottom:24 }}>
            {STAT_CONFIG.map((cfg, i) => (
              <StatCard key={cfg.key} config={cfg} value={stats?.[cfg.key]} index={i} />
            ))}
          </div>

          {/* Progress + alerts row */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:24 }}>
            {/* Completion */}
            <div className="glass animate-fadeUp delay-3" style={{ padding:'20px 24px' }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
                <span style={{ fontSize:12, color:'var(--text2)', fontWeight:500 }}>Overall Completion</span>
                <span style={{ fontFamily:'Syne,sans-serif', fontWeight:700, fontSize:18, color:'var(--green)' }}>{completion}%</span>
              </div>
              <div className="progress-track">
                <div className="progress-fill" style={{ width:`${completion}%`, background:'linear-gradient(90deg, var(--green), #22c55e)' }} />
              </div>
              <div style={{ display:'flex', justifyContent:'space-between', marginTop:10, fontSize:11, color:'var(--text3)' }}>
                <span>{stats?.done ?? 0} done</span>
                <span>{stats?.total_tasks ?? 0} total</span>
              </div>
            </div>

            {/* Overdue alert or all good */}
            <div className="glass animate-fadeUp delay-4" style={{
              padding:'20px 24px',
              borderColor: stats?.overdue > 0 ? 'rgba(248,113,113,0.3)' : 'rgba(74,222,128,0.2)',
              background: stats?.overdue > 0 ? 'rgba(248,113,113,0.04)' : 'rgba(74,222,128,0.04)',
            }}>
              {stats?.overdue > 0 ? (
                <>
                  <div style={{ fontSize:11, color:'var(--red)', letterSpacing:'0.08em', textTransform:'uppercase', marginBottom:8 }}>⚠ Attention Required</div>
                  <div style={{ fontFamily:'Syne,sans-serif', fontWeight:700, fontSize:22, color:'var(--red)', marginBottom:4 }}>
                    {stats.overdue} Overdue
                  </div>
                  <div style={{ fontSize:12, color:'var(--text3)' }}>
                    {stats.overdue} task{stats.overdue > 1 ? 's are' : ' is'} past due date
                  </div>
                  <Link to="/projects" style={{ display:'inline-block', marginTop:12, fontSize:11, color:'var(--red)', textDecoration:'none', borderBottom:'1px solid rgba(248,113,113,0.3)' }}>
                    Review now →
                  </Link>
                </>
              ) : (
                <>
                  <div style={{ fontSize:11, color:'var(--green)', letterSpacing:'0.08em', textTransform:'uppercase', marginBottom:8 }}>✓ All On Track</div>
                  <div style={{ fontFamily:'Syne,sans-serif', fontWeight:700, fontSize:22, color:'var(--green)', marginBottom:4 }}>No Overdue</div>
                  <div style={{ fontSize:12, color:'var(--text3)' }}>All tasks are within deadlines</div>
                </>
              )}
            </div>
          </div>

          {/* Quick links */}
          <div className="glass animate-fadeUp delay-5" style={{ padding:'20px 24px' }}>
            <div style={{ fontSize:11, color:'var(--text3)', letterSpacing:'0.08em', textTransform:'uppercase', marginBottom:14 }}>Quick Actions</div>
            <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
              <Link to="/projects" className="btn btn-ghost" style={{ fontSize:12 }}>📁 All Projects</Link>
              {user?.role === 'admin' && <>
                <Link to="/projects" className="btn btn-ghost" style={{ fontSize:12 }}>+ Create Project</Link>
                <Link to="/users" className="btn btn-ghost" style={{ fontSize:12 }}>👥 Manage Users</Link>
              </>}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
