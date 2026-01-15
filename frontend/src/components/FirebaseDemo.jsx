import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { firebaseDB } from '../services/firebaseDB';
import { firebaseStorage } from '../services/firebaseStorage';

const FirebaseDemo = () => {
  const { user, firebaseLogin, firebaseRegister } = useAuth();
  const [demoData, setDemoData] = useState([]);
  const [newItem, setNewItem] = useState('');
  const [file, setFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedFileUrl, setUploadedFileUrl] = useState('');

  // Load demo data from Firestore
  useEffect(() => {
    const loadDemoData = async () => {
      try {
        const data = await firebaseDB.getCollection('demoItems', { orderBy: 'createdAt', direction: 'desc', limit: 10 });
        setDemoData(data);
      } catch (error) {
        console.error('Error loading demo data:', error);
      }
    };

    loadDemoData();
  }, []);

  const handleAddItem = async () => {
    if (!newItem.trim()) return;

    try {
      const result = await firebaseDB.addDocument('demoItems', {
        text: newItem,
        userId: user?.us_usid || 'anonymous',
        userName: user?.us_fname || 'Anonymous'
      });
      
      setDemoData([result, ...demoData]);
      setNewItem('');
    } catch (error) {
      console.error('Error adding item:', error);
    }
  };

  const handleFileUpload = async () => {
    if (!file) return;

    try {
      const result = await firebaseStorage.uploadFile(file, 'demo-files');
      setUploadedFileUrl(result.url);
      console.log('File uploaded:', result);
    } catch (error) {
      console.error('Error uploading file:', error);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h2>Firebase Integration Demo</h2>
      
      <div style={{ marginBottom: '20px' }}>
        <h3>Authentication Status</h3>
        {user ? (
          <div>
            <p>Logged in as: {user.us_fname} ({user.us_email})</p>
            <p>User ID: {user.us_usid}</p>
            {user.isFirebaseUser && <p><strong>Firebase User</strong></p>}
          </div>
        ) : (
          <p>Not logged in</p>
        )}
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h3>Add Demo Item</h3>
        <div style={{ display: 'flex', gap: '10px' }}>
          <input
            type="text"
            value={newItem}
            onChange={(e) => setNewItem(e.target.value)}
            placeholder="Enter item text"
            style={{ flex: 1, padding: '8px' }}
          />
          <button onClick={handleAddItem} style={{ padding: '8px 16px' }}>
            Add Item
          </button>
        </div>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h3>Upload File</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <input
            type="file"
            onChange={(e) => setFile(e.target.files[0])}
            style={{ padding: '8px' }}
          />
          <button onClick={handleFileUpload} style={{ padding: '8px 16px' }}>
            Upload File
          </button>
          {uploadedFileUrl && (
            <div>
              <p>File uploaded successfully!</p>
              <a href={uploadedFileUrl} target="_blank" rel="noopener noreferrer">
                View File
              </a>
            </div>
          )}
        </div>
      </div>

      <div>
        <h3>Demo Items ({demoData.length})</h3>
        <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
          {demoData.map((item) => (
            <div key={item.id} style={{ 
              padding: '10px', 
              margin: '5px 0', 
              border: '1px solid #ccc', 
              borderRadius: '4px' 
            }}>
              <strong>{item.userName}:</strong> {item.text}
              <div style={{ fontSize: '0.8em', color: '#666', marginTop: '5px' }}>
                ID: {item.id} | {item.createdAt?.toDate ? item.createdAt.toDate().toLocaleString() : 'N/A'}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FirebaseDemo;