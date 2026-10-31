const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Create uploads directories if they don't exist
const employeeUploadDir = path.join(__dirname, '../../public/uploads/employees');
const customerUploadDir = path.join(__dirname, '../../public/uploads/customers');
const profileUploadDir = path.join(__dirname, '../../public/uploads/profiles');
const paymentUploadDir = path.join(__dirname, '../../public/uploads/payments');

if (!fs.existsSync(employeeUploadDir)) {
  fs.mkdirSync(employeeUploadDir, { recursive: true });
}
if (!fs.existsSync(customerUploadDir)) {
  fs.mkdirSync(customerUploadDir, { recursive: true });
}
if (!fs.existsSync(profileUploadDir)) {
  fs.mkdirSync(profileUploadDir, { recursive: true });
}
if (!fs.existsSync(paymentUploadDir)) {
  fs.mkdirSync(paymentUploadDir, { recursive: true });
}

// Determine the upload category from the full request URL.
// req.route.path is only the matched suffix (usually '/'), so it cannot
// distinguish mounted payment/employee routes.
const getUploadCategory = (req) => {
  const requestPath = `${req.baseUrl || ''}${req.path || req.originalUrl || ''}`.toLowerCase();

  if (requestPath.includes('/profile')) return 'profile';
  if (requestPath.includes('/customer')) return 'customer';
  if (
    requestPath.includes('/payment') ||
    requestPath.includes('/receipt') ||
    requestPath.includes('/journal') ||
    requestPath.includes('/contra')
  ) {
    return 'payment';
  }
  return 'employee';
};

const categoryConfig = {
  profile: { dir: profileUploadDir, prefix: 'profile-' },
  customer: { dir: customerUploadDir, prefix: 'customer-' },
  payment: { dir: paymentUploadDir, prefix: 'payment-proof-' },
  employee: { dir: employeeUploadDir, prefix: 'employee-' }
};

// Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const category = getUploadCategory(req);
    cb(null, categoryConfig[category].dir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const category = getUploadCategory(req);
    cb(null, categoryConfig[category].prefix + uniqueSuffix + ext);
  }
});

// File filter to allow only images
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'), false);
  }
};

// Initialize multer with storage and limits
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

module.exports = upload;