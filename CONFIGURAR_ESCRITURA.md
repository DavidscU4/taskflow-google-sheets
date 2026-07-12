# Habilitar creación y edición en Google Sheets

La aplicación ya contiene los formularios y el servicio que escribe las nueve columnas del Sheet. Solo hay que autorizar el servicio una vez:

1. Abre el Sheet y entra en **Extensiones > Apps Script**.
2. Reemplaza el contenido de `Code.gs` con el archivo `google-apps-script/Code.gs` de este proyecto.
3. En **Configuración del proyecto > Propiedades del script**, agrega `SPREADSHEET_ID` con el ID del Sheet y, opcionalmente, `SHEET_NAME`.
4. Pulsa **Implementar > Nueva implementación** y selecciona **Aplicación web**.
5. Configura **Ejecutar como: Yo** y el acceso según quién utilizará la aplicación.
6. Autoriza el acceso al Sheet y copia la URL terminada en `/exec`.
7. Crea un archivo `.env` copiando `.env.example` y configura el ID, nombre de pestaña y URL de escritura.
8. Reinicia la aplicación.

No compartas la URL de escritura públicamente. El servicio solo permite crear o actualizar filas de la pestaña `Seguimiento de Tareas`.
