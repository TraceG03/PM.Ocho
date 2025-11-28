import React, { useState, useRef } from 'react';
import { Plus, Eye, Trash2, X, Upload, FileText, File, Download, FileCheck } from 'lucide-react';
import { useApp } from '../context/AppContext';

const PlansContractsView: React.FC = () => {
  const { documents, files, addDocument, deleteDocument, uploadFile, getFile, updateDocumentText } = useApp();
  const [showUpload, setShowUpload] = useState(false);
  const [viewingDocument, setViewingDocument] = useState<string | null>(null);
  const [documentForm, setDocumentForm] = useState({
    type: 'Plan' as 'Plan' | 'Contract',
    title: '',
    description: '',
  });
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      // Upload the file
      const fileId = await uploadFile(file);
      const uploadedFile = getFile(fileId);
      
      if (!uploadedFile) {
        throw new Error('File upload failed');
      }

      // Extract text content for AI access
      let textContent = '';
      if (file.type === 'text/plain') {
        const reader = new FileReader();
        textContent = await new Promise<string>((resolve, reject) => {
          reader.onload = (e) => resolve(e.target?.result as string);
          reader.onerror = reject;
          reader.readAsText(file);
        });
      } else if (file.type.includes('pdf')) {
        // For PDFs, extract text from base64 data URL
        // Note: This is a simplified extraction. For production, use a PDF parsing library like pdf.js
        try {
          const base64Data = uploadedFile.dataUrl.split(',')[1];
          // Try to decode and extract readable text
          // This is a basic implementation - full PDF parsing would require a library
          textContent = `PDF Document: ${file.name}\n\nType: ${documentForm.type}\nTitle: ${documentForm.title || file.name}\nDescription: ${documentForm.description || 'No description'}\n\n[PDF content extraction: The document "${file.name}" has been uploaded. While full text extraction from PDFs requires additional libraries, you can ask me questions about this document and I'll reference it by name and metadata. For full text search, consider uploading the document content as a text file or using a PDF-to-text converter.]`;
        } catch (error) {
          textContent = `PDF Document: ${file.name}\n\nType: ${documentForm.type}\nTitle: ${documentForm.title || file.name}\nDescription: ${documentForm.description || 'No description'}`;
        }
      } else if (file.type.includes('image')) {
        // For images, store metadata
        textContent = `Image Document: ${file.name}\n\nType: ${documentForm.type}\nTitle: ${documentForm.title || file.name}\nDescription: ${documentForm.description || 'No description'}\n\n[This is an image file. You can view it in the document viewer. For text-based questions, please upload text or PDF documents.]`;
      } else {
        // For other file types, store metadata
        textContent = `Document: ${file.name}\n\nType: ${documentForm.type}\nTitle: ${documentForm.title || file.name}\nDescription: ${documentForm.description || 'No description'}\nFile Type: ${file.type}\n\n[Document uploaded. You can ask me about this document and I'll reference it by name and metadata.]`;
      }

      // Create document
      const documentId = Date.now().toString();
      addDocument({
        type: documentForm.type,
        title: documentForm.title || file.name,
        description: documentForm.description,
        fileId,
        textContent,
      });

      // Reset form
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

  return (
    <div className="pb-20 min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="px-4 py-4">
          <h1 className="text-2xl font-bold text-gray-900">Plans & Contracts</h1>
          <p className="text-sm text-gray-500 mt-1">Upload and manage project documents</p>
        </div>
      </div>

      {/* Upload Section */}
      <div className="px-4 mt-4">
        <div className="bg-white rounded-3xl shadow-sm p-4">
          <button
            onClick={() => setShowUpload(!showUpload)}
            className="w-full flex items-center justify-between text-left"
          >
            <span className="font-semibold text-gray-900">Upload Document</span>
            <Plus size={20} className="text-gray-400" />
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
                accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
              />
              
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 border-dashed border-gray-300 text-gray-700 hover:border-accent-purple hover:bg-purple-50 transition-colors disabled:opacity-50"
              >
                <Upload size={20} />
                <span>{uploading ? 'Uploading...' : 'Select File to Upload'}</span>
              </button>
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
                  className="bg-white rounded-3xl shadow-sm p-4 border border-gray-100"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
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
                        <p className="text-sm text-gray-600 mb-2">{document.description}</p>
                      )}
                      {file && (
                        <div className="flex items-center gap-2 mt-2 p-2 bg-gray-50 rounded-lg">
                          {getFileIcon(file.type)}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
                            <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2 ml-2">
                      <button
                        onClick={() => setViewingDocument(document.id)}
                        className="p-2 text-gray-400 hover:text-blue-500"
                        title="View document"
                      >
                        <Eye size={18} />
                      </button>
                      <button
                        onClick={() => deleteDocument(document.id)}
                        className="p-2 text-gray-400 hover:text-red-500"
                        title="Delete"
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
      {selectedDocument && selectedFile && (
        <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <div className="flex items-center gap-3">
                {getFileIcon(selectedFile.type)}
                <div>
                  <h3 className="font-semibold text-gray-900">{selectedDocument.title}</h3>
                  <p className="text-sm text-gray-500">
                    {selectedDocument.type} • {formatFileSize(selectedFile.size)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={selectedFile.dataUrl}
                  download={selectedFile.name}
                  className="p-2 text-gray-400 hover:text-blue-500"
                  title="Download"
                >
                  <Download size={20} />
                </a>
                <button
                  onClick={() => setViewingDocument(null)}
                  className="p-2 text-gray-400 hover:text-gray-600"
                >
                  <X size={24} />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-auto p-4 bg-gray-50">
              {selectedFile.type.startsWith('image/') ? (
                <img
                  src={selectedFile.dataUrl}
                  alt={selectedDocument.title}
                  className="max-w-full h-auto rounded-lg shadow-sm mx-auto"
                />
              ) : selectedFile.type.includes('pdf') ? (
                <iframe
                  src={selectedFile.dataUrl}
                  className="w-full h-full min-h-[600px] rounded-lg border border-gray-200"
                  title={selectedDocument.title}
                />
              ) : (
                <div className="bg-white rounded-lg p-8 text-center">
                  <FileText size={64} className="mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-600 mb-4">Preview not available for this file type</p>
                  <a
                    href={selectedFile.dataUrl}
                    download={selectedFile.name}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-accent-purple text-white rounded-lg font-medium hover:bg-purple-600 transition-colors"
                  >
                    <Download size={18} />
                    <span>Download File</span>
                  </a>
                </div>
              )}
            </div>
            {selectedDocument.description && (
              <div className="p-4 border-t border-gray-200 bg-white">
                <p className="text-sm text-gray-600">{selectedDocument.description}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PlansContractsView;
