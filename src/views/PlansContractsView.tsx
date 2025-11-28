import React, { useState } from 'react';
import { Plus, Eye, Trash2, X, Paperclip } from 'lucide-react';
import { useApp } from '../context/AppContext';

const PlansContractsView: React.FC = () => {
  const { notes, addNote, deleteNote } = useApp();
  const [showAddNote, setShowAddNote] = useState(false);
  const [selectedNote, setSelectedNote] = useState<string | null>(null);
  const [noteForm, setNoteForm] = useState({
    type: 'Plan Detail' as 'Plan Detail' | 'Spec',
    refNumber: '',
    title: '',
    details: '',
    fileName: '',
  });
  const [attachedFile, setAttachedFile] = useState<string>('');

  const handleSaveNote = () => {
    if (noteForm.title && noteForm.details) {
      addNote({
        ...noteForm,
        fileName: attachedFile || undefined,
      });
      setNoteForm({
        type: 'Plan Detail',
        refNumber: '',
        title: '',
        details: '',
        fileName: '',
      });
      setAttachedFile('');
      setShowAddNote(false);
    }
  };

  const handleFileAttach = () => {
    // Simulate file selection
    const fileName = `document_${Date.now()}.pdf`;
    setAttachedFile(fileName);
  };

  const selectedNoteData = notes.find(n => n.id === selectedNote);

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
              <div className="flex items-center gap-2">
                <button
                  onClick={handleFileAttach}
                  className="flex items-center gap-2 px-4 py-3 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <Paperclip size={18} />
                  <span>Attach File</span>
                </button>
                {attachedFile && (
                  <span className="text-sm text-gray-600 flex-1 truncate">{attachedFile}</span>
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
          {notes.map((note) => (
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
                  {note.fileName && (
                    <div className="flex items-center gap-1 mt-2 text-sm text-gray-500">
                      <Paperclip size={14} />
                      <span className="truncate">{note.fileName}</span>
                    </div>
                  )}
                </div>
                <div className="flex gap-2 ml-2">
                  <button
                    onClick={() => setSelectedNote(note.id)}
                    className="p-2 text-gray-400 hover:text-blue-500"
                  >
                    <Eye size={18} />
                  </button>
                  <button
                    onClick={() => deleteNote(note.id)}
                    className="p-2 text-gray-400 hover:text-red-500"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </div>
          ))}
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
                {selectedNoteData.fileName && (
                  <div className="mt-4 p-3 bg-gray-50 rounded-xl flex items-center gap-2">
                    <Paperclip size={18} className="text-gray-500" />
                    <span className="text-sm text-gray-700">{selectedNoteData.fileName}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlansContractsView;

