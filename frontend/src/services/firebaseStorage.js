import { storage } from '../config/firebase';
import { 
  ref, 
  uploadBytes, 
  getDownloadURL, 
  deleteObject 
} from 'firebase/storage';

// Firebase Storage Service
export const firebaseStorage = {
  // Upload file to Firebase Storage
  uploadFile: async (file, folderPath = 'files') => {
    try {
      // Create a unique filename
      const fileName = `${Date.now()}_${file.name}`;
      const storageRef = ref(storage, `${folderPath}/${fileName}`);
      
      // Upload the file
      const snapshot = await uploadBytes(storageRef, file);
      
      // Get the download URL
      const downloadURL = await getDownloadURL(snapshot.ref);
      
      return {
        url: downloadURL,
        name: fileName,
        size: file.size,
        type: file.type
      };
    } catch (error) {
      throw new Error(error.message);
    }
  },

  // Get download URL for a file
  getFileUrl: async (filePath) => {
    try {
      const storageRef = ref(storage, filePath);
      const downloadURL = await getDownloadURL(storageRef);
      return downloadURL;
    } catch (error) {
      throw new Error(error.message);
    }
  },

  // Delete file from Firebase Storage
  deleteFile: async (filePath) => {
    try {
      const storageRef = ref(storage, filePath);
      await deleteObject(storageRef);
      return { success: true };
    } catch (error) {
      throw new Error(error.message);
    }
  }
};