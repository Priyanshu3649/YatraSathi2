# Booking System Accessibility, Submit Button, and Sessional Database Fix

This document outlines the changes, architectural decisions, and verification steps implemented to resolve critical usability, accessibility, and database routing issues in the YatraSathi booking workflow.

## Table of Contents
1. [Overview](#1-overview)
2. [Root Causes & Targeted Solutions](#2-root-causes--targeted-solutions)
   - [Usability: Hidden Submit Booking Button](#usability-hidden-submit-booking-button)
   - [Accessibility: Broken Sequential Tab Navigation](#accessibility-broken-sequential-tab-navigation)
   - [Data Fetching: Empty 'My Bookings' Dashboard](#data-fetching-empty-my-bookings-dashboard)
   - [Session Management: Missing User Phone Number at Booking Creation](#session-management-missing-user-phone-number-at-booking-creation)
3. [Summary of Modified Files](#3-summary-of-modified-files)
4. [Testing & Verification](#4-testing--verification)

---

## 1. Overview

The customer portal's booking workflow suffered from three critical roadblocks:
1. **Broken UI Elements:** The final submit button in Step 3 (Review & Submit) of the "New Booking" wizard was visually hidden due to nesting-specific style definitions.
2. **WCAG Compliance Violations:** Sequential keyboard navigation was broken due to hardcoded, disjointed `tabIndex` parameters that interfered with active steps.
3. **Database & Cache Mismatch:** Successfully created customer bookings were silently invisible under the "My Bookings" page because they were saved in the master TVL database instead of the switching sessional database.

---

## 2. Root Causes & Targeted Solutions

### Usability: Hidden Submit Booking Button
- **Issue:** The button in the final review step was styled with `.btn-primary` but existed inside a `.submit-section` instead of `.form-actions`. Because of this, it inherited no padding, borders, or colors, rendering as an invisible default browser button.
- **Solution:** Designed and implemented a standalone CSS class `.submit-booking-btn` with premium IRCTC-style gradient backgrounds (`linear-gradient(135deg, #ff6b35 0%, #e55a2b 100%)`), micro-animations (hover scaling, active pressing), and high contrast colors. Also implemented an in-page confirmation screen with a success tick, booking reference display, and quick navigation actions to replace raw redirects.

### Accessibility: Broken Sequential Tab Navigation
- **Issue:** Static, manual `tabIndex={1}`, `tabIndex={2}`, etc. were hardcoded across inputs. Since Step 1, Step 2, and Step 3 shared overlapping tab indices, keyboard focus would jump to invisible fields in non-active steps.
- **Solution:** 
  - Removed all explicit `tabIndex` properties, allowing elements to receive focus naturally in DOM sequence order.
  - Implemented programmatic focus shifts: upon step transitions, focus is automatically directed to the first relevant field (e.g. the first passenger card input in Step 2, the primary Submit button in Step 3).
  - Configured WCAG 2.1 AA focus-ring styles via the CSS `:focus-visible` selector, adding high-contrast outlines and shadows.
  - Added a screen-reader-only skip-navigation link (`.skip-link`) for immediate layout bypassing.

### Data Fetching: Empty 'My Bookings' Dashboard
- **Issue:** The client fetched from `/api/bookings/my-bookings` and attempted to read `data.data.bookings || []`. However, the API returns a paginated structure where `data.data` is the array directly. Additionally, the backend was instantiating database transactions using `sequelizeTVL` (hardcoded to the master `YATRASATHI_MASTER` schema), thereby bypassing database context switching, whereas customer lists were queried using the database-switching `sequelize` instance pointing to sessional schemas (like `TVL_2024_25`).
- **Solution:**
  - Modified `MyBookings.jsx` to defensively parse three common response formats: `data.data` as array, `data.data.bookings` as object array, and `data.data.rows` as raw paginated rows.
  - Corrected `bookingController.js` to initialize transactions on `sequelize` (switching instance) rather than `sequelizeTVL`.
  - Migrated existing draft records from `YATRASATHI_MASTER` to `TVL_2024_25` tables (`bkXbooking` & `psXpassenger`) using a database synchronizer utility.

### Session Management: Missing User Phone Number at Booking Creation
- **Issue:** When the customer registered or logged in, the auth response returned user attributes without `us_phone`. If profile fetching failed (e.g., 403 authorization limits), the phone remained undefined. Thus, the client sent empty values, causing backend validations to fail.
- **Solution:**
  - Configured `authController.js` to return `us_phone` and `us_lname` at login.
  - Modified frontend `Login.jsx` to map and persist those fields into state and `localStorage`.
  - Added backend fallback logic: if `phoneNumber` is omitted or empty, the controller resolves it from the logged-in user context or queries the user table directly before failing.

---

## 3. Summary of Modified Files

### Backend
1. **[src/controllers/authController.js](file:///Users/priyanshu/Library/Mobile%20Documents/com~apple~CloudDocs/Desktop/YatraSathi/src/controllers/authController.js)**
   - Included `us_phone` and `us_lname` inside the login endpoint payload.
2. **[src/controllers/bookingController.js](file:///Users/priyanshu/Library/Mobile%20Documents/com~apple~CloudDocs/Desktop/YatraSathi/src/controllers/bookingController.js)**
   - Replaced static `sequelizeTVL` imports with dynamic, switching `sequelize` instances.
   - Refactored `createBooking` to resolve blank phone numbers and names from authenticated request user context.
   - Replaced `sequelizeTVL.query` inside billing confirmation with `sequelize.query` for sessional database consistency.

### Frontend
1. **[frontend/src/pages/Login.jsx](file:///Users/priyanshu/Library/Mobile%20Documents/com~apple~CloudDocs/Desktop/YatraSathi/frontend/src/pages/Login.jsx)**
   - Parsed user phone number during initial auth session setting.
2. **[frontend/src/components/Customer/BookingForm.jsx](file:///Users/priyanshu/Library/Mobile%20Documents/com~apple~CloudDocs/Desktop/YatraSathi/frontend/src/components/Customer/BookingForm.jsx)**
   - Replaced tabIndex properties with step-based sequential navigation.
   - Designed a post-submit confirmation screen.
   - Integrated screen-reader aids (`aria-describedby`, `aria-busy`, `role="region"`).
3. **[frontend/src/pages/MyBookings.jsx](file:///Users/priyanshu/Library/Mobile%20Documents/com~apple~CloudDocs/Desktop/YatraSathi/frontend/src/pages/MyBookings.jsx)**
   - Fixed data array resolution from `data.data.bookings` to `data.data`.
4. **[frontend/src/styles/booking-form.css](file:///Users/priyanshu/Library/Mobile%20Documents/com~apple~CloudDocs/Desktop/YatraSathi/frontend/src/styles/booking-form.css)**
   - Added styles for confirmation screens, spinners, focus outlines, and skip links.

---

## 4. Testing & Verification

### Unit & Integration Testing
We added a Jest-based mock test suite located at **[tests/customerBookingFetch.test.js](file:///Users/priyanshu/Library/Mobile%20Documents/com~apple~CloudDocs/Desktop/YatraSathi/tests/customerBookingFetch.test.js)** to validate:
- Pagination and pagination helper integration.
- Station name and passenger count resolution in the API response.
- Status filters (filtering out inactive records).
- 500 error boundary outputs.

Run tests using:
```bash
npm test tests/customerBookingFetch.test.js
```
*Result: All 3 tests passed successfully.*
