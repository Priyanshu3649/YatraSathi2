const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'frontend/src/pages/Billing.jsx');
let content = fs.readFileSync(filePath, 'utf8');

const hookTarget = 'useEffect(() => {';
const newHook = `
  // Enter key redirect to Receipt Form
  useEffect(() => {
    const handleGlobalKeyDown = (e) => {
      if (e.key === 'Enter' && selectedBill) {
        e.preventDefault();
        navigate('/payments', { 
          state: { 
            view: 'receipt', 
            autoFill: { 
              customer_name: selectedBill.customerName, 
              customer_phone: selectedBill.customerPhone 
            } 
          } 
        });
      }
    };
    
    // Only attach if no modals are open
    if (!showPaymentModal) {
      window.addEventListener('keydown', handleGlobalKeyDown);
    }
    
    return () => {
      window.removeEventListener('keydown', handleGlobalKeyDown);
    };
  }, [selectedBill, navigate, showPaymentModal]);
  
  useEffect(() => {`;

content = content.replace(hookTarget, newHook);
fs.writeFileSync(filePath, content);
console.log('Added Enter key hook in Billing.jsx');
