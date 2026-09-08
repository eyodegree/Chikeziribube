# Chidiebube & Mcdaniels — Wedding Website
## Phase 2 — RSVP Form Logic

Phase 1 frontend remains intact. Phase 2 adds client-side RSVP behaviour for testing only.

### Implemented
- Required guest name
- Email validation
- Attendance selection
- Individual/couple selection
- Conditional required partner name
- Dietary requirement field
- Consent checkbox validation
- Loading state
- Error state
- Validation success state clearly labelled as TEST ONLY
- RSVP deadline validation: October 11, 2026
- Expected guest calculation: Individual=1, Couple=2, Declined=0
- Duplicate detection using an in-memory Set for the current browser session only
- Input normalisation

### Important
No RSVP data is sent, persisted, or stored anywhere in Phase 2. There is no LocalStorage, cookie, IndexedDB, database, Google Sheet, or external API integration. A successful test only means the form passed local validation.

### Phase 2 status
PASSED for local form behaviour. Production submission is intentionally not enabled.

### Next
Phase 3: Google Apps Script Web App → Google Sheets integration. This requires the owner to create/configure the Google Sheet and Apps Script deployment values before a real submission can occur.


## Phase 4
Final pre-launch polish: live Google Maps link, Add to Calendar link, production RSVP status copy, accessible live status messaging, mobile refinements, and final visual/interaction QA preparation.


## Phase 5 — Security & Data Privacy

Implemented basic protections appropriate for this wedding RSVP site:
- Server-side validation remains authoritative.
- RSVP deadline is enforced server-side (October 11, 2026).
- Duplicate email protection prevents repeat RSVPs.
- Request-size limit reduces oversized payload abuse.
- Honeypot field blocks common automated spam submissions.
- User-controlled values are escaped in confirmation emails.
- Spreadsheet formula-injection protection is applied before writing text to Google Sheets.
- No RSVP records are stored in browser storage.
- The Google Sheet is not exposed to the website.
- Consent is explicitly collected for RSVP administration.

### Phase 5 status
IMPLEMENTED. Final end-to-end testing remains Phase 6.
