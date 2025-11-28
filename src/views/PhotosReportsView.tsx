import React, { useState, useRef } from 'react';
import { Camera, Image, Mail, Loader, X, Eye, Download } from 'lucide-react';
import { useApp } from '../context/AppContext';

const PhotosReportsView: React.FC = () => {
  const { photos, files, addPhoto, uploadFile, getFile, deleteFile } = useApp();
  const [email, setEmail] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [caption, setCaption] = useState('');
  const [reportType, setReportType] = useState<'Daily' | 'Weekly'>('Daily');
  const [isGenerating, setIsGenerating] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [viewingPhoto, setViewingPhoto] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const libraryInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (file: File, source: 'camera' | 'library') => {
    // Check if it's an image
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    setUploading(true);
    try {
      const fileId = await uploadFile(file);
      const imageUrl = getFile(fileId)?.dataUrl;
      
      addPhoto({
        caption: caption || file.name,
        date: selectedDate,
        source,
        fileId,
        imageUrl,
      });
      
      setCaption('');
      setShowToast(true);
      setToastMessage(`Photo uploaded successfully!`);
      setTimeout(() => setShowToast(false), 2000);
    } catch (error) {
      alert('Failed to upload photo. Please try again.');
      console.error('Photo upload error:', error);
    } finally {
      setUploading(false);
      // Reset inputs
      if (cameraInputRef.current) cameraInputRef.current.value = '';
      if (libraryInputRef.current) libraryInputRef.current.value = '';
    }
  };

  const handleTakePhoto = () => {
    cameraInputRef.current?.click();
  };

  const handleFromLibrary = () => {
    libraryInputRef.current?.click();
  };

  const handleCameraFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFileUpload(file, 'camera');
    }
  };

  const handleLibraryFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFileUpload(file, 'library');
    }
  };

  const handleGenerateReport = () => {
    if (!email) {
      alert('Please enter an email address');
      return;
    }

    setIsGenerating(true);
    setToastMessage(`Report generated for ${email}...`);
    setShowToast(true);

    // Simulate report generation
    setTimeout(() => {
      setIsGenerating(false);
      setToastMessage(`${reportType} report generated and sent to ${email}`);
      setTimeout(() => {
        setShowToast(false);
      }, 3000);
    }, 2000);
  };

  const selectedPhoto = photos.find(p => p.id === viewingPhoto);
  const photoFile = selectedPhoto?.fileId ? getFile(selectedPhoto.fileId) : null;

  return (
    <div className="pb-20 min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="px-4 py-4">
          <h1 className="text-2xl font-bold text-gray-900">Photos & Reports</h1>
          <p className="text-sm text-gray-500 mt-1">Document progress and generate reports</p>
        </div>
      </div>

      {/* Email and Date Inputs */}
      <div className="px-4 mt-4 space-y-3">
        <div className="bg-white rounded-3xl shadow-sm p-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Email Account</label>
          <input
            type="email"
            placeholder="email@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-accent-purple"
          />
        </div>

        <div className="bg-white rounded-3xl shadow-sm p-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-accent-purple"
          />
        </div>
      </div>

      {/* Add Photos */}
      <div className="px-4 mt-4">
        <div className="bg-white rounded-3xl shadow-sm p-4">
          <h2 className="font-semibold text-gray-900 mb-3">Add Photos</h2>
          
          {/* Hidden file inputs */}
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleCameraFileSelect}
            className="hidden"
          />
          <input
            ref={libraryInputRef}
            type="file"
            accept="image/*"
            onChange={handleLibraryFileSelect}
            className="hidden"
          />

          <div className="grid grid-cols-2 gap-3 mb-3">
            <button
              onClick={handleTakePhoto}
              disabled={uploading}
              className="flex flex-col items-center justify-center gap-2 py-6 rounded-xl border-2 border-dashed border-gray-300 hover:border-accent-purple hover:bg-purple-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Camera size={32} className="text-gray-400" />
              <span className="text-sm font-medium text-gray-700">
                {uploading ? 'Uploading...' : 'Take Photo'}
              </span>
            </button>
            <button
              onClick={handleFromLibrary}
              disabled={uploading}
              className="flex flex-col items-center justify-center gap-2 py-6 rounded-xl border-2 border-dashed border-gray-300 hover:border-accent-purple hover:bg-purple-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Image size={32} className="text-gray-400" />
              <span className="text-sm font-medium text-gray-700">
                {uploading ? 'Uploading...' : 'From Library'}
              </span>
            </button>
          </div>
          <input
            type="text"
            placeholder="Caption (optional)"
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-accent-purple"
          />
        </div>
      </div>

      {/* Photo Gallery */}
      {photos.length > 0 && (
        <div className="px-4 mt-4">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Uploaded Photos</h2>
          <div className="grid grid-cols-3 gap-2">
            {photos.map((photo) => (
              <div
                key={photo.id}
                className="relative aspect-square bg-gray-100 rounded-xl overflow-hidden group cursor-pointer"
                onClick={() => setViewingPhoto(photo.id)}
              >
                {photo.imageUrl ? (
                  <img
                    src={photo.imageUrl}
                    alt={photo.caption}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Image size={32} className="text-gray-400" />
                  </div>
                )}
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-opacity flex items-center justify-center">
                  <Eye size={20} className="text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                {photo.caption && (
                  <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs p-2 truncate">
                    {photo.caption}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Report Generation */}
      <div className="px-4 mt-4">
        <div className="bg-white rounded-3xl shadow-sm p-4">
          <h2 className="font-semibold text-gray-900 mb-3">Report Generation</h2>
          
          {/* Tabs */}
          <div className="flex bg-gray-100 rounded-xl p-1 mb-4">
            <button
              onClick={() => setReportType('Daily')}
              className={`flex-1 py-2 px-4 rounded-lg transition-all ${
                reportType === 'Daily'
                  ? 'bg-white text-accent-purple shadow-sm font-medium'
                  : 'text-gray-600'
              }`}
            >
              Daily
            </button>
            <button
              onClick={() => setReportType('Weekly')}
              className={`flex-1 py-2 px-4 rounded-lg transition-all ${
                reportType === 'Weekly'
                  ? 'bg-white text-accent-purple shadow-sm font-medium'
                  : 'text-gray-600'
              }`}
            >
              Weekly
            </button>
          </div>

          <button
            onClick={handleGenerateReport}
            disabled={isGenerating || !email}
            className="w-full bg-accent-purple text-white py-4 rounded-xl font-medium shadow-sm hover:shadow-md transition-shadow disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isGenerating ? (
              <>
                <Loader size={20} className="animate-spin" />
                <span>Generating...</span>
              </>
            ) : (
              <>
                <Mail size={20} />
                <span>Generate & Email {reportType} Report</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Toast Notification */}
      {showToast && (
        <div className="fixed bottom-24 left-4 right-4 z-50">
          <div className="bg-gray-900 text-white px-4 py-3 rounded-xl shadow-lg">
            <p className="text-sm">{toastMessage}</p>
          </div>
        </div>
      )}

      {/* Photo Viewer Modal */}
      {selectedPhoto && (
        <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <div>
                <h3 className="font-semibold text-gray-900">{selectedPhoto.caption || 'Photo'}</h3>
                <p className="text-sm text-gray-500">
                  {new Date(selectedPhoto.date).toLocaleDateString()} • {selectedPhoto.source === 'camera' ? 'Camera' : 'Library'}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {photoFile && (
                  <a
                    href={photoFile.dataUrl}
                    download={photoFile.name}
                    className="p-2 text-gray-400 hover:text-blue-500"
                    title="Download"
                  >
                    <Download size={20} />
                  </a>
                )}
                <button
                  onClick={() => setViewingPhoto(null)}
                  className="p-2 text-gray-400 hover:text-gray-600"
                >
                  <X size={24} />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-auto p-4 bg-gray-50 flex items-center justify-center">
              {selectedPhoto.imageUrl ? (
                <img
                  src={selectedPhoto.imageUrl}
                  alt={selectedPhoto.caption}
                  className="max-w-full max-h-full rounded-lg shadow-lg"
                />
              ) : (
                <div className="text-center text-gray-500">
                  <Image size={64} className="mx-auto mb-4 opacity-50" />
                  <p>Image not available</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PhotosReportsView;
