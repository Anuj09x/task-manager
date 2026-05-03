import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const NAV = [
  { to: '/dashboard', label: 'Dashboard',  icon: <GridIcon /> },
  { to: '/projects',  label: 'Projects',   icon: <FolderIcon /> },
  { to: '/users',     label: 'Users',      icon: <UsersIcon />, adminOnly: true },
]

function GridIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>
}
function FolderIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V7z"/></svg>
}
function UsersIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>
}
function LogoutIcon() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/></svg>
}

export default function Layout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => { logout(); navigate('/login') }

  const initials = user?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0,2) || 'U'

  return (
    <div style={{ display:'flex', height:'100vh', overflow:'hidden', background:'var(--bg)' }}>
      {/* Sidebar */}
      <aside style={{
        width: 220,
        background: 'var(--bg2)',
        borderRight: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
        position: 'relative',
      }}>
        {/* Logo */}
        <div style={{ padding: '24px 20px 20px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <div style={{
              width: 32, height: 32,
              background: 'linear-gradient(135deg, var(--accent), #0284c7)',
              borderRadius: 8,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 14, fontWeight: 800, color: '#050a10',
              fontFamily: 'Syne, sans-serif',
              boxShadow: '0 0 12px rgba(56,189,248,0.3)',
            }}>T</div>
            <div>
              <div style={{ fontFamily:'Syne,sans-serif', fontWeight:700, fontSize:15, color:'var(--text)', letterSpacing:'-0.02em' }}>TaskFlow</div>
              <div style={{ fontSize:9, color:'var(--text3)', letterSpacing:'0.1em', textTransform:'uppercase' }}>Workspace</div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex:1, padding:'16px 12px', display:'flex', flexDirection:'column', gap:2 }}>
          <div style={{ fontSize:9, color:'var(--text3)', letterSpacing:'0.12em', textTransform:'uppercase', padding:'0 6px', marginBottom:8 }}>Menu</div>
          {NAV.map(item => {
            if (item.adminOnly && user?.role !== 'admin') return null
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
              >
                {item.icon}
                {item.label}
              </NavLink>
            )
          })}
        </nav>

        {/* User footer */}
        <div style={{ padding:'16px 16px 20px', borderTop:'1px solid var(--border)' }}>
          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:12 }}>
            <div style={{
              width:32, height:32, borderRadius:8,
              background:'linear-gradient(135deg, var(--surface2), var(--surface))',
              border:'1px solid var(--border2)',
              display:'flex', alignItems:'center', justifyContent:'center',
              fontSize:11, fontWeight:700, color:'var(--accent)',
              fontFamily:'Syne,sans-serif',
              flexShrink:0,
            }}>{initials}</div>
            <div style={{ minWidth:0 }}>
              <div style={{ fontSize:12, color:'var(--text)', fontWeight:500, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{user?.name}</div>
              <div style={{ fontSize:10, color:'var(--text3)' }}>{user?.email?.split('@')[0]}</div>
            </div>
          </div>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <span className={`badge badge-${user?.role === 'admin' ? 'admin' : 'member'}`}>{user?.role}</span>
            <button onClick={handleLogout} className="btn-icon" title="Logout" style={{ fontSize:11 }}>
              <LogoutIcon />
            </button>
          </div>
        </div>

        {/* Decorative accent line */}
        <div style={{
          position:'absolute', top:0, left:0, right:0, height:1,
          background:'linear-gradient(90deg, transparent, var(--accent), transparent)',
          opacity:0.4,
        }} />
      </aside>

      {/* Main content */}
      <main style={{ flex:1, overflowY:'auto', background:'var(--bg)', position:'relative' }}>
        {/* Top subtle gradient */}
        <div style={{
          position:'sticky', top:0, zIndex:10,
          height:1,
          background:'linear-gradient(90deg, transparent, rgba(56,189,248,0.2), transparent)',
        }} />
        <div style={{ maxWidth:1100, margin:'0 auto', padding:'36px 40px' }}>
          <Outlet />
        </div>
      </main>
    </div>
  )
}
