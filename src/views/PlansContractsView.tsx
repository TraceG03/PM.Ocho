import React, { useState, useRef } from 'react';
import { Plus, Eye, Trash2, X, Upload, FileText, File, Download } from 'lucide-react';
import { useApp } from '../context/AppContext';

const PlansContractsView: React.FC = () => {
  const { documents, addDocument, deleteDocument, uploadFile, getFile } = useApp();
  
  const [showUpload, setShowUpload] = useState(false);
  const [viewingDocument, setViewingDocument] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [documentForm, setDocumentForm] = useState({
    type: 'Plan' as 'Plan' | 'Contract',
    title: '',
    description: '',
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = async (file: File) => {
    if (!file) return;

    setUploading(true);
    try {
      const uploadedFile = await uploadFile(file);
      
      // Extract text content for AI access
      let textContent = '';
      if (file.type === 'text/plain' || file.name.endsWith('.txt')) {
        try {
          const reader = new FileReader();
          textContent = await new Promise<string>((resolve, reject) => {
            reader.onload = (e) => resolve(e.target?.result as string);
            reader.onerror = reject;
            reader.readAsText(file);
          });
        } catch (error) {
          textContent = `Text Document: ${file.name}\n\nType: ${documentForm.type}\nTitle: ${documentForm.title || file.name}\nDescription: ${documentForm.description || 'No description'}`;
        }
      } else if (file.type.includes('pdf') || file.name.endsWith('.pdf')) {
        textContent = `PDF Document: ${file.name}\n\nType: ${documentForm.type}\nTitle: ${documentForm.title || file.name}\nDescription: ${documentForm.description || 'No description'}\n\n[PDF content extraction: The document "${file.name}" has been uploaded. While full text extraction from PDFs requires additional libraries, you can ask me questions about this document and I'll reference it by name and metadata.]`;
      } else if (file.type.includes('image') || /\.(jpg|jpeg|png|gif|bmp|webp|svg)$/i.test(file.name)) {
        textContent = `Image Document: ${file.name}\n\nType: ${documentForm.type}\nTitle: ${documentForm.title || file.name}\nDescription: ${documentForm.description || 'No description'}\n\n[This is an image file. You can view it in the document viewer.]`;
      } else {
        textContent = `Document: ${file.name}\n\nType: ${documentForm.type}\nTitle: ${documentForm.title || file.name}\nDescription: ${documentForm.description || 'No description'}\nFile Type: ${file.type}\nFile Size: ${(file.size / 1024).toFixed(2)} KB`;
      }

      await addDocument({
        type: documentForm.type,
        title: documentForm.title || file.name,
        description: documentForm.description,
        fileId: uploadedFile.id,
        textContent,
      });

      setDocumentForm({
        type: 'Plan',
        title: '',
        description: '',
      });
      setShowUpload(false);
    } catch (error) {
      alert('Failed to upload document. Please try again.');
      console.error('Document upload error:', error);
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) await processFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) await processFile(files[0]);
  };

  const selectedDocument = documents.find(d => d.id === viewingDocument);
  const selectedFile = selectedDocument ? getFile(selectedDocument.fileId) : null;

  const getFileIcon = (fileType: string) => {
    if (fileType.includes('pdf')) return <FileText size={24} className="text-red-500" />;
    if (fileType.includes('image')) return <File size={24} className="text-blue-500" />;
    return <File size={24} className="text-gray-500" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const downloadFile = () => {
    if (selectedFile) {
      const link = document.createElement('a');
      link.href = selectedFile.dataUrl;
      link.download = selectedFile.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const downloadFileById = (fileId: string) => {
    const file = getFile(fileId);
    if (file) {
      const link = document.createElement('a');
      link.href = file.dataUrl;
      link.download = file.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const getFilePreview = (file: typeof selectedFile) => {
    if (!file) return null;
    
    if (file.type.includes('image')) {
      return (
        <img
          src={file.dataUrl}
          alt={file.name}
          className="w-full h-full object-cover rounded-lg"
        />
      );
    }
    
    if (file.type.includes('pdf')) {
      return (
        <div className="w-full h-full bg-red-50 rounded-lg flex items-center justify-center">
          <FileText size={32} className="text-red-500" />
        </div>
      );
    }
    
    return (
      <div className="w-full h-full bg-gray-100 rounded-lg flex items-center justify-center">
        <File size={32} className="text-gray-400" />
      </div>
    );
  };

  return (
    <div className="pb-20 min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm sticky top-0 z-10">
        <div className="px-4 py-4">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Plans & Contracts</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Upload and manage project documents</p>
        </div>
      </div>

      {/* Upload Section */}
      <div className="px-4 mt-4">
        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm p-4">
          <button
            onClick={() => setShowUpload(!showUpload)}
            className="w-full flex items-center justify-between text-left"
          >
            <span className="font-semibold text-gray-900 dark:text-white">Upload Document</span>
            <Plus size={20} className="text-gray-400 dark:text-gray-500" />
          </button>

          {showUpload && (
            <div className="mt-4 space-y-3">
              <select
                value={documentForm.type}
                onChange={(e) => setDocumentForm({ ...documentForm, type: e.target.value as 'Plan' | 'Contract' })}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-accent-purple"
              >
                <option value="Plan">Plan</option>
                <option value="Contract">Contract</option>
              </select>
              <input
                type="text"
                placeholder="Document Title"
                value={documentForm.title}
                onChange={(e) => setDocumentForm({ ...documentForm, title: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-accent-purple"
              />
              <textarea
                placeholder="Description (optional)"
                value={documentForm.description}
                onChange={(e) => setDocumentForm({ ...documentForm, description: e.target.value })}
                rows={3}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-accent-purple resize-none"
              />
              
              <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileSelect}
                className="hidden"
              />
              
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 border-dashed transition-all cursor-pointer ${
                  isDragging
                    ? 'border-accent-purple bg-purple-100 scale-105'
                    : 'border-gray-300 text-gray-700 hover:border-accent-purple hover:bg-purple-50'
                } ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <Upload size={20} />
                <span>{uploading ? 'Uploading...' : isDragging ? 'Drop file here' : 'Select Any File to Upload or Drag & Drop'}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Documents List */}
      <div className="px-4 mt-4">
        <h2 className="text-lg font-semibold text-gray-900 mb-3">
          Documents ({documents.length})
        </h2>
        
        {documents.length === 0 ? (
          <div className="bg-white rounded-3xl shadow-sm p-8 text-center">
            <FileText size={48} className="mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500">No documents uploaded yet</p>
            <p className="text-sm text-gray-400 mt-1">Upload plans and contracts to get started</p>
          </div>
        ) : (
          <div className="space-y-3">
            {documents.map((document) => {
              const file = getFile(document.fileId);
              return (
                <div
                  key={document.id}
                  className="bg-white rounded-3xl shadow-sm p-4 border border-gray-100 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start gap-4">
                    {/* File Preview Thumbnail */}
                    {file && (
                      <div 
                        className="w-24 h-24 flex-shrink-0 rounded-lg overflow-hidden bg-gray-50 border border-gray-200 cursor-pointer"
                        onClick={() => setViewingDocument(document.id)}
                        title="Click to view"
                      >
                        {getFilePreview(file)}
                      </div>
                    )}
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            document.type === 'Plan'
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-purple-100 text-purple-700'
                          }`}
                        >
                          {document.type}
                        </span>
                        <span className="text-xs text-gray-500">
                          {formatDate(document.uploadedAt)}
                        </span>
                      </div>
                      <h3 className="font-semibold text-gray-900 mb-1">{document.title}</h3>
                      {document.description && (
                        <p className="text-sm text-gray-600 mb-2 line-clamp-2">{document.description}</p>
                      )}
                      {file && (
                        <div className="flex items-center gap-2 mt-2 p-2 bg-gray-50 rounded-lg">
                          {getFileIcon(file.type)}
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-gray-900 truncate">{file.name}</p>
                            <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="flex flex-col gap-2 ml-2">
                      <button
                        onClick={() => setViewingDocument(document.id)}
                        className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                        title="View file"
                      >
                        <Eye size={18} />
                      </button>
                      <button
                        onClick={() => downloadFileById(document.fileId)}
                        className="p-2 text-gray-400 hover:text-green-500 hover:bg-green-50 rounded-lg transition-colors"
                        title="Download file"
                      >
                        <Download size={18} />
                      </button>
                      <button
                        onClick={async () => {
                          if (confirm(`Are you sure you want to delete "${document.title}"?`)) {
                            try {
                              await deleteDocument(document.id);
                            } catch (error) {
                              console.error('Error deleting document:', error);
                              alert('Failed to delete document. Please try again.');
                            }
                          }
                        }}
                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete document"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Document Viewer Modal */}
      {viewingDocument && selectedFile && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">{selectedDocument?.title}</h2>
              <div className="flex gap-2">
                <button
                  onClick={downloadFile}
                  className="p-2 text-gray-400 hover:text-blue-500"
                >
                  <Download size={20} />
                </button>
                <button
                  onClick={() => setViewingDocument(null)}
                  className="p-2 text-gray-400 hover:text-gray-600"
                >
                  <X size={20} />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-auto p-4 bg-gray-50">
              {selectedFile.type.includes('image') ? (
                <div className="flex items-center justify-center min-h-full">
                  <img
                    src={selectedFile.dataUrl}
                    alt={selectedFile.name}
                    className="max-w-full max-h-[70vh] h-auto rounded-lg shadow-lg object-contain"
                  />
                </div>
              ) : selectedFile.type.includes('pdf') ? (
                <iframe
                  src={selectedFile.dataUrl}
                  className="w-full h-full min-h-[600px] rounded-lg border border-gray-200"
                  title={selectedFile.name}
                />
              ) : selectedFile.type.includes('text') || selectedFile.name.endsWith('.txt') ? (
                <div className="bg-white rounded-lg p-6 shadow-sm">
                  <pre className="whitespace-pre-wrap text-sm text-gray-700 font-mono">
                    {(() => {
                      try {
                        const base64Match = selectedFile.dataUrl.match(/^data:text\/plain;base64,(.+)$/);
                        if (base64Match) {
                          return atob(base64Match[1]);
                        }
                        return 'Unable to display text content';
                      } catch (e) {
                        return 'Unable to display text content';
                      }
                    })()}
                  </pre>
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="mb-4">
                    {getFileIcon(selectedFile.type)}
                  </div>
                  <p className="text-lg font-medium text-gray-900 mb-2">{selectedFile.name}</p>
                  <p className="text-sm text-gray-500 mb-6">
                    {formatFileSize(selectedFile.size)} • {selectedFile.type || 'Unknown type'}
                  </p>
                  <button
                    onClick={downloadFile}
                    className="px-6 py-3 bg-accent-purple text-white rounded-xl hover:shadow-md transition-shadow font-medium flex items-center gap-2 mx-auto"
                  >
                    <Download size={20} />
                    Download File
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlansContractsView;
