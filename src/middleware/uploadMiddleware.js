const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Create uploads directories if they don't exist
const employeeUploadDir = path.join(__dirname, '../../public/uploads/employees');
const customerUploadDir = path.join(__dirname, '../../public/uploads/customers');
const profileUploadDir = path.join(__dirname, '../../public/uploads/profiles');

if (!fs.existsSync(employeeUploadDir)) {
  fs.mkdirSync(employeeUploadDir, { recursive: true });
}
if (!fs.existsSync(customerUploadDir)) {
  fs.mkdirSync(customerUploadDir, { recursive: true });
}
if (!fs.existsSync(profileUploadDir)) {
  fs.mkdirSync(profileUploadDir, { recursive: true });
}

// Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Check route to determine upload directory
    if (req.route.path.includes('/profile/')) {
      cb(null, profileUploadDir);
    } else if (req.route.path.includes('/customer/') || req.route.path.includes('/customers/')) {
      cb(null, customerUploadDir);
    } else {
      cb(null, employeeUploadDir);
    }
  },
  filename: (req, file, cb) => {
    // Generate unique filename based on route
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    
    if (req.route.path.includes('/profile/')) {
      cb(null, 'profile-' + uniqueSuffix + ext);
    } else if (req.route.path.includes('/customer/') || req.route.path.includes('/customers/')) {
      cb(null, 'customer-' + uniqueSuffix + ext);
    } else {
      cb(null, 'employee-' + uniqueSuffix + ext);
    }
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