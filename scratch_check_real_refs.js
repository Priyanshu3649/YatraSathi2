const fs = require('fs');
const path = require('path');

const modelsMap = {
  "Company": "coCompany",
  "CompanyTVL": "coCompany",
  "Role": "fnXfunction",
  "Permission": "opXoperation",
  "RolePermission": "rpRolePermission",
  "RolePermissionTVL": "fpXfuncperm",
  "RoleTVL": "fnXfunction",
  "User": "usUser",
  "Login": "lgLogin",
  "Employee": "emEmployee",
  "Customer": "cuCustomer",
  "CorporateCustomer": "cuCorporateCustomer",
  "CustomerContact": "ccCustContact",
  "Station": "stStation",
  "Train": "trTrain",
  "Booking": "bkXbooking",
  "Pnr": "pnXpnr",
  "Account": "acAccount",
  "Payment": "pyXpayment",
  "PaymentAlloc": "paXpayalloc",
  "pnXpnr": "pnXpnr",
  "ptXpayment": "ptXpayment",
  "paXpayalloc": "paXpayalloc",
  "ptPayment": "ptXpayment",
  "paPaymentAlloc": "paXpayalloc",
  "billXbill": "blXbilling",
  "BillTVL": "blXbilling",
  "BillingMaster": "billingMaster",
  "Session": "ssSession",
  "Audit": "auAudit",
  "Config": "cfConfig",
  "TravelPlan": "tpTravelPlan",
  "EmployeeTVL": "emXemployee",
  "AccountTVL": "acXaccount",
  "UserTVL": "usXuser",
  "StationTVL": "stXstation",
  "TrainTVL": "trXtrain",
  "CustomerTVL": "cuXcustomer",
  "LoginTVL": "lgXlogin",
  "BookingTVL": "bkXbooking",
  "PaymentTVL": "ptXpayment",
  "UserPermissionTVL": "upXusrperm",
  "Ledger": "lgLedger",
  "CustomerAdvance": "caCustomerAdvance",
  "CustomerAdvanceTVL": "caXcustomeradvance",
  "YearEndClosing": "yeYearEndClosing",
  "YearEndClosingTVL": "yeXyearendclosing",
  "PassengerTVL": "psXpassenger",
  "MasterPassengerList": "mlXmasterlist",
  "CustomerMasterPassenger": "cmpXmasterpassenger",
  "ReportTemplate": "rtXreporttemplate",
  "Contra": "ctXcontra",
  "Receipt": "rcXreceipt",
  "Journal": "jeXjournal",
  "PermissionTVL": "opXoperation",
  "ForensicAuditLog": "audit_forensic_log",
  "ApplicationTVL": "apXapplication",
  "ModuleTVL": "moXmodule",
  "ServiceCharge": "service_charges",
  "ServiceChargeDefault": "service_charges_default",
  "PaymentAllocation": "payment_allocations",
  "CustomerLedger": "customer_ledger"
};

function getFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      if (file !== 'node_modules' && file !== '.git' && file !== '.qoder' && file !== 'frontend' && file !== 'PROJECT_CLEANUP_ARCHIVE') {
        getFiles(filePath, fileList);
      }
    } else {
      if (file.endsWith('.js')) {
        fileList.push(filePath);
      }
    }
  }
  return fileList;
}

const srcFiles = [];
if (fs.existsSync('./src')) {
  getFiles('./src', srcFiles);
}

// Read all files
const fileContents = srcFiles.map(filePath => ({
  path: filePath,
  content: fs.readFileSync(filePath, 'utf8')
}));

const result = [];
for (const [model, table] of Object.entries(modelsMap)) {
  // Let's search for uses of model in the code
  const filesUsed = [];
  fileContents.forEach(file => {
    // Exclude the model's own file and index.js
    if (file.path.endsWith(`models/${model}.js`) || file.path.endsWith('models/index.js')) {
      return;
    }
    
    // Find import or reference
    // A simple regex to see if the model name is used as an identifier
    const regex = new RegExp(`\\b${model}\\b`, 'g');
    const matches = file.content.match(regex);
    if (matches && matches.length > 0) {
      filesUsed.push({
        file: path.relative('.', file.path),
        count: matches.length
      });
    }
  });

  result.push({
    model,
    table,
    useCount: filesUsed.length,
    files: filesUsed
  });
}

const compactSummary = result.map(r => ({
  model: r.model,
  table: r.table,
  useCount: r.useCount,
  sampleFiles: r.files.slice(0, 3).map(f => f.file)
}));
fs.writeFileSync('scratch_model_usage_results.json', JSON.stringify(compactSummary, null, 2), 'utf8');
console.log('Results written to scratch_model_usage_results.json');
process.exit(0);
