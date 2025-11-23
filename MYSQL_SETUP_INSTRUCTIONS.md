# MySQL Setup Instructions

## Quick Setup

The application is now configured to use MySQL. Follow these steps:

### Step 1: Run the Setup Script

```bash
./setup-mysql.sh
```

This script will:
- Check if MySQL is installed
- Create the `yatrasathi` database
- Optionally create a dedicated database user
- Guide you through the setup process

### Step 2: Update .env File

Your `.env` file already has MySQL configuration:

```env
NODE_ENV=development
PORT=5003
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=yatrasathi
JWT_SECRET=default_secret
```

**Update the DB_PASSWORD:**
- If you have a MySQL root password, add it to `DB_PASSWORD=your_password`
- If you created a dedicated user, update `DB_USER` and `DB_PASSWORD`

### Step 3: Restart the Application

Stop the current server (if running) and restart:

```bash
npm start
```

You should see:
```
Using MySQL database: yatrasathi
Database connected successfully
All models were synchronized successfully
```

### Step 4: Seed Initial Data

```bash
npm run seed
```

This will create:
- Admin user (admin@example.com / admin123)
- Sample roles and permissions
- Sample employees and customers
- Sample stations and trains

## Manual Setup (Alternative)

If you prefer to set up manually:

### 1. Login to MySQL

```bash
mysql -u root -p
```

### 2. Create Database

```sql
CREATE DATABASE yatrasathi CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 3. Create User (Optional but Recommended)

```sql
CREATE USER 'yatrasathi_user'@'localhost' IDENTIFIED BY 'your_secure_password';
GRANT ALL PRIVILEGES ON yatrasathi.* TO 'yatrasathi_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

### 4. Update .env

```env
DB_HOST=localhost
DB_USER=yatrasathi_user
DB_PASSWORD=your_secure_password
DB_NAME=yatrasathi
```

### 5. Restart Application

```bash
npm start
```

## Verification

### Check Database Connection

Look for this in the console:
```
Using MySQL database: yatrasathi
Database connected successfully
```

### Verify Tables

```bash
mysql -u root -p yatrasathi -e "SHOW TABLES;"
```

You should see 20+ tables created.

### Test the Application

1. Open: http://localhost:3001
2. Login with admin credentials
3. Verify all features work

## Troubleshooting

### Error: Access Denied

**Problem:** Wrong MySQL credentials

**Solution:** 
1. Test your credentials: `mysql -u root -p`
2. Update `.env` with correct password
3. Restart the application

### Error: Database Does Not Exist

**Problem:** Database not created

**Solution:**
```bash
mysql -u root -p -e "CREATE DATABASE yatrasathi;"
```

### Error: Can't Connect to MySQL

**Problem:** MySQL not running

**Solution:**
```bash
# macOS
brew services start mysql

# Linux
sudo systemctl start mysql

# Check status
brew services list  # macOS
sudo systemctl status mysql  # Linux
```

### Error: ER_NOT_SUPPORTED_AUTH_MODE

**Problem:** MySQL 8+ authentication issue

**Solution:**
```sql
ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY 'your_password';
FLUSH PRIVILEGES;
```

## Rollback to SQLite

If you want to go back to SQLite:

1. Remove MySQL variables from `.env`:
```env
NODE_ENV=development
PORT=5003
JWT_SECRET=default_secret
```

2. Restart the application - it will automatically use SQLite

## Current Status

✅ **Configuration Updated:**
- `config/db.js` - Now supports MySQL with automatic detection
- `.env` - MySQL credentials added
- Setup script created for easy database creation

✅ **How It Works:**
- If `DB_NAME` and `DB_HOST` are set in `.env` → Uses MySQL
- If not set → Falls back to SQLite
- Automatic detection, no code changes needed

✅ **Next Steps:**
1. Run `./setup-mysql.sh` to create the database
2. Update `.env` with your MySQL password
3. Restart the application with `npm start`
4. Run `npm run seed` to populate data

The migration is ready! Just run the setup script and restart the application.
