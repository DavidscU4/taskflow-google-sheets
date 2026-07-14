import { AlertTriangle, BarChart3, CalendarClock, CheckCircle2, Layers3, Timer, TrendingUp } from 'lucide-react'
import './BiDashboard.css'
import { parseSheetDate } from './dateUtils'

function normalize(value = '') { return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase() }
function statusType(status) { const value = normalize(status); if (/realizado|finalizado|completado/.test(value)) return 'done'; if (value.includes('proceso')) return 'progress'; return 'pending' }
function dateOf(value) { return parseSheetDate(value) }
function daysBetween(start, end) { return Math.max(0, Math.round((end - start) / 86400000)) }
function groupBy(tasks, key) {
  const result = new Map()
  tasks.forEach((task) => { const label = task[key] || 'Sin asignar'; const current = result.get(label) || { label, total: 0, done: 0, progress: 0, pending: 0 }; current.total += 1; current[statusType(task.status)] += 1; result.set(label, current) })
  return [...result.values()].sort((a, b) => b.total - a.total)
}

function StackedBar({ item, max }) {
  return <div className="bi-bar-row"><div className="bi-bar-label"><span>{item.label}</span><b>{item.total}</b></div><div className="bi-bar-track" aria-label={`${item.label}: ${item.total} tareas`}><i className="bar-pending" style={{ width: `${item.pending / max * 100}%` }} /><i className="bar-progress" style={{ width: `${item.progress / max * 100}%` }} /><i className="bar-done" style={{ width: `${item.done / max * 100}%` }} /></div><div className="bi-bar-detail"><span>{item.pending} pendientes</span><span>{item.progress} en proceso</span><span>{item.done} realizadas</span></div></div>
}

export default function BiDashboard({ tasks }) {
  const total = tasks.length
  const done = tasks.filter((task) => statusType(task.status) === 'done').length
  const progress = tasks.filter((task) => statusType(task.status) === 'progress').length
  const pending = total - done - progress
  const now = new Date(); now.setHours(0, 0, 0, 0)
  const overdueTasks = tasks.filter((task) => statusType(task.status) !== 'done' && dateOf(task.dueDate) && dateOf(task.dueDate) < now)
  const finishedWithDates = tasks.map((task) => ({ start: dateOf(task.startDate), end: dateOf(task.endDate) })).filter((item) => item.start && item.end)
  const avgDays = finishedWithDates.length ? Math.round(finishedWithDates.reduce((sum, item) => sum + daysBetween(item.start, item.end), 0) / finishedWithDates.length) : 0
  const projects = groupBy(tasks, 'project').slice(0, 8)
  const entities = groupBy(tasks, 'entity').slice(0, 6)
  const modules = groupBy(tasks, 'module').slice(0, 8)
  const maxProject = Math.max(1, ...projects.map((item) => item.total))
  const maxModule = Math.max(1, ...modules.map((item) => item.total))
  const completion = total ? Math.round(done / total * 100) : 0
  const onTime = tasks.filter((task) => { const due = dateOf(task.dueDate); const end = dateOf(task.endDate); return due && end && end <= due }).length
  const finishedDated = tasks.filter((task) => dateOf(task.endDate)).length
  const onTimeRate = finishedDated ? Math.round(onTime / finishedDated * 100) : 0

  return <section className="bi-dashboard">
    <div className="bi-heading"><div><p className="eyebrow">Business intelligence</p><h1>Panorama de<br /><em>rendimiento.</em></h1></div><p>Indicadores calculados con la información actual del Sheet. Los valores se actualizan junto con el tablero.</p></div>
    <div className="bi-kpis">
      <article><span><TrendingUp size={17} />Avance general</span><strong>{completion}%</strong><small>{done} de {total} tareas completadas</small></article>
      <article><span><AlertTriangle size={17} />Tareas vencidas</span><strong>{overdueTasks.length}</strong><small>actividades abiertas fuera de fecha</small></article>
      <article><span><Timer size={17} />Tiempo promedio</span><strong>{avgDays}<i> días</i></strong><small>desde inicio hasta finalización</small></article>
      <article><span><CheckCircle2 size={17} />Cumplimiento</span><strong>{onTimeRate}%</strong><small>finalizadas dentro del plazo</small></article>
    </div>

    <div className="bi-grid bi-grid--top">
      <article className="bi-panel status-panel"><div className="bi-panel-title"><div><BarChart3 size={17} /><span>Distribución por estado</span></div><small>{total} tareas</small></div><div className="status-visual"><div className="donut" style={{ '--pending': `${total ? pending / total * 100 : 0}%`, '--progress': `${total ? (pending + progress) / total * 100 : 0}%` }}><div><strong>{completion}%</strong><span>completado</span></div></div><div className="status-legend"><div><i className="legend-pending" /><span>Pendientes</span><b>{pending}</b></div><div><i className="legend-progress" /><span>En proceso</span><b>{progress}</b></div><div><i className="legend-done" /><span>Realizadas</span><b>{done}</b></div></div></div></article>
      <article className="bi-panel"><div className="bi-panel-title"><div><Layers3 size={17} /><span>Carga por proyecto</span></div><small>Top {projects.length}</small></div><div className="bi-bars">{projects.map((item) => <StackedBar item={item} max={maxProject} key={item.label} />)}</div></article>
    </div>

    <div className="bi-grid bi-grid--bottom">
      <article className="bi-panel"><div className="bi-panel-title"><div><CalendarClock size={17} /><span>Salud de fechas</span></div><small>actividades abiertas</small></div><div className="deadline-summary"><div><strong>{overdueTasks.length}</strong><span>Vencidas</span></div><div><strong>{tasks.filter((task) => statusType(task.status) !== 'done' && dateOf(task.dueDate) && dateOf(task.dueDate) >= now).length}</strong><span>Dentro de plazo</span></div><div><strong>{tasks.filter((task) => statusType(task.status) !== 'done' && !dateOf(task.dueDate)).length}</strong><span>Sin fecha</span></div></div><div className="overdue-list">{overdueTasks.slice(0, 5).map((task) => <div key={task.rowNumber}><span>{task.description}</span><b>{task.project}</b></div>)}{!overdueTasks.length && <p>No existen tareas vencidas.</p>}</div></article>
      <article className="bi-panel"><div className="bi-panel-title"><div><Layers3 size={17} /><span>Módulos con mayor actividad</span></div><small>por volumen</small></div><div className="module-list">{modules.map((item, index) => <div key={item.label}><b>{String(index + 1).padStart(2, '0')}</b><span>{item.label}</span><div><i style={{ width: `${item.total / maxModule * 100}%` }} /></div><strong>{item.total}</strong></div>)}</div></article>
      <article className="bi-panel"><div className="bi-panel-title"><div><BarChart3 size={17} /><span>Avance por entidad</span></div><small>comparativo</small></div><div className="entity-list">{entities.map((item) => { const rate = item.total ? Math.round(item.done / item.total * 100) : 0; return <div key={item.label}><div><span>{item.label}</span><b>{rate}%</b></div><div className="entity-track"><i style={{ width: `${rate}%` }} /></div><small>{item.done} de {item.total} realizadas</small></div> })}</div></article>
    </div>
  </section>
}
