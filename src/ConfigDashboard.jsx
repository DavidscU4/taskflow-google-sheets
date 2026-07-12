import { Building2, FolderKanban, Layers3, Settings2 } from 'lucide-react'
import './ConfigDashboard.css'

function catalog(tasks, key) {
  const values = new Map()
  tasks.forEach((task) => { const value = task[key]?.trim(); if (value) values.set(value, (values.get(value) || 0) + 1) })
  return [...values.entries()].map(([name, count]) => ({ name, count })).sort((a, b) => a.name.localeCompare(b.name, 'es'))
}

function Catalog({ title, description, icon, items }) {
  return <article className="catalog-panel"><div className="catalog-heading"><span>{icon}</span><div><h2>{title}</h2><p>{description}</p></div><b>{items.length}</b></div><div className="catalog-list">{items.map((item) => <div key={item.name}><span>{item.name}</span><small>{item.count} {item.count === 1 ? 'tarea' : 'tareas'}</small></div>)}</div></article>
}

export default function ConfigDashboard({ tasks }) {
  const projects = catalog(tasks, 'project'); const entities = catalog(tasks, 'entity'); const modules = catalog(tasks, 'module')
  return <section className="config-dashboard"><div className="config-hero"><div><p className="eyebrow">Catálogos del Sheet</p><h1>Configuraciones<br /><em>de tareas.</em></h1></div><p>Estos valores se detectan automáticamente en las tareas existentes y aparecen como sugerencias al crear o editar una actividad.</p></div><div className="config-summary"><div><Settings2 size={18} /><span>Valores detectados</span><strong>{projects.length + entities.length + modules.length}</strong></div><div><FolderKanban size={18} /><span>Proyectos</span><strong>{projects.length}</strong></div><div><Building2 size={18} /><span>Entidades</span><strong>{entities.length}</strong></div><div><Layers3 size={18} /><span>Módulos</span><strong>{modules.length}</strong></div></div><div className="catalog-grid"><Catalog title="Proyectos" description="Nombres usados en la columna A" icon={<FolderKanban size={18} />} items={projects} /><Catalog title="Entidades" description="Entidades registradas en la columna B" icon={<Building2 size={18} />} items={entities} /><Catalog title="Módulos" description="Módulos registrados en la columna C" icon={<Layers3 size={18} />} items={modules} /></div><div className="config-note"><strong>¿Cómo se actualizan?</strong><span>Al crear una tarea con un valor nuevo, el catálogo se actualizará después de sincronizar el Sheet. Las sugerencias respetan exactamente la escritura existente.</span></div></section>
}
