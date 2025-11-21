# User Session Management Implementation

## Overview
This document describes the implementation of user session management for the YatraSathi travel agency system. The session management system provides tracking and control of user sessions across multiple devices, with features for login, logout, and session monitoring.

## Components

### 1. Session Model
The Session model ([Session.js](file:///Users/priyanshu/Desktop/YatraSathi/src/models/Session.js)) tracks user sessions with the following fields:
- **ss_start**: Session start time (primary key)
- **ss_ssid**: Session ID (primary key)
- **ss_usid**: User ID (primary key)
- **ss_coid**: Company ID
- **ss_ipaddr**: IP address of the client
- **ss_useragent**: User agent string
- **ss_token**: Session token
- **ss_active**: Active status (1 = active, 0 = inactive)
- **ss_lastact**: Last activity timestamp
- **ss_end**: Session end time
- **Audit fields**: edtm, eby, mdtm, mby (for tracking creation and modification)

### 2. Session Service
The Session Service ([sessionService.js](file:///Users/priyanshu/Desktop/YatraSathi/src/services/sessionService.js)) provides business logic for session management:
- **createSession()**: Creates a new user session
- **validateSession()**: Validates an existing session
- **endSession()**: Ends a specific user session
- **getUserSessions()**: Retrieves all active sessions for a user
- **endAllUserSessions()**: Ends all sessions for a user (logout from all devices)
- **cleanupExpiredSessions()**: Cleans up expired sessions (periodic maintenance)

### 3. Session Middleware
The Session Middleware ([sessionMiddleware.js](file:///Users/priyanshu/Desktop/YatraSathi/src/middleware/sessionMiddleware.js)) provides middleware functions for session validation:
- **sessionAuth**: Validates user sessions
- **createSession**: Creates a new session after successful login

### 4. Auth Controller Updates
The Auth Controller ([authController.js](file:///Users/priyanshu/Desktop/YatraSathi/src/controllers/authController.js)) was updated to include session management functions:
- **loginUser()**: Now creates a session upon successful login
- **logoutUser()**: Ends a specific user session
- **getUserSessions()**: Retrieves all active sessions for a user
- **logoutAllDevices()**: Ends all sessions for a user

### 5. Auth Routes
New endpoints were added to the Auth Routes ([authRoutes.js](file:///Users/priyanshu/Desktop/YatraSathi/src/routes/authRoutes.js)):
- **POST /api/auth/logout**: Logout a user from a specific session
- **GET /api/auth/sessions**: Get all active sessions for a user
- **POST /api/auth/logout-all**: Logout a user from all devices/sessions

## Implementation Details

### Session Creation
When a user successfully logs in:
1. A unique session ID is generated using crypto.randomBytes()
2. User information is retrieved
3. IP address and user agent are captured from the request
4. A new session record is created in the database
5. The session ID is returned to the client

### Session Validation
When accessing protected routes:
1. Session token is retrieved from cookies, headers, or query parameters
2. Session is validated against the database
3. Session expiration is checked (24-hour limit)
4. Last activity timestamp is updated
5. Request proceeds if session is valid

### Session Termination
Users can logout in two ways:
1. **Single session logout**: Ends only the current session
2. **All devices logout**: Ends all active sessions for the user

### Session Cleanup
Expired sessions are automatically cleaned up through the cleanupExpiredSessions() function, which can be scheduled to run periodically.

## API Endpoints

### Login with Session Creation
```
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}

Response:
{
  "id": "USR1234567890",
  "name": "User Name",
  "email": "user@example.com",
  "userType": "customer",
  "token": "jwt_token_here",
  "sessionId": "session_id_here",
  "message": "Login successful"
}
```

### Get User Sessions
```
GET /api/auth/sessions
Authorization: Bearer jwt_token_here

Response:
{
  "sessions": [
    {
      "ss_start": "2023-01-01T10:00:00.000Z",
      "ss_ssid": "session_id_1",
      "ss_ipaddr": "192.168.1.1",
      "ss_useragent": "Mozilla/5.0...",
      "ss_lastact": "2023-01-01T10:30:00.000Z"
    },
    {
      "ss_start": "2023-01-01T11:00:00.000Z",
      "ss_ssid": "session_id_2",
      "ss_ipaddr": "10.0.0.1",
      "ss_useragent": "MobileApp/1.0",
      "ss_lastact": "2023-01-01T11:15:00.000Z"
    }
  ]
}
```

### Logout Single Session
```
POST /api/auth/logout
Authorization: Bearer jwt_token_here
Content-Type: application/json

{
  "sessionId": "session_id_here"
}

Response:
{
  "message": "Logout successful"
}
```

### Logout All Sessions
```
POST /api/auth/logout-all
Authorization: Bearer jwt_token_here

Response:
{
  "message": "Logged out from all devices. 3 sessions ended.",
  "sessionsEnded": 3
}
```

## Security Considerations

1. **Session ID Generation**: Uses cryptographically secure random bytes
2. **Session Expiration**: Sessions automatically expire after 24 hours
3. **Secure Cookies**: Session cookies are HTTP-only and secure in production
4. **IP and User Agent Tracking**: Sessions track client information for security monitoring
5. **Audit Trail**: All session activities are logged with timestamps and user information

## Testing

Comprehensive tests have been created to verify all session management functionality:
- Session creation during login
- Retrieval of active sessions
- Single session logout
- Logout from all devices
- Session validation

All tests pass successfully, confirming the session management system is working correctly.