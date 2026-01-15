# Firebase Integration Guide for YatraSathi

This document outlines the Firebase integration in the YatraSathi travel agency system, providing guidance on how to use Firebase services alongside the existing Node.js/Express backend.

## Services Integrated

1. **Firebase Authentication** - For user authentication
2. **Cloud Firestore** - For NoSQL database operations
3. **Firebase Storage** - For file storage and retrieval
4. **Firebase Analytics** - For app analytics

## Configuration

Firebase is configured in `frontend/src/config/firebase.js` with the following services initialized:

- `auth` - Firebase Authentication
- `db` - Cloud Firestore
- `storage` - Firebase Storage
- `analytics` - Firebase Analytics

## Available Services

### 1. Firebase Authentication (`firebaseAuth`)

Located in: `frontend/src/services/firebaseAuth.js`

Methods:
- `login(email, password)` - Sign in with email/password
- `register(email, password, displayName)` - Create new account
- `logout()` - Sign out
- `resetPassword(email)` - Send password reset email
- `getCurrentUser()` - Get current user object
- `isAuthenticated()` - Check authentication status

### 2. Firestore Database (`firebaseDB`)

Located in: `frontend/src/services/firebaseDB.js`

Methods:
- `addDocument(collectionName, data)` - Add document to collection
- `getCollection(collectionName, options)` - Get all documents from collection
- `getDocumentById(collectionName, docId)` - Get specific document
- `updateDocument(collectionName, docId, data)` - Update document
- `deleteDocument(collectionName, docId)` - Delete document
- `queryDocuments(collectionName, field, operator, value, options)` - Query documents

### 3. Firebase Storage (`firebaseStorage`)

Located in: `frontend/src/services/firebaseStorage.js`

Methods:
- `uploadFile(file, folderPath)` - Upload file to storage
- `getFileUrl(filePath)` - Get download URL
- `deleteFile(filePath)` - Delete file

## Integration with Existing System

The Firebase integration works alongside the existing authentication system:

- The `AuthContext` has been enhanced with Firebase methods
- Both authentication systems can coexist
- User data structure is compatible with existing role-based access control

### Enhanced AuthContext Methods:

- `firebaseLogin(email, password)` - Login with Firebase
- `firebaseRegister(email, password, displayName)` - Register with Firebase
- Standard `login`, `logout` methods remain unchanged

## Usage Examples

### Using Firebase Authentication

```javascript
import { useAuth } from './contexts/AuthContext';

const MyComponent = () => {
  const { firebaseLogin, firebaseRegister, logout } = useAuth();
  
  // Login with Firebase
  const handleFirebaseLogin = async () => {
    try {
      await firebaseLogin('user@example.com', 'password');
      // User is now logged in via Firebase
    } catch (error) {
      console.error('Login failed:', error);
    }
  };
  
  // Register with Firebase
  const handleFirebaseRegister = async () => {
    try {
      await firebaseRegister('user@example.com', 'password', 'John Doe');
      // User is now registered and logged in via Firebase
    } catch (error) {
      console.error('Registration failed:', error);
    }
  };
};
```

### Using Firestore

```javascript
import { firebaseDB } from './services/firebaseDB';

// Add a new booking record
const addBooking = async () => {
  try {
    const bookingData = {
      customerName: 'John Doe',
      travelDate: new Date(),
      destination: 'Delhi',
      status: 'confirmed'
    };
    
    const result = await firebaseDB.addDocument('bookings', bookingData);
    console.log('Booking added with ID:', result.id);
  } catch (error) {
    console.error('Error adding booking:', error);
  }
};

// Get recent bookings
const getRecentBookings = async () => {
  try {
    const bookings = await firebaseDB.getCollection('bookings', {
      orderBy: 'createdAt',
      direction: 'desc',
      limit: 10
    });
    return bookings;
  } catch (error) {
    console.error('Error getting bookings:', error);
  }
};
```

### Using Firebase Storage

```javascript
import { firebaseStorage } from './services/firebaseStorage';

const uploadProfilePicture = async (file) => {
  try {
    const result = await firebaseStorage.uploadFile(file, 'profile-pictures');
    console.log('File uploaded:', result.url);
    return result.url;
  } catch (error) {
    console.error('Upload failed:', error);
  }
};
```

## Firebase Demo Component

A demo component is available at `/firebase-demo` route to showcase Firebase functionality.

## Best Practices

1. **Hybrid Approach**: Use Firebase for features that benefit from real-time capabilities while keeping core business logic on your existing backend
2. **Data Synchronization**: Consider how Firebase data relates to your existing MySQL database
3. **Authentication**: You can authenticate via Firebase and still access your existing backend APIs
4. **Security Rules**: Configure Firestore security rules appropriately in the Firebase Console
5. **Cost Management**: Monitor Firebase usage to manage costs effectively

## Migration Strategy

If you decide to transition fully to Firebase:

1. Gradually move non-critical features to Firestore
2. Implement hybrid authentication (Firebase + JWT from your backend)
3. Migrate file storage to Firebase Storage
4. Consider using Firebase Functions for server-side logic if needed

## Troubleshooting

- Ensure your Firebase project has the correct security rules configured
- Check that Firebase services are enabled in your Firebase Console
- Verify that the web app is properly registered in Firebase
- Confirm that CORS settings allow your domain

## Next Steps

1. Customize Firebase security rules for your data
2. Implement specific Firebase features for your travel agency needs
3. Consider using Firebase Functions for complex server-side operations
4. Integrate Firebase Analytics for user behavior insights
5. Explore Firebase Push Notifications for booking updates