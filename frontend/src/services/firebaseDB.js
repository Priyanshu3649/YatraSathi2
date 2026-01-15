import { db } from '../config/firebase';
import { 
  collection, 
  addDoc, 
  getDocs, 
  getDoc, 
  doc, 
  updateDoc, 
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp
} from 'firebase/firestore';

// Firebase Firestore Service
export const firebaseDB = {
  // Add a document to a collection
  addDocument: async (collectionName, data) => {
    try {
      const docRef = await addDoc(collection(db, collectionName), {
        ...data,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      return { id: docRef.id, ...data };
    } catch (error) {
      throw new Error(error.message);
    }
  },

  // Get all documents from a collection
  getCollection: async (collectionName, options = {}) => {
    try {
      let q = collection(db, collectionName);
      
      if (options.orderBy) {
        q = query(q, orderBy(options.orderBy, options.direction || 'asc'));
      }
      
      if (options.limit) {
        q = query(q, limit(options.limit));
      }
      
      const querySnapshot = await getDocs(q);
      const documents = [];
      querySnapshot.forEach((doc) => {
        documents.push({ id: doc.id, ...doc.data() });
      });
      
      return documents;
    } catch (error) {
      throw new Error(error.message);
    }
  },

  // Get a specific document by ID
  getDocumentById: async (collectionName, docId) => {
    try {
      const docRef = doc(db, collectionName, docId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() };
      } else {
        return null;
      }
    } catch (error) {
      throw new Error(error.message);
    }
  },

  // Update a document
  updateDocument: async (collectionName, docId, data) => {
    try {
      const docRef = doc(db, collectionName, docId);
      await updateDoc(docRef, {
        ...data,
        updatedAt: serverTimestamp()
      });
      return { id: docId, ...data };
    } catch (error) {
      throw new Error(error.message);
    }
  },

  // Delete a document
  deleteDocument: async (collectionName, docId) => {
    try {
      const docRef = doc(db, collectionName, docId);
      await deleteDoc(docRef);
      return { success: true };
    } catch (error) {
      throw new Error(error.message);
    }
  },

  // Query documents with where clause
  queryDocuments: async (collectionName, field, operator, value, options = {}) => {
    try {
      let q = query(
        collection(db, collectionName),
        where(field, operator, value)
      );
      
      if (options.orderBy) {
        q = query(q, orderBy(options.orderBy, options.direction || 'asc'));
      }
      
      if (options.limit) {
        q = query(q, limit(options.limit));
      }
      
      const querySnapshot = await getDocs(q);
      const documents = [];
      querySnapshot.forEach((doc) => {
        documents.push({ id: doc.id, ...doc.data() });
      });
      
      return documents;
    } catch (error) {
      throw new Error(error.message);
    }
  }
};