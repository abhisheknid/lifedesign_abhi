/**
 * Life Design · test mailer (Google Apps Script web app)
 *
 * Receives the Life Happiness Test PDF from the website and emails it to you.
 * Deploy: script.google.com → New project → paste this file → Deploy → New deployment
 *         → type "Web app" → Execute as: Me → Who has access: Anyone → Deploy → copy the /exec URL.
 * The recipient is fixed here, so the endpoint can't be used to email anyone else,
 * and requests without the shared token are rejected.
 */
const RECIPIENT = '__RECIPIENT__';
const TOKEN = '__TOKEN__';

function doPost(e) {
  try {
    const d = JSON.parse(e.postData.contents);
    if (d.token !== TOKEN) return json({ ok: false, error: 'unauthorised' });
    const pdf = Utilities.newBlob(Utilities.base64Decode(d.pdf), 'application/pdf',
      String(d.filename || 'life-happiness-analysis.pdf').slice(0, 80));
    MailApp.sendEmail({
      to: RECIPIENT,
      subject: String(d.subject || 'Life Happiness Test').slice(0, 200),
      htmlBody: String(d.html || ''),
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
