import React, { useState } from 'react';
import { Camera, Image, Mail, Loader } from 'lucide-react';
import { useApp } from '../context/AppContext';

const PhotosReportsView: React.FC = () => {
  const { addPhoto } = useApp();
  const [email, setEmail] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [caption, setCaption] = useState('');
  const [reportType, setReportType] = useState<'Daily' | 'Weekly'>('Daily');
  const [isGenerating, setIsGenerating] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const handleTakePhoto = () => {
    // Simulate photo capture
    const photo = {
      caption: caption || 'Photo',
      date: selectedDate,
      source: 'camera' as const,
    };
    addPhoto(photo);
    setCaption('');
    alert('Photo captured! (Simulated)');
  };

  const handleFromLibrary = () => {
    // Simulate library selection
    const photo = {
      caption: caption || 'Photo from library',
      date: selectedDate,
      source: 'library' as const,
    };
    addPhoto(photo);
    setCaption('');
    alert('Photo selected from library! (Simulated)');
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
          <div className="grid grid-cols-2 gap-3 mb-3">
            <button
              onClick={handleTakePhoto}
              className="flex flex-col items-center justify-center gap-2 py-6 rounded-xl border-2 border-dashed border-gray-300 hover:border-accent-purple hover:bg-purple-50 transition-colors"
            >
              <Camera size={32} className="text-gray-400" />
              <span className="text-sm font-medium text-gray-700">Take Photo</span>
            </button>
            <button
              onClick={handleFromLibrary}
              className="flex flex-col items-center justify-center gap-2 py-6 rounded-xl border-2 border-dashed border-gray-300 hover:border-accent-purple hover:bg-purple-50 transition-colors"
            >
              <Image size={32} className="text-gray-400" />
              <span className="text-sm font-medium text-gray-700">From Library</span>
            </button>
          </div>
          <input
            type="text"
            placeholder="Caption"
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-accent-purple"
          />
        </div>
      </div>

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
    </div>
  );
};

export default PhotosReportsView;

