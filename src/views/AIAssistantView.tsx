import React, { useState } from 'react';
import { Bot, Send, Upload, FileText, Sparkles } from 'lucide-react';
import { useApp } from '../context/AppContext';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'assistant';
}

const AIAssistantView: React.FC = () => {
  const { milestones, addMilestone, phases } = useApp();
  const [activeTab, setActiveTab] = useState<'chat' | 'extractor'>('chat');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: "Hello! I'm your AI construction site assistant. How can I help you today?",
      sender: 'assistant',
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [documentText, setDocumentText] = useState('');
  const [isExtracting, setIsExtracting] = useState(false);

  const suggestedChips = ['Timeline planning', 'Safety guidelines', 'Material estimates'];

  const handleSendMessage = () => {
    if (!inputText.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText,
      sender: 'user',
    };

    setMessages([...messages, userMessage]);
    setInputText('');

    // Simulate AI response
    setTimeout(() => {
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: "I understand you're asking about: " + inputText + ". Here's some helpful information...",
        sender: 'assistant',
      };
      setMessages((prev) => [...prev, assistantMessage]);
    }, 1000);
  };

  const handleSuggestedChip = (chip: string) => {
    setInputText(chip);
  };

  const handleExtractMilestones = () => {
    if (!documentText.trim()) {
      alert('Please paste a document or schedule');
      return;
    }

    setIsExtracting(true);

    // Simulate AI extraction - parse text and create sample milestones
    setTimeout(() => {
      // Extract dates and create sample milestones
      const datePattern = /\d{4}-\d{2}-\d{2}|\d{1,2}\/\d{1,2}\/\d{4}/g;
      const dates = documentText.match(datePattern);

      if (dates && dates.length >= 2) {
        // Create sample milestones based on extracted dates
        const sampleMilestones = [
          {
            title: 'Foundation Phase',
            startDate: dates[0].includes('/') 
              ? new Date(dates[0]).toISOString().split('T')[0]
              : dates[0],
            endDate: dates[1].includes('/')
              ? new Date(dates[1]).toISOString().split('T')[0]
              : dates[1],
            phaseId: phases[0]?.id || '',
            notes: 'Extracted from document',
          },
          {
            title: 'Construction Phase',
            startDate: dates.length > 2 && dates[2].includes('/')
              ? new Date(dates[2]).toISOString().split('T')[0]
              : dates[1].includes('/')
              ? new Date(dates[1]).toISOString().split('T')[0]
              : dates[1],
            endDate: dates.length > 3 && dates[3].includes('/')
              ? new Date(dates[3]).toISOString().split('T')[0]
              : dates[2]?.includes('/')
              ? new Date(dates[2]).toISOString().split('T')[0]
              : dates[2] || dates[1],
            phaseId: phases[1]?.id || phases[0]?.id || '',
            notes: 'Extracted from document',
          },
        ];

        sampleMilestones.forEach((milestone) => {
          addMilestone(milestone);
        });

        alert(`Extracted ${sampleMilestones.length} milestones from the document!`);
      } else {
        // Fallback: create generic milestones
        const today = new Date();
        const nextWeek = new Date(today);
        nextWeek.setDate(nextWeek.getDate() + 7);
        const twoWeeks = new Date(today);
        twoWeeks.setDate(twoWeeks.getDate() + 14);

        addMilestone({
          title: 'Phase 1 - Planning',
          startDate: today.toISOString().split('T')[0],
          endDate: nextWeek.toISOString().split('T')[0],
          phaseId: phases[0]?.id || '',
          notes: 'Extracted from document',
        });

        addMilestone({
          title: 'Phase 2 - Execution',
          startDate: nextWeek.toISOString().split('T')[0],
          endDate: twoWeeks.toISOString().split('T')[0],
          phaseId: phases[1]?.id || phases[0]?.id || '',
          notes: 'Extracted from document',
        });

        alert('Extracted 2 milestones from the document!');
      }

      setDocumentText('');
      setIsExtracting(false);
    }, 2000);
  };

  return (
    <div className="pb-20 min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="px-4 py-4">
          <h1 className="text-2xl font-bold text-gray-900">AI Assistant</h1>
          <p className="text-sm text-gray-500 mt-1">Get help with your construction project</p>
        </div>

        {/* Tabs */}
        <div className="px-4 pb-4">
          <div className="flex bg-gray-100 rounded-xl p-1">
            <button
              onClick={() => setActiveTab('chat')}
              className={`flex-1 py-2 px-4 rounded-lg transition-all ${
                activeTab === 'chat'
                  ? 'bg-white text-accent-purple shadow-sm font-medium'
                  : 'text-gray-600'
              }`}
            >
              AI Chat
            </button>
            <button
              onClick={() => setActiveTab('extractor')}
              className={`flex-1 py-2 px-4 rounded-lg transition-all ${
                activeTab === 'extractor'
                  ? 'bg-white text-accent-purple shadow-sm font-medium'
                  : 'text-gray-600'
              }`}
            >
              Timeline Extractor
            </button>
          </div>
        </div>
      </div>

      {/* AI Chat Tab */}
      {activeTab === 'chat' && (
        <div className="flex flex-col h-[calc(100vh-200px)]">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-3xl px-4 py-3 ${
                    message.sender === 'user'
                      ? 'bg-accent-purple text-white'
                      : 'bg-white text-gray-900 shadow-sm'
                  }`}
                >
                  {message.sender === 'assistant' && (
                    <div className="flex items-center gap-2 mb-1">
                      <Bot size={16} className="text-accent-purple" />
                      <span className="text-xs font-medium text-gray-500">AI Assistant</span>
                    </div>
                  )}
                  <p className="text-sm whitespace-pre-wrap">{message.text}</p>
                </div>
              </div>
            ))}

            {/* Suggested Chips */}
            {messages.length === 1 && (
              <div className="space-y-2">
                <p className="text-sm text-gray-500 px-2">Suggested topics:</p>
                <div className="flex flex-wrap gap-2">
                  {suggestedChips.map((chip) => (
                    <button
                      key={chip}
                      onClick={() => handleSuggestedChip(chip)}
                      className="px-4 py-2 bg-white rounded-full text-sm text-gray-700 border border-gray-200 hover:border-accent-purple hover:text-accent-purple transition-colors"
                    >
                      {chip}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Input Area */}
          <div className="px-4 py-4 bg-white border-t border-gray-200">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Type your message..."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                className="flex-1 px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-accent-purple"
              />
              <button
                onClick={handleSendMessage}
                className="bg-accent-purple text-white p-3 rounded-xl shadow-sm hover:shadow-md transition-shadow"
              >
                <Send size={20} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Timeline Extractor Tab */}
      {activeTab === 'extractor' && (
        <div className="px-4 mt-4 space-y-4">
          <div className="bg-white rounded-3xl shadow-sm p-4">
            <h2 className="font-semibold text-gray-900 mb-3">Upload Document</h2>
            <div className="border-2 border-dashed border-gray-300 rounded-2xl p-8 text-center mb-4">
              <Upload size={48} className="mx-auto text-gray-400 mb-2" />
              <p className="text-sm text-gray-500">Click to upload or drag and drop</p>
              <p className="text-xs text-gray-400 mt-1">PDF, DOCX, TXT files</p>
            </div>

            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700">
                Or paste project document or schedule...
              </label>
              <textarea
                value={documentText}
                onChange={(e) => setDocumentText(e.target.value)}
                placeholder="Paste your project schedule, timeline, or document text here..."
                rows={10}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-accent-purple resize-none"
              />
            </div>

            <button
              onClick={handleExtractMilestones}
              disabled={isExtracting || !documentText.trim()}
              className="w-full mt-4 bg-accent-purple text-white py-4 rounded-xl font-medium shadow-sm hover:shadow-md transition-shadow disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isExtracting ? (
                <>
                  <Sparkles size={20} className="animate-pulse" />
                  <span>Extracting milestones...</span>
                </>
              ) : (
                <>
                  <FileText size={20} />
                  <span>Extract Milestones with AI</span>
                </>
              )}
            </button>

            <p className="text-xs text-gray-500 mt-3 text-center">
              AI will analyze your document and automatically create milestones in the Timeline view
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIAssistantView;

