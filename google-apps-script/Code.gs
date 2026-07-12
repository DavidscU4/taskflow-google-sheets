const PROPERTIES = PropertiesService.getScriptProperties();
const SPREADSHEET_ID = PROPERTIES.getProperty('SPREADSHEET_ID');
const SHEET_NAME = PROPERTIES.getProperty('SHEET_NAME') || 'Seguimiento de Tareas';

function doGet() {
  return jsonResponse({ ok: true, configured: Boolean(SPREADSHEET_ID), service: 'Taskflow Sheets API' });
}

function doPost(event) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
    if (!SPREADSHEET_ID) throw new Error('Configura SPREADSHEET_ID en las propiedades del script');
    const data = JSON.parse(event.postData.contents || '{}');
    const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET_NAME);
    if (!sheet) throw new Error('No se encontró la hoja "' + SHEET_NAME + '"');

    const values = [[
      required(data.project, 'Proyecto'),
      required(data.entity, 'Entidad'),
      required(data.module, 'Módulo'),
      required(data.description, 'Descripción'),
      clean(data.startDate),
      clean(data.dueDate),
      clean(data.endDate),
      required(data.status, 'Estado'),
      clean(data.notes),
    ]];

    if (data.action === 'update') {
      const row = Number(data.rowNumber);
      if (!Number.isInteger(row) || row < 2 || row > sheet.getLastRow()) throw new Error('La fila indicada no es válida');
      sheet.getRange(row, 1, 1, values[0].length).setValues(values);
      return jsonResponse({ ok: true, action: 'update', rowNumber: row });
    }

    sheet.getRange(sheet.getLastRow() + 1, 1, 1, values[0].length).setValues(values);
    return jsonResponse({ ok: true, action: 'create', rowNumber: sheet.getLastRow() });
  } catch (error) {
    return jsonResponse({ ok: false, error: error.message });
  } finally {
    lock.releaseLock();
  }
}

function required(value, label) {
  const result = clean(value);
  if (!result) throw new Error(label + ' es obligatorio');
  return result;
}

function clean(value) {
  return String(value == null ? '' : value).trim();
}

function jsonResponse(payload) {
  return ContentService.createTextOutput(JSON.stringify(payload)).setMimeType(ContentService.MimeType.JSON);
}
