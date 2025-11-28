import React, { useState } from 'react';
import { FileText, Mail, Loader, Bot, Sparkles, Copy, Check } from 'lucide-react';
import { useApp } from '../context/AppContextSupabase';

const DailyReportsView: React.FC = () => {
  const { tasks, milestones, documents, photos } = useApp();
  const [email, setEmail] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [reportType, setReportType] = useState<'Daily' | 'Weekly'>('Daily');
  const [isGenerating, setIsGenerating] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [aiGeneratedReport, setAiGeneratedReport] = useState('');
  const [copied, setCopied] = useState(false);

  const generateDailyReport = () => {
    if (!email) {
      alert('Please enter an email address');
      return;
    }

    setIsGenerating(true);
    setToastMessage(`Generating ${reportType} report...`);
    setShowToast(true);

    // Generate AI report based on current data
    setTimeout(() => {
      const dateTasks = tasks.filter(t => t.date === selectedDate);
      const completedTasks = dateTasks.filter(t => t.completed);
      const pendingTasks = dateTasks.filter(t => !t.completed);
      const highPriorityTasks = dateTasks.filter(t => t.priority === 'High');

      // Get milestones around the selected date
      const selectedDateObj = new Date(selectedDate);
      const relevantMilestones = milestones.filter(m => {
        const startDate = new Date(m.startDate);
        const endDate = new Date(m.endDate);
        return selectedDateObj >= startDate && selectedDateObj <= endDate;
      });

      // Generate report content
      let reportContent = `${reportType} Construction Report\n`;
      reportContent += `Date: ${new Date(selectedDate).toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      })}\n\n`;

      reportContent += `=== PROJECT SUMMARY ===\n\n`;
      
      if (relevantMilestones.length > 0) {
        reportContent += `Active Milestones:\n`;
        relevantMilestones.forEach(m => {
          const phase = milestones.find(ms => ms.id === m.phaseId);
          reportContent += `- ${m.title} (${phase?.name || 'Unknown Phase'})\n`;
        });
        reportContent += `\n`;
      }

      reportContent += `=== TASK STATUS ===\n\n`;
      reportContent += `Total Tasks: ${dateTasks.length}\n`;
      reportContent += `Completed: ${completedTasks.length}\n`;
      reportContent += `Pending: ${pendingTasks.length}\n`;
      
      if (highPriorityTasks.length > 0) {
        reportContent += `High Priority Tasks: ${highPriorityTasks.length}\n`;
      }
      reportContent += `\n`;

      if (completedTasks.length > 0) {
        reportContent += `Completed Tasks:\n`;
        completedTasks.forEach(t => {
          reportContent += `✓ ${t.name}${t.crew ? ` - ${t.crew}` : ''}\n`;
        });
        reportContent += `\n`;
      }

      if (pendingTasks.length > 0) {
        reportContent += `Pending Tasks:\n`;
        pendingTasks.forEach(t => {
          reportContent += `○ ${t.name}${t.crew ? ` - ${t.crew}` : ''}${t.priority === 'High' ? ' [HIGH PRIORITY]' : ''}\n`;
        });
        reportContent += `\n`;
      }

      if (photos.length > 0) {
        const datePhotos = photos.filter(p => p.date === selectedDate);
        if (datePhotos.length > 0) {
          reportContent += `=== PHOTOS ===\n`;
          reportContent += `Photos taken: ${datePhotos.length}\n\n`;
        }
      }

      if (documents.length > 0) {
        reportContent += `=== DOCUMENTS ===\n`;
        reportContent += `Available documents: ${documents.length}\n`;
        reportContent += `- Plans: ${documents.filter(d => d.type === 'Plan').length}\n`;
        reportContent += `- Contracts: ${documents.filter(d => d.type === 'Contract').length}\n\n`;
      }

      reportContent += `=== NOTES ===\n`;
      reportContent += `Report generated automatically by AI Assistant.\n`;
      reportContent += `For detailed information, refer to the project timeline and task management system.\n`;

      setAiGeneratedReport(reportContent);
      setIsGenerating(false);
      setToastMessage(`${reportType} report generated successfully!`);
      setTimeout(() => {
        setShowToast(false);
      }, 3000);
    }, 2000);
  };

  const handleCopyReport = () => {
    navigator.clipboard.writeText(aiGeneratedReport);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="pb-20 min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="px-4 py-4">
          <h1 className="text-2xl font-bold text-gray-900">Daily Reports</h1>
          <p className="text-sm text-gray-500 mt-1">Generate and manage daily construction reports</p>
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

      {/* Report Generation */}
      <div className="px-4 mt-4">
        <div className="bg-white rounded-3xl shadow-sm p-4">
          <h2 className="font-semibold text-gray-900 mb-3">Generate Report</h2>
          
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
            onClick={generateDailyReport}
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
                <Bot size={20} />
                <span>Generate {reportType} Report with AI</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* AI Generated Report Text Box */}
      {aiGeneratedReport && (
        <div className="px-4 mt-4">
          <div className="bg-white rounded-3xl shadow-sm p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Sparkles size={20} className="text-accent-purple" />
                <h2 className="font-semibold text-gray-900">AI Generated Report</h2>
              </div>
              <button
                onClick={handleCopyReport}
                className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-accent-purple transition-colors"
              >
                {copied ? (
                  <>
                    <Check size={16} />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy size={16} />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>
            <textarea
              value={aiGeneratedReport}
              onChange={(e) => setAiGeneratedReport(e.target.value)}
              rows={15}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-accent-purple resize-none font-mono text-sm bg-gray-50"
              placeholder="AI-generated report will appear here..."
            />
            <div className="mt-3 flex gap-2">
              <button
                onClick={() => {
                  setAiGeneratedReport('');
                }}
                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
              >
                Clear
              </button>
              <button
                onClick={() => {
                  // Simulate email sending
                  setToastMessage(`Report sent to ${email}`);
                  setShowToast(true);
                  setTimeout(() => setShowToast(false), 3000);
                }}
                className="flex-1 px-4 py-2 bg-accent-purple text-white rounded-xl font-medium hover:bg-purple-600 transition-colors flex items-center justify-center gap-2"
              >
                <Mail size={18} />
                <span>Email Report</span>
              </button>
            </div>
          </div>
        </div>
      )}

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

export default DailyReportsView;

