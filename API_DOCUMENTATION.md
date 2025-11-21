# YatraSathi API Documentation

## Overview
This document provides comprehensive documentation for the YatraSathi API endpoints. The API follows REST principles and uses JSON for request/response bodies.

## Authentication
Most endpoints require authentication via JWT tokens. Include the token in the Authorization header:
```
Authorization: Bearer <token>
```

## API Endpoints

### Authentication
| Method | Endpoint | Description | User Type |
|--------|----------|-------------|-----------|
| POST | `/auth/register` | User registration | Public |
| POST | `/auth/login` | User login | Public |
| GET | `/auth/profile` | Get user profile | Authenticated |
| PUT | `/auth/profile` | Update user profile | Authenticated |
| POST | `/auth/forgot-password` | Request password reset | Public |
| POST | `/auth/reset-password` | Reset password | Public |
| POST | `/auth/verify-email` | Verify email address | Authenticated |

### Users
| Method | Endpoint | Description | User Type |
|--------|----------|-------------|-----------|
| GET | `/users` | Get all users | Admin |
| GET | `/users/:id` | Get user by ID | Admin |
| PUT | `/users/:id` | Update user | Admin |
| DELETE | `/users/:id` | Delete user | Admin |
| GET | `/users/my/profile` | Get own profile | Authenticated |
| PUT | `/users/my/profile` | Update own profile | Authenticated |

### Bookings
| Method | Endpoint | Description | User Type |
|--------|----------|-------------|-----------|
| POST | `/bookings` | Create booking | Customer |
| GET | `/bookings` | Get all bookings | Admin |
| GET | `/bookings/my-bookings` | Get customer bookings | Customer |
| GET | `/bookings/:id` | Get booking by ID | Customer/Admin |
| PUT | `/bookings/:id` | Update booking | Customer/Admin |
| DELETE | `/bookings/:id` | Delete booking | Customer/Admin |
| PUT | `/bookings/:id/status` | Update booking status | Admin/Employee |
| PUT | `/bookings/:id/assign` | Assign booking to employee | Admin |
| PUT | `/bookings/:id/cancel` | Cancel booking | Customer/Admin |

### Payments
| Method | Endpoint | Description | User Type |
|--------|----------|-------------|-----------|
| POST | `/payments` | Create payment | Accounts/Admin |
| GET | `/payments` | Get all payments | Accounts/Admin |
| GET | `/payments/my-payments` | Get customer payments | Customer |
| GET | `/payments/:id` | Get payment by ID | Accounts/Admin |
| PUT | `/payments/:id` | Update payment | Accounts/Admin |
| POST | `/payments/:id/refund` | Process refund | Accounts/Admin |

### Travel Plans
| Method | Endpoint | Description | User Type |
|--------|----------|-------------|-----------|
| POST | `/travel-plans` | Create travel plan | Customer |
| GET | `/travel-plans` | Get all travel plans | Admin |
| GET | `/travel-plans/my-plans` | Get customer plans | Customer |
| GET | `/travel-plans/:id` | Get plan by ID | Customer/Admin |
| PUT | `/travel-plans/:id` | Update travel plan | Customer/Admin |
| DELETE | `/travel-plans/:id` | Delete travel plan | Customer/Admin |
| POST | `/travel-plans/:id/share` | Share travel plan | Customer |

### Reports
| Method | Endpoint | Description | User Type |
|--------|----------|-------------|-----------|
| GET | `/reports/employee-performance` | Employee performance report | Admin |
| GET | `/reports/financial` | Financial summary report | Admin |
| GET | `/reports/corporate-customers` | Corporate customers report | Admin |
| GET | `/reports/customer-analytics` | Customer analytics report | Admin |
| GET | `/reports/bookings` | Booking summary report | Employee/Admin |
| GET | `/reports/travel-plan/:id` | Generate travel plan report | Customer |

### Audit
| Method | Endpoint | Description | User Type |
|--------|----------|-------------|-----------|
| GET | `/audit` | Get audit logs | Admin |
| GET | `/audit/my-logs` | Get user audit logs | Authenticated |
| GET | `/audit/user/:userId` | Get user logs | Admin |
| DELETE | `/audit/clear` | Clear audit logs | Admin |

### Configuration
| Method | Endpoint | Description | User Type |
|--------|----------|-------------|-----------|
| GET | `/config` | Get configuration | Admin |
| PUT | `/config` | Update configuration | Admin |
| GET | `/config/:key` | Get config value | Authenticated |
| DELETE | `/config/reset` | Reset configuration | Admin |

### Notifications
| Method | Endpoint | Description | User Type |
|--------|----------|-------------|-----------|
| GET | `/notifications` | Get user notifications | Authenticated |
| GET | `/notifications/history` | Get notification history | Authenticated |
| PUT | `/notifications/:notificationId/read` | Mark as read | Authenticated |
| PUT | `/notifications/read-all` | Mark all as read | Authenticated |
| DELETE | `/notifications/:notificationId` | Delete notification | Authenticated |

### Search
| Method | Endpoint | Description | User Type |
|--------|----------|-------------|-----------|
| GET | `/search` | Search all entities | Authenticated |
| GET | `/search/users` | Search users | Authenticated |
| GET | `/search/bookings` | Search bookings | Authenticated |
| GET | `/search/payments` | Search payments | Accounts/Admin |

### Statistics
| Method | Endpoint | Description | User Type |
|--------|----------|-------------|-----------|
| GET | `/statistics/system` | System statistics | Admin |
| GET | `/statistics/bookings` | Booking statistics | Authenticated |
| GET | `/statistics/financial` | Financial statistics | Accounts/Admin |
| GET | `/statistics/employees` | Employee statistics | Management/Admin |
| GET | `/statistics/corporate` | Corporate statistics | Relationship Manager/Admin |

## Request/Response Examples

### User Registration
**Request:**
```json
POST /api/auth/register
{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "9876543210",
  "password": "SecurePass123",
  "userType": "customer"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "user_id",
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "9876543210",
    "userType": "customer",
    "token": "jwt_token"
  }
}
```

### User Login
**Request:**
```json
POST /api/auth/login
{
  "email": "john@example.com",
  "password": "SecurePass123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "user_id",
    "name": "John Doe",
    "email": "john@example.com",
    "token": "jwt_token"
  }
}
```

### Create Booking
**Request:**
```json
POST /api/bookings
{
  "origin": "MUMBAI",
  "destination": "DELHI",
  "travelDate": "2023-12-25",
  "class": "3A",
  "berthPreference": "LB",
  "totalTickets": 2,
  "passengers": [
    {
      "name": "John Doe",
      "age": 30,
      "gender": "M"
    },
    {
      "name": "Jane Doe",
      "age": 25,
      "gender": "F"
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "booking_id",
    "customerId": "user_id",
    "origin": "MUMBAI",
    "destination": "DELHI",
    "travelDate": "2023-12-25T00:00:00.000Z",
    "class": "3A",
    "berthPreference": "LB",
    "totalTickets": 2,
    "passengers": [
      {
        "name": "John Doe",
        "age": 30,
        "gender": "M"
      },
      {
        "name": "Jane Doe",
        "age": 25,
        "gender": "F"
      }
    ],
    "status": "PENDING",
    "createdAt": "2023-12-01T10:00:00.000Z"
  }
}
```

## Rate Limiting
API requests are rate-limited to prevent abuse:
- 100 requests per hour per IP for unauthenticated requests
- 1000 requests per hour per user for authenticated requests

## CORS
CORS is enabled for all origins in development. In production, it should be restricted to specific domains.

## WebSockets
The application uses Socket.IO for real-time notifications. Connect to the WebSocket server at the same base URL.

## Data Validation
All input data is validated on the server-side. Validation rules include:
- Email format validation
- Phone number validation (Indian format)
- Password strength requirements
- Date format validation
- Numeric value validation
- Enum value validation

## Security
- Passwords are hashed using bcrypt
- JWT tokens are used for authentication
- Input validation and sanitization
- Role-based access control
- Audit logging for all actions
- Rate limiting to prevent abuse