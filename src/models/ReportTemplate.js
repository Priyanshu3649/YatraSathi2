const { DataTypes } = require('sequelize');
const { sequelize, BaseModel } = require('./baseModel');

/**
 * Report Template Model
 * Stores user-created report templates for reuse
 */
const ReportTemplate = sequelize.define('rtReportTemplate', {
  rt_rtid: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false,
    comment: 'Report Template ID'
  },
  
  rt_name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    comment: 'Template name'
  },
  
  rt_description: {
    type: DataTypes.STRING(500),
    allowNull: true,
    comment: 'Template description'
  },
  
  rt_type: {
    type: DataTypes.STRING(20),
    allowNull: false,
    comment: 'Report type (booking, billing, payment, etc.)'
  },
  
  rt_config: {
    type: DataTypes.JSON,
    allowNull: false,
    comment: 'JSON configuration for the report'
  },
  
  rt_role_access: {
    type: DataTypes.STRING(50),
    allowNull: false,
    defaultValue: 'private',
    comment: 'Role access level (private, role-specific, public)'
  },
  
  rt_created_by: {
    type: DataTypes.STRING(15),
    allowNull: false,
    comment: 'User ID who created the template'
  },
  
  rt_is_public: {
    type: DataTypes.TINYINT,
    allowNull: false,
    defaultValue: 0,
    comment: 'Whether template is public (1) or private (0)'
  },
  
  rt_is_active: {
    type: DataTypes.TINYINT,
    allowNull: false,
    defaultValue: 1,
    comment: 'Whether template is active (1) or archived (0)'
  },
  
  rt_usage_count: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    comment: 'Number of times template has been used'
  },
  
  rt_last_used: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Last time template was used'
  },
  
  // Audit fields from BaseModel
  ...BaseModel
  
}, {
  tableName: 'rtXreporttemplate',
  timestamps: true,
  indexes: [
    {
      name: 'idx_rt_created_by',
      fields: ['rt_created_by']
    },
    {
      name: 'idx_rt_type',
      fields: ['rt_type']
    },
    {
      name: 'idx_rt_role_access',
      fields: ['rt_role_access']
    },
    {
      name: 'idx_rt_is_public',
      fields: ['rt_is_public']
    },
    {
      name: 'idx_rt_is_active',
      fields: ['rt_is_active']
    }
  ]
});

// Define associations
ReportTemplate.associate = function(models) {
  // Template belongs to user who created it
  ReportTemplate.belongsTo(models.User, {
    foreignKey: 'rt_created_by',
    targetKey: 'us_usid',
    as: 'creator'
  });
  
  // Template can be associated with reports (if we track which reports used which templates)
  // ReportTemplate.hasMany(models.ReportExecution, {
  //   foreignKey: 're_template_id',
  //   sourceKey: 'rt_rtid',
  //   as: 'executions'
  // });
};

module.exports = ReportTemplate;