const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');

const outPath = path.resolve('output/pdf/yatrasathi-app-summary-one-page.pdf');
const doc = new PDFDocument({ size: 'A4', margin: 42 });

doc.pipe(fs.createWriteStream(outPath));

const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
const bulletIndent = 12;
const sectionGap = 8;
let y = doc.page.margins.top;

function heading(text) {
  doc.font('Helvetica-Bold').fontSize(13).fillColor('#0b2239').text(text, doc.page.margins.left, y, {
    width: pageWidth,
    lineGap: 1,
  });
  y = doc.y + 3;
}

function paragraph(text) {
  doc.font('Helvetica').fontSize(9.5).fillColor('#111111').text(text, doc.page.margins.left, y, {
    width: pageWidth,
    lineGap: 1.5,
  });
  y = doc.y + sectionGap;
}

function bullets(items) {
  doc.font('Helvetica').fontSize(9.5).fillColor('#111111');
  items.forEach((item) => {
    doc.text('\u2022', doc.page.margins.left, y, { continued: true });
    doc.text(` ${item}`, doc.page.margins.left + bulletIndent, y, {
      width: pageWidth - bulletIndent,
      lineGap: 1.5,
    });
    y = doc.y + 2;
  });
  y += sectionGap - 2;
}

// Title
heading('YatraSathi: One-Page App Summary');
paragraph('Evidence source: README.md, src/server.js, config/db.js, src/models/index.js, frontend/src/App.jsx, frontend/src/services/api.js, package.json, frontend/package.json.');

heading('What It Is');
paragraph('YatraSathi is a full-stack railway booking and operations platform with customer, employee, and admin portals. The repo shows booking, billing, payments, accounting, reports, and role-protected workflows implemented across a React frontend and an Express plus MySQL backend.');

heading('Who It\'s For');
paragraph('Primary persona: multi-role railway business teams and customers (roles include CUS, employee roles such as EMP/ACC, and ADM) who need booking-to-billing operations in one system.');

heading('What It Does');
bullets([
  'Manages railway bookings, passenger records, PNR links, and booking status flows (create, update, confirm, cancel, delete).',
  'Supports customer, employee, and admin route spaces with authentication and role-gated access in both frontend and backend.',
  'Handles billing, payment allocation, receipts, contra, and journal/accounting endpoints with dedicated route modules.',
  'Provides reporting capabilities, including JESPR-style spreadsheet report components and report APIs.',
  'Maintains master passenger lists and customer self-service pages (bookings, profile, bills/payments).',
  'Includes audit/config/notification/statistics/search/security endpoints for operational oversight.',
]);

heading('How It Works (Repo-Evidenced Architecture)');
bullets([
  'Frontend: React 18 + Vite app (`frontend/src/main.jsx`, `frontend/src/App.jsx`) uses route guards (`ProtectedRoute`, `RoleBasedRoute`) and context providers for auth, booking, payment, reporting, and keyboard navigation.',
  'Client data flow: frontend service layer calls relative `/api` endpoints and attaches bearer token from localStorage (`frontend/src/services/api.js`).',
  'Backend: Express server (`src/server.js`) mounts domain routes (`/api/bookings`, `/api/payments`, `/api/billing`, `/api/accounting`, etc.) plus middleware and error handlers.',
  'Auth and access: JWT verification in `src/middleware/authMiddleware.js`; RBAC checks via `src/middleware/rbacMiddleware.js` and route-level authorization middleware.',
  'Data layer: Sequelize models and associations in `src/models/index.js`; DB connection pools and sync logic in `config/db.js` against MySQL (`DB_NAME_TVL` / `TVL_001`).',
]);

heading('How To Run (Minimal)');
bullets([
  'Install dependencies: `npm install` (root), then `cd frontend && npm install`.',
  'Create root `.env` with DB and auth values used by backend (`DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `DB_NAME_TVL`, `JWT_SECRET`, `PORT`).',
  'Initialize DB schema/data: `npm run setup-mysql` (optional seed: `npm run seed`).',
  'Run backend: `npm run dev` from repo root.',
  'Run frontend: `cd frontend && npm run dev` in a second terminal.',
  '`.env.example` template: Not found in repo.',
]);

// Final check marker for overflow awareness
if (y > doc.page.height - doc.page.margins.bottom) {
  doc.font('Helvetica-Bold').fontSize(9).fillColor('red').text('Layout warning: content exceeded one page.', doc.page.margins.left, doc.page.height - doc.page.margins.bottom - 12);
}

doc.end();
