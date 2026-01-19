# Keyboard Navigation Implementation Plan

## 🎯 OBJECTIVE
Implement a fully keyboard-operable application where mouse usage is optional at every point, with desktop-style enterprise transaction screen behavior.

## 📋 IMPLEMENTATION TASK LIST (Chronological Order)

### PHASE 1: FOUNDATION & CORE INFRASTRUCTURE

#### Task 1.1: Create Global Keyboard Navigation Context
- [ ] Create `frontend/src/contexts/KeyboardNavigationContext.jsx`
- [ ] Implement global state management for:
  - `isNewMode` - Form is in new record mode
  - `isPassengerLoopActive` - Passenger entry loop is active
  - `lastTabTimestamp` - Track double-tab detection
  - `currentFocusedField` - Track current field
  - `formState` - Track form completion state
- [ ] Provide global keyboard event handlers
- [ ] Implement focus trap functionality

#### Task 1.2: Create Keyboard Navigation Hook
- [ ] Create `frontend/src/hooks/useKeyboardNavigation.js`
- [ ] Implement core functions:
  - `setFocusOrder(fields)` - Define tab order
  - `handleTabNavigation(event, currentField)` - Handle tab logic
  - `handleEnterKey(event, currentField)` - Handle enter actions
  - `handleEscapeKey(event)` - Handle escape actions
  - `trapFocus(containerRef)` - Prevent focus escape
  - `detectDoubleTab()` - Detect double-tab for loop exit

#### Task 1.3: Create Focus Management Utilities
- [ ] Create `frontend/src/utils/focusManager.js`
- [ ] Implement functions:
  - `setInitialFocus(formRef)` - Set focus on page load
  - `moveFocusToField(fieldName)` - Programmatic focus movement
  - `getFocusableElements(container)` - Get all focusable elements
  - `createFocusOrder(businessLogicOrder)` - Override DOM order
  - `preventFocusEscape(event)` - Prevent browser focus escape

### PHASE 2: PASSENGER ENTRY SYSTEM (CRITICAL)

#### Task 2.1: Create Passenger Entry Hook
- [ ] Create `frontend/src/hooks/usePassengerEntry.js`
- [ ] Implement passenger loop logic:
  - `passengerFields` - Define field order (Name → Age → Gender → Berth)
  - `currentPassenger` - Current passenger data buffer
  - `passengerList` - Array of saved passengers
  - `isInPassengerLoop` - Loop state flag
  - `handlePassengerTab()` - Handle tab in passenger section
  - `saveCurrentPassenger()` - Auto-save passenger
  - `clearPassengerFields()` - Reset input fields
  - `exitPassengerLoop()` - Exit conditions logic

#### Task 2.2: Implement Passenger Auto-Save Logic
- [ ] Create passenger validation function
- [ ] Implement auto-save on tab from last field
- [ ] Add passenger to grid immediately
- [ ] Clear input fields after save
- [ ] Return focus to first passenger field
- [ ] Handle validation errors with focus management

#### Task 2.3: Implement Passenger Loop Exit Conditions
- [ ] Detect double-tab on empty fields
- [ ] Detect tab on empty last field
- [ ] Move focus to next section after passenger loop
- [ ] Update passenger count in real-time
- [ ] Maintain grid state consistency

### PHASE 3: FORM-LEVEL SAVE SYSTEM

#### Task 3.1: Create Save Confirmation Modal
- [ ] Create `frontend/src/components/common/SaveConfirmationModal.jsx`
- [ ] Implement modal with:
  - "You have reached the end of the form. Save this record?"
  - ENTER → Save record
  - ESC → Cancel and stay on page
  - TAB → Cycle inside popup buttons only
- [ ] Trap focus within modal
- [ ] Handle keyboard navigation inside modal

#### Task 3.2: Implement Last Field Detection
- [ ] Create logic to detect last focusable field
- [ ] Trigger save confirmation on tab from last field
- [ ] Prevent default focus loss
- [ ] Handle post-save focus management
- [ ] Implement success message display

#### Task 3.3: Implement Post-Save Behavior
- [ ] Move focus to first field (new entry mode)
- [ ] Or move to next logical workflow step
- [ ] Show non-blocking success message
- [ ] Reset form state appropriately
- [ ] Update form mode flags

### PHASE 4: BOOKINGS PAGE IMPLEMENTATION

#### Task 4.1: Update Bookings Page Structure
- [ ] Modify `frontend/src/pages/Bookings.jsx`
- [ ] Implement NEW operation mode by default
- [ ] Set automatic focus on page load
- [ ] Define business-logic tab order
- [ ] Integrate passenger entry system

#### Task 4.2: Implement Booking Form Fields
- [ ] Define field order: Booking Date → Customer ID → Travel Details
- [ ] Implement keyboard navigation between sections
- [ ] Add passenger entry section with loop behavior
- [ ] Implement form completion save trigger
- [ ] Handle validation with keyboard-friendly feedback

#### Task 4.3: Integrate Customer Lookup
- [ ] Make customer lookup keyboard-navigable
- [ ] Support arrow keys for dropdown navigation
- [ ] ENTER to select, ESC to close
- [ ] Auto-focus next field after selection
- [ ] Handle search with keyboard input

### PHASE 5: BILLING INTEGRATION

#### Task 5.1: Implement Booking-to-Billing Flow
- [ ] Create keyboard action menu for existing bookings
- [ ] ENTER on booking record opens action menu
- [ ] Arrow keys navigate menu options
- [ ] "Generate Billing" option available
- [ ] Seamless transition to billing screen

#### Task 5.2: Update Billing Page
- [ ] Modify `frontend/src/pages/Billing.jsx`
- [ ] Auto-load booking details when coming from booking
- [ ] Set focus on first editable billing field
- [ ] Implement keyboard navigation for billing fields
- [ ] Prevent duplicate data entry

### PHASE 6: GLOBAL KEYBOARD STANDARDS

#### Task 6.1: Implement Dropdown/Autocomplete Standards
- [ ] Arrow keys (↑ ↓) for navigation
- [ ] ENTER to select
- [ ] ESC to close
- [ ] Type-ahead search support
- [ ] Keyboard-accessible for all dropdowns

#### Task 6.2: Implement Button Standards
- [ ] ENTER → Primary action
- [ ] ESC → Cancel/Close
- [ ] Space bar → Activate button
- [ ] Focus indicators for all buttons
- [ ] Keyboard navigation between buttons

#### Task 6.3: Implement Focus Trap System
- [ ] Prevent TAB from escaping to browser
- [ ] Prevent focus jumping to URL bar
- [ ] Trap focus within active forms
- [ ] Trap focus within open modals
- [ ] Trap focus within popup confirmations

### PHASE 7: VALIDATION & ERROR HANDLING

#### Task 7.1: Keyboard-Friendly Validation
- [ ] Announce validation errors immediately
- [ ] Auto-focus invalid fields
- [ ] Dismissible via keyboard (ESC)
- [ ] No mouse click required to resolve
- [ ] Screen reader compatible messages

#### Task 7.2: Error Recovery System
- [ ] Maintain form state during errors
- [ ] Return focus to appropriate field
- [ ] Provide clear error messages
- [ ] Allow keyboard-only error resolution
- [ ] Preserve user input during validation

### PHASE 8: CUSTOMER PORTAL IMPLEMENTATION

#### Task 8.1: Update Customer Booking Form
- [ ] Apply same keyboard navigation to customer portal
- [ ] Implement passenger entry loop for customers
- [ ] Customer-specific field order and validation
- [ ] Consistent behavior across all portals

#### Task 8.2: Update Customer Dashboard
- [ ] Keyboard navigation for booking list
- [ ] Action menus for existing bookings
- [ ] Consistent keyboard shortcuts
- [ ] Focus management for customer workflows

### PHASE 9: EMPLOYEE & ADMIN PORTALS

#### Task 9.1: Update Employee Dashboard
- [ ] Apply keyboard navigation standards
- [ ] Role-specific keyboard shortcuts
- [ ] Consistent behavior across employee functions
- [ ] Focus management for employee workflows

#### Task 9.2: Update Admin Panel
- [ ] Keyboard navigation for admin functions
- [ ] Consistent behavior with other portals
- [ ] Admin-specific keyboard shortcuts
- [ ] Focus management for admin workflows

### PHASE 10: TESTING & VALIDATION

#### Task 10.1: Create Keyboard Navigation Tests
- [ ] Create `test-keyboard-navigation.js`
- [ ] Test passenger entry loop behavior
- [ ] Test double-tab exit conditions
- [ ] Test save confirmation flow
- [ ] Test focus management

#### Task 10.2: Cross-Portal Testing
- [ ] Test consistency across Admin portal
- [ ] Test consistency across Employee portal
- [ ] Test consistency across Customer portal
- [ ] Verify no mouse dependency anywhere

#### Task 10.3: Edge Case Testing
- [ ] Test with screen readers
- [ ] Test rapid keyboard input
- [ ] Test error scenarios
- [ ] Test browser compatibility
- [ ] Test focus trap edge cases

## 🎯 SUCCESS CRITERIA

### Primary Goals
- [ ] Operator never touches mouse
- [ ] Operator never wonders "what happened?"
- [ ] Operator can enter 20+ passengers rapidly
- [ ] Zero unnecessary keystrokes
- [ ] Consistent behavior across all portals

### Technical Requirements
- [ ] TAB acts as navigation, commit action, and section-exit trigger
- [ ] Explicit focus management implemented
- [ ] State flags properly maintained
- [ ] No reliance on default browser tabbing
- [ ] Desktop-style enterprise transaction behavior

### User Experience Requirements
- [ ] Forms start in NEW operation mode by default
- [ ] Focus is automatically set on page load
- [ ] Passenger entry works as a looped data-entry grid
- [ ] Save confirmations are keyboard-accessible
- [ ] All validation is keyboard-friendly

## 📝 IMPLEMENTATION NOTES

### Critical Points
1. **TAB is not just navigation** - it's a commit action in passenger entry
2. **Focus must be programmatically controlled** - don't rely on browser defaults
3. **Passenger section is a loop** - not a traditional form
4. **Double-tab detection** - critical for loop exit
5. **Save confirmation** - must be keyboard-only accessible

### Architecture Decisions
- Use React Context for global keyboard state
- Custom hooks for specific keyboard behaviors
- Focus management utilities for consistent behavior
- Modal system for save confirmations
- State flags for operation modes

### Testing Strategy
- Automated tests for keyboard flows
- Manual testing with keyboard-only operation
- Screen reader compatibility testing
- Cross-browser keyboard behavior testing
- Performance testing for rapid input scenarios

## 🚀 IMPLEMENTATION ORDER

Execute tasks in the exact order listed above. Each phase builds upon the previous one, and the passenger entry system (Phase 2) is the most critical component that must be implemented exactly as specified.

The implementation must treat the application as a desktop-style enterprise transaction screen, not a web form, with keyboard-first operation as the primary interaction method.