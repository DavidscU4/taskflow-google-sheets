# Taskflow

Panel de gestión de tareas conectado con Google Sheets. Incluye tablero Kanban, creación y edición de actividades, movimiento entre estados y paneles de BI para analizar proyectos, entidades, módulos, fechas y cumplimiento.

## Funcionalidades

- Lectura de tareas desde Google Sheets.
- Creación y edición desde la aplicación.
- Kanban: Pendientes, En proceso y Realizadas.
- Fecha de finalización automática al mover una tarjeta a Realizadas.
- Búsqueda, filtros y vista de lista.
- Indicadores de avance, vencimientos y cumplimiento.
- Gráficos por proyecto, entidad, módulo y estado.
- Diseño adaptable para escritorio y móviles.

## Requisitos

- Node.js 20.19+, 22.12+ o una versión más reciente compatible con Vite.
- Una cuenta de Google con permisos de edición sobre el Sheet.
- Una pestaña llamada `Seguimiento de Tareas`, o el nombre configurado en el entorno.

## Estructura del Sheet

La primera fila debe contener estas nueve columnas, en este orden:

| Columna | Contenido |
|---|---|
| A | Nombre del Proyecto |
| B | Entidad |
| C | Módulo |
| D | Descripción de la Actividad |
| E | Fecha de Inicio |
| F | Fecha Estimada de Terminación |
| G | Fecha de Finalización |
| H | Estado |
| I | Observaciones |

Estados reconocidos: `PENDIENTE`, `EN PROCESO` y `REALIZADO`.

## Instalación

```bash
git clone URL_DEL_REPOSITORIO
cd gestor-tareas-hoja-calculo
npm install
```

Copia `.env.example` como `.env` y configura:

```env
VITE_GOOGLE_SHEET_ID=ID_DEL_DOCUMENTO
VITE_GOOGLE_SHEET_NAME=Seguimiento de Tareas
VITE_SHEETS_API_URL=https://script.google.com/macros/s/ID_DE_IMPLEMENTACION/exec
```

El ID del Sheet es el texto situado entre `/d/` y `/edit` en su dirección web.

## Habilitar lectura

La aplicación utiliza la exportación CSV de Google Sheets. El documento debe estar compartido de forma que los usuarios de la aplicación puedan consultarlo. Si contiene información privada, limita su uso a un entorno controlado y añade autenticación antes de publicarlo.

## Habilitar creación y edición

1. Abre el Sheet y entra en **Extensiones > Apps Script**.
2. Copia [`google-apps-script/Code.gs`](google-apps-script/Code.gs) en el editor.
3. Abre **Configuración del proyecto > Propiedades del script**.
4. Crea `SPREADSHEET_ID` con el ID del documento.
5. Opcionalmente crea `SHEET_NAME` si la pestaña tiene otro nombre.
6. Selecciona **Implementar > Nueva implementación > Aplicación web**.
7. Configura **Ejecutar como: Yo**.
8. Elige el acceso. Una aplicación sin inicio de sesión necesita **Cualquier persona**, pero la URL funciona como una credencial de escritura: no la publiques ni la incluyas en Git.
9. Autoriza el acceso y copia la URL terminada en `/exec` a `VITE_SHEETS_API_URL`.

## Ejecutar y validar

```bash
npm run dev
npm run lint
npm run build
```

En producción, configura las tres variables en el proveedor de hosting. No subas `.env`.

## Seguridad

- `.env`, dependencias y archivos generados están excluidos del repositorio.
- No incluyas IDs privados, URLs de escritura, tokens ni credenciales en el código.
- Quien conozca una URL pública de Apps Script puede invocar el endpoint.
- Para información sensible, añade autenticación y validación de usuarios.
- Rota la implementación de Apps Script si su URL se filtra.

## Tecnologías

React 19, Vite, Lucide React, Google Sheets y Google Apps Script.
