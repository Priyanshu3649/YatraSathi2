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

// All audited tables in the DB
const dbTables = [
  "acAccount", "acXaccount", "apXapplication", "auAudit", "audit_forensic_log",
  "billingMaster", "bkXbooking", "blXbilling", "caCustomerAdvance", "caXcustomeradvance",
  "ccCustContact", "cfConfig", "cmpXmasterpassenger", "coCompany", "ctXcontra",
  "cuCorporateCustomer", "cuCustomer", "customer_ledger", "cuXcustomer", "emEmployee",
  "emXemployee", "fnXfunction", "fpXfuncperm", "jeXjournal", "lgLedger",
  "lgLogin", "lgXlogin", "mlXmasterlist", "moXmodule", "opXoperation",
  "paXpayalloc", "payment_allocations", "pnXpnr", "psXpassenger", "ptXpayment",
  "pyXpayment", "rcXreceipt", "rpRolePermission", "rtXreporttemplate", "service_charges",
  "service_charges_default", "ssSession", "stStation", "stXstation", "tpTravelPlan",
  "trTrain", "trXtrain", "upXusrperm", "usUser", "usXuser",
  "yeXyearendclosing", "yeYearEndClosing"
];

// Let's invert map: table -> list of models that map to it
const tableToModels = {};
dbTables.forEach(t => tableToModels[t] = []);
for (const [model, table] of Object.entries(modelsMap)) {
  if (tableToModels[table]) {
    tableToModels[table].push(model);
  }
}

// Find all code files recursively in src/, and SQL files in root
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
      if (file.endsWith('.js') || file.endsWith('.json') || file.endsWith('.sql')) {
        fileList.push(filePath);
      }
    }
  }
  return fileList;
}

const allFiles = [];
// Scan src directory
if (fs.existsSync('./src')) {
  getFiles('./src', allFiles);
}
// Add root SQL and JS files (except scratch ones)
const rootFiles = fs.readdirSync('.').filter(f => {
  return (f.endsWith('.sql') || (f.endsWith('.js') && !f.startsWith('scratch') && f !== 'package.json'));
});
rootFiles.forEach(f => allFiles.push(path.resolve(f)));

console.log(`Scanning ${allFiles.length} files...`);

// Read all files contents
const fileContents = allFiles.map(filePath => {
  try {
    return {
      path: filePath,
      content: fs.readFileSync(filePath, 'utf8')
    };
  } catch (e) {
    return { path: filePath, content: '' };
  }
});

const auditSummary = [];

for (const tableName of dbTables) {
  const models = tableToModels[tableName] || [];
  let modelRefs = 0;
  let tableRefs = 0;

  // Count references in all files
  fileContents.forEach(file => {
    // Check table name reference
    const tableRegex = new RegExp(`\\b${tableName}\\b`, 'g');
    const tableMatches = file.content.match(tableRegex);
    if (tableMatches) {
      tableRefs += tableMatches.length;
    }

    // Check each model reference
    models.forEach(model => {
      const modelRegex = new RegExp(`\\b${model}\\b`, 'g');
      const modelMatches = file.content.match(modelRegex);
      if (modelMatches) {
        modelRefs += modelMatches.length;
      }
    });
  });

  auditSummary.push({
    tableName,
    models,
    modelRefs,
    tableRefs,
    totalRefs: modelRefs + tableRefs
  });
}

console.log('--- TABLE USAGE STATIC CODE ANALYSIS ---');
console.log(JSON.stringify(auditSummary, null, 2));
process.exit(0);
