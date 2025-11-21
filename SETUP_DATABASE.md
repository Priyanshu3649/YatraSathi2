# Database Setup Instructions

## Prerequisites
1. Install MySQL 8.0 or later
2. Ensure MySQL service is running

## Database Setup

1. Create the database:
```sql
CREATE DATABASE yatrasathi CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

2. Create a database user (optional but recommended):
```sql
CREATE USER 'yatrasathi_user'@'localhost' IDENTIFIED BY 'your_secure_password';
GRANT ALL PRIVILEGES ON yatrasathi.* TO 'yatrasathi_user'@'localhost';
FLUSH PRIVILEGES;
```

3. Update your .env file with the database credentials:
```env
DB_HOST=localhost
DB_USER=yatrasathi_user
DB_PASSWORD=your_secure_password
DB_NAME=yatrasathi
```

## Alternative: Use root user (for development only)
If you want to use the root user for development:

1. Update your .env file:
```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_root_password
DB_NAME=yatrasathi
```

## Testing the Connection
After setting up the database, you can test the connection:
```bash
npm run test-models
```

## Seeding Initial Data
Once the database is set up and connected, you can seed initial data:
```bash
npm run seed
```