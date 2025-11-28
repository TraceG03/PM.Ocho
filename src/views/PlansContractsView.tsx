import React, { useState, useRef } from 'react';
import { Plus, Eye, Trash2, X, Paperclip, Download, FileText, Image as ImageIcon, File } from 'lucide-react';
import { useApp } from '../context/AppContext';

const PlansContractsView: React.FC = () => {
  const { notes, files, addNote, deleteNote, uploadFile, getFile, deleteFile } = useApp();
  const [showAddNote, setShowAddNote] = useState(false);
  const [selectedNote, setSelectedNote] = useState<string | null>(null);
  const [viewingFile, setViewingFile] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [noteForm, setNoteForm] = useState({
    type: 'Plan Detail' as 'Plan Detail' | 'Spec',
    refNumber: '',
    title: '',
    details: '',
    fileId: '',
  });
  const [uploading, setUploading] = useState(false);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const fileId = await uploadFile(file);
      setNoteForm({ ...noteForm, fileId });
    } catch (error) {
      alert('Failed to upload file. Please try again.');
      console.error('File upload error:', error);
    } finally {
      setUploading(false);
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleSaveNote = () => {
    if (noteForm.title && noteForm.details) {
      addNote({
        type: noteForm.type,
        refNumber: noteForm.refNumber,
        title: noteForm.title,
        details: noteForm.details,
        fileId: noteForm.fileId || undefined,
      });
      setNoteForm({
        type: 'Plan Detail',
        refNumber: '',
        title: '',
        details: '',
        fileId: '',
      });
      setShowAddNote(false);
    }
  };

  const handleRemoveFile = () => {
    if (noteForm.fileId) {
      deleteFile(noteForm.fileId);
      setNoteForm({ ...noteForm, fileId: '' });
    }
  };

  const selectedNoteData = notes.find(n => n.id === selectedNote);
  const selectedFile = viewingFile ? getFile(viewingFile) : null;
  const attachedFile = noteForm.fileId ? getFile(noteForm.fileId) : null;

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) return <ImageIcon size={20} className="text-blue-500" />;
    if (fileType.includes('pdf')) return <FileText size={20} className="text-red-500" />;
    return <File size={20} className="text-gray-500" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className="pb-20 min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="px-4 py-4">
          <h1 className="text-2xl font-bold text-gray-900">Plans & Contracts</h1>
          <p className="text-sm text-gray-500 mt-1">Project documentation and references</p>
        </div>
      </div>

      {/* Add Note Section */}
      <div className="px-4 mt-4">
        <div className="bg-white rounded-3xl shadow-sm p-4">
          <button
            onClick={() => setShowAddNote(!showAddNote)}
            className="w-full flex items-center justify-between text-left"
          >
            <span className="font-semibold text-gray-900">Add Note</span>
            <Plus size={20} className="text-gray-400" />
          </button>

          {showAddNote && (
            <div className="mt-4 space-y-3">
              <select
                value={noteForm.type}
                onChange={(e) => setNoteForm({ ...noteForm, type: e.target.value as 'Plan Detail' | 'Spec' })}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-accent-purple"
              >
                <option value="Plan Detail">Plan Detail</option>
                <option value="Spec">Spec</option>
              </select>
              <input
                type="text"
                placeholder="Ref/Sheet Number"
                value={noteForm.refNumber}
                onChange={(e) => setNoteForm({ ...noteForm, refNumber: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-accent-purple"
              />
              <input
                type="text"
                placeholder="Title"
                value={noteForm.title}
                onChange={(e) => setNoteForm({ ...noteForm, title: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-accent-purple"
              />
              <textarea
                placeholder="Details"
                value={noteForm.details}
                onChange={(e) => setNoteForm({ ...noteForm, details: e.target.value })}
                rows={4}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-accent-purple resize-none"
              />
              
              {/* File Upload */}
              <div className="space-y-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={handleFileSelect}
                  className="hidden"
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif,.txt"
                />
                {!attachedFile ? (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 border-dashed border-gray-300 text-gray-700 hover:border-accent-purple hover:bg-purple-50 transition-colors disabled:opacity-50"
                  >
                    <Paperclip size={18} />
                    <span>{uploading ? 'Uploading...' : 'Attach File'}</span>
                  </button>
                ) : (
                  <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-xl">
                    <div className="flex items-center gap-2 flex-1">
                      {getFileIcon(attachedFile.type)}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{attachedFile.name}</p>
                        <p className="text-xs text-gray-500">{formatFileSize(attachedFile.size)}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setViewingFile(attachedFile.id)}
                      className="p-2 text-gray-400 hover:text-blue-500"
                      title="View file"
                    >
                      <Eye size={18} />
                    </button>
                    <button
                      onClick={handleRemoveFile}
                      className="p-2 text-gray-400 hover:text-red-500"
                      title="Remove file"
                    >
                      <X size={18} />
                    </button>
                  </div>
                )}
              </div>

              <button
                onClick={handleSaveNote}
                className="w-full bg-accent-purple text-white py-3 rounded-xl font-medium shadow-sm hover:shadow-md transition-shadow"
              >
                Save Note
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Quick Reference List */}
      <div className="px-4 mt-4">
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Quick Reference</h2>
        <div className="grid grid-cols-1 gap-3">
          {notes.map((note) => {
            const noteFile = note.fileId ? getFile(note.fileId) : null;
            return (
              <div
                key={note.id}
                className="bg-white rounded-3xl shadow-sm p-4 border border-gray-100"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          note.type === 'Plan Detail'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-purple-100 text-purple-700'
                        }`}
                      >
                        {note.type}
                      </span>
                      {note.refNumber && (
                        <span className="text-xs text-gray-500">Ref: {note.refNumber}</span>
                      )}
                    </div>
                    <h3 className="font-semibold text-gray-900">{note.title}</h3>
                    {noteFile && (
                      <div className="flex items-center gap-2 mt-2 p-2 bg-gray-50 rounded-lg">
                        {getFileIcon(noteFile.type)}
                        <span className="text-sm text-gray-700 flex-1 truncate">{noteFile.name}</span>
                        <span className="text-xs text-gray-500">{formatFileSize(noteFile.size)}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2 ml-2">
                    {noteFile && (
                      <button
                        onClick={() => setViewingFile(noteFile.id)}
                        className="p-2 text-gray-400 hover:text-blue-500"
                        title="View file"
                      >
                        <Eye size={18} />
                      </button>
                    )}
                    <button
                      onClick={() => setSelectedNote(note.id)}
                      className="p-2 text-gray-400 hover:text-blue-500"
                      title="View details"
                    >
                      <Eye size={18} />
                    </button>
                    <button
                      onClick={() => deleteNote(note.id)}
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
      </div>

      {/* Note Detail Modal */}
      {selectedNoteData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end">
          <div className="bg-white rounded-t-3xl w-full max-h-[80vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Note Details</h2>
              <button
                onClick={() => setSelectedNote(null)}
                className="p-2 text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                      selectedNoteData.type === 'Plan Detail'
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-purple-100 text-purple-700'
                    }`}
                  >
                    {selectedNoteData.type}
                  </span>
                  {selectedNoteData.refNumber && (
                    <span className="text-sm text-gray-500">Ref: {selectedNoteData.refNumber}</span>
                  )}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{selectedNoteData.title}</h3>
                <p className="text-gray-700 whitespace-pre-wrap">{selectedNoteData.details}</p>
                {selectedNoteData.fileId && (() => {
                  const file = getFile(selectedNoteData.fileId!);
                  return file ? (
                    <div className="mt-4 p-3 bg-gray-50 rounded-xl">
                      <div className="flex items-center gap-2 mb-2">
                        {getFileIcon(file.type)}
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">{file.name}</p>
                          <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          setSelectedNote(null);
                          setViewingFile(file.id);
                        }}
                        className="w-full mt-2 flex items-center justify-center gap-2 px-4 py-2 bg-accent-purple text-white rounded-lg text-sm font-medium hover:bg-purple-600 transition-colors"
                      >
                        <Eye size={16} />
                        <span>View File</span>
                      </button>
                    </div>
                  ) : null;
                })()}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* File Viewer Modal */}
      {selectedFile && (
        <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <div className="flex items-center gap-3">
                {getFileIcon(selectedFile.type)}
                <div>
                  <h3 className="font-semibold text-gray-900">{selectedFile.name}</h3>
                  <p className="text-sm text-gray-500">{formatFileSize(selectedFile.size)}</p>
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
                  onClick={() => setViewingFile(null)}
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
                  alt={selectedFile.name}
                  className="max-w-full h-auto rounded-lg shadow-sm mx-auto"
                />
              ) : selectedFile.type.includes('pdf') ? (
                <iframe
                  src={selectedFile.dataUrl}
                  className="w-full h-full min-h-[600px] rounded-lg border border-gray-200"
                  title={selectedFile.name}
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
          </div>
        </div>
      )}
    </div>
  );
};

export default PlansContractsView;
