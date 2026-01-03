
const express = require('express');
const router = express.Router();
const { EmployeeTVL, UserTVL, RoleTVL } = require('../models');

router.get('/test-employees', async (req, res) => {
  try {
    console.log('Debug route called');
    
    // Check associations
    const checks = {
        UserTVL_fnXfunction: !!UserTVL.associations.fnXfunction,
        EmployeeTVL_manager: !!EmployeeTVL.associations.manager,
        EmployeeTVL_user: !!EmployeeTVL.associations.user
    };
    console.log('Associations:', checks);

    const employees = await EmployeeTVL.findAll({
      include: [
        {
          model: UserTVL,
          as: 'user',
          attributes: ['us_usid', 'us_fname', 'us_lname', 'us_email', 'us_phone', 'us_aadhaar', 'us_pan', 'us_addr1', 'us_addr2', 'us_city', 'us_state', 'us_pin', 'us_roid', 'us_coid', 'us_active'],
          include: [
            {
              model: RoleTVL,
              attributes: ['fn_fnid', 'fn_fnshort', 'fn_fndesc'],
              as: 'fnXfunction'
            }
          ]
        },
        {
          model: EmployeeTVL,
          as: 'manager',
          attributes: ['em_usid', 'em_empno'],
          include: [{
            model: UserTVL,
            as: 'user',
            attributes: ['us_usid', 'us_fname', 'us_lname']
          }],
          required: false
        }
      ],
      order: [['edtm', 'DESC']]
    });

    res.json({ success: true, count: employees.length, checks });
  } catch (error) {
    console.error('Debug Route Error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
      stack: error.stack,
      sql: error.sql
    });
  }
});

module.exports = router;
