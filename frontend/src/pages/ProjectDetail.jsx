import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import axios from 'axios'
import { useAuth } from '../context/AuthContext'
import { format, isPast } from 'date-fns'

const STATUS_CYCLE = { todo: 'in_progress', in_progress: 'done', done: 'todo' }

function TaskModal({ projectId, users, initial, onClose, onSaved }) {
  const [form, setForm] = useState({
    title: initial?.title || '',
    description: initial?.description || '',
    status: initial?.status || 'todo',
    priority: initial?.priority || 'medium',
    due_date: initial?.due_date ? initial.due_date.slice(0,16) : '',
    assignee_id: initial?.assignee_id || '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const set = k => e => setForm(p => ({ ...p, [k]: e.target.value }))

  const submit = async e => {
    e.preventDefault(); setLoading(true)
    const payload = { ...form, assignee_id: form.assignee_id ? parseInt(form.assignee_id) : null, due_date: form.due_date || null }
    try {
      initial ? await axios.put(`/tasks/${initial.id}`, payload) : await axios.post(`/projects/${projectId}/tasks`, payload)
      onSaved()
    } catch (err) { setError(err.response?.data?.detail || 'Failed') }
    finally { setLoading(false) }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" style={{ maxWidth:520 }} onClick={e => e.stopPropagation()}>
        <div style={{ marginBottom:20 }}>
          <h2 style={{ fontFamily:'Syne,sans-serif', fontWeight:700, fontSize:18, color:'var(--text)' }}>
            {initial ? 'Edit Task' : 'New Task'}
          </h2>
          <p style={{ color:'var(--text3)', fontSize:12, marginTop:4 }}>Fill in the task details below</p>
        </div>
        {error && <div className="error-box" style={{ marginBottom:16 }}>{error}</div>}
        <form onSubmit={submit} style={{ display:'flex', flexDirection:'column', gap:14 }}>
          <div>
            <label className="input-label">Task Title</label>
            <input className="input" value={form.title} onChange={set('title')} required placeholder="e.g. Implement order routing logic" autoFocus />
          </div>
          <div>
            <label className="input-label">Description</label>
            <textarea className="input" value={form.description} onChange={set('description')} style={{ height:80, resize:'vertical' }} placeholder="Add more context..." />
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            <div>
              <label className="input-label">Status</label>
              <select className="input" value={form.status} onChange={set('status')} style={{ cursor:'pointer' }}>
                <option value="todo">To Do</option>
                <option value="in_progress">In Progress</option>
                <option value="done">Done</option>
              </select>
            </div>
            <div>
              <label className="input-label">Priority</label>
              <select className="input" value={form.priority} onChange={set('priority')} style={{ cursor:'pointer' }}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            <div>
              <label className="input-label">Due Date</label>
              <input className="input" type="datetime-local" value={form.due_date} onChange={set('due_date')} />
            </div>
            <div>
              <label className="input-label">Assignee</label>
              <select className="input" value={form.assignee_id} onChange={set('assignee_id')} style={{ cursor:'pointer' }}>
                <option value="">Unassigned</option>
                {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
            </div>
          </div>
          <div style={{ display:'flex', gap:10, marginTop:6 }}>
            <button className="btn btn-primary" type="submit" disabled={loading} style={{ flex:1, justifyContent:'center' }}>
              {loading ? <><span className="spinner" style={{width:13,height:13}}/> Saving...</> : (initial ? 'Save Changes' : 'Create Task')}
            </button>
            <button className="btn btn-ghost" type="button" onClick={onClose}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  )
}

const PRIORITY_DOT = { high: 'var(--red)', medium: 'var(--yellow)', low: 'var(--text3)' }
const STATUS_LABEL = { todo: 'To Do', in_progress: 'In Progress', done: 'Done' }
const STATUS_BADGE = { todo: 'badge-todo', in_progress: 'badge-progress', done: 'badge-done' }
const PRIORITY_BADGE = { low: 'badge-low', medium: 'badge-medium', high: 'badge-high' }

const COLS = ['todo', 'in_progress', 'done']
const COL_LABELS = { todo: 'To Do', in_progress: 'In Progress', done: 'Done' }
const COL_COLORS = { todo: 'var(--text3)', in_progress: 'var(--accent)', done: 'var(--green)' }

export default function ProjectDetail() {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [project, setProject] = useState(null)
  const [tasks, setTasks] = useState([])
  const [allUsers, setAllUsers] = useState([])
  const [taskModal, setTaskModal] = useState(null)
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState('board') // board | list
  const [filter, setFilter] = useState('all')

  const fetchAll = async () => {
    try {
      const [proj, taskList] = await Promise.all([
        axios.get(`/projects/${id}`),
        axios.get(`/projects/${id}/tasks`),
      ])
      setProject(proj.data)
      setTasks(taskList.data)
      if (user?.role === 'admin') {
        const ur = await axios.get('/users')
        setAllUsers(ur.data)
      } else {
        setAllUsers(proj.data.members || [])
      }
    } catch { navigate('/projects') }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchAll() }, [id])

  const cycleStatus = async task => {
    await axios.put(`/tasks/${task.id}`, { status: STATUS_CYCLE[task.status] })
    fetchAll()
  }

  const deleteTask = async taskId => {
    if (!confirm('Delete task?')) return
    await axios.delete(`/tasks/${taskId}`); fetchAll()
  }

  const addMember = async uid => {
    await axios.post(`/projects/${id}/members`, { user_id: parseInt(uid) }); fetchAll()
  }
  const removeMember = async uid => {
    await axios.delete(`/projects/${id}/members/${uid}`); fetchAll()
  }

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', gap:10, color:'var(--text3)', fontSize:13, padding:'60px 0' }}>
      <span className="spinner" /> Loading project...
    </div>
  )
  if (!project) return null

  const isOverdue = t => t.due_date && isPast(new Date(t.due_date)) && t.status !== 'done'
  const filtered = filter === 'all' ? tasks : tasks.filter(t => t.status === filter)

  const TaskCard = ({ task, compact }) => (
    <div style={{
      background:'var(--bg2)',
      border:`1px solid ${isOverdue(task) ? 'rgba(248,113,113,0.35)' : 'var(--border)'}`,
      borderRadius:10,
      padding: compact ? '12px 14px' : '14px 16px',
      transition:'border-color 0.2s, transform 0.2s, box-shadow 0.2s',
      position:'relative',
      overflow:'hidden',
    }}
    onMouseEnter={e => { e.currentTarget.style.borderColor = isOverdue(task) ? 'rgba(248,113,113,0.6)' : 'var(--border2)'; e.currentTarget.style.transform='translateY(-1px)'; e.currentTarget.style.boxShadow='0 4px 20px rgba(0,0,0,0.3)' }}
    onMouseLeave={e => { e.currentTarget.style.borderColor = isOverdue(task) ? 'rgba(248,113,113,0.35)' : 'var(--border)'; e.currentTarget.style.transform='none'; e.currentTarget.style.boxShadow='none' }}
    >
      {/* Priority bar */}
      <div style={{ position:'absolute', left:0, top:0, bottom:0, width:2, background:PRIORITY_DOT[task.priority], borderRadius:'10px 0 0 10px' }} />

      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:8 }}>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{
            fontSize:13, fontWeight:500, color: task.status === 'done' ? 'var(--text3)' : 'var(--text)',
            textDecoration: task.status === 'done' ? 'line-through' : 'none',
            lineHeight:1.4, marginBottom:8,
          }}>{task.title}</div>
          {task.description && !compact && (
            <p style={{ fontSize:11, color:'var(--text3)', lineHeight:1.5, marginBottom:8, display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden' }}>
              {task.description}
            </p>
          )}
          <div style={{ display:'flex', flexWrap:'wrap', gap:6, alignItems:'center' }}>
            <span className={`badge ${STATUS_BADGE[task.status]}`}>{STATUS_LABEL[task.status]}</span>
            <span className={`badge ${PRIORITY_BADGE[task.priority]}`}>{task.priority}</span>
            {task.assignee && (
              <span className="chip" style={{ fontSize:10 }}>
                <span style={{ width:14, height:14, borderRadius:'50%', background:'var(--surface2)', display:'inline-flex', alignItems:'center', justifyContent:'center', fontSize:8, color:'var(--accent)', fontWeight:700 }}>
                  {task.assignee.name[0]}
                </span>
                {task.assignee.name.split(' ')[0]}
              </span>
            )}
            {task.due_date && (
              <span style={{ fontSize:10, color: isOverdue(task) ? 'var(--red)' : 'var(--text3)', fontFamily:'DM Mono,monospace' }}>
                {isOverdue(task) ? '⚠ ' : ''}due {format(new Date(task.due_date), 'MMM d')}
              </span>
            )}
          </div>
        </div>
        <div style={{ display:'flex', gap:4, flexShrink:0 }}>
          <button className="btn-icon" onClick={() => cycleStatus(task)} title={`Move to ${STATUS_CYCLE[task.status]}`} style={{ fontSize:11 }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 11-2.12-9.36L23 10"/></svg>
          </button>
          {user?.role === 'admin' && <>
            <button className="btn-icon" onClick={() => setTaskModal(task)} title="Edit">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            </button>
            <button className="btn-icon" onClick={() => deleteTask(task.id)} title="Delete" style={{ borderColor:'rgba(248,113,113,0.2)', color:'rgba(248,113,113,0.7)' }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/></svg>
            </button>
          </>}
        </div>
      </div>
    </div>
  )

  return (
    <div>
      {/* Breadcrumb */}
      <div className="animate-fadeUp" style={{ display:'flex', alignItems:'center', gap:8, marginBottom:20, fontSize:12, color:'var(--text3)' }}>
        <Link to="/projects" style={{ color:'var(--text3)', textDecoration:'none', transition:'color 0.2s' }}
          onMouseEnter={e=>e.target.style.color='var(--accent)'}
          onMouseLeave={e=>e.target.style.color='var(--text3)'}
        >Projects</Link>
        <span>/</span>
        <span style={{ color:'var(--text2)' }}>{project.name}</span>
      </div>

      {/* Header */}
      <div className="animate-fadeUp" style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:24, flexWrap:'wrap', gap:16 }}>
        <div>
          <h1 style={{ fontFamily:'Syne,sans-serif', fontWeight:800, fontSize:26, color:'var(--text)', letterSpacing:'-0.03em' }}>{project.name}</h1>
          {project.description && <p style={{ color:'var(--text3)', fontSize:13, marginTop:6, maxWidth:500 }}>{project.description}</p>}
          <div style={{ display:'flex', gap:16, marginTop:10, fontSize:11, color:'var(--text3)' }}>
            <span>{tasks.length} tasks</span>
            <span>·</span>
            <span>{project.members?.length ?? 0} members</span>
            <span>·</span>
            <span>Owner: {project.owner?.name}</span>
          </div>
        </div>
        <div style={{ display:'flex', gap:10, alignItems:'center' }}>
          {/* View toggle */}
          <div style={{ display:'flex', background:'var(--surface)', border:'1px solid var(--border)', borderRadius:8, overflow:'hidden' }}>
            {['board','list'].map(v => (
              <button key={v} onClick={() => setView(v)} style={{
                padding:'7px 14px', fontSize:11, border:'none', cursor:'pointer', fontFamily:'DM Mono,monospace',
                background: view === v ? 'var(--surface2)' : 'transparent',
                color: view === v ? 'var(--accent)' : 'var(--text3)',
                transition:'all 0.15s',
              }}>{v}</button>
            ))}
          </div>
          {user?.role === 'admin' && (
            <button className="btn btn-primary" onClick={() => setTaskModal('new')}>+ Task</button>
          )}
        </div>
      </div>

      {/* Filter bar */}
      <div className="animate-fadeUp delay-1" style={{ display:'flex', gap:8, marginBottom:20, flexWrap:'wrap' }}>
        {['all','todo','in_progress','done'].map(f => {
          const count = f === 'all' ? tasks.length : tasks.filter(t => t.status === f).length
          return (
            <button key={f} onClick={() => setFilter(f)} style={{
              padding:'6px 14px', borderRadius:20, fontSize:11, cursor:'pointer', fontFamily:'DM Mono,monospace',
              border:`1px solid ${filter === f ? 'var(--accent)' : 'var(--border)'}`,
              color: filter === f ? 'var(--accent)' : 'var(--text3)',
              background: filter === f ? 'var(--accent-glow)' : 'transparent',
              transition:'all 0.15s',
            }}>{f === 'in_progress' ? 'in progress' : f} <span style={{ opacity:0.6 }}>({count})</span></button>
          )
        })}
      </div>

      <div style={{ display:'grid', gridTemplateColumns: user?.role === 'admin' ? '1fr 220px' : '1fr', gap:20 }}>
        {/* Tasks area */}
        <div>
          {/* BOARD VIEW */}
          {view === 'board' && (
            <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:14 }}>
              {COLS.map(col => {
                const colTasks = tasks.filter(t => t.status === col)
                return (
                  <div key={col}>
                    <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:12, padding:'0 2px' }}>
                      <div style={{ width:8, height:8, borderRadius:'50%', background:COL_COLORS[col] }} />
                      <span style={{ fontSize:11, fontWeight:600, color:'var(--text2)', letterSpacing:'0.06em', textTransform:'uppercase' }}>{COL_LABELS[col]}</span>
                      <span style={{ fontSize:10, color:'var(--text3)', background:'var(--surface)', borderRadius:10, padding:'1px 7px', border:'1px solid var(--border)' }}>{colTasks.length}</span>
                    </div>
                    <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                      {colTasks.length === 0 ? (
                        <div style={{ border:'1px dashed var(--border)', borderRadius:10, padding:'24px 16px', textAlign:'center', color:'var(--text3)', fontSize:11 }}>
                          No tasks
                        </div>
                      ) : colTasks.map(task => <TaskCard key={task.id} task={task} compact />)}
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* LIST VIEW */}
          {view === 'list' && (
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              {filtered.length === 0 ? (
                <div className="empty-state">
                  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>
                  <span>No tasks found</span>
                </div>
              ) : filtered.map(task => <TaskCard key={task.id} task={task} />)}
            </div>
          )}
        </div>

        {/* Sidebar panel - admin only */}
        {user?.role === 'admin' && (
          <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
            {/* Members */}
            <div className="glass" style={{ padding:'18px' }}>
              <div style={{ fontSize:11, color:'var(--text3)', letterSpacing:'0.08em', textTransform:'uppercase', marginBottom:14 }}>
                Members ({project.members?.length ?? 0})
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:10, marginBottom:14 }}>
                {(project.members || []).length === 0 ? (
                  <div style={{ fontSize:12, color:'var(--text3)' }}>No members added</div>
                ) : (project.members || []).map(m => (
                  <div key={m.id} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:8 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                      <div style={{ width:26, height:26, borderRadius:6, background:'var(--surface2)', border:'1px solid var(--border)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, color:'var(--accent)', fontWeight:700 }}>
                        {m.name[0]}
                      </div>
                      <div>
                        <div style={{ fontSize:12, color:'var(--text2)' }}>{m.name}</div>
                        <span className={`badge badge-${m.role}`} style={{ fontSize:9 }}>{m.role}</span>
                      </div>
                    </div>
                    <button className="btn-icon" onClick={() => removeMember(m.id)} style={{ borderColor:'rgba(248,113,113,0.2)', color:'rgba(248,113,113,0.6)' }}>
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    </button>
                  </div>
                ))}
              </div>
              <div>
                <label className="input-label">Add Member</label>
                <select className="input" style={{ fontSize:12, cursor:'pointer' }} onChange={e => { if(e.target.value) { addMember(e.target.value); e.target.value = '' } }} defaultValue="">
                  <option value="" disabled>Select user...</option>
                  {allUsers.filter(u => !(project.members||[]).find(m => m.id === u.id)).map(u => (
                    <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Task stats */}
            <div className="glass" style={{ padding:'18px' }}>
              <div style={{ fontSize:11, color:'var(--text3)', letterSpacing:'0.08em', textTransform:'uppercase', marginBottom:14 }}>Task Breakdown</div>
              {COLS.map(col => {
                const count = tasks.filter(t => t.status === col).length
                const pct = tasks.length > 0 ? Math.round(count / tasks.length * 100) : 0
                return (
                  <div key={col} style={{ marginBottom:12 }}>
                    <div style={{ display:'flex', justifyContent:'space-between', marginBottom:5, fontSize:11 }}>
                      <span style={{ color:'var(--text3)' }}>{COL_LABELS[col]}</span>
                      <span style={{ color:COL_COLORS[col], fontWeight:600 }}>{count}</span>
                    </div>
                    <div className="progress-track">
                      <div className="progress-fill" style={{ width:`${pct}%`, background:COL_COLORS[col] }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {taskModal && (
        <TaskModal
          projectId={id}
          users={allUsers}
          initial={taskModal === 'new' ? null : taskModal}
          onClose={() => setTaskModal(null)}
          onSaved={() => { setTaskModal(null); fetchAll() }}
        />
      )}
    </div>
  )
}
