/**
 * Policy Desk – Google Sheet backend
 * ---------------------------------------------------------------
 * 1. Open your Google Sheet → Extensions → Apps Script.
 * 2. Replace everything in Code.gs with this file.
 * 3. Set TOKEN below to a long random secret (the same value goes in
 *    Vercel as GOOGLE_SCRIPT_TOKEN).
 * 4. Deploy → New deployment → type "Web app"
 *      Execute as: Me      Who has access: Anyone
 *    Copy the Web app URL into Vercel as GOOGLE_SCRIPT_URL.
 *
 * The URL is only used by the server, never by the browser, and every
 * request must carry the TOKEN, so the data cannot be read without it.
 */

const TOKEN = 'PASTE-A-LONG-RANDOM-SECRET-HERE';
const SHEET_NAME = 'Policies';
const FIELDS = ['id', 'name', 'phone', 'policyNo', 'date', 'purchase', 'sell', 'profit',
  'issueDate', 'expireDate', 'type', 'insuranceP', 'company', 'createdAt', 'remindedAt'];
const NUMERIC = ['purchase', 'sell', 'profit'];

function out_(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}

function sheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(SHEET_NAME);
  if (!sh) sh = ss.insertSheet(SHEET_NAME);
  if (sh.getLastRow() === 0) {
    sh.appendRow(FIELDS);
    sh.setFrozenRows(1);
    sh.getRange(1, 1, 1, FIELDS.length).setFontWeight('bold');
  }
  // Make sure every field has a column (adds any missing ones at the end).
  const head = headers_(sh);
  const missing = FIELDS.filter(function (f) { return head.indexOf(f) < 0; });
  if (missing.length) sh.getRange(1, head.length + 1, 1, missing.length).setValues([missing]);
  return sh;
}

function headers_(sh) {
  const n = Math.max(sh.getLastColumn(), 1);
  return sh.getRange(1, 1, 1, n).getValues()[0].map(function (h) { return String(h).trim(); });
}

function cell_(v) {
  if (v instanceof Date) return Utilities.formatDate(v, Session.getScriptTimeZone(), 'yyyy-MM-dd');
  return v;
}

function readAll_() {
  const sh = sheet_();
  const values = sh.getDataRange().getValues();
  const head = values.shift().map(String);
  return values
    .filter(function (r) { return r[head.indexOf('id')]; })
    .map(function (r) {
      const o = {};
      head.forEach(function (h, i) { if (h) o[h] = cell_(r[i]); });
      return o;
    });
}

function rowFor_(head, rec) {
  return head.map(function (h) {
    const v = rec[h];
    if (v === undefined || v === null) return '';
    return NUMERIC.indexOf(h) >= 0 ? Number(v) || 0 : String(v);
  });
}

function writeRow_(sh, rowIndex, rec) {
  const head = headers_(sh);
  const range = sh.getRange(rowIndex, 1, 1, head.length);
  // Store text columns as plain text so phone numbers / dates aren't reformatted.
  head.forEach(function (h, i) {
    if (NUMERIC.indexOf(h) < 0) sh.getRange(rowIndex, i + 1).setNumberFormat('@');
  });
  range.setValues([rowFor_(head, rec)]);
}

function findRow_(sh, id) {
  const head = headers_(sh);
  const col = head.indexOf('id') + 1;
  if (!col || sh.getLastRow() < 2) return 0;
  const hit = sh.getRange(2, col, sh.getLastRow() - 1, 1)
    .createTextFinder(String(id)).matchEntireCell(true).findNext();
  return hit ? hit.getRow() : 0;
}

function doGet(e) {
  if (TOKEN && (e.parameter.token || '') !== TOKEN) return out_({ ok: false, error: 'Unauthorized' });
  return out_({ ok: true, data: readAll_() });
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    const b = JSON.parse(e.postData.contents);
    if (TOKEN && b.token !== TOKEN) return out_({ ok: false, error: 'Unauthorized' });
    const sh = sheet_();

    if (b.action === 'add' || b.action === 'update') {
      const row = findRow_(sh, b.record.id);
      writeRow_(sh, row || sh.getLastRow() + 1, b.record);
      return out_({ ok: true });
    }
    if (b.action === 'bulkAdd') {
      (b.records || []).forEach(function (r) {
        if (!findRow_(sh, r.id)) writeRow_(sh, sh.getLastRow() + 1, r);
      });
      return out_({ ok: true });
    }
    if (b.action === 'delete') {
      const row = findRow_(sh, b.id);
      if (row) sh.deleteRow(row);
      return out_({ ok: true });
    }
    return out_({ ok: false, error: 'Unknown action' });
  } catch (err) {
    return out_({ ok: false, error: String(err) });
  } finally {
    lock.releaseLock();
  }
}
