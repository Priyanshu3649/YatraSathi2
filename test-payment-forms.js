// Test script to verify that the payment form components are working correctly
import React from 'react';
import { createRoot } from 'react-dom/client';
import { AuthProvider } from './frontend/src/contexts/AuthContext';
import { KeyboardNavigationProvider } from './frontend/src/contexts/KeyboardNavigationContext';
import PaymentForm from './frontend/src/components/Payments/PaymentForm';
import ReceiptForm from './frontend/src/components/Payments/ReceiptForm';
import ContraForm from './frontend/src/components/Payments/ContraForm';
import JournalForm from './frontend/src/components/Payments/JournalForm';

console.log('Testing payment form components...');

// Test PaymentForm component
try {
  const paymentFormRoot = createRoot(document.createElement('div'));
  paymentFormRoot.render(
    <AuthProvider>
      <KeyboardNavigationProvider>
        <PaymentForm onBack={() => {}} />
      </KeyboardNavigationProvider>
    </AuthProvider>
  );
  console.log('✅ PaymentForm component rendered successfully');
} catch (error) {
  console.error('❌ Error rendering PaymentForm:', error);
}

// Test ReceiptForm component
try {
  const receiptFormRoot = createRoot(document.createElement('div'));
  receiptFormRoot.render(
    <AuthProvider>
      <KeyboardNavigationProvider>
        <ReceiptForm onBack={() => {}} />
      </KeyboardNavigationProvider>
    </AuthProvider>
  );
  console.log('✅ ReceiptForm component rendered successfully');
} catch (error) {
  console.error('❌ Error rendering ReceiptForm:', error);
}

// Test ContraForm component
try {
  const contraFormRoot = createRoot(document.createElement('div'));
  contraFormRoot.render(
    <AuthProvider>
      <KeyboardNavigationProvider>
        <ContraForm onBack={() => {}} />
      </KeyboardNavigationProvider>
    </AuthProvider>
  );
  console.log('✅ ContraForm component rendered successfully');
} catch (error) {
  console.error('❌ Error rendering ContraForm:', error);
}

// Test JournalForm component
try {
  const journalFormRoot = createRoot(document.createElement('div'));
  journalFormRoot.render(
    <AuthProvider>
      <KeyboardNavigationProvider>
        <JournalForm onBack={() => {}} />
      </KeyboardNavigationProvider>
    </AuthProvider>
  );
  console.log('✅ JournalForm component rendered successfully');
} catch (error) {
  console.error('❌ Error rendering JournalForm:', error);
}

console.log('Payment form component tests completed');