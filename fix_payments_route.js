const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'frontend/src/pages/Payments.jsx');
let content = fs.readFileSync(filePath, 'utf8');

// We need to import useLocation if not already imported
if (!content.includes('useLocation')) {
  content = content.replace("import { useNavigate } from 'react-router-dom';", "import { useNavigate, useLocation } from 'react-router-dom';");
}

// Intercept location state in useEffect
const target = 'const { setActiveForm } = useKeyboardNavigation();';
const newCode = `const { setActiveForm } = useKeyboardNavigation();
  const location = useLocation();

  useEffect(() => {
    if (location.state && location.state.view) {
      setCurrentView(location.state.view);
    }
  }, [location.state]);`;

content = content.replace(target, newCode);

// We also need to pass the autoFill prop to ReceiptForm
content = content.replace(
  "<ReceiptForm onBack={() => setCurrentView('menu')} />",
  "<ReceiptForm onBack={() => setCurrentView('menu')} autoFillData={location.state?.autoFill} />"
);

fs.writeFileSync(filePath, content);
console.log('Modified Payments.jsx');
