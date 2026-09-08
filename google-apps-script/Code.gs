/**
 * CHIDIEBUBE & MCDANIELS — WEDDING RSVP
 * Phase 3 — Google Apps Script + Google Sheets
 *
 * Required Sheet columns, in this exact order:
 * Timestamp | Guest Name | Partner Name | Email | Phone | Attendance |
 * RSVP Type | Dietary Requirement | Additional Notes | Expected Guests
 */

const CONFIG = {
  SPREADSHEET_ID: 'PASTE_GOOGLE_SHEET_ID_HERE',
  SHEET_NAME: 'RSVPs',
  ORGANISER_EMAIL: 'PASTE_ORGANISER_EMAIL_HERE',
  WEDDING_DATE: '2026-11-13T13:00:00+01:00',
  RSVP_DEADLINE: '2026-10-11T23:59:59+01:00'
};

const MAX_REQUEST_BYTES = 15000;
const MAX_RSVPS_PER_EMAIL_WINDOW = 3;
const RATE_LIMIT_SECONDS = 3600;

const HEADERS = [
  'Timestamp','Guest Name','Partner Name','Email','Phone','Attendance',
  'RSVP Type','Dietary Requirement','Additional Notes','Expected Guests'
];

function doGet() {
  return json_({ success: true, service: 'Wedding RSVP', status: 'online' });
}

function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return json_({ success:false, message:'Invalid request.' });
    }

    const input = JSON.parse(e.postData.contents);
    const data = validateAndNormalise_(input);

    const lock = LockService.getScriptLock();
    lock.waitLock(10000);

    try {
      const sheet = getSheet_();
      ensureHeaders_(sheet);

      if (isDuplicate_(sheet, data.email)) {
        return json_({
          success:false,
          code:'DUPLICATE',
          message:'An RSVP has already been received for this email address.'
        });
      }

      sheet.appendRow([
        new Date(),
        safeCell(data.guestName),
        safeCell(data.partnerName),
        safeCell(data.email),
        safeCell(data.phone),
        safeCell(data.attendance),
        safeCell(data.rsvpType),
        safeCell(data.dietary),
        safeCell(data.notes),
        data.expectedGuests
      ]);

      try {
        sendOrganiserEmail_(data);
      } catch (emailError) {
        console.error('Organiser email failed:', emailError);
      }

      try {
        sendGuestEmail_(data);
      } catch (emailError) {
        console.error('Guest email failed:', emailError);
      }

      return json_({
        success:true,
        message:'Your RSVP has been received. Thank you!'
      });
    } finally {
      lock.releaseLock();
    }
  } catch (error) {
    console.error(error);
    return json_({
      success:false,
      code:'SERVER_ERROR',
      message:'We could not process your RSVP at this time. Please try again later.'
    });
  }
}

function validateAndNormalise_(input) {
  if (!input || typeof input !== 'object') throw new Error('Invalid payload.');

  const guestName = clean_(input.guestName, 150);
  const partnerName = clean_(input.partnerName, 150);
  const email = clean_(input.email, 254).toLowerCase();
  const phone = clean_(input.phone, 50);
  const attendance = clean_(input.attendance, 20).toLowerCase();
  const rsvpType = clean_(input.rsvpType, 20).toLowerCase();
  const dietary = clean_(input.dietary, 200);
  const notes = clean_(input.notes, 1000);

  if (new Date() > new Date(CONFIG.RSVP_DEADLINE)) {
    throw new Error('The RSVP deadline has passed.');
  }

  if (!guestName) throw new Error('Guest name is required.');
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error('A valid email address is required.');
  }
  if (attendance !== 'yes' && attendance !== 'no') {
    throw new Error('Invalid attendance selection.');
  }
  if (rsvpType !== 'individual' && rsvpType !== 'couple') {
    throw new Error('Invalid RSVP type.');
  }
  if (rsvpType === 'couple' && !partnerName) {
    throw new Error('Partner name is required for a couple RSVP.');
  }

  const expectedGuests = attendance === 'no' ? 0 : (rsvpType === 'couple' ? 2 : 1);

  return {
    guestName, partnerName, email, phone,
    attendance: attendance === 'yes' ? 'Attending' : 'Declined',
    rsvpType: rsvpType === 'couple' ? 'Couple' : 'Individual',
    dietary, notes, expectedGuests
  };
}

function getSheet_() {
  const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  const sheet = ss.getSheetByName(CONFIG.SHEET_NAME);
  if (!sheet) throw new Error('RSVPs worksheet not found.');
  return sheet;
}

function ensureHeaders_(sheet) {
  const range = sheet.getRange(1, 1, 1, HEADERS.length);
  const current = range.getValues()[0];
  const matches = HEADERS.every((header, i) => current[i] === header);

  if (!matches) {
    range.setValues([HEADERS]);
    range.setFontWeight('bold');
    sheet.setFrozenRows(1);
    if (sheet.getFilter()) sheet.getFilter().remove();
    range.createFilter();
    sheet.getRange(2,1,sheet.getMaxRows()-1,1).setNumberFormat('dd mmm yyyy, hh:mm:ss');
    sheet.autoResizeColumns(1, HEADERS.length);
  }
}

function isDuplicate_(sheet, email) {
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return false;
  const values = sheet.getRange(2,4,lastRow-1,1).getDisplayValues().flat();
  return values.some(value => String(value).trim().toLowerCase() === email);
}

function sendOrganiserEmail_(data) {
  if (!isConfiguredEmail_(CONFIG.ORGANISER_EMAIL)) return;

  const subject = 'New Wedding RSVP – ' + data.guestName;
  const html = emailShell_(
    'New RSVP received',
    '<p><strong>' + escapeHtml_(data.guestName) + '</strong> has submitted a wedding RSVP.</p>' +
    detailsHtml_(data)
  );
  MailApp.sendEmail({
    to: CONFIG.ORGANISER_EMAIL,
    subject,
    htmlBody: html,
    body: stripHtml_(html)
  });
}

function sendGuestEmail_(data) {
  const subject = 'RSVP Confirmation – Chidiebube & McDaniels';
  const greeting = '<p>Dear ' + escapeHtml_(data.guestName) + ',</p>';
  const body = data.attendance === 'Attending'
    ? '<p>Thank you for confirming your attendance. We look forward to celebrating with you.</p>'
    : '<p>Thank you for letting us know. We are sorry you will be unable to join us and appreciate your response.</p>';

  const html = emailShell_(
    'RSVP Confirmation',
    greeting + body + detailsHtml_(data) +
    '<p>With love,<br>Chidiebube &amp; Mcdaniels</p>'
  );

  MailApp.sendEmail({
    to: data.email,
    subject,
    htmlBody: html,
    body: stripHtml_(html)
  });
}

function detailsHtml_(data) {
  return '<div style="margin:24px 0;padding:18px;border:1px solid #ddd;background:#f8f5ee;">' +
    '<p><strong>Attendance:</strong> ' + escapeHtml_(data.attendance) + '</p>' +
    '<p><strong>RSVP type:</strong> ' + escapeHtml_(data.rsvpType) + '</p>' +
    (data.partnerName ? '<p><strong>Partner:</strong> ' + escapeHtml_(data.partnerName) + '</p>' : '') +
    '<p><strong>Expected guests:</strong> ' + data.expectedGuests + '</p>' +
    '</div>';
}

function emailShell_(title, content) {
  return '<!doctype html><html><body style="margin:0;background:#f4f0e7;color:#173b2b;font-family:Arial,sans-serif;">' +
    '<div style="max-width:620px;margin:30px auto;padding:40px;background:#fffdf8;">' +
    '<p style="font-size:11px;letter-spacing:3px;text-transform:uppercase;">Chidiebube &amp; Mcdaniels</p>' +
    '<h1 style="font-family:Georgia,serif;font-weight:normal;font-size:38px;">' + escapeHtml_(title) + '</h1>' +
    content +
    '<p style="margin-top:35px;font-size:12px;color:#777;">#Chikeziribube</p>' +
    '</div></body></html>';
}

function clean_(value, max) {
  return String(value == null ? '' : value)
    .replace(/[\u0000-\u001F\u007F]/g, ' ')
    .trim()
    .slice(0, max);
}

function escapeHtml_(value) {
  return String(value == null ? '' : value)
    .replace(/&/g,'&amp;').replace(/</g,'&lt;')
    .replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;');
}

function stripHtml_(html) {
  return html.replace(/<[^>]*>/g,' ').replace(/\s+/g,' ').trim();
}

function isConfiguredEmail_(email) {
  return email && email.indexOf('PASTE_') !== 0 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function json_(object) {
  return ContentService
    .createTextOutput(JSON.stringify(object))
    .setMimeType(ContentService.MimeType.JSON);
}
