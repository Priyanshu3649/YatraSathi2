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
 * Generates Employee Master Report
 */
const generateEmployeeReport = async (filters) => {
  const where = {};
  if (filters.status) where.em_status = filters.status;
  if (filters.dept) where.em_dept = filters.dept;

  const employees = await EmployeeTVL.findAll({
    include: [{ 
      model: UserTVL, 
      as: 'user',
      include: [{ model: RoleTVL, as: 'fnXfunction' }]
    }],
    where
  });

  const rows = employees.map(emp => {
    const json = emp.toJSON();
    return {
      "ID": json.em_usid,
      "Name": `${json.user?.us_fname || ''} ${json.user?.us_lname || ''}`.trim(),
      "Email": json.user?.us_email || '',
      "Phone": json.user?.us_phone || '',
      "Dept": json.em_dept || '',
      "Role": json.user?.fnXfunction?.fn_fnshort || json.user?.us_roid || '',
      "Status": json.em_status || '',
      "Joined": json.em_joindt ? new Date(json.em_joindt).toLocaleDateString() : ''
    };
  });

  return {
    columns: ["ID", "Name", "Email", "Phone", "Dept", "Role", "Status", "Joined"],
    rows,
    summary: { "Total Employees": rows.length }
  };
};

/**
 * Generates Customer Master Report
 */
const generateCustomerReport = async (filters) => {
  const where = {};
  if (filters.status) where.cu_status = filters.status;
  if (filters.type) where.cu_custtype = filters.type;

  const customers = await CustomerTVL.findAll({
    include: [{ model: UserTVL, as: 'user' }],
    where
  });

  const rows = customers.map(cust => {
    const json = cust.toJSON();
    return {
      "Cust No": json.cu_custno,
      "Name": `${json.user?.us_fname || ''} ${json.user?.us_lname || ''}`.trim(),
      "Email": json.user?.us_email || '',
      "Phone": json.user?.us_phone || '',
      "Type": json.cu_custtype || '',
      "Company": json.cu_company || '',
      "GST": json.cu_gst || '',
      "Credit": json.cu_creditlmt || 0
    };
  });

  return {
    columns: ["Cust No", "Name", "Email", "Phone", "Type", "Company", "GST", "Credit"],
    rows,
    summary: { "Total Customers": rows.length }
  };
};

/**
 * Generates Bookings Report
 */
const generateBookingReport = async (filters) => {
  const where = {};
  if (filters.startDate && filters.endDate) {
    where.bk_trvldt = { [Op.between]: [new Date(filters.startDate), new Date(filters.endDate)] };
  }
  if (filters.status) where.bk_status = filters.status;
  if (filters.customerId) where.bk_usid = filters.customerId;

  const bookings = await Booking.findAll({
    include: [{ model: CustomerTVL, attributes: ['cu_name'] }],
    where,
    order: [['bk_trvldt', 'ASC']]
  });

  const rows = bookings.map(bk => {
    const json = bk.toJSON();
    return {
      "Booking No": json.bk_bkno,
      "Customer": json.Customer?.cu_name || json.bk_usid,
      "From": json.bk_fromst,
      "To": json.bk_tost,
      "Travel Date": json.bk_trvldt ? new Date(json.bk_trvldt).toLocaleDateString() : '',
      "Class": json.bk_class,
      "Pass": json.bk_totalpass,
      "Status": json.bk_status
    };
  });

  return {
    columns: ["Booking No", "Customer", "From", "To", "Travel Date", "Class", "Pass", "Status"],
    rows,
    summary: { "Total Bookings": rows.length }
  };
};

/**
 * Generates Billings Report
 */
const generateBillingReport = async (filters) => {
  const where = {};
  if (filters.startDate && filters.endDate) {
    where.bl_billing_date = { [Op.between]: [new Date(filters.startDate), new Date(filters.endDate)] };
  }
  if (filters.status) where.status = filters.status;
  if (filters.customerId) where.bl_customer_id = filters.customerId;

  const billings = await BillingMaster.findAll({
    where,
    order: [['bl_billing_date', 'ASC']]
  });

  const rows = billings.map(bill => {
    const json = bill.toJSON();
    return {
      "Bill No": json.bl_bill_no,
      "Date": json.bl_billing_date ? new Date(json.bl_billing_date).toLocaleDateString() : '',
      "Customer": json.bl_customer_name,
      "Train": json.train_number || '',
      "Fare": json.bl_total_amount,
      "Status": json.status || ''
    };
  });

  return {
    columns: ["Bill No", "Date", "Customer", "Train", "Fare", "Status"],
    rows,
    summary: { 
      "Total Bills": rows.length,
      "Total Amount": rows.reduce((sum, r) => sum + (parseFloat(r.Fare) || 0), 0).toFixed(2)
    }
  };
};

module.exports = {
  generateEmployeeReport,
  generateCustomerReport,
  generateBookingReport,
  generateBillingReport
};
