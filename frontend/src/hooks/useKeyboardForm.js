// KEYBOARD-FIRST FORM HOOK (MANDATORY COMPLIANCE)
// Forms MUST use this hook and follow lifecycle rules exactly

import { useEffect, useMemo } from 'react';
import { useKeyboardNavigation } from '../contexts/KeyboardNavigationContext';

export const useKeyboardForm = (options = {}) => {
  const {
    formId,
    fields = [],
    onSave = null,
    onCancel = null
  } = options;

  const {
    registerForm,
    unregisterForm,
    setActiveForm,
    isModalOpen,
    closeModal
  } = useKeyboardNavigation();

  // MANDATORY: Form definition MUST be memoized
  const formDefinition = useMemo(() => ({
    id: formId,
    fields: fields
  }), [formId, fields]);

  // MANDATORY: Registration MUST happen only once on mount
  useEffect(() => {
    if (!formId || fields.length === 0) {
      console.warn('useKeyboardForm: formId and fields are required');
      return;
    }

    console.log(`Registering keyboard form: ${formId}`);
    registerForm(formId, fields);
    setActiveForm(formId);

    // MANDATORY: Cleanup on unmount
    return () => {
      console.log(`Unregistering keyboard form: ${formId}`);
      unregisterForm(formId);
    };
  }, []); // ABSOLUTE RULE: Empty dependency array

  // Handle save confirmation modal through global event
  useEffect(() => {
    const handleSaveResponse = (confirmed) => {
      closeModal();
      if (confirmed && onSave) {
        onSave();
      } else if (!confirmed && onCancel) {
        onCancel();
      }
    };

    // Set up global handler for save confirmation
    if (isModalOpen) {
      window.handleSaveResponse = handleSaveResponse;
    }

    return () => {
      if (window.handleSaveResponse) {
        delete window.handleSaveResponse;
      }
    };
  }, []); // ABSOLUTE RULE: Empty dependency array

  return {
    formId,
    isModalOpen
  };
};

export default useKeyboardForm;