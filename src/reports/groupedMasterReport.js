const { 
  EmployeeTVL, 
  CustomerTVL, 
  UserTVL, 
  Booking, 
  BillingMaster,
  RoleTVL
} = require('../models');
const { Op } = require('sequelize');

/**
 * Generates Grouped Employee Report (By Department)
 */
const generateGroupedEmployeeReport = async (filters) => {
  const employees = await EmployeeTVL.findAll({
    include: [{ 
      model: UserTVL, 
      as: 'user',
      include: [{ model: RoleTVL, as: 'fnXfunction' }]
    }]
  });

  // Grouping logic
  const grouped = employees.reduce((acc, emp) => {
    const dept = emp.em_dept || 'Other';
    if (!acc[dept]) acc[dept] = [];
    acc[dept].push(emp.toJSON());
    return acc;
  }, {});

  const groups = Object.entries(grouped).map(([dept, emps]) => ({
    groupTitle: `Department: ${dept}`,
    columns: [
      { key: "ID", label: "ID" },
      { key: "Name", label: "Full Name" },
      { key: "Email", label: "Email" },
      { key: "Role", label: "Role" },
      { key: "Status", label: "Status" }
    ],
    rows: emps.map(e => ({
      "ID": e.em_usid,
      "Name": `${e.user?.us_fname || ''} ${e.user?.us_lname || ''}`.trim(),
      "Email": e.user?.us_email || '',
      "Role": e.user?.fnXfunction?.fn_fnshort || e.user?.us_roid || '',
      "Status": e.em_status || ''
    })),
    summary: { "Count": emps.length }
  }));

  return {
    title: 'Employee Report (Grouped by Department)',
    subtitle: `Exported on ${new Date().toLocaleDateString()}`,
    groups,
    summary: { "Total Employees": employees.length }
  };
};

/**
 * Generates Grouped Booking Report (By Customer)
 */
const generateGroupedBookingReport = async (filters) => {
  const where = {};
  if (filters.customerId) where.bk_usid = filters.customerId;
  
  const bookings = await Booking.findAll({
    include: [{ model: CustomerTVL, attributes: ['cu_name'] }],
    where,
    order: [['bk_usid', 'ASC'], ['bk_trvldt', 'ASC']]
  });

  const grouped = bookings.reduce((acc, bk) => {
    const cust = bk.Customer?.cu_name || bk.bk_usid || 'Unknown';
    if (!acc[cust]) acc[cust] = [];
    acc[cust].push(bk.toJSON());
    return acc;
  }, {});

  const groups = Object.entries(grouped).map(([cust, bks]) => ({
    groupTitle: `Customer: ${cust}`,
    columns: [
      { key: "Booking No", label: "Booking No" },
      { key: "From", label: "From" },
      { key: "To", label: "To" },
      { key: "Date", label: "Travel Date" },
      { key: "Status", label: "Status" }
    ],
    rows: bks.map(b => ({
      "Booking No": b.bk_bkno,
      "From": b.bk_fromst,
      "To": b.bk_tost,
      "Date": b.bk_trvldt ? new Date(b.bk_trvldt).toLocaleDateString() : '',
      "Status": b.bk_status
    })),
    summary: { "Total Bookings": bks.length }
  }));

  return {
    title: 'Bookings Report (Grouped by Customer)',
    groups,
    summary: { "Grand Total Bookings": bookings.length }
  };
};

/**
 * Generates Grouped Billing Report (By Customer)
 */
const generateGroupedBillingReport = async (filters) => {
  const where = {};
  if (filters.customerId) where.bl_customer_id = filters.customerId;

  const billings = await BillingMaster.findAll({
    where,
    order: [['bl_customer_name', 'ASC'], ['bl_billing_date', 'ASC']]
  });

  const grouped = billings.reduce((acc, bill) => {
    const cust = bill.bl_customer_name || 'Unknown';
    if (!acc[cust]) acc[cust] = [];
    acc[cust].push(bill.toJSON());
    return acc;
  }, {});

  const groups = Object.entries(grouped).map(([cust, bills]) => ({
    groupTitle: `Customer: ${cust}`,
    columns: [
      { key: "Bill No", label: "Bill No" },
      { key: "Date", label: "Date" },
      { key: "Train", label: "Train" },
      { key: "Amount", label: "Amount" },
      { key: "Status", label: "Status" }
    ],
    rows: bills.map(b => ({
      "Bill No": b.bl_bill_no,
      "Date": b.bl_billing_date ? new Date(b.bl_billing_date).toLocaleDateString() : '',
      "Train": b.train_number || '',
      "Amount": b.bl_total_amount,
      "Status": b.status
    })),
    summary: { 
      "Total Bills": bills.length,
      "Total Amount": bills.reduce((sum, b) => sum + (parseFloat(b.bl_total_amount) || 0), 0).toFixed(2)
    }
  }));

  return {
    title: 'Billings Report (Grouped by Customer)',
    groups,
    summary: { 
      "Grand Total Bills": billings.length,
      "Grand Total Amount": billings.reduce((sum, b) => sum + (parseFloat(b.bl_total_amount) || 0), 0).toFixed(2)
    }
  };
};

module.exports = {
  generateGroupedEmployeeReport,
  generateGroupedBookingReport,
  generateGroupedBillingReport
};
