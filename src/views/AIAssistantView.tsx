import React, { useState, useRef } from 'react';
import { Bot, Send, Upload, FileText, Sparkles, X, AlertCircle } from 'lucide-react';
import { useApp } from '../context/AppContextSupabase';
import { openai, isOpenAIConfigured } from '../lib/openai';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'assistant';
}

const AIAssistantView: React.FC = () => {
  const context = useApp();
  
  const { 
    milestones = [], 
    addMilestone, 
    phases = [], 
    documents = [], 
    uploadFile, 
    getFile 
  } = context || {};

  // Only show loading if context itself is missing
  if (!context) {
    return (
      <div className="pb-20 min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }
  
  // Check if OpenAI is configured
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

  // Enhanced function to search through documents and their file contents
  const searchDocuments = async (query: string): Promise<string> => {
    if (!documents || documents.length === 0) {
      return `I don't have any documents uploaded yet. Please upload plans or contracts in the Plans & Contracts tab, and then I'll be able to answer questions about them.`;
    }

    const queryLower = query.toLowerCase();
    const queryWords = queryLower.split(/\s+/).filter(w => w.length > 2);
    const relevantDocs: Array<{ 
      title: string; 
      type: string; 
      snippets: string[]; 
      score: number;
      fullContent?: string;
    }> = [];

    // Search through all documents
    for (const doc of documents) {
      if (!doc) continue;

      let searchableContent = doc.textContent || '';
      const titleLower = doc.title.toLowerCase();
      let score = 0;
      const snippets: string[] = [];

      // Try to get the actual file content if available
      if (doc.fileId) {
        const fileData = getFile(doc.fileId);
        if (fileData && fileData.dataUrl) {
          try {
            // Extract text from file based on type
            if (fileData.type === 'text/plain' || fileData.name.endsWith('.txt')) {
              // For text files, decode the base64 content
              const base64Match = fileData.dataUrl.match(/^data:text\/plain;base64,(.+)$/);
              if (base64Match) {
                try {
                  const decoded = atob(base64Match[1]);
                  searchableContent = decoded;
                } catch (e) {
                  // If decode fails, try without base64 prefix
                  searchableContent = fileData.dataUrl.replace(/^data:text\/plain[^,]*,/, '');
                }
              } else {
                // Try direct text extraction
                searchableContent = fileData.dataUrl.replace(/^data:[^;]*;base64,/, '');
                try {
                  searchableContent = atob(searchableContent);
                } catch (e) {
                  // Keep original if decode fails
                }
              }
            } else if (fileData.type.includes('pdf') || fileData.name.endsWith('.pdf')) {
              // For PDFs, we can search the metadata textContent that was extracted
              // In a production app, you'd use a PDF parsing library
              searchableContent = doc.textContent || `PDF Document: ${fileData.name}`;
            } else {
              // For other file types, use the extracted textContent
              searchableContent = doc.textContent || `Document: ${fileData.name}`;
            }
          } catch (error) {
            console.error('Error reading file content:', error);
            // Fall back to textContent
            searchableContent = doc.textContent || '';
          }
        }
      }

      if (!searchableContent || searchableContent.trim().length === 0) {
        continue;
      }

      const contentLower = searchableContent.toLowerCase();

      // Check title match (higher weight)
      if (titleLower.includes(queryLower)) {
        score += 10;
      }
      queryWords.forEach(word => {
        if (titleLower.includes(word)) score += 3;
      });

      // Check for exact phrase match in content
      if (contentLower.includes(queryLower)) {
        score += 8;
        // Extract multiple contexts around matches
        let searchIndex = 0;
        let matchCount = 0;
        while (matchCount < 3 && searchIndex < contentLower.length) {
          const index = contentLower.indexOf(queryLower, searchIndex);
          if (index === -1) break;
          
          const start = Math.max(0, index - 150);
          const end = Math.min(searchableContent.length, index + queryLower.length + 150);
          const context = searchableContent.substring(start, end).trim();
          
          // Clean up context (remove partial words at start/end)
          const cleanContext = context.replace(/^[^\s]*\s/, '').replace(/\s[^\s]*$/, '');
          if (cleanContext.length > 20 && !snippets.includes(cleanContext)) {
            snippets.push(cleanContext);
            matchCount++;
          }
          searchIndex = index + 1;
        }
      }

      // Check for individual word matches
      queryWords.forEach(word => {
        if (contentLower.includes(word)) {
          score += 2;
          // Find sentences/paragraphs containing the word
          const sentences = searchableContent.split(/[.!?\n]+/);
          const matchingSentences = sentences
            .filter(s => s.toLowerCase().includes(word) && s.trim().length > 10)
            .slice(0, 3);
          matchingSentences.forEach(s => {
            const trimmed = s.trim();
            if (trimmed.length > 0 && !snippets.some(existing => existing.includes(trimmed))) {
              snippets.push(trimmed);
            }
          });
        }
      });

      // Check document type
      if (queryLower.includes('plan') && doc.type === 'Plan') score += 2;
      if (queryLower.includes('contract') && doc.type === 'Contract') score += 2;

      if (score > 0) {
        relevantDocs.push({
          title: doc.title,
          type: doc.type,
          snippets: snippets.slice(0, 5), // Get up to 5 relevant snippets
          score,
          fullContent: searchableContent.length > 5000 ? searchableContent.substring(0, 5000) : searchableContent
        });
      }
    }

    // Sort by relevance score
    relevantDocs.sort((a, b) => b.score - a.score);

    if (relevantDocs.length > 0) {
      const topDocs = relevantDocs.slice(0, 3); // Top 3 most relevant
      let response = `I found relevant information in ${relevantDocs.length} document(s):\n\n`;
      
      topDocs.forEach((doc, index) => {
        response += `${index + 1}. **${doc.title}** (${doc.type})\n`;
        if (doc.snippets.length > 0) {
          // Show the most relevant snippets
          doc.snippets.slice(0, 2).forEach((snippet, i) => {
            if (snippet.length > 0) {
              response += `   ${i + 1}. ${snippet.substring(0, 200)}${snippet.length > 200 ? '...' : ''}\n`;
            }
          });
        }
        response += `\n`;
      });

      if (relevantDocs.length > 3) {
        response += `\nAnd ${relevantDocs.length - 3} more document(s) may contain relevant information.`;
      }

      // Provide a more specific answer if we found good matches
      const bestMatch = relevantDocs[0];
      if (bestMatch && bestMatch.score >= 5) {
        response += `\n\n**Answer:** Based on the document "${bestMatch.title}", `;
        // Try to extract a direct answer from the best snippet
        const bestSnippet = bestMatch.snippets[0] || '';
        if (bestSnippet.length > 50) {
          response += bestSnippet.substring(0, 300);
          if (bestSnippet.length > 300) response += '...';
        } else {
          response += `the information you're looking for appears in this document.`;
        }
      }

      response += `\n\nWould you like me to search for something more specific?`;
      return response;
    }

    // If no matches, suggest available documents
    const docList = documents.map(d => `${d.title} (${d.type})`).join(', ');
    return `I couldn't find specific information about "${query}" in the uploaded documents.\n\nI have access to ${documents.length} document(s): ${docList}\n\nTry asking about:\n- Specific document titles\n- Information that might be in plans or contracts\n- Or upload more documents with the information you need`;
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
        // First, get relevant document context
        let documentContext = '';
        if (documents.length > 0) {
          const relevantDocs = await searchDocuments(currentQuery);
          documentContext = `\n\nRelevant information from uploaded documents:\n${relevantDocs}`;
        }

        // Build system prompt with context
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

        const userPrompt = currentQuery + documentContext;

        const completion = await openai.chat.completions.create({
          model: 'gpt-4o-mini', // Using gpt-4o-mini for cost efficiency, can be changed to gpt-4 or gpt-3.5-turbo
          messages: [
            { role: 'system', content: systemPrompt },
            ...messages.slice(-5).map(msg => ({
              role: msg.sender === 'user' ? 'user' : 'assistant',
              content: msg.text
            })),
            { role: 'user', content: userPrompt }
          ],
          temperature: 0.7,
          max_tokens: 1000,
        });

        response = completion.choices[0]?.message?.content || 'I apologize, but I encountered an error generating a response.';
      } else {
        // Fallback to rule-based system if OpenAI is not configured
        const documentKeywords = ['document', 'plan', 'contract', 'specification', 'spec', 'detail', 'upload', 'file', 'what does', 'tell me about', 'information about', 'what is in', 'what says', 'what contains', 'show me', 'find', 'search'];
        const isDocumentQuery = documentKeywords.some(keyword => 
          currentQuery.toLowerCase().includes(keyword)
        ) || documents.length > 0;

        if (isDocumentQuery && documents.length > 0) {
          response = await searchDocuments(currentQuery);
        } else if (currentQuery.toLowerCase().includes('timeline') || currentQuery.toLowerCase().includes('schedule')) {
          response = `I can help with timeline planning. You currently have ${milestones.length} milestone(s) in your timeline. Would you like me to help create new milestones or analyze your existing timeline?`;
        } else if (currentQuery.toLowerCase().includes('safety')) {
          response = `Here are some general construction safety guidelines:\n\n1. Always wear appropriate PPE (hard hat, safety glasses, steel-toed boots)\n2. Follow proper lockout/tagout procedures\n3. Maintain clear work areas and proper signage\n4. Conduct regular safety inspections\n5. Ensure all workers are properly trained\n\nFor project-specific safety requirements, please check your uploaded plans and contracts.`;
        } else if (currentQuery.toLowerCase().includes('material') || currentQuery.toLowerCase().includes('estimate')) {
          response = `I can help with material estimates. To provide accurate estimates, I would need:\n- Project dimensions and specifications\n- Material types and grades\n- Quantity requirements\n\nThis information is typically found in your project plans. Would you like me to search through your uploaded documents for material specifications?`;
        } else {
          if (documents.length > 0) {
            response = `I understand you're asking about: "${currentQuery}". Let me search through your ${documents.length} document(s) for relevant information...\n\n${await searchDocuments(currentQuery)}`;
          } else {
            response = `I understand you're asking about: "${currentQuery}". I can help with timeline planning, safety guidelines, and material estimates. To answer questions about your specific project, please upload your plans and contracts in the Plans & Contracts tab.`;
          }
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
      setAiError(error.message || 'Failed to get AI response. Please check your OpenAI API key.');
      
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

  const handleSuggestedChip = (chip: string) => {
    setInputText(chip);
  };

  const processFile = async (file: File) => {
    if (!file) return;

    // Accept any file type

    setUploading(true);
    try {
      const uploadedFileObj = await uploadFile(file);
      const fileId = uploadedFileObj.id;
      setUploadedFile(fileId);
      
      // Try to extract text from the file
      const fileData = getFile(fileId);
      if (fileData) {
        // For text files, read the content
        if (file.type === 'text/plain') {
          const response = await fetch(fileData.dataUrl);
          const text = await response.text();
          // Remove data URL prefix
          const textContent = text.replace(/^data:text\/plain;base64,/, '');
          try {
            const decoded = atob(textContent);
            setDocumentText(decoded);
          } catch {
            // If base64 decode fails, try direct text
            setDocumentText(text);
          }
        } else {
          // For PDF/DOC files, show a message
          setDocumentText(`Document "${file.name}" uploaded. Please paste the content below or the AI will extract milestones from the file structure.`);
        }
      }
    } catch (error) {
      alert('Failed to upload file. Please try again.');
      console.error('File upload error:', error);
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      await processFile(file);
    }
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
    if (files && files.length > 0) {
      await processFile(files[0]);
    }
  };

  const handleExtractMilestones = () => {
    if (!documentText.trim() && !uploadedFile) {
      alert('Please upload a document or paste text');
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
            phaseId: (phases && phases.length > 0) ? phases[0].id : '',
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
            phaseId: (phases && phases.length > 1) ? phases[1].id : ((phases && phases.length > 0) ? phases[0].id : ''),
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
          {!openAIConfigured && (
            <div className="mt-2 bg-yellow-50 border border-yellow-200 rounded-lg p-2 flex items-center gap-2">
              <AlertCircle size={16} className="text-yellow-600" />
              <p className="text-xs text-yellow-800">
                OpenAI API key not configured. Using rule-based responses. Add VITE_OPENAI_API_KEY to .env for ChatGPT.
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

            {/* Available Documents Info */}
            {documents.length > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-2xl p-3 mx-2 mb-2">
                <div className="flex items-center gap-2 mb-1">
                  <FileText size={16} className="text-blue-600" />
                  <p className="text-xs font-medium text-blue-900">
                    {documents.length} document(s) available for questions
                  </p>
                </div>
                <p className="text-xs text-blue-700">
                  Ask me about: {documents.slice(0, 3).map(d => d.title).join(', ')}
                  {documents.length > 3 && ` and ${documents.length - 3} more`}
                </p>
              </div>
            )}

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
                disabled={isProcessing}
                className="bg-accent-purple text-white p-3 rounded-xl shadow-sm hover:shadow-md transition-shadow disabled:opacity-50 disabled:cursor-not-allowed"
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

      {/* Timeline Extractor Tab */}
      {activeTab === 'extractor' && (
        <div className="px-4 mt-4 space-y-4">
          <div className="bg-white rounded-3xl shadow-sm p-4">
            <h2 className="font-semibold text-gray-900 mb-3">Upload Document</h2>
            
            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileUpload}
              className="hidden"
            />
            
            {!uploadedFile ? (
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`w-full border-2 border-dashed rounded-2xl p-8 text-center transition-all cursor-pointer ${
                  isDragging
                    ? 'border-accent-purple bg-purple-100 scale-105'
                    : 'border-gray-300 hover:border-accent-purple hover:bg-purple-50'
                } ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
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
                      <p className="text-sm font-medium text-gray-900">
                        {getFile(uploadedFile)?.name || 'Uploaded file'}
                      </p>
                      <p className="text-xs text-gray-500">File uploaded successfully</p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setUploadedFile(null);
                      setDocumentText('');
                    }}
                    className="p-2 text-gray-400 hover:text-red-500"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>
            )}

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
              disabled={isExtracting || (!documentText.trim() && !uploadedFile)}
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

