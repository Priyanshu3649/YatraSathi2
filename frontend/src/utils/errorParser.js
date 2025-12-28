/**
 * Parse database and API errors into user-friendly messages
 */

export const parseError = (error, response) => {
  console.log('parseError called with:', { error, response });
  
  // Network errors
  if (error && (error.message === 'Failed to fetch' || error.code === 'ECONNREFUSED')) {
    return {
      type: 'error',
      title: 'Connection Error',
      description: 'Unable to connect to the server. Please check your network connection and try again.'
    };
  }

  if (error && (error.message?.includes('timeout') || error.code === 'ETIMEDOUT')) {
    return {
      type: 'error',
      title: 'Request Timeout',
      description: 'The request took too long to complete. Please try again.'
    };
  }

  // Parse backend error response
  if (response) {
    const message = response.message || response.error || JSON.stringify(response);
    console.log('Parsing message:', message);

    // Duplicate entry (MySQL 1062)
    if (message.includes('Duplicate entry') || message.includes('already exists')) {
      // Extract field and value from message
      const match = message.match(/Duplicate entry.*'([^']+)'.*for key '([^']+)'/i) ||
                    message.match(/([^=]+)\s*=\s*'([^']+)'/);
      
      if (match) {
        const value = match[1];
        const field = match[2] || 'this value';
        return {
          type: 'error',
          title: 'Duplicate Entry',
          description: `A record with ${field} '${value}' already exists.\nPlease use a different value.`
        };
      }
      
      return {
        type: 'error',
        title: 'Duplicate Entry',
        description: message
      };
    }

    // Foreign key constraint - delete (MySQL 1451)
    if (message.includes('Cannot delete') || message.includes('referenced by other records') || 
        message.includes('ER_ROW_IS_REFERENCED')) {
      return {
        type: 'error',
        title: 'Cannot Delete Record',
        description: 'This record is referenced by other records.\nPlease delete dependent records first.'
      };
    }

    // Foreign key constraint - insert/update (MySQL 1452)
    if (message.includes('Foreign key constraint') || message.includes('does not exist') ||
        message.includes('ER_NO_REFERENCED_ROW')) {
      return {
        type: 'error',
        title: 'Invalid Reference',
        description: 'The referenced record does not exist.\nPlease select a valid option.'
      };
    }

    // Data too long (MySQL 1406)
    if (message.includes('Data too long') || message.includes('exceed')) {
      const fieldMatch = message.match(/for column '([^']+)'/i);
      const field = fieldMatch ? fieldMatch[1] : 'field';
      return {
        type: 'error',
        title: 'Data Too Long',
        description: `The ${field} exceeds the maximum allowed length.\nPlease shorten your input.`
      };
    }

    // Required field (MySQL 1048)
    if (message.includes('cannot be null') || message.includes('Required field missing')) {
      const fieldMatch = message.match(/'([^']+)'/);
      const field = fieldMatch ? fieldMatch[1] : 'field';
      return {
        type: 'error',
        title: 'Required Field Missing',
        description: `The ${field} is required.\nPlease provide a value.`
      };
    }

    // Validation error
    if (message.includes('Validation error')) {
      return {
        type: 'warning',
        title: 'Validation Error',
        description: message.replace('Validation error: ', '')
      };
    }

    // Access denied (MySQL 1044/1045)
    if (message.includes('Access denied') || message.includes('permission')) {
      return {
        type: 'error',
        title: 'Access Denied',
        description: 'You do not have permission to perform this operation.'
      };
    }

    // Table doesn't exist (MySQL 1146)
    if (message.includes("Table") && message.includes("doesn't exist")) {
      return {
        type: 'error',
        title: 'System Error',
        description: 'The requested data table does not exist.\nPlease contact system administrator.'
      };
    }

    // Unknown column (MySQL 1054)
    if (message.includes('Unknown column')) {
      return {
        type: 'error',
        title: 'System Error',
        description: 'Invalid field detected.\nPlease contact support.'
      };
    }

    // Generic error with message
    return {
      type: 'error',
      title: 'Error',
      description: message
    };
  }

  // Default error
  return {
    type: 'error',
    title: 'Unexpected Error',
    description: error?.message || 'An unexpected error occurred. Please try again.'
  };
};

/**
 * Validate form data before submission
 */
export const validateFormData = (formData, fields) => {
  const errors = [];

  fields.forEach(field => {
    const value = formData[field.name];

    // Required field validation
    if (field.required && (!value || value === '')) {
      errors.push(`${field.label} is required`);
    }

    // Email validation
    if (field.type === 'email' && value) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) {
        errors.push(`${field.label} must be a valid email address`);
      }
    }

    // Phone validation (10 digits)
    if (field.type === 'tel' && value) {
      const phoneRegex = /^\d{10}$/;
      if (!phoneRegex.test(value.replace(/\D/g, ''))) {
        errors.push(`${field.label} must be a 10-digit phone number`);
      }
    }

    // Max length validation
    if (field.maxLength && value && value.length > field.maxLength) {
      errors.push(`${field.label} must not exceed ${field.maxLength} characters`);
    }

    // Pattern validation
    if (field.pattern && value) {
      const regex = new RegExp(field.pattern);
      if (!regex.test(value)) {
        errors.push(`${field.label}: ${field.title || 'Invalid format'}`);
      }
    }
  });

  return errors;
};
