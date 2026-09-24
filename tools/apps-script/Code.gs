/**
 * Life Design · test mailer + log (Google Apps Script web app)
 *
 * On each Life Happiness Test submission from the website it:
 *   1. saves the PDF analysis to your Drive folder,
 *   2. appends a summary row (scores, index, Odyssey totals, tripwires, PDF link) to the log Sheet,
 *   3. emails you the PDF.
 * Deploy: script.google.com → New project → paste this file → Deploy → New deployment
 *         → "Web app" → Execute as: Me → Who has access: Anyone → Deploy → copy the /exec URL.
 * Recipient, Sheet and folder are fixed here and requests without the token are rejected,
 * so the endpoint can't be used for anything else.
 */
const RECIPIENT = '__RECIPIENT__';
const TOKEN = '__TOKEN__';
const SHEET_ID = '__SHEET_ID__';
const FOLDER_ID = '__FOLDER_ID__';
const HEADER = ['Submitted at','Happiness index','Band','Sprint contract','Check-in list','Kian','Shruti and home','Health','Prayer',
  'Wealth protection','Financial floor','Hats','Creating and adventure','Odyssey A Delhi /25','Odyssey B London+Delhi /25','Odyssey C US /25',
  'Dream is for','Freedom Floor (Rs)','Runway (months)','Protections in place /7','2x overdue people','Tripwires fired',
  'Start','Stop','Continue','Top action','PDF','Answers (JSON)'];

function doPost(e) {
  try {
    const d = JSON.parse(e.postData.contents);
    if (d.token !== TOKEN) return json({ ok: false, error: 'unauthorised' });
    const name = String(d.filename || 'life-happiness-analysis.pdf').slice(0, 80);
    const pdf = Utilities.newBlob(Utilities.base64Decode(d.pdf), 'application/pdf', name);

    let pdfUrl = '';
    try { pdfUrl = DriveApp.getFolderById(FOLDER_ID).createFile(pdf).getUrl(); } catch (err) { pdfUrl = 'Drive save failed: ' + err; }

    try {
      const sh = SpreadsheetApp.openById(SHEET_ID).getSheets()[0];
      if (sh.getLastRow() === 0 || sh.getRange(1, 1).getValue() !== HEADER[0]) sh.insertRowBefore(1), sh.getRange(1, 1, 1, HEADER.length).setValues([HEADER]).setFontWeight('bold');
      const row = Array.isArray(d.row) ? d.row : [];
      sh.appendRow([new Date()].concat(row, [pdfUrl, JSON.stringify(d.answers || {}).slice(0, 49000)]));
    } catch (err) { /* logging is best-effort; still send the email */ }

    MailApp.sendEmail({
      to: RECIPIENT,
      subject: String(d.subject || 'Life Happiness Test').slice(0, 200),
      htmlBody: String(d.html || '') + (pdfUrl.indexOf('http') === 0 ? '<p style="font-size:13px;color:#7A7468">Saved to Drive: <a href="' + pdfUrl + '">PDF</a> · <a href="https://docs.google.com/spreadsheets/d/' + SHEET_ID + '">history sheet</a></p>' : ''),
      body: String(d.text || ''),
      attachments: [pdf],
      name: 'Life Design for Abhi'
    });
    return json({ ok: true });
  } catch (err) {
    return json({ ok: false, error: String(err) });
  }
}

function doGet() { return json({ ok: true, service: 'life-design-mailer' }); }

function json(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}
