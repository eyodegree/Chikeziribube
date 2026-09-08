# Phase 3 — Google Sheets + Apps Script

## 1. Create the spreadsheet

Recommended name:

`Chidiebube & Mcdaniels Wedding RSVPs`

Create one worksheet named exactly:

`RSVPs`

Put these headers in row 1, in this exact order:

`Timestamp | Guest Name | Partner Name | Email | Phone | Attendance | RSVP Type | Dietary Requirement | Additional Notes | Expected Guests`

Freeze row 1 and enable a filter.

## 2. Get the Spreadsheet ID

Open the spreadsheet. The ID is the value between `/d/` and `/edit` in the Google Sheets URL.

Example:

`https://docs.google.com/spreadsheets/d/THIS_IS_THE_ID/edit`

Do not put the spreadsheet URL into the website. Only the Apps Script needs the ID.

## 3. Create the Apps Script

In Google Sheets:

Extensions → Apps Script

Replace the default code with the complete code in `google-apps-script/Code.gs`.

Change only:

- `SPREADSHEET_ID`
- `ORGANISER_EMAIL`

The following are already configured:

- `SHEET_NAME = RSVPs`
- `WEDDING_DATE = 2026-11-13T13:00:00+01:00`
- `RSVP_DEADLINE = 2026-10-11T23:59:59+01:00`

## 4. Authorise the script

Run `doGet` once from the Apps Script editor.

Google will request permissions for:

- Google Sheets access
- Sending email

Review and authorise the permissions.

## 5. Deploy as a Web App

Apps Script → Deploy → New deployment

Select:

`Web app`

Use:

- Execute as: **Me**
- Who has access: **Anyone**

The exact access options shown can vary by Google account/workspace policy. The website needs an endpoint that accepts unauthenticated POST requests.

Deploy and copy the Web App URL.

## 6. Add the Web App URL to the website

Open:

`script.js`

Find:

`const GOOGLE_APPS_SCRIPT_URL = "";`

Paste the deployed Web App URL between the quotes.

Do NOT paste the Google Sheet URL.

## 7. Test

Before considering Phase 3 production-ready, test:

1. Valid individual RSVP
2. Valid couple RSVP
3. Declined RSVP
4. Invalid email
5. Missing guest name
6. Couple without partner name
7. Duplicate email
8. RSVP after October 11, 2026
9. Google Apps Script unavailable
10. Email failure

Confirm the valid submission appears in the private `RSVPs` worksheet.

Confirm the organiser email and guest confirmation email work.

## Important Phase 3 limitation

The actual deployment requires manual configuration in the website owner's Google account:

- Google Sheet creation
- Spreadsheet ID
- Organiser email
- Apps Script authorisation
- Apps Script deployment
- Web App URL

The website intentionally refuses to report a successful production RSVP until the Web App URL has been configured and the Apps Script returns a successful response.

No guest records are stored in the browser.
