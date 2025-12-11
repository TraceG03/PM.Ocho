import React, { useState } from 'react';
import { Bot, Send, FileText, AlertCircle } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { openai, isOpenAIConfigured } from '../lib/openai';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'assistant';
}

const AIAssistantView: React.FC = () => {
  const { 
    milestones, 
    phases, 
    documents, 
    tasks, 
    photos, 
    files,
    getFile 
  } = useApp();
  
  const openAIConfigured = isOpenAIConfigured();
  
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: openAIConfigured 
        ? "Hello! I'm your AI construction site assistant powered by ChatGPT. I have full access to your project data including milestones, tasks, weekly planner, documents, photos, and phases. I can answer questions about any part of your project and help you manage your construction site. How can I help you today?"
        : "Hello! I'm your AI construction site assistant. I have full access to your project data including milestones, tasks, weekly planner, documents, photos, and phases. I can answer questions about any part of your project and help you manage your construction site. How can I help you today?",
      sender: 'assistant',
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  const suggestedChips = ['Show my timeline', 'What tasks do I have?', 'Project summary'];

  // Build comprehensive app context for AI
  const buildAppContext = (): string => {
    const today = new Date().toISOString().split('T')[0];
    
    let context = `=== COMPLETE PROJECT DATA ===\n\n`;
    
    // Phases
    context += `PHASES (${phases.length}):\n`;
    if (phases.length > 0) {
      phases.forEach((phase, idx) => {
        context += `${idx + 1}. ${phase.name} (Color: ${phase.color})\n`;
      });
    } else {
      context += `No phases defined yet.\n`;
    }
    context += `\n`;
    
    // Milestones
    context += `MILESTONES (${milestones.length}):\n`;
    if (milestones.length > 0) {
      const sortedMilestones = [...milestones].sort((a, b) => 
        new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
      );
      sortedMilestones.forEach((milestone, idx) => {
        const phase = phases.find(p => p.id === milestone.phaseId);
        const phaseName = phase ? phase.name : 'No phase';
        const startDate = new Date(milestone.startDate);
        const endDate = new Date(milestone.endDate);
        const isPast = new Date(milestone.endDate) < new Date(today);
        const isCurrent = new Date(milestone.startDate) <= new Date(today) && new Date(milestone.endDate) >= new Date(today);
        const status = isPast ? 'Completed' : isCurrent ? 'In Progress' : 'Upcoming';
        
        context += `${idx + 1}. "${milestone.title}"\n`;
        context += `   Phase: ${phaseName}\n`;
        context += `   Dates: ${startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} - ${endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}\n`;
        context += `   Status: ${status}\n`;
        if (milestone.notes) {
          context += `   Notes: ${milestone.notes.substring(0, 100)}${milestone.notes.length > 100 ? '...' : ''}\n`;
        }
        context += `\n`;
      });
    } else {
      context += `No milestones in timeline yet.\n`;
    }
    context += `\n`;
    
    // Tasks
    context += `TASKS (${tasks.length} total):\n`;
    const completedTasks = tasks.filter(t => t.completed).length;
    const pendingTasks = tasks.filter(t => !t.completed).length;
    const highPriorityTasks = tasks.filter(t => t.priority === 'High' && !t.completed).length;
    
    context += `- Completed: ${completedTasks}\n`;
    context += `- Pending: ${pendingTasks}\n`;
    context += `- High Priority Pending: ${highPriorityTasks}\n\n`;
    
    if (tasks.length > 0) {
      // Group tasks by date
      const tasksByDate = tasks.reduce((acc, task) => {
        if (!acc[task.date]) acc[task.date] = [];
        acc[task.date].push(task);
        return acc;
      }, {} as Record<string, typeof tasks>);
      
      const sortedDates = Object.keys(tasksByDate).sort((a, b) => 
        new Date(a).getTime() - new Date(b).getTime()
      );
      
      sortedDates.slice(0, 10).forEach(date => {
        const dateTasks = tasksByDate[date];
        const dateObj = new Date(date);
        const isToday = date === today;
        context += `${isToday ? 'TODAY' : dateObj.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} (${dateTasks.length} task${dateTasks.length !== 1 ? 's' : ''}):\n`;
        dateTasks.forEach(task => {
          context += `  - ${task.completed ? '[✓]' : '[ ]'} ${task.name}`;
          if (task.priority === 'High') context += ` [HIGH PRIORITY]`;
          if (task.category !== 'General') context += ` (${task.category})`;
          if (task.crew) context += ` - Crew: ${task.crew}`;
          context += `\n`;
        });
        context += `\n`;
      });
      
      if (sortedDates.length > 10) {
        context += `... and ${sortedDates.length - 10} more days with tasks\n\n`;
      }
    } else {
      context += `No tasks in weekly planner yet.\n`;
    }
    context += `\n`;
    
    // Documents
    context += `DOCUMENTS (${documents.length}):\n`;
    if (documents.length > 0) {
      documents.forEach((doc, idx) => {
        context += `${idx + 1}. "${doc.title}" (${doc.type})\n`;
        if (doc.description) {
          context += `   Description: ${doc.description.substring(0, 80)}${doc.description.length > 80 ? '...' : ''}\n`;
        }
        context += `   Uploaded: ${new Date(doc.uploadedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}\n`;
        context += `\n`;
      });
    } else {
      context += `No documents uploaded yet.\n`;
    }
    context += `\n`;
    
    // Photos
    context += `PHOTOS/REPORTS (${photos.length}):\n`;
    if (photos.length > 0) {
      const recentPhotos = photos.slice(0, 5);
      recentPhotos.forEach((photo, idx) => {
        context += `${idx + 1}. ${photo.caption || 'Untitled'} (${photo.source})\n`;
        context += `   Date: ${new Date(photo.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}\n`;
        context += `\n`;
      });
      if (photos.length > 5) {
        context += `... and ${photos.length - 5} more photos\n\n`;
      }
    } else {
      context += `No photos/reports uploaded yet.\n`;
    }
    context += `\n`;
    
    // Summary Statistics
    context += `=== PROJECT SUMMARY ===\n`;
    context += `Total Phases: ${phases.length}\n`;
    context += `Total Milestones: ${milestones.length}\n`;
    context += `Total Tasks: ${tasks.length} (${completedTasks} completed, ${pendingTasks} pending)\n`;
    context += `Total Documents: ${documents.length}\n`;
    context += `Total Photos: ${photos.length}\n`;
    context += `Total Files: ${files.length}\n`;
    
    // Upcoming milestones (next 30 days)
    const upcomingMilestones = milestones.filter(m => {
      const endDate = new Date(m.endDate);
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
      return endDate >= new Date(today) && endDate <= thirtyDaysFromNow;
    });
    
    if (upcomingMilestones.length > 0) {
      context += `\nUPCOMING MILESTONES (next 30 days):\n`;
      upcomingMilestones.forEach((milestone, idx) => {
        const phase = phases.find(p => p.id === milestone.phaseId);
        context += `${idx + 1}. "${milestone.title}" (${phase?.name || 'No phase'}) - Due: ${new Date(milestone.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}\n`;
      });
    }
    
    return context;
  };

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

        // Build complete app context
        const appContext = buildAppContext();

        const systemPrompt = `You are an AI construction site assistant with FULL ACCESS to the user's entire project data. You can see and reference:

1. TIMELINE & MILESTONES: All project milestones with dates, phases, status (completed/in progress/upcoming), and notes
2. WEEKLY PLANNER & TASKS: All tasks organized by date, including completed/pending status, priority, category, crew assignments, and notes
3. PHASES: All project phases with names and colors
4. DOCUMENTS: All uploaded plans, contracts, and documents with titles, types, descriptions, and content
5. PHOTOS/REPORTS: All photos and reports with captions and dates
6. FILES: All uploaded files

You have complete visibility into:
- What milestones are coming up
- What tasks are pending or completed
- What documents contain relevant information
- Project progress and status
- Dates, schedules, and deadlines

When answering questions:
- Reference SPECIFIC data from the project (e.g., "You have 3 milestones coming up in the next 2 weeks: Foundation Complete on Jan 15, Framing Start on Jan 20...")
- Use actual milestone names, task names, dates, and details from the project
- Provide insights based on the complete project data
- Be helpful, professional, and construction-focused
- Reference specific information from uploaded documents when available
- Provide practical, actionable advice based on the actual project state
- If asked about something not in the data, say so clearly

You can answer questions like:
- "What milestones do I have coming up?"
- "Show me my tasks for this week"
- "What's the status of my project?"
- "What does my timeline look like?"
- "What tasks are high priority?"
- "What information is in my documents about [topic]?"
- And any other question about the project data`;

        const completion = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'system', content: `Here is the complete project data:\n\n${appContext}` },
            ...messages.slice(-5).map(msg => ({
              role: (msg.sender === 'user' ? 'user' : 'assistant') as 'user' | 'assistant',
              content: msg.text
            })),
            { role: 'user', content: currentQuery + (documentContext ? `\n\nRelevant document context:\n${documentContext}` : '') }
          ],
          temperature: 0.7,
          max_tokens: 2000,
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

  return (
    <div className="pb-20 min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="bg-white dark:bg-gray-800 shadow-sm sticky top-0 z-10">
        <div className="px-4 py-4">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">AI Assistant</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Get help with your construction project</p>
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
      </div>

      <div className="flex flex-col h-[calc(100vh-200px)]">
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
          {messages.map((message) => (
            <div key={message.id} className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] rounded-3xl px-4 py-3 ${
                message.sender === 'user' ? 'bg-accent-purple text-white' : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm'
              }`}>
                {message.sender === 'assistant' && (
                  <div className="flex items-center gap-2 mb-1">
                    <Bot size={16} className="text-accent-purple" />
                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400">AI Assistant</span>
                  </div>
                )}
                <p className="text-sm whitespace-pre-wrap">{message.text}</p>
              </div>
            </div>
          ))}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-2xl p-3 mx-2 mb-2">
            <div className="flex items-center gap-2 mb-1">
              <FileText size={16} className="text-blue-600 dark:text-blue-400" />
              <p className="text-xs font-medium text-blue-900 dark:text-blue-200">
                AI has access to: {milestones.length} milestones, {tasks.length} tasks, {phases.length} phases, {documents.length} documents, {photos.length} photos
              </p>
            </div>
          </div>
          {messages.length === 1 && (
            <div className="space-y-2">
              <p className="text-sm text-gray-500 dark:text-gray-400 px-2">Suggested topics:</p>
              <div className="flex flex-wrap gap-2">
                {suggestedChips.map((chip) => (
                  <button
                    key={chip}
                    onClick={() => setInputText(chip)}
                    className="px-4 py-2 bg-white dark:bg-gray-800 rounded-full text-sm text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:border-accent-purple hover:text-accent-purple transition-colors"
                  >
                    {chip}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
        <div className="px-4 py-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Type your message..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              className="flex-1 px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-accent-purple"
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
    </div>
  );
};

export default AIAssistantView;
