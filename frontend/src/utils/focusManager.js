// Focus Management Utilities
// Provides utilities for managing focus in keyboard-first applications

/**
 * Enhanced Focus Manager Class for Complex Form Navigation
 * Implements WCAG 2.1 AA compliant focus management with manual focus tracking
 */
export class EnhancedFocusManager {
  constructor() {
    this.fieldOrder = [];
    this.currentFieldIndex = -1;
    this.manualFocusOverride = false;
    this.passengerEntryContext = {
      isActive: false,
      currentPassengerIndex: 0,
      passengerFieldIndex: 0
    };
    this.focusHistory = [];
    this.maxHistorySize = 10;
    this.performanceMetrics = {
      startTime: performance.now(),
      focusOperations: 0
    };
    // Define passenger fields sequence
    this.passengerFields = ['passenger_name', 'passenger_age', 'passenger_gender', 'passenger_berth'];
  }

  // Initialize field order for the booking form
  initializeFieldOrder(fieldOrder) {
    this.fieldOrder = fieldOrder;
    this.currentFieldIndex = 0;
    console.log('🎯 Focus manager initialized with field order:', fieldOrder);
  }

  // Track manual focus changes (mouse clicks, programmatic focus)
  trackManualFocus(fieldName) {
    const startTime = performance.now();
    
    // Check if it's a main field
    const fieldIndex = this.fieldOrder.indexOf(fieldName);
    if (fieldIndex !== -1) {
      this.currentFieldIndex = fieldIndex;
      this.manualFocusOverride = true;
      
      // IMPORTANT: If clicking a main field, we should exit passenger mode
      // unless the field is part of the passenger entry context
      if (this.passengerEntryContext.isActive) {
        this.exitPassengerMode();
      }
      
      this.addToHistory(fieldName, 'manual');
      console.log(`🎯 Manual focus tracked: ${fieldName} (index: ${fieldIndex})`);
    } else {
      // Check if it's a passenger field
      const passengerIndex = this.passengerFields.indexOf(fieldName);
      
      if (passengerIndex !== -1) {
        // If it is a passenger field, ensure we are in passenger mode
        if (!this.passengerEntryContext.isActive) {
          this.enterPassengerMode();
        }
        
        this.passengerEntryContext.passengerFieldIndex = passengerIndex;
        this.addToHistory(fieldName, 'manual_passenger');
        console.log(`🎯 Manual passenger focus tracked: ${fieldName} (p-index: ${passengerIndex})`);
      }
    }
    
    this.performanceMetrics.focusOperations++;
    const endTime = performance.now();
    if (endTime - startTime > 5) {
      console.warn(`Focus tracking took ${endTime - startTime}ms - performance threshold exceeded`);
    }
  }

  // Get the next field in logical sequence (regardless of manual focus)
  getNextField() {
    if (this.passengerEntryContext.isActive) {
      return this.getNextPassengerField();
    }

    const nextIndex = this.currentFieldIndex + 1;
    if (nextIndex < this.fieldOrder.length) {
      return this.fieldOrder[nextIndex];
    }
    return null; // End of form
  }

  // Get the previous field in logical sequence
  getPreviousField() {
    if (this.passengerEntryContext.isActive) {
      return this.getPreviousPassengerField();
    }

    const prevIndex = this.currentFieldIndex - 1;
    if (prevIndex >= 0) {
      return this.fieldOrder[prevIndex];
    }
    return null; // Beginning of form
  }

  // Handle Tab key navigation with manual focus correction
  handleTabNavigation(direction = 'forward') {
    const targetField = direction === 'forward' ? this.getNextField() : this.getPreviousField();
    
    if (targetField) {
      this.focusField(targetField);
      this.manualFocusOverride = false;
      return true;
    }
    return false;
  }

  // Focus a specific field and update tracking
  focusField(fieldName) {
    const element = this.getFieldElement(fieldName);
    if (element && this.isElementFocusable(element)) {
      element.focus();
      const fieldIndex = this.fieldOrder.indexOf(fieldName);
      if (fieldIndex !== -1) {
        this.currentFieldIndex = fieldIndex;
      }
      this.addToHistory(fieldName, 'programmatic');
      this.announceToScreenReader(`Focused on ${this.getFieldLabel(fieldName) || fieldName}`);
      console.log(`✅ Focused field: ${fieldName}`);
      return true;
    }
    console.warn(`❌ Field not found or not focusable: ${fieldName}`);
    return false;
  }

  // Get field element by name or data-field attribute
  getFieldElement(fieldName) {
    return document.querySelector(`[name="${fieldName}"], [data-field="${fieldName}"]`);
  }

  // Get field label for accessibility announcements
  getFieldLabel(fieldName) {
    const element = this.getFieldElement(fieldName);
    if (!element) return null;

    // Try to find associated label
    const label = document.querySelector(`label[for="${element.id}"]`) || 
                 element.closest('label') ||
                 document.querySelector(`label[for="${element.name}"]`);
    
    if (label) return label.textContent.trim();
    
    // Try aria-label
    if (element.getAttribute('aria-label')) {
      return element.getAttribute('aria-label');
    }
    
    // Try placeholder
    if (element.placeholder) {
      return element.placeholder;
    }
    
    return null;
  }

  // Passenger entry context management
  enterPassengerMode() {
    this.passengerEntryContext.isActive = true;
    this.passengerEntryContext.currentPassengerIndex = 0;
    this.passengerEntryContext.passengerFieldIndex = 0;
    this.announceToScreenReader('Entered passenger entry mode');
    console.log('🎯 Entered passenger entry mode');
  }

  exitPassengerMode() {
    this.passengerEntryContext.isActive = false;
    this.passengerEntryContext.currentPassengerIndex = 0;
    this.passengerEntryContext.passengerFieldIndex = 0;
    this.announceToScreenReader('Exited passenger entry mode');
    console.log('🎯 Exited passenger entry mode');
  }

  // Get next passenger field in sequence
  getNextPassengerField() {
    const currentIndex = this.passengerEntryContext.passengerFieldIndex;
    
    if (currentIndex < this.passengerFields.length - 1) {
      this.passengerEntryContext.passengerFieldIndex++;
      return this.passengerFields[this.passengerEntryContext.passengerFieldIndex];
    }
    
    // End of passenger fields - return to passenger_name for next passenger
    this.passengerEntryContext.passengerFieldIndex = 0;
    return 'passenger_name';
  }

  // Get previous passenger field in sequence
  getPreviousPassengerField() {
    const currentIndex = this.passengerEntryContext.passengerFieldIndex;
    
    if (currentIndex > 0) {
      this.passengerEntryContext.passengerFieldIndex--;
      return this.passengerFields[this.passengerEntryContext.passengerFieldIndex];
    }
    
    // Beginning of passenger fields - go to previous form field
    this.exitPassengerMode();
    return this.fieldOrder[this.fieldOrder.indexOf('quotaType')];
  }

  // Add to focus history for debugging and analytics
  addToHistory(fieldName, type) {
    this.focusHistory.push({
      fieldName,
      type,
      timestamp: Date.now(),
      fieldIndex: this.fieldOrder.indexOf(fieldName)
    });
    
    // Maintain history size
    if (this.focusHistory.length > this.maxHistorySize) {
      this.focusHistory.shift();
    }
  }

  // Get focus history for debugging
  getFocusHistory() {
    return this.focusHistory;
  }

  // Reset focus manager state
  reset() {
    this.currentFieldIndex = 0;
    this.manualFocusOverride = false;
    this.passengerEntryContext = {
      isActive: false,
      currentPassengerIndex: 0,
      passengerFieldIndex: 0
    };
    this.focusHistory = [];
    this.performanceMetrics = {
      startTime: performance.now(),
      focusOperations: 0
    };
  }

  // WCAG 2.1 AA compliance utilities
  announceToScreenReader(message) {
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', 'polite');
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only';
    announcement.textContent = message;
    document.body.appendChild(announcement);
    
    setTimeout(() => {
      if (document.body.contains(announcement)) {
        document.body.removeChild(announcement);
      }
    }, 1000);
  }

  // Check if element is currently visible and focusable
  isElementFocusable(element) {
    if (!element) return false;
    
    // Check if element is disabled
    if (element.disabled) return false;
    
    // Check if element is hidden
    if (element.offsetParent === null) return false;
    
    // Check if element has tabindex="-1"
    if (element.tabIndex === -1) return false;
    
    // Check if element is in a hidden container
    const style = window.getComputedStyle(element);
    if (style.display === 'none' || style.visibility === 'hidden') return false;
    
    return true;
  }

  // Validate field accessibility
  validateFieldAccessibility(fieldName) {
    const element = this.getFieldElement(fieldName);
    if (!element) return false;

    const issues = [];
    
    // Check for label association
    const label = document.querySelector(`label[for="${element.id}"]`) || 
                 element.closest('label') ||
                 document.querySelector(`label[for="${element.name}"]`);
    if (!label) {
      issues.push('Missing label association');
    }

    // Check for aria-label or aria-labelledby
    if (!element.getAttribute('aria-label') && !element.getAttribute('aria-labelledby') && !label) {
      issues.push('Missing accessible name');
    }

    // Check tabindex
    const tabIndex = element.getAttribute('tabindex');
    if (tabIndex && parseInt(tabIndex) > 0) {
      issues.push('Positive tabindex detected (should use 0 or -1)');
    }

    if (issues.length > 0) {
      console.warn(`Accessibility issues for ${fieldName}:`, issues);
      return false;
    }

    return true;
  }

  // Get performance metrics
  getPerformanceMetrics() {
    const currentTime = performance.now();
    return {
      ...this.performanceMetrics,
      totalTime: currentTime - this.performanceMetrics.startTime,
      averageOperationTime: (currentTime - this.performanceMetrics.startTime) / this.performanceMetrics.focusOperations
    };
  }
}

// Create singleton instance
export const enhancedFocusManager = new EnhancedFocusManager();

/**
 * Set initial focus on form load
 * @param {React.RefObject} formRef - Reference to form container
 * @param {string} firstFieldName - Name of first field to focus
 */
export const setInitialFocus = (formRef, firstFieldName = null) => {
  if (!formRef.current) return;
  
  let targetElement;
  
  if (firstFieldName) {
    targetElement = formRef.current.querySelector(
      `[name="${firstFieldName}"], [data-field="${firstFieldName}"]`
    );
  }
  
  if (!targetElement) {
    // Find first focusable element
    targetElement = formRef.current.querySelector(
      'input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );
  }
  
  if (targetElement) {
    // Small delay to ensure DOM is ready
    setTimeout(() => {
      targetElement.focus();
    }, 100);
  }
};

/**
 * Move focus to specific field
 * @param {string} fieldName - Name or data-field attribute of target field
 * @param {React.RefObject} containerRef - Optional container reference
 */
export const moveFocusToField = (fieldName, containerRef = null) => {
  const container = containerRef?.current || document;
  const element = container.querySelector(
    `[name="${fieldName}"], [data-field="${fieldName}"]`
  );
  
  if (element) {
    element.focus();
    return true;
  }
  return false;
};

/**
 * Get all focusable elements within a container
 * @param {HTMLElement} container - Container element
 * @returns {HTMLElement[]} Array of focusable elements
 */
export const getFocusableElements = (container) => {
  if (!container) return [];
  
  const focusableSelectors = [
    'input:not([disabled]):not([type="hidden"])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    'button:not([disabled])',
    'a[href]',
    '[tabindex]:not([tabindex="-1"])',
    '[contenteditable="true"]'
  ].join(', ');
  
  return Array.from(container.querySelectorAll(focusableSelectors));
};

/**
 * Create focus order based on business logic rather than DOM order
 * @param {string[]} businessOrder - Array of field names in business order
 * @param {React.RefObject} containerRef - Container reference
 * @returns {HTMLElement[]} Array of elements in business order
 */
export const createFocusOrder = (businessOrder, containerRef) => {
  if (!containerRef.current || !businessOrder.length) return [];
  
  return businessOrder.map(fieldName => 
    containerRef.current.querySelector(
      `[name="${fieldName}"], [data-field="${fieldName}"]`
    )
  ).filter(Boolean);
};

/**
 * Prevent focus from escaping the application
 * @param {KeyboardEvent} event - Keyboard event
 * @param {React.RefObject} containerRef - Container to trap focus within
 */
export const preventFocusEscape = (event, containerRef) => {
  if (event.key !== 'Tab' || !containerRef.current) return;
  
  const focusableElements = getFocusableElements(containerRef.current);
  if (focusableElements.length === 0) return;
  
  const firstElement = focusableElements[0];
  const lastElement = focusableElements[focusableElements.length - 1];
  
  if (event.shiftKey) {
    // Shift + Tab
    if (document.activeElement === firstElement) {
      event.preventDefault();
      lastElement.focus();
    }
  } else {
    // Tab
    if (document.activeElement === lastElement) {
      event.preventDefault();
      firstElement.focus();
    }
  }
};

/**
 * Setup focus trap for modals and popups
 * @param {React.RefObject} containerRef - Container to trap focus within
 * @returns {Function} Cleanup function
 */
export const setupFocusTrap = (containerRef) => {
  if (!containerRef.current) return () => {};
  
  const previouslyFocusedElement = document.activeElement;
  
  // Focus first element in container
  const focusableElements = getFocusableElements(containerRef.current);
  if (focusableElements.length > 0) {
    focusableElements[0].focus();
  }
  
  const handleKeyDown = (event) => {
    preventFocusEscape(event, containerRef);
  };
  
  document.addEventListener('keydown', handleKeyDown);
  
  // Return cleanup function
  return () => {
    document.removeEventListener('keydown', handleKeyDown);
    if (previouslyFocusedElement) {
      previouslyFocusedElement.focus();
    }
  };
};

/**
 * Check if element is currently visible and focusable
 * @param {HTMLElement} element - Element to check
 * @returns {boolean} True if element is focusable
 */
export const isElementFocusable = (element) => {
  if (!element) return false;
  
  // Check if element is disabled
  if (element.disabled) return false;
  
  // Check if element is hidden
  if (element.offsetParent === null) return false;
  
  // Check if element has tabindex="-1"
  if (element.tabIndex === -1) return false;
  
  // Check if element is in a hidden container
  const style = window.getComputedStyle(element);
  if (style.display === 'none' || style.visibility === 'hidden') return false;
  
  return true;
};

/**
 * Find next focusable element in specified direction
 * @param {HTMLElement} currentElement - Current focused element
 * @param {HTMLElement} container - Container to search within
 * @param {boolean} reverse - Search backwards if true
 * @returns {HTMLElement|null} Next focusable element or null
 */
export const findNextFocusableElement = (currentElement, container, reverse = false) => {
  const focusableElements = getFocusableElements(container);
  const currentIndex = focusableElements.indexOf(currentElement);
  
  if (currentIndex === -1) return focusableElements[0] || null;
  
  let nextIndex;
  if (reverse) {
    nextIndex = currentIndex - 1;
    if (nextIndex < 0) nextIndex = focusableElements.length - 1;
  } else {
    nextIndex = currentIndex + 1;
    if (nextIndex >= focusableElements.length) nextIndex = 0;
  }
  
  return focusableElements[nextIndex] || null;
};

/**
 * Announce text to screen readers
 * @param {string} message - Message to announce
 * @param {string} priority - Priority level ('polite' or 'assertive')
 */
export const announceToScreenReader = (message, priority = 'polite') => {
  const announcement = document.createElement('div');
  announcement.setAttribute('aria-live', priority);
  announcement.setAttribute('aria-atomic', 'true');
  announcement.className = 'sr-only';
  announcement.textContent = message;
  
  document.body.appendChild(announcement);
  
  // Remove after announcement
  setTimeout(() => {
    document.body.removeChild(announcement);
  }, 1000);
};

/**
 * Create keyboard navigation handler for custom components
 * @param {Object} options - Configuration options
 * @returns {Function} Keyboard event handler
 */
export const createKeyboardHandler = (options = {}) => {
  const {
    onTab = null,
    onEnter = null,
    onEscape = null,
    onArrowUp = null,
    onArrowDown = null,
    onArrowLeft = null,
    onArrowRight = null,
    preventDefault = true
  } = options;
  
  return (event) => {
    let handled = false;
    
    switch (event.key) {
      case 'Tab':
        if (onTab) {
          handled = onTab(event);
        }
        break;
      case 'Enter':
        if (onEnter) {
          handled = onEnter(event);
        }
        break;
      case 'Escape':
        if (onEscape) {
          handled = onEscape(event);
        }
        break;
      case 'ArrowUp':
        if (onArrowUp) {
          handled = onArrowUp(event);
        }
        break;
      case 'ArrowDown':
        if (onArrowDown) {
          handled = onArrowDown(event);
        }
        break;
      case 'ArrowLeft':
        if (onArrowLeft) {
          handled = onArrowLeft(event);
        }
        break;
      case 'ArrowRight':
        if (onArrowRight) {
          handled = onArrowRight(event);
        }
        break;
      default:
        break;
    }
    
    if (handled && preventDefault) {
      event.preventDefault();
      event.stopPropagation();
    }
  };
};

/**
 * Debounce function for keyboard events
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} Debounced function
 */
export const debounceKeyboard = (func, wait = 300) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

export default {
  setInitialFocus,
  moveFocusToField,
  getFocusableElements,
  createFocusOrder,
  preventFocusEscape,
  setupFocusTrap,
  isElementFocusable,
  findNextFocusableElement,
  announceToScreenReader,
  createKeyboardHandler,
  debounceKeyboard
};