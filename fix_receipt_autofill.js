const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'frontend/src/components/Payments/ReceiptForm.jsx');
let content = fs.readFileSync(filePath, 'utf8');

// Change `const ReceiptForm = ({ onBack }) => {` to `const ReceiptForm = ({ onBack, autoFillData }) => {`
content = content.replace(
  "const ReceiptForm = ({ onBack }) => {",
  "const ReceiptForm = ({ onBack, autoFillData }) => {\n  const [autoFillReadOnly, setAutoFillReadOnly] = useState(false);"
);

// We also need to consume autoFillData in a useEffect
const hookTarget = "useEffect(() => {";
const newHook = `useEffect(() => {
    if (autoFillData) {
      setFormData(prev => ({
        ...prev,
        customer_name: autoFillData.customer_name || prev.customer_name,
        customer_phone: autoFillData.customer_phone || prev.customer_phone
      }));
      setAutoFillReadOnly(true);
      setIsEditing(true);
    }
  }, [autoFillData]);

  useEffect(() => {`;

content = content.replace(hookTarget, newHook);

fs.writeFileSync(filePath, content);
console.log('Modified ReceiptForm.jsx for autoFillData');
