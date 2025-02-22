import React, { useState, useEffect } from 'react';
import axios from 'axios';

const FileUpload = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [files, setFiles] = useState([]);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetchFiles();
  }, []);

  const fetchFiles = async () => {
    try {
      const { data } = await axios.get('http://localhost:5000/api/files/files');
      setFiles(data.files);
    } catch (err) {
      setError('Error fetching files');
    }
  };

  const handleFileSelect = (event) => {
    setSelectedFile(event.target.files[0]);
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setError('Please select a file');
      return;
    }

    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      await axios.post('http://localhost:5000/api/files/uploads', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setMessage('File uploaded successfully');
      setSelectedFile(null);
      setTimeout(() => {
        window.location.reload(); // Refresh the file list
      }, 1000); 
    } catch (err) {
      setError(err.response?.data?.message || 'Error uploading file');
    }
  };

  const handleDownload = async (filename) => {
    try {
      const { data } = await axios.get(`http://localhost:5000/api/files/download/${filename}`, {
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(new Blob([data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      setError('Error downloading file');
    }
  };

  const handleDelete = async (filename) => {
    try {
      await axios.delete(`http://localhost:5000/api/files/files/${filename}`);
      setMessage('File deleted successfully');
      setTimeout(() => {
        window.location.reload(); // Refresh the file list
      }, 1000);  // Refresh file list
    } catch (err) {
      setError('Error deleting file');
    }
  };

  return (
    <div className="file-upload-container">
      <h2>File Upload</h2>

      {message && <div className="success-message">{message}</div>}
      {error && <div className="error-message">{error}</div>}

      <div className="upload-section">
        <input
          type="file"
          onChange={handleFileSelect}
          className="file-input"
        />
        <button onClick={handleUpload} className="upload-button">
          Upload
        </button>
      </div>

      <div className="files-list">
        <h3>Uploaded Files</h3>
        {files.map((file, index) => (
          <div key={index} className="file-item">
            <span>{file.filename}</span>
            <div className="file-actions">
              <button onClick={() => handleDownload(file.filename)}>
                Download
              </button>
              <button onClick={() => handleDelete(file.filename)}>
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FileUpload;
