import React, { useState, useRef } from 'react';
import { Bot, Send, Upload, FileText, Sparkles, X, AlertCircle } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { openai, isOpenAIConfigured } from '../lib/openai';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'assistant';
}

const AIAssistantView: React.FC = () => {
  const { milestones, addMilestone, phases, documents, uploadFile, getFile } = useApp();
  
  const openAIConfigured = isOpenAIConfigured();
  
  const [activeTab, setActiveTab] = useState<'chat' | 'extractor'>('chat');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: openAIConfigured 
        ? "Hello! I'm your AI construction site assistant powered by ChatGPT. I can help you with questions about your uploaded plans and contracts, timeline planning, safety guidelines, and material estimates. How can I help you today?"
        : "Hello! I'm your AI construction site assistant. I can help you with questions about your uploaded plans and contracts, timeline planning, safety guidelines, and material estimates. How can I help you today?",
      sender: 'assistant',
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [documentText, setDocumentText] = useState('');
  const [isExtracting, setIsExtracting] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const suggestedChips = ['Timeline planning', 'Safety guidelines', 'Material estimates'];

  // Search documents for relevant information
  const searchDocuments = async (query: string): Promise<string> => {
    if (!documents || documents.length === 0) {
      return `I don't have any documents uploaded yet. Please upload plans or contracts in the Plans & Contracts tab.`;
    }

    const queryLower = query.toLowerCase();
    const queryWords = queryLower.split(/\s+/).filter(w => w.length > 2);
    const relevantDocs: Array<{ title: string; type: string; snippets: string[]; score: number }> = [];

    for (const doc of documents) {
      if (!doc) continue;
      let searchableContent = doc.textContent || '';
      
      if (doc.fileId) {
        const fileData = getFile(doc.fileId);
        if (fileData && fileData.dataUrl) {
          try {
            if (fileData.type === 'text/plain' || fileData.name.endsWith('.txt')) {
              const base64Match = fileData.dataUrl.match(/^data:text\/plain;base64,(.+)$/);
              if (base64Match) {
                try {
                  searchableContent = atob(base64Match[1]);
                } catch (e) {
                  searchableContent = doc.textContent || '';
                }
              }
            }
          } catch (error) {
            searchableContent = doc.textContent || '';
          }
        }
      }

      if (!searchableContent) continue;

      const contentLower = searchableContent.toLowerCase();
      const titleLower = doc.title.toLowerCase();
      let score = 0;
      const snippets: string[] = [];

      if (titleLower.includes(queryLower)) score += 10;
      queryWords.forEach(word => {
        if (titleLower.includes(word)) score += 3;
        if (contentLower.includes(word)) {
          score += 2;
          const sentences = searchableContent.split(/[.!?\n]+/);
          const matching = sentences.filter(s => s.toLowerCase().includes(word) && s.trim().length > 10).slice(0, 2);
          matching.forEach(s => {
            const trimmed = s.trim();
            if (trimmed && !snippets.some(existing => existing.includes(trimmed))) {
              snippets.push(trimmed);
            }
          });
        }
      });

      if (contentLower.includes(queryLower)) {
        score += 8;
        const index = contentLower.indexOf(queryLower);
        const start = Math.max(0, index - 150);
        const end = Math.min(searchableContent.length, index + queryLower.length + 150);
        const context = searchableContent.substring(start, end).trim();
        if (context.length > 20) snippets.push(context);
      }

      if (score > 0) {
        relevantDocs.push({ title: doc.title, type: doc.type, snippets: snippets.slice(0, 3), score });
      }
    }

    relevantDocs.sort((a, b) => b.score - a.score);

    if (relevantDocs.length > 0) {
      const topDocs = relevantDocs.slice(0, 3);
      let response = `I found relevant information in ${relevantDocs.length} document(s):\n\n`;
      topDocs.forEach((doc, index) => {
        response += `${index + 1}. **${doc.title}** (${doc.type})\n`;
        if (doc.snippets.length > 0) {
          response += `   ${doc.snippets[0].substring(0, 200)}${doc.snippets[0].length > 200 ? '...' : ''}\n`;
        }
        response += `\n`;
      });
      return response;
    }

    const docList = documents.map(d => `${d.title} (${d.type})`).join(', ');
    return `I couldn't find specific information about "${query}" in the uploaded documents.\n\nAvailable documents: ${docList}`;
  };

  const handleSendMessage = async () => {
    if (!inputText.trim() || isProcessing) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText,
      sender: 'user',
    };

    setMessages([...messages, userMessage]);
    const currentQuery = inputText;
    setInputText('');
    setIsProcessing(true);
    setAiError(null);

    try {
      let response = '';

      if (openAIConfigured && openai) {
        // Use OpenAI ChatGPT
        let documentContext = '';
        if (documents.length > 0) {
          documentContext = await searchDocuments(currentQuery);
        }

        const systemPrompt = `You are an AI construction site assistant. You help with construction project management, including:
- Timeline planning and milestone tracking
- Safety guidelines and best practices
- Material estimates and specifications
- Answering questions about uploaded project documents (plans, contracts, specifications)

Current project context:
- ${milestones.length} milestone(s) in the timeline
- ${phases.length} phase(s) defined
- ${documents.length} document(s) uploaded

When answering questions:
- Be helpful, professional, and construction-focused
- Reference specific information from uploaded documents when available
- Provide practical, actionable advice
- If you don't have information, say so clearly`;

        const completion = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: systemPrompt },
            ...messages.slice(-5).map(msg => ({
              role: (msg.sender === 'user' ? 'user' : 'assistant') as 'user' | 'assistant',
              content: msg.text
            })),
            { role: 'user', content: currentQuery + (documentContext ? `\n\nRelevant document context:\n${documentContext}` : '') }
          ],
          temperature: 0.7,
          max_tokens: 1000,
        });

        response = completion.choices[0]?.message?.content || 'I apologize, but I encountered an error generating a response.';
      } else {
        // Fallback to rule-based
        if (documents.length > 0) {
          response = await searchDocuments(currentQuery);
        } else if (currentQuery.toLowerCase().includes('timeline') || currentQuery.toLowerCase().includes('schedule')) {
          response = `I can help with timeline planning. You currently have ${milestones.length} milestone(s) in your timeline.`;
        } else if (currentQuery.toLowerCase().includes('safety')) {
          response = `Here are some general construction safety guidelines:\n\n1. Always wear appropriate PPE (hard hat, safety glasses, steel-toed boots)\n2. Follow proper lockout/tagout procedures\n3. Maintain clear work areas and proper signage\n4. Conduct regular safety inspections\n5. Ensure all workers are properly trained`;
        } else {
          response = `I understand you're asking about: "${currentQuery}". I can help with timeline planning, safety guidelines, and material estimates. To answer questions about your specific project, please upload your plans and contracts in the Plans & Contracts tab.`;
        }
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: response,
        sender: 'assistant',
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error: any) {
      console.error('AI Error:', error);
      setAiError(error.message || 'Failed to get AI response.');
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: `I apologize, but I encountered an error: ${error.message || 'Unable to process your request'}. Please check your OpenAI API key configuration or try again later.`,
        sender: 'assistant',
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsProcessing(false);
    }
  };

  const processFile = async (file: File) => {
    if (!file) return;
    setUploading(true);
    try {
      const uploadedFileObj = await uploadFile(file);
      setUploadedFile(uploadedFileObj.id);
      if (file.type === 'text/plain') {
        const fileData = getFile(uploadedFileObj.id);
        if (fileData) {
          try {
            const base64Match = fileData.dataUrl.match(/^data:text\/plain;base64,(.+)$/);
            if (base64Match) {
              setDocumentText(atob(base64Match[1]));
            }
          } catch (e) {
            setDocumentText(`Document "${file.name}" uploaded.`);
          }
        }
      } else {
        setDocumentText(`Document "${file.name}" uploaded. Please paste the content below.`);
      }
    } catch (error) {
      alert('Failed to upload file.');
    } finally {
      setUploading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) await processFile(files[0]);
  };

  const handleExtractMilestones = async () => {
    if (!documentText.trim() && !uploadedFile) {
      alert('Please upload a document or paste text');
      return;
    }

    setIsExtracting(true);

    try {
      let textToAnalyze = documentText;

      // If we have an uploaded file, try to get its content
      if (uploadedFile && !textToAnalyze.trim()) {
        const fileData = getFile(uploadedFile);
        if (fileData && fileData.type === 'text/plain') {
          try {
            const base64Match = fileData.dataUrl.match(/^data:text\/plain;base64,(.+)$/);
            if (base64Match) {
              textToAnalyze = atob(base64Match[1]);
            }
          } catch (e) {
            console.error('Error reading file:', e);
          }
        }
      }

      if (!textToAnalyze.trim()) {
        alert('No text content found to analyze');
        setIsExtracting(false);
        return;
      }

      if (openAIConfigured && openai) {
        // Use OpenAI to extract milestones
        const systemPrompt = `You are an AI assistant that extracts project milestones from construction documents, schedules, and timelines.

Your task is to analyze the provided document and extract meaningful milestones with:
- Clear, descriptive titles (e.g., "Foundation Complete", "Wall Framing", "Roof Installation")
- Start dates (in YYYY-MM-DD format)
- End dates (in YYYY-MM-DD format)
- Brief notes describing the milestone

Return your response as a JSON object with a "milestones" array in this exact format:
{
  "milestones": [
    {
      "title": "Milestone Name",
      "startDate": "YYYY-MM-DD",
      "endDate": "YYYY-MM-DD",
      "notes": "Brief description"
    }
  ]
}

If you cannot find clear dates or milestones, return: {"milestones": []}

Available phases in the project:
${phases.map(p => `- ${p.name} (ID: ${p.id})`).join('\n') || 'No phases defined yet'}

Try to match milestones to appropriate phases when possible. Extract dates from the document and convert them to YYYY-MM-DD format.`;

        const completion = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: `Extract milestones from this document:\n\n${textToAnalyze.substring(0, 8000)}` }
          ],
          temperature: 0.3,
          max_tokens: 1500,
        });

        const response = completion.choices[0]?.message?.content || '[]';
        let milestones: any[] = [];
        
        try {
          // Try to parse as JSON directly
          const parsed = JSON.parse(response);
          milestones = Array.isArray(parsed) ? parsed : (parsed.milestones || []);
        } catch (e) {
          // Try to extract JSON from markdown code blocks
          const jsonMatch = response.match(/```(?:json)?\s*(\[[\s\S]*?\])\s*```/);
          if (jsonMatch) {
            try {
              milestones = JSON.parse(jsonMatch[1]);
            } catch (e2) {
              // Try to extract JSON object
              const objMatch = response.match(/\{[\s\S]*"milestones"[\s\S]*\}/);
              if (objMatch) {
                const parsed = JSON.parse(objMatch[0]);
                milestones = parsed.milestones || [];
              }
            }
          } else {
            // Try to find JSON object in response
            const objMatch = response.match(/\{[\s\S]*\}/);
            if (objMatch) {
              try {
                const parsed = JSON.parse(objMatch[0]);
                milestones = parsed.milestones || (Array.isArray(parsed) ? parsed : []);
              } catch (e3) {
                console.error('Failed to parse JSON:', e3);
              }
            }
          }
        }

        if (milestones.length === 0) {
          alert('No milestones could be extracted from the document. Please ensure the document contains dates and milestone information.');
          setIsExtracting(false);
          return;
        }

        // Create milestones
        let createdCount = 0;
        for (const milestone of milestones) {
          if (milestone.title && milestone.startDate && milestone.endDate) {
            // Find appropriate phase or use first available
            let phaseId = phases[0]?.id || '';
            
            // Try to match phase by name if milestone notes mention it
            if (milestone.notes) {
              const matchingPhase = phases.find(p => 
                milestone.notes.toLowerCase().includes(p.name.toLowerCase()) ||
                milestone.title.toLowerCase().includes(p.name.toLowerCase())
              );
              if (matchingPhase) {
                phaseId = matchingPhase.id;
              }
            }

            await addMilestone({
              title: milestone.title,
              startDate: milestone.startDate,
              endDate: milestone.endDate,
              phaseId: phaseId,
              notes: milestone.notes || 'Extracted by AI from document',
            });
            createdCount++;
          }
        }

        if (createdCount > 0) {
          alert(`Successfully extracted ${createdCount} milestone(s) using AI!`);
          setDocumentText('');
          setUploadedFile(null);
        } else {
          alert('AI extracted milestones but they were missing required fields. Please check the document format.');
        }
      } else {
        // Fallback to basic pattern matching if OpenAI is not configured
        const datePattern = /\d{4}-\d{2}-\d{2}|\d{1,2}\/\d{1,2}\/\d{4}/g;
        const dates = textToAnalyze.match(datePattern);
        if (dates && dates.length >= 2) {
          addMilestone({
            title: 'Extracted Milestone',
            startDate: dates[0].includes('/') 
              ? new Date(dates[0]).toISOString().split('T')[0]
              : dates[0],
            endDate: dates[1].includes('/')
              ? new Date(dates[1]).toISOString().split('T')[0]
              : dates[1],
            phaseId: phases[0]?.id || '',
            notes: 'Extracted from document (basic extraction - configure OpenAI for AI-powered extraction)',
          });
          alert('Milestone extracted using basic pattern matching. Configure OpenAI API key for AI-powered extraction.');
        } else {
          const today = new Date();
          const nextWeek = new Date(today);
          nextWeek.setDate(nextWeek.getDate() + 7);
          addMilestone({
            title: 'Phase 1 - Planning',
            startDate: today.toISOString().split('T')[0],
            endDate: nextWeek.toISOString().split('T')[0],
            phaseId: phases[0]?.id || '',
            notes: 'Extracted from document (basic extraction - configure OpenAI for AI-powered extraction)',
          });
          alert('Created default milestone. Configure OpenAI API key for AI-powered extraction.');
        }
        setDocumentText('');
        setUploadedFile(null);
      }
    } catch (error: any) {
      console.error('Error extracting milestones:', error);
      alert(`Error extracting milestones: ${error.message || 'Unknown error'}. Please try again or check your OpenAI API key.`);
    } finally {
      setIsExtracting(false);
    }
  };

  return (
    <div className="pb-20 min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="px-4 py-4">
          <h1 className="text-2xl font-bold text-gray-900">AI Assistant</h1>
          <p className="text-sm text-gray-500 mt-1">Get help with your construction project</p>
          {!openAIConfigured && (
            <div className="mt-2 bg-yellow-50 border border-yellow-200 rounded-lg p-2 flex items-center gap-2">
              <AlertCircle size={16} className="text-yellow-600" />
              <p className="text-xs text-yellow-800">
                OpenAI API key not configured. Add VITE_OPENAI_API_KEY to .env for ChatGPT.
              </p>
            </div>
          )}
          {aiError && (
            <div className="mt-2 bg-red-50 border border-red-200 rounded-lg p-2 flex items-center gap-2">
              <AlertCircle size={16} className="text-red-600" />
              <p className="text-xs text-red-800">{aiError}</p>
            </div>
          )}
        </div>
        <div className="px-4 pb-4">
          <div className="flex bg-gray-100 rounded-xl p-1">
            <button
              onClick={() => setActiveTab('chat')}
              className={`flex-1 py-2 px-4 rounded-lg transition-all ${
                activeTab === 'chat' ? 'bg-white text-accent-purple shadow-sm font-medium' : 'text-gray-600'
              }`}
            >
              AI Chat
            </button>
            <button
              onClick={() => setActiveTab('extractor')}
              className={`flex-1 py-2 px-4 rounded-lg transition-all ${
                activeTab === 'extractor' ? 'bg-white text-accent-purple shadow-sm font-medium' : 'text-gray-600'
              }`}
            >
              Timeline Extractor
            </button>
          </div>
        </div>
      </div>

      {activeTab === 'chat' && (
        <div className="flex flex-col h-[calc(100vh-200px)]">
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
            {messages.map((message) => (
              <div key={message.id} className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] rounded-3xl px-4 py-3 ${
                  message.sender === 'user' ? 'bg-accent-purple text-white' : 'bg-white text-gray-900 shadow-sm'
                }`}>
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
            {documents.length > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-2xl p-3 mx-2 mb-2">
                <div className="flex items-center gap-2 mb-1">
                  <FileText size={16} className="text-blue-600" />
                  <p className="text-xs font-medium text-blue-900">
                    {documents.length} document(s) available for questions
                  </p>
                </div>
              </div>
            )}
            {messages.length === 1 && (
              <div className="space-y-2">
                <p className="text-sm text-gray-500 px-2">Suggested topics:</p>
                <div className="flex flex-wrap gap-2">
                  {suggestedChips.map((chip) => (
                    <button
                      key={chip}
                      onClick={() => setInputText(chip)}
                      className="px-4 py-2 bg-white rounded-full text-sm text-gray-700 border border-gray-200 hover:border-accent-purple hover:text-accent-purple transition-colors"
                    >
                      {chip}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
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
                disabled={isProcessing}
                className="bg-accent-purple text-white p-3 rounded-xl shadow-sm hover:shadow-md transition-shadow disabled:opacity-50"
              >
                {isProcessing ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Send size={20} />
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'extractor' && (
        <div className="px-4 mt-4 space-y-4">
          <div className="bg-white rounded-3xl shadow-sm p-4">
            <h2 className="font-semibold text-gray-900 mb-3">Upload Document</h2>
            <input ref={fileInputRef} type="file" onChange={(e) => e.target.files?.[0] && processFile(e.target.files[0])} className="hidden" />
            {!uploadedFile ? (
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`w-full border-2 border-dashed rounded-2xl p-8 text-center transition-all cursor-pointer ${
                  isDragging ? 'border-accent-purple bg-purple-100 scale-105' : 'border-gray-300 hover:border-accent-purple hover:bg-purple-50'
                } ${uploading ? 'opacity-50' : ''}`}
              >
                <Upload size={48} className={`mx-auto mb-2 ${isDragging ? 'text-accent-purple' : 'text-gray-400'}`} />
                <p className="text-sm text-gray-500">
                  {uploading ? 'Uploading...' : isDragging ? 'Drop file here' : 'Click to upload or drag and drop'}
                </p>
                <p className="text-xs text-gray-400 mt-1">Any file type accepted</p>
              </div>
            ) : (
              <div className="border-2 border-accent-purple rounded-2xl p-4 mb-4 bg-purple-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FileText size={24} className="text-accent-purple" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">{getFile(uploadedFile)?.name || 'Uploaded file'}</p>
                      <p className="text-xs text-gray-500">File uploaded successfully</p>
                    </div>
                  </div>
                  <button onClick={() => { setUploadedFile(null); setDocumentText(''); }} className="p-2 text-gray-400 hover:text-red-500">
                    <X size={20} />
                  </button>
                </div>
              </div>
            )}
            <textarea
              value={documentText}
              onChange={(e) => setDocumentText(e.target.value)}
              placeholder="Paste your project schedule, timeline, or document text here..."
              rows={10}
              className="w-full mt-3 px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-accent-purple resize-none"
            />
            <button
              onClick={handleExtractMilestones}
              disabled={isExtracting || (!documentText.trim() && !uploadedFile)}
              className="w-full mt-4 bg-accent-purple text-white py-4 rounded-xl font-medium shadow-sm hover:shadow-md transition-shadow disabled:opacity-50 flex items-center justify-center gap-2"
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
          </div>
        </div>
      )}
    </div>
  );
};

export default AIAssistantView;
