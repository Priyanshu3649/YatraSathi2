// Validation utilities

// Validate email format
const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Validate phone number (Indian format)
const validatePhone = (phone) => {
  const phoneRegex = /^[6-9]\d{9}$/;
  return phoneRegex.test(phone);
};

// Validate Aadhaar number (12 digits)
const validateAadhaar = (aadhaar) => {
  const aadhaarRegex = /^\d{12}$/;
  return aadhaarRegex.test(aadhaar);
};

// Validate PAN number (10 characters: 5 letters, 4 digits, 1 letter)
const validatePAN = (pan) => {
  const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
  return panRegex.test(pan);
};

// Validate password strength
const validatePassword = (password) => {
  // At least 8 characters, one uppercase, one lowercase, one number
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/;
  return passwordRegex.test(password);
};

// Validate Indian PIN code
const validatePIN = (pin) => {
  const pinRegex = /^[1-9][0-9]{5}$/;
  return pinRegex.test(pin);
};

// Validate train number (1-5 digits)
const validateTrainNumber = (trainNumber) => {
  const trainRegex = /^\d{1,5}$/;
  return trainRegex.test(trainNumber);
};

// Validate PNR number (10 digits)
const validatePNR = (pnr) => {
  const pnrRegex = /^\d{10}$/;
  return pnrRegex.test(pnr);
};

// Validate booking class
const validateBookingClass = (bookingClass) => {
  const validClasses = ['1A', '2A', '3A', 'SL', 'CC', 'EC', 'FC'];
  return validClasses.includes(bookingClass);
};

// Validate berth preference
const validateBerthPreference = (berthPref) => {
  const validPreferences = ['LB', 'MB', 'UB', 'SL', 'SU', 'None'];
  return validPreferences.includes(berthPref);
};

// Validate passenger age
const validatePassengerAge = (age) => {
  return age >= 1 && age <= 125;
};

// Validate gender
const validateGender = (gender) => {
  const validGenders = ['M', 'F', 'O'];
  return validGenders.includes(gender);
};

// Validate booking status
const validateBookingStatus = (status) => {
  const validStatuses = ['PENDING', 'APPROVED', 'CONFIRMED', 'CANCELLED', 'COMPLETED'];
  return validStatuses.includes(status);
};

// Validate payment mode
const validatePaymentMode = (mode) => {
  const validModes = ['CASH', 'CHEQUE', 'BANK_TRANSFER', 'ONLINE', 'CARD'];
  return validModes.includes(mode);
};

// Validate payment status
const validatePaymentStatus = (status) => {
  const validStatuses = ['PENDING', 'RECEIVED', 'BOUNCED', 'REFUNDED'];
  return validStatuses.includes(status);
};

// Validate user type
const validateUserType = (userType) => {
  const validTypes = ['admin', 'employee', 'customer'];
  return validTypes.includes(userType);
};

// Validate department
const validateDepartment = (department) => {
  const validDepartments = [
    'hr', 'accounts', 'agent', 'marketing', 
    'call', 'management', 'administrator', 'relationship_manager'
  ];
  return validDepartments.includes(department);
};

// Validate customer type
const validateCustomerType = (customerType) => {
  const validTypes = ['individual', 'corporate'];
  return validTypes.includes(customerType);
};

module.exports = {
  validateEmail,
  validatePhone,
  validateAadhaar,
  validatePAN,
  validatePassword,
  validatePIN,
  validateTrainNumber,
  validatePNR,
  validateBookingClass,
  validateBerthPreference,
  validatePassengerAge,
  validateGender,
  validateBookingStatus,
  validatePaymentMode,
  validatePaymentStatus,
  validateUserType,
  validateDepartment,
  validateCustomerType
};