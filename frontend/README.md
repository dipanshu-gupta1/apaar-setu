# APAAR Student Data Management Portal — Frontend

A React + TypeScript + Vite frontend prototype for SIH26263. All records and activity shown in the UI are synthetic demo data. The frontend does not connect to real APAAR, AICTE, institutional systems, or a production database.

## Requirements

- Node.js 20.19+ or 22.12+ (a current LTS release is recommended)
- npm

## Run locally (Windows PowerShell or terminal)

```powershell
cd frontend
npm install
npm run dev
```

Open the local URL printed by Vite (normally `http://localhost:5173`).

## Checks

```powershell
npm run build
npm run lint
```

## Included screens

- Dashboard with synthetic statistics and activity
- Student directory with search, status filter and pagination
- Student detail and masked APAAR ID
- Verification queue with demo decisions
- Correction request submission and review
- Notifications with read/unread state
- Data quality review list
- Institution directory
- CSV exports and verification summary
- Audit history sample
- Rule-based advisory insights (not a trained AI model)
- Role switcher and light/dark theme

## Important notes

- The demo role switcher is for presentation only. It is not authentication or authorization.
- All student names, identifiers, events, counts and institution records are illustrative.
- APAAR IDs are masked in the UI; do not add real personal data to this demo.
- Frontend-only changes are held in browser memory/session storage. Connect the API and enforce all permissions on the backend before real use.
