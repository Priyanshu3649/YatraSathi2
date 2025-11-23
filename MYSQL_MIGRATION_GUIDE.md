# MySQL Migration Guide

## Overview
This guide will help you migrate the YatraSathi application from SQLite to MySQL database.

## Prerequisites

### 1. Install MySQL
Make sure MySQL is installed on your system:

**macOS (using Homebrew):**
```bash
brew install mysql
brew services start mysql
```

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install mysql-server
sudo systemctl start mysql
sudo systemctl enable mysql
```

**Windows:**
Download and install from: https://dev.mysql.com/downloads/mysql/

### 2. Verify MySQL Installation
```bash
mysql --version
```

## Step-by-Step Migration

### Step 1: Create MySQL Database

Login to MySQL:
```bash
mysql -u root -p
```

Create the database:
```sql
CREATE DATABASE yatrasathi CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

Create a dedicated user (recommended):
```sql
CREATE USER 'yatrasathi_user'@'localhost' IDENTIFIED BY 'your_secure_password';
GRANT ALL PRIVILEGES ON yatrasathi.* TO 'yatrasathi_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

### Step 2: Update Environment Variables

Your `.env` file has been updated with MySQL configuration:

```env
NODE_ENV=development
PORT=5003
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=yatrasathi
JWT_SECRET=default_secret
```

**If you created a dedicated user, update:**
```env
DB_USER=yatrasathi_user
DB_PASSWORD=your_secure_password
```

### Step 3: Export Data from SQLite (Optional)

If you want to preserve existing data, export it first:

```bash
# Install sqlite3 if not already installed
npm install -g sqlite3

# Export data to SQL
sqlite3 database.sqlite .dump > sqlite_backup.sql
```

### Step 4: Restart the Application

Stop the current server (Ctrl+C) and restart:
```bash
npm start
```

The application will now:
1. Connect to MySQL instead of SQLite
2. Automatically create all tables
3. Sync the schema

### Step 5: Seed Initial Data

Run the seed script to populate initial data:
```bash
npm run seed
```

This will create:
- Default admin user (admin@example.com / admin123)
- Sample roles and permissions
- Sample employees
- Sample customers
- Sample stations and trains

## Configuration Details

### Database Configuration (config/db.js)

The configuration now automatically detects MySQL:
- If `DB_NAME` and `DB_HOST` are set in `.env`, it uses MySQL
- Otherwise, it falls back to SQLite

### Connection Pool Settings

MySQL connection pool is configured with:
- **Max connections**: 5
- **Min connections**: 0
- **Acquire timeout**: 30 seconds
- **Idle timeout**: 10 seconds

## Verification

### 1. Check Database Connection

Look for this message in the console:
```
Using MySQL database: yatrasathi
Database connected successfully
All models were synchronized successfully
```

### 2. Verify Tables Created

Login to MySQL and check:
```bash
mysql -u root -p yatrasathi
```

```sql
SHOW TABLES;
```

You should see all 20+ tables:
```
+------------------------+
| Tables_in_yatrasathi   |
+------------------------+
| acAccount              |
| auAudit                |
| bkBooking              |
| ccCustContact          |
| cfConfig               |
| coCompany              |
| cuCustomer             |
| emEmployee             |
| lgLogin                |
| paPaymentAlloc         |
| pnPnr                  |
| prPermission           |
| psPassenger            |
| ptPayment              |
| rpRolePermission       |
| ssSession              |
| stStation              |
| trTrain                |
| urRole                 |
| usUser                 |
+------------------------+
```

### 3. Test the Application

1. Open browser: http://localhost:3001
2. Login with admin credentials
3. Check if data loads correctly
4. Try creating a new employee
5. Verify all features work

## Troubleshooting

### Error: "Access denied for user"

**Solution:** Check your MySQL credentials in `.env`
```bash
mysql -u root -p
# If this works, your credentials are correct
```

### Error: "Database does not exist"

**Solution:** Create the database manually
```sql
CREATE DATABASE yatrasathi;
```

### Error: "Can't connect to MySQL server"

**Solution:** Make sure MySQL is running
```bash
# macOS
brew services start mysql

# Linux
sudo systemctl start mysql

# Check status
mysql -u root -p
```

### Error: "ER_NOT_SUPPORTED_AUTH_MODE"

**Solution:** Update MySQL authentication method
```sql
ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY 'your_password';
FLUSH PRIVILEGES;
```

### Port Already in Use

**Solution:** Change the port in `.env`
```env
PORT=5004
```

## Data Migration (SQLite to MySQL)

If you need to migrate existing data:

### Option 1: Manual Export/Import

1. **Export from SQLite:**
```bash
sqlite3 database.sqlite .dump > data.sql
```

2. **Clean up the SQL file:**
Remove SQLite-specific commands and adjust for MySQL

3. **Import to MySQL:**
```bash
mysql -u root -p yatrasathi < data.sql
```

### Option 2: Use a Migration Script

Create a custom migration script to copy data table by table.

## Performance Considerations

### MySQL vs SQLite

**MySQL Advantages:**
- Better for concurrent users
- Better performance with large datasets
- Better for production environments
- Supports replication and clustering
- Better transaction handling

**Configuration Tips:**
1. Use connection pooling (already configured)
2. Add indexes for frequently queried columns
3. Use prepared statements (Sequelize does this)
4. Monitor slow queries
5. Regular backups

## Backup Strategy

### Automated Backups

Create a backup script:
```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
mysqldump -u root -p yatrasathi > backup_$DATE.sql
```

### Restore from Backup

```bash
mysql -u root -p yatrasathi < backup_20231120_120000.sql
```

## Security Best Practices

1. **Use Strong Passwords:**
```sql
ALTER USER 'yatrasathi_user'@'localhost' IDENTIFIED BY 'StrongP@ssw0rd!';
```

2. **Limit User Privileges:**
```sql
GRANT SELECT, INSERT, UPDATE, DELETE ON yatrasathi.* TO 'yatrasathi_user'@'localhost';
```

3. **Use Environment Variables:**
Never commit `.env` file with real credentials

4. **Enable SSL (Production):**
```javascript
{
  host: process.env.DB_HOST,
  dialect: 'mysql',
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false
    }
  }
}
```

## Production Deployment

### Environment Variables for Production

```env
NODE_ENV=production
PORT=5003
DB_HOST=your-mysql-host.com
DB_USER=yatrasathi_user
DB_PASSWORD=your_secure_password
DB_NAME=yatrasathi
JWT_SECRET=your_very_secure_jwt_secret_key
```

### Connection Pool for Production

Update `config/db.js` for production:
```javascript
pool: {
  max: 20,        // Increase for production
  min: 5,         // Keep some connections ready
  acquire: 30000,
  idle: 10000
}
```

## Monitoring

### Check Connection Status

```sql
SHOW PROCESSLIST;
SHOW STATUS LIKE 'Threads_connected';
```

### Check Database Size

```sql
SELECT 
  table_schema AS 'Database',
  ROUND(SUM(data_length + index_length) / 1024 / 1024, 2) AS 'Size (MB)'
FROM information_schema.tables
WHERE table_schema = 'yatrasathi'
GROUP BY table_schema;
```

## Rollback to SQLite

If you need to rollback to SQLite:

1. Remove MySQL variables from `.env`:
```env
NODE_ENV=development
PORT=5003
JWT_SECRET=default_secret
```

2. Restart the application - it will automatically use SQLite

## Summary

✅ **Completed Steps:**
1. Updated `config/db.js` to support MySQL
2. Updated `.env` with MySQL configuration
3. Application now uses MySQL when configured
4. Automatic fallback to SQLite if MySQL not configured

✅ **Next Steps:**
1. Create MySQL database
2. Update `.env` with your MySQL credentials
3. Restart the application
4. Run seed script to populate data
5. Test all functionality

The migration is complete! The application will now use MySQL for better performance and scalability.
