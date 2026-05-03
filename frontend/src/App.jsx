import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Dashboard from './pages/Dashboard'
import Projects from './pages/Projects'
import ProjectDetail from './pages/ProjectDetail'
import Users from './pages/Users'
import Layout from './components/Layout'

function Private({ children }) {
  const { user, loading } = useAuth()
  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', background:'#080b10', flexDirection:'column', gap:12 }}>
      <div className="spinner" style={{ width:28, height:28 }} />
      <span style={{ color:'#475569', fontSize:12, fontFamily:'DM Mono, monospace' }}>loading...</span>
    </div>
  )
  return user ? children : <Navigate to="/login" replace />
}

export default function App() {
  return (
    <Routes>
      <Route path="/login"  element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/" element={<Private><Layout /></Private>}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard"       element={<Dashboard />} />
        <Route path="projects"        element={<Projects />} />
        <Route path="projects/:id"    element={<ProjectDetail />} />
        <Route path="users"           element={<Users />} />
      </Route>
    </Routes>
  )
}
