const SHEET_NAME   = 'הרשמות';
const HEADERS      = ['תאריך', 'שם מלא', 'דוא"ל', 'טלפון', 'סוג משתמש', 'עדכונים שיווקיים'];
const VALID_TYPES  = ['parent', 'slp', 'teacher', 'other'];
const EMAIL_RE     = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/;
const PHONE_RE     = /^(\+972|0)(5[0-9]|[2-9]\d)\d{7}$/;

// Strip leading formula characters to prevent spreadsheet injection
function sanitize(val, maxLen) {
  if (typeof val !== 'string') return '';
  val = val.trim().slice(0, maxLen || 200);
  // Prefix with apostrophe if value would be interpreted as a formula
  if (/^[=+\-@|%]/.test(val)) val = "'" + val;
  return val;
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const data = JSON.parse(e.postData.contents);

    // ── Server-side validation ──────────────────────────────────────────────
    const name     = sanitize(data.fullname, 100);
    const email    = sanitize(data.email, 200);
    const phone    = sanitize((data.phone || '').replace(/[\s\-]/g, ''), 20);
    const usertype = sanitize(data.usertype, 20);

    if (!name || name.length < 2)
      return ok('validation');          // silent – client already validated
    if (!EMAIL_RE.test(email))
      return ok('validation');
    if (phone && !PHONE_RE.test(phone))
      return ok('validation');
    if (!VALID_TYPES.includes(usertype.replace(/^'/, '')))
      return ok('validation');

    // ── Write to sheet ───────────────────────────────────────────────────────
    const ss    = SpreadsheetApp.getActiveSpreadsheet();
    let   sheet = ss.getSheetByName(SHEET_NAME);
    if (!sheet) {
      sheet = ss.insertSheet(SHEET_NAME);
      sheet.appendRow(HEADERS);
      sheet.setFrozenRows(1);
    }
    sheet.appendRow([
      new Date(),
      name,
      email,
      phone,
      usertype,
      data.newsletter ? 'כן' : 'לא',
    ]);

    return ok('ok');
  } catch (_) {
    return ok('error');      // no internal details leaked
  } finally {
    lock.releaseLock();
  }
}

function ok(result) {
  return ContentService
    .createTextOutput(JSON.stringify({ result }))
    .setMimeType(ContentService.MimeType.JSON);
}
