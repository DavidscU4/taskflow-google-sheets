import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowUpRight,
  BarChart3,
  Building2,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  CircleDot,
  Clock3,
  Edit3,
  LayoutGrid,
  List,
  Plus,
  RefreshCw,
  Save,
  Search,
  Settings2,
  Sheet,
  SlidersHorizontal,
  X,
} from "lucide-react";
import "./App.css";
import "./drag.css";
import "./navigation.css";
import "./suggestions.css";
import BiDashboard from "./BiDashboard";
import ConfigDashboard from "./ConfigDashboard";
import { formatShortDate, toInputDate } from "./dateUtils";

const SHEET_ID = import.meta.env.VITE_GOOGLE_SHEET_ID || "";
const SHEET_NAME =
  import.meta.env.VITE_GOOGLE_SHEET_NAME || "Seguimiento de Tareas";
const SHEET_URL = SHEET_ID
  ? `https://docs.google.com/spreadsheets/d/${SHEET_ID}/edit`
  : "#";
const DATA_URL = SHEET_ID
  ? `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(SHEET_NAME)}`
  : "";
const API_URL = import.meta.env.VITE_SHEETS_API_URL || "";
const fields = [
  "project",
  "entity",
  "module",
  "description",
  "startDate",
  "dueDate",
  "endDate",
  "status",
  "notes",
];
const fallback = [
  [
    "IBARRA VENTANILLA",
    "IBARRA",
    "VENTANILLA",
    "Revisión de tickets de mesa de ayuda",
    "2026-05-01",
    "2026-06-25",
    "",
    "EN PROCESO",
    "",
  ],
  [
    "ERP IBARRA",
    "IBARRA",
    "FINANCIERO",
    "Revisar cómo conectar el trámite ciudadano con un trámite interno",
    "2026-06-10",
    "2026-06-17",
    "",
    "EN PROCESO",
    "Analizar relación entre trámite ciudadano, generación de trámite interno y trazabilidad.",
  ],
  [
    "ERP LATACUNGA",
    "LATACUNGA",
    "VENTANILLA LATACUNGA",
    "Revisar las opciones de continuar tarea y devolver tarea dentro de los trámites de ventanilla",
    "2026-05-04",
    "2026-05-06",
    "2026-05-06",
    "REALIZADO",
    "",
  ],
];

function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let quoted = false;
  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    if (char === '"') {
      if (quoted && text[i + 1] === '"') {
        field += '"';
        i += 1;
      } else quoted = !quoted;
    } else if (char === "," && !quoted) {
      row.push(field);
      field = "";
    } else if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && text[i + 1] === "\n") i += 1;
      row.push(field);
      if (row.some(Boolean)) rows.push(row);
      row = [];
      field = "";
    } else field += char;
  }
  row.push(field);
  if (row.some(Boolean)) rows.push(row);
  return rows;
}

function toTasks(rows, hasHeader = true) {
  return rows
    .slice(hasHeader ? 1 : 0)
    .filter((row) => row[3])
    .map((row, index) => {
      const task = { id: index + 1, rowNumber: index + 2 };
      fields.forEach((key, i) => {
      const value = (row[i] || "").trim();
      task[key] = ["startDate", "dueDate", "endDate"].includes(key)
        ? toInputDate(value)
        : value;
      });
      return task;
    });
}
function normalize(value = "") {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}
function typeOf(status) {
  const value = normalize(status);
  if (/realizado|finalizado|completado/.test(value)) return "done";
  if (value.includes("proceso")) return "progress";
  return "pending";
}
function formatDate(value) {
  return formatShortDate(value);
}
function today() {
  const date = new Date();
  const offset = date.getTimezoneOffset();
  return new Date(date.getTime() - offset * 60000).toISOString().slice(0, 10);
}

function TaskCard({ task, compact = false, onEdit, onDragStart }) {
  const type = typeOf(task.status);
  return (
    <article
      className={`task-card ${compact ? "task-card--compact" : ""}`}
      draggable={!compact}
      onDragStart={(event) => onDragStart?.(event, task)}
    >
      <div className="task-card__top">
        <span className={`status-pill status-pill--${type}`}>
          {type === "done" ? (
            <CheckCircle2 size={13} />
          ) : type === "progress" ? (
            <CircleDot size={13} />
          ) : (
            <Clock3 size={13} />
          )}
          {task.status || "PENDIENTE"}
        </span>
        <span className="card-actions">
          <span className="task-id">#{String(task.id).padStart(2, "0")}</span>
          <button onClick={() => onEdit(task)} aria-label="Editar tarea">
            <Edit3 size={14} />
          </button>
        </span>
      </div>
      <h3>{task.description}</h3>
      {task.notes && !compact && <p className="task-notes">{task.notes}</p>}
      <div className="task-meta">
        <span>
          <Building2 size={14} />
          {task.module || task.entity}
        </span>
        <span>
          <CalendarDays size={14} />
          {formatDate(task.dueDate)}
        </span>
      </div>
      <div className="task-footer">
        <span>{task.project}</span>
        <span className="entity-dot">{task.entity}</span>
      </div>
    </article>
  );
}

const emptyTask = {
  project: "",
  entity: "",
  module: "",
  description: "",
  startDate: "",
  dueDate: "",
  endDate: "",
  status: "EN PROCESO",
  notes: "",
};

function TaskModal({ task, tasks, saving, error, onClose, onSave }) {
  const [form, setForm] = useState(task || emptyTask);
  const unique = (values) =>
    [...new Set(values.filter(Boolean).map((value) => value.trim()))].sort(
      (a, b) => a.localeCompare(b, "es"),
    );
  const projectOptions = unique(tasks.map((item) => item.project));
  const related = tasks.filter(
    (item) =>
      (!form.project || item.project === form.project) &&
      (!form.entity || item.entity === form.entity),
  );
  const entityOptions = unique(
    tasks
      .filter((item) => !form.project || item.project === form.project)
      .map((item) => item.entity),
  );
  const moduleOptions = unique(
    (related.length ? related : tasks).map((item) => item.module),
  );
  const update = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({
      ...current,
      [name]: value,
      ...(name === "status"
        ? { endDate: value === "REALIZADO" ? current.endDate || today() : "" }
        : {}),
    }));
  };
  const submit = (event) => {
    event.preventDefault();
    onSave({
      ...form,
      action: task ? "update" : "create",
      rowNumber: task?.rowNumber,
    });
  };
  return (
    <div
      className="modal-backdrop"
      onMouseDown={(event) => event.target === event.currentTarget && onClose()}
    >
      <section
        className="task-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        <div className="modal-header">
          <div>
            <p>{task ? "Actualizar actividad" : "Nueva actividad"}</p>
            <h2 id="modal-title">{task ? "Editar tarea" : "Crear tarea"}</h2>
          </div>
          <button className="modal-close" onClick={onClose} aria-label="Cerrar">
            <X size={19} />
          </button>
        </div>
        {!API_URL && (
          <div className="write-warning">
            La interfaz está lista. Falta configurar la URL de escritura para
            guardar en Google Sheets.
          </div>
        )}
        <form onSubmit={submit}>
          <div className="form-grid">
            <label>
              Proyecto
              <input
                name="project"
                list="project-options"
                value={form.project}
                onChange={update}
                autoComplete="off"
                required
              />
              <small>Selecciona un valor existente o escribe uno nuevo.</small>
            </label>
            <label>
              Entidad
              <input
                name="entity"
                list="entity-options"
                value={form.entity}
                onChange={update}
                autoComplete="off"
                required
              />
              <small>Las sugerencias se filtran por proyecto.</small>
            </label>
          </div>
          <label>
            Módulo
            <input
              name="module"
              list="module-options"
              value={form.module}
              onChange={update}
              autoComplete="off"
              required
            />
            <small>Las sugerencias se filtran por proyecto y entidad.</small>
          </label>
          <datalist id="project-options">
            {projectOptions.map((value) => (
              <option value={value} key={value} />
            ))}
          </datalist>
          <datalist id="entity-options">
            {entityOptions.map((value) => (
              <option value={value} key={value} />
            ))}
          </datalist>
          <datalist id="module-options">
            {moduleOptions.map((value) => (
              <option value={value} key={value} />
            ))}
          </datalist>
          <label>
            Descripción de la actividad
            <textarea
              name="description"
              value={form.description}
              onChange={update}
              rows="4"
              required
            />
          </label>
          <div className="form-grid form-grid--dates">
            <label>
              Fecha de inicio
              <input
                type="date"
                name="startDate"
                value={toInputDate(form.startDate)}
                onChange={update}
              />
            </label>
            <label>
              Fecha estimada
              <input
                type="date"
                name="dueDate"
                value={toInputDate(form.dueDate)}
                onChange={update}
              />
            </label>
            <label>
              Fecha final
              <input
                type="date"
                name="endDate"
                value={toInputDate(form.endDate)}
                onChange={update}
              />
            </label>
          </div>
          <label>
            Estado
            <select name="status" value={form.status} onChange={update}>
              <option>EN PROCESO</option>
              <option>PENDIENTE</option>
              <option>REALIZADO</option>
            </select>
          </label>
          <label>
            Observaciones
            <textarea
              name="notes"
              value={form.notes}
              onChange={update}
              rows="3"
            />
          </label>
          {error && <p className="form-error">{error}</p>}
          <div className="modal-footer">
            <button
              type="button"
              className="secondary-button"
              onClick={onClose}
            >
              Cancelar
            </button>
            <button className="primary-button" disabled={saving || !API_URL}>
              <Save size={16} />
              {saving ? "Guardando..." : "Guardar en Sheet"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

function App() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState("");
  const [lastUpdate, setLastUpdate] = useState(null);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("TODOS");
  const [project, setProject] = useState("TODOS");
  const [view, setView] = useState("board");
  const [modal, setModal] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [dragOver, setDragOver] = useState("");
  const [section, setSection] = useState("board");
  const loadTasks = useCallback(async () => {
    setLoading(true);
    setNotice("");
    try {
      if (!DATA_URL) throw new Error();
      const response = await fetch(DATA_URL, { cache: "no-store" });
      if (!response.ok) throw new Error();
      const imported = toTasks(parseCsv(await response.text()));
      if (!imported.length) throw new Error();
      setTasks(imported);
      setLastUpdate(new Date());
    } catch {
      setTasks(toTasks(fallback, false));
      setNotice(
        "No fue posible sincronizar. Se muestra una vista de referencia.",
      );
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    const timer = window.setTimeout(loadTasks, 0);
    return () => window.clearTimeout(timer);
  }, [loadTasks]);
  const projects = useMemo(
    () => [...new Set(tasks.map((task) => task.project))].sort(),
    [tasks],
  );
  const filtered = useMemo(
    () =>
      tasks.filter(
        (task) =>
          (status === "TODOS" || typeOf(task.status) === status) &&
          (project === "TODOS" || task.project === project) &&
          (!query ||
            normalize(Object.values(task).join(" ")).includes(
              normalize(query),
            )),
      ),
    [tasks, status, project, query],
  );
  const summary = useMemo(
    () => ({
      total: tasks.length,
      progress: tasks.filter((t) => typeOf(t.status) === "progress").length,
      done: tasks.filter((t) => typeOf(t.status) === "done").length,
      pending: tasks.filter((t) => typeOf(t.status) === "pending").length,
    }),
    [tasks],
  );
  const groups = [
    { key: "pending", label: "Pendientes", color: "amber" },
    { key: "progress", label: "En proceso", color: "violet" },
    { key: "done", label: "Realizadas", color: "green" },
  ];
  const saveTask = async (payload) => {
    setSaving(true);
    setSaveError("");
    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (!result.ok) throw new Error(result.error || "No se pudo guardar");
      await loadTasks();
      setModal(null);
    } catch (error) {
      setSaveError(error.message || "No se pudo conectar con Google Sheets");
    } finally {
      setSaving(false);
    }
  };
  const moveTask = async (task, target) => {
    if (typeOf(task.status) === target) return;
    if (!API_URL) {
      setNotice(
        "Configura la URL de escritura para mover tareas y guardar el cambio en el Sheet.",
      );
      return;
    }
    const statusByType = {
      pending: "PENDIENTE",
      progress: "EN PROCESO",
      done: "REALIZADO",
    };
    const updated = {
      ...task,
      action: "update",
      status: statusByType[target],
      endDate: target === "done" ? today() : "",
    };
    setTasks((current) =>
      current.map((item) =>
        item.rowNumber === task.rowNumber ? updated : item,
      ),
    );
    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify(updated),
      });
      const result = await response.json();
      if (!result.ok)
        throw new Error(result.error || "No se pudo mover la tarea");
      setLastUpdate(new Date());
      setNotice("");
    } catch (error) {
      await loadTasks();
      setNotice(
        error.message || "No se pudo guardar el cambio en Google Sheets.",
      );
    }
  };
  const startDrag = (event, task) => {
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/task-row", String(task.rowNumber));
  };
  const dropTask = (event, target) => {
    event.preventDefault();
    setDragOver("");
    const rowNumber = Number(event.dataTransfer.getData("text/task-row"));
    const task = tasks.find((item) => item.rowNumber === rowNumber);
    if (task) moveTask(task, target);
  };

  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand" href="#main">
          <span className="brand-mark">
            <Sheet size={21} />
          </span>
          <span>
            <strong>Taskflow</strong>
            <small>Gestión de actividades</small>
          </span>
        </a>
        <div className="topbar-actions">
          <div className="sync-state">
            <span className="sync-dot" />
            {lastUpdate
              ? `Sincronizado ${lastUpdate.toLocaleTimeString("es-EC", { hour: "2-digit", minute: "2-digit" })}`
              : "Conectando..."}
          </div>
          <button
            className="icon-button"
            onClick={loadTasks}
            aria-label="Actualizar tareas"
          >
            <RefreshCw size={18} className={loading ? "spinning" : ""} />
          </button>
          <button
            className="new-task-button"
            onClick={() => setModal({ mode: "create" })}
          >
            <Plus size={17} />
            Nueva tarea
          </button>
          <a
            className="sheet-button"
            href={SHEET_URL}
            target="_blank"
            rel="noreferrer"
          >
            <Sheet size={17} />
            Abrir Sheet
            <ArrowUpRight size={15} />
          </a>
        </div>
      </header>
      <main id="main">
        <nav className="primary-tabs" aria-label="Vistas principales">
          <button
            className={section === "board" ? "active" : ""}
            onClick={() => setSection("board")}
          >
            <LayoutGrid size={16} />
            Tablero de tareas
          </button>
          <button
            className={section === "bi" ? "active" : ""}
            onClick={() => setSection("bi")}
          >
            <BarChart3 size={16} />
            BI y analítica
          </button>
          <button
            className={section === "config" ? "active" : ""}
            onClick={() => setSection("config")}
          >
            <Settings2 size={16} />
            Configuraciones
          </button>
        </nav>
        {section === "board" ? (
          <>
            <section className="intro">
              <div>
                <p className="eyebrow">Panel de seguimiento</p>
                <h1>
                  Todo el trabajo,
                  <br />
                  <em>en un solo lugar.</em>
                </h1>
                <p className="intro-copy">
                  Consulta el avance de tus proyectos y encuentra rápidamente la
                  próxima actividad.
                </p>
              </div>
              <div className="summary-grid">
                <div className="summary-card summary-card--total">
                  <span>Total de tareas</span>
                  <strong>{summary.total}</strong>
                  <small>en el Sheet</small>
                </div>
                <div className="summary-card">
                  <span>
                    <i className="dot dot--violet" />
                    En proceso
                  </span>
                  <strong>{summary.progress}</strong>
                  <small>activas ahora</small>
                </div>
                <div className="summary-card">
                  <span>
                    <i className="dot dot--green" />
                    Realizadas
                  </span>
                  <strong>{summary.done}</strong>
                  <small>
                    {summary.total
                      ? Math.round((summary.done / summary.total) * 100)
                      : 0}
                    % completado
                  </small>
                </div>
                <div className="summary-card">
                  <span>
                    <i className="dot dot--amber" />
                    Pendientes
                  </span>
                  <strong>{summary.pending}</strong>
                  <small>por iniciar</small>
                </div>
              </div>
            </section>
            {notice && (
              <div className="notice">
                {notice}
                <button onClick={loadTasks}>Reintentar</button>
              </div>
            )}
            <section className="workspace">
              <div className="toolbar">
                <div className="search-box">
                  <Search size={18} />
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Buscar por actividad, módulo o entidad..."
                    aria-label="Buscar tareas"
                  />
                </div>
                <div className="filters">
                  <label>
                    <SlidersHorizontal size={16} />
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value)}
                    >
                      <option value="TODOS">Todos los estados</option>
                      <option value="progress">En proceso</option>
                      <option value="pending">Pendientes</option>
                      <option value="done">Realizadas</option>
                    </select>
                    <ChevronDown size={15} />
                  </label>
                  <label>
                    <select
                      value={project}
                      onChange={(e) => setProject(e.target.value)}
                    >
                      <option value="TODOS">Todos los proyectos</option>
                      {projects.map((item) => (
                        <option key={item}>{item}</option>
                      ))}
                    </select>
                    <ChevronDown size={15} />
                  </label>
                  <div className="view-switch">
                    <button
                      className={view === "board" ? "active" : ""}
                      onClick={() => setView("board")}
                      aria-label="Vista tablero"
                    >
                      <LayoutGrid size={17} />
                    </button>
                    <button
                      className={view === "list" ? "active" : ""}
                      onClick={() => setView("list")}
                      aria-label="Vista lista"
                    >
                      <List size={18} />
                    </button>
                  </div>
                </div>
              </div>
              <div className="results-line">
                <span>
                  {filtered.length} {filtered.length === 1 ? "tarea" : "tareas"}
                </span>
                {(query || status !== "TODOS" || project !== "TODOS") && (
                  <button
                    onClick={() => {
                      setQuery("");
                      setStatus("TODOS");
                      setProject("TODOS");
                    }}
                  >
                    Limpiar filtros
                  </button>
                )}
              </div>
              {loading && !tasks.length ? (
                <div className="loading-grid">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div className="skeleton" key={i} />
                  ))}
                </div>
              ) : !filtered.length ? (
                <div className="empty-state">
                  <Search size={28} />
                  <h2>No encontramos tareas</h2>
                  <p>Prueba con otros filtros o términos de búsqueda.</p>
                </div>
              ) : view === "board" ? (
                <div className="board">
                  {groups.map((group) => {
                    const list = filtered.filter(
                      (task) => typeOf(task.status) === group.key,
                    );
                    return (
                      <section
                        className={`board-column ${dragOver === group.key ? "board-column--dragover" : ""}`}
                        key={group.key}
                        onDragOver={(event) => {
                          event.preventDefault();
                          event.dataTransfer.dropEffect = "move";
                          setDragOver(group.key);
                        }}
                        onDragLeave={(event) =>
                          !event.currentTarget.contains(event.relatedTarget) &&
                          setDragOver("")
                        }
                        onDrop={(event) => dropTask(event, group.key)}
                      >
                        <div className="column-heading">
                          <span>
                            <i className={`dot dot--${group.color}`} />
                            {group.label}
                          </span>
                          <b>{list.length}</b>
                        </div>
                        <div className="column-content">
                          {list.map((task) => (
                            <TaskCard
                              task={task}
                              onDragStart={startDrag}
                              onEdit={(item) =>
                                setModal({ mode: "edit", task: item })
                              }
                              key={task.id}
                            />
                          ))}
                          {!list.length && (
                            <p className="column-empty">
                              Arrastra una tarea a esta columna
                            </p>
                          )}
                        </div>
                      </section>
                    );
                  })}
                </div>
              ) : (
                <div className="task-list">
                  {filtered.map((task) => (
                    <TaskCard
                      task={task}
                      compact
                      onEdit={(item) => setModal({ mode: "edit", task: item })}
                      key={task.id}
                    />
                  ))}
                </div>
              )}
            </section>
          </>
        ) : section === "bi" ? (
          <BiDashboard tasks={tasks} />
        ) : (
          <ConfigDashboard tasks={tasks} />
        )}
      </main>
      <footer>
        <span>Datos conectados con Google Sheets</span>
        <span>Lectura y escritura sincronizadas</span>
      </footer>
      {modal && (
        <TaskModal
          task={modal.task}
          tasks={tasks}
          saving={saving}
          error={saveError}
          onClose={() => {
            setModal(null);
            setSaveError("");
          }}
          onSave={saveTask}
        />
      )}
    </div>
  );
}
export default App;
