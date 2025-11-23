#!/bin/bash

# YatraSathi MySQL Setup Script
# This script will create the MySQL database for YatraSathi

echo "========================================="
echo "YatraSathi MySQL Database Setup"
echo "========================================="
echo ""

# Check if MySQL is installed
if ! command -v mysql &> /dev/null; then
    echo "❌ MySQL is not installed!"
    echo ""
    echo "Please install MySQL first:"
    echo "  macOS:   brew install mysql"
    echo "  Ubuntu:  sudo apt install mysql-server"
    echo "  Windows: Download from https://dev.mysql.com/downloads/mysql/"
    exit 1
fi

echo "✅ MySQL is installed"
echo ""

# Prompt for MySQL root password
echo "Please enter your MySQL root password:"
echo "(Press Enter if there is no password)"
read -s MYSQL_PASSWORD

echo ""
echo "Creating database..."

# Create database
if [ -z "$MYSQL_PASSWORD" ]; then
    # No password
    mysql -u root -e "CREATE DATABASE IF NOT EXISTS yatrasathi CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;" 2>/dev/null
    RESULT=$?
else
    # With password
    mysql -u root -p"$MYSQL_PASSWORD" -e "CREATE DATABASE IF NOT EXISTS yatrasathi CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;" 2>/dev/null
    RESULT=$?
fi

if [ $RESULT -eq 0 ]; then
    echo "✅ Database 'yatrasathi' created successfully!"
else
    echo "❌ Failed to create database. Please check your MySQL credentials."
    exit 1
fi

echo ""
echo "Do you want to create a dedicated database user? (recommended for production)"
echo "Enter 'yes' to create a user, or press Enter to skip:"
read CREATE_USER

if [ "$CREATE_USER" = "yes" ]; then
    echo ""
    echo "Enter username for the new database user (default: yatrasathi_user):"
    read DB_USER
    DB_USER=${DB_USER:-yatrasathi_user}
    
    echo "Enter password for the new database user:"
    read -s DB_USER_PASSWORD
    
    echo ""
    echo "Creating user..."
    
    if [ -z "$MYSQL_PASSWORD" ]; then
        mysql -u root -e "CREATE USER IF NOT EXISTS '$DB_USER'@'localhost' IDENTIFIED BY '$DB_USER_PASSWORD';" 2>/dev/null
        mysql -u root -e "GRANT ALL PRIVILEGES ON yatrasathi.* TO '$DB_USER'@'localhost';" 2>/dev/null
        mysql -u root -e "FLUSH PRIVILEGES;" 2>/dev/null
    else
        mysql -u root -p"$MYSQL_PASSWORD" -e "CREATE USER IF NOT EXISTS '$DB_USER'@'localhost' IDENTIFIED BY '$DB_USER_PASSWORD';" 2>/dev/null
        mysql -u root -p"$MYSQL_PASSWORD" -e "GRANT ALL PRIVILEGES ON yatrasathi.* TO '$DB_USER'@'localhost';" 2>/dev/null
        mysql -u root -p"$MYSQL_PASSWORD" -e "FLUSH PRIVILEGES;" 2>/dev/null
    fi
    
    echo "✅ User '$DB_USER' created successfully!"
    echo ""
    echo "📝 Update your .env file with these credentials:"
    echo "DB_USER=$DB_USER"
    echo "DB_PASSWORD=$DB_USER_PASSWORD"
fi

echo ""
echo "========================================="
echo "✅ MySQL Setup Complete!"
echo "========================================="
echo ""
echo "Next steps:"
echo "1. Make sure your .env file has these settings:"
echo "   DB_HOST=localhost"
echo "   DB_USER=root (or your custom user)"
echo "   DB_PASSWORD=your_password"
echo "   DB_NAME=yatrasathi"
echo ""
echo "2. Restart your application:"
echo "   npm start"
echo ""
echo "3. Run the seed script to populate initial data:"
echo "   npm run seed"
echo ""
echo "The application will now use MySQL instead of SQLite!"
echo ""
