// Focus Management Utilities
// Provides utilities for managing focus in keyboard-first applications

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