const SHEET_NAME = 'הרשמות';
const HEADERS    = ['תאריך', 'שם מלא', 'דוא"ל', 'טלפון', 'סוג משתמש', 'עדכונים שיווקיים'];

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const ss    = SpreadsheetApp.getActiveSpreadsheet();
    let   sheet = ss.getSheetByName(SHEET_NAME);
    if (!sheet) {
      sheet = ss.insertSheet(SHEET_NAME);
      sheet.appendRow(HEADERS);
      sheet.setFrozenRows(1);
    }
    const data = JSON.parse(e.postData.contents);
    sheet.appendRow([
      new Date(),
      data.fullname   || '',
      data.email      || '',
      data.phone      || '',
      data.usertype   || '',
      data.newsletter ? 'כן' : 'לא',
    ]);
    return ContentService
      .createTextOutput(JSON.stringify({ result: 'ok' }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ result: 'error', message: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}
