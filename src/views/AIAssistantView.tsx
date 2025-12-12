import React, { useState, useRef } from 'react';
import { Bot, Send, FileText, AlertCircle, Upload, Link as LinkIcon } from 'lucide-react';
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
    getFile,
    addMilestone
  } = useApp();
  
  const openAIConfigured = isOpenAIConfigured();
  
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: openAIConfigured 
        ? "Hello! I'm your AI assistant powered by GPT-4o-mini. I'm a general-purpose AI that can help you with a wide variety of tasks - from answering questions, writing, analysis, coding, and more. I also have access to your project data (milestones, tasks, documents, photos, phases) which I can reference when relevant. How can I help you today?"
        : "Hello! I'm your AI assistant. I can help you with a wide variety of tasks. I also have access to your project data (milestones, tasks, documents, photos, phases) which I can reference when relevant. How can I help you today?",
      sender: 'assistant',
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [uploadedContent, setUploadedContent] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const suggestedChips = ['Show my timeline', 'What tasks do I have?', 'Project summary', 'Help me write', 'Explain something'];

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

  // Fetch content from URL (with CORS proxy)
  const fetchUrlContent = async (url: string): Promise<string> => {
    try {
      // Try direct fetch first
      try {
        const response = await fetch(url);
        if (response.ok) {
          return await response.text();
        }
      } catch (e) {
        // If direct fetch fails, try CORS proxy
      }
      
      // Use CORS proxy
      const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`;
      const response = await fetch(proxyUrl);
      const data = await response.json();
      return data.contents || '';
    } catch (error: any) {
      throw new Error(`Failed to fetch URL: ${error.message}`);
    }
  };

  // Parse Microsoft Project XML file
  const parseProjectXML = (xmlContent: string): Array<{ title: string; startDate: string; endDate: string; notes: string }> => {
    const milestones: Array<{ title: string; startDate: string; endDate: string; notes: string }> = [];
    try {
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlContent, 'text/xml');
      
      // Check for parse errors
      const parseError = xmlDoc.querySelector('parsererror');
      if (parseError) {
        throw new Error('Invalid XML format');
      }

      // Find all tasks in the XML
      const tasks = xmlDoc.querySelectorAll('Task');
      tasks.forEach((task) => {
        const name = task.querySelector('Name')?.textContent || '';
        const start = task.querySelector('Start')?.textContent || '';
        const finish = task.querySelector('Finish')?.textContent || '';
        const notes = task.querySelector('Notes')?.textContent || '';

        if (name && start && finish) {
          // Convert Microsoft Project date format (if needed)
          const startDate = new Date(start).toISOString().split('T')[0];
          const endDate = new Date(finish).toISOString().split('T')[0];
          
          milestones.push({
            title: name,
            startDate,
            endDate,
            notes: notes || '',
          });
        }
      });
    } catch (error) {
      console.error('Error parsing XML:', error);
      throw error;
    }
    return milestones;
  };

  // Extract text from uploaded file
  const extractTextFromFile = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      if (file.type === 'text/plain' || file.name.endsWith('.txt')) {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.onerror = reject;
        reader.readAsText(file);
      } else if (file.name.endsWith('.xml')) {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.onerror = reject;
        reader.readAsText(file);
      } else {
        reject(new Error('Unsupported file type. Please upload .txt or .xml files.'));
      }
    });
  };

  // Handle file upload
  const handleFileUpload = async (file: File) => {
    try {
      setIsProcessing(true);
      setAiError(null);
      
      const fileContent = await extractTextFromFile(file);
      
      // Check if it's a Microsoft Project XML file
      if (file.name.endsWith('.xml') && fileContent.includes('<Project')) {
        const xmlMilestones = parseProjectXML(fileContent);
        
        if (xmlMilestones.length > 0) {
          // Add all milestones from XML
          let addedCount = 0;
          for (const milestone of xmlMilestones) {
            try {
              const phaseId = phases.length > 0 ? phases[0].id : '';
              await addMilestone({
                title: milestone.title,
                startDate: milestone.startDate,
                endDate: milestone.endDate,
                phaseId,
                notes: milestone.notes,
              });
              addedCount++;
            } catch (error) {
              console.error('Error adding milestone:', error);
            }
          }
          
          const userMessage: Message = {
            id: Date.now().toString(),
            text: `Uploaded file: ${file.name}`,
            sender: 'user',
          };
          setMessages(prev => [...prev, userMessage]);
          
          const assistantMessage: Message = {
            id: (Date.now() + 1).toString(),
            text: `✅ Successfully extracted and added ${addedCount} milestone(s) from the Microsoft Project XML file!`,
            sender: 'assistant',
          };
          setMessages(prev => [...prev, assistantMessage]);
          return;
        }
      }
      
      // For text files or if XML parsing didn't work, use AI to extract milestones
      setUploadedContent(fileContent);
      setInputText(`Extract milestones from this content:\n\n${fileContent.substring(0, 5000)}${fileContent.length > 5000 ? '...' : ''}`);
      
    } catch (error: any) {
      setAiError(error.message || 'Failed to process file');
      console.error('File upload error:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  // Parse AI response for milestone creation (single or multiple)
  const parseMilestonesFromResponse = (responseText: string): Array<{ title: string; startDate: string; endDate: string; phaseId: string; notes: string }> => {
    const milestones: Array<{ title: string; startDate: string; endDate: string; phaseId: string; notes: string }> = [];
    
    try {
      // Try to find single milestone JSON
      const singleMatch = responseText.match(/\{[\s\S]*"action"\s*:\s*"add_milestone"[\s\S]*?\}/);
      if (singleMatch) {
        const parsed = JSON.parse(singleMatch[0]);
        if (parsed.action === 'add_milestone' && parsed.milestone) {
          milestones.push(parsed.milestone);
          return milestones;
        }
      }
      
      // Try to find multiple milestones JSON array
      const arrayMatch = responseText.match(/\[[\s\S]*"action"\s*:\s*"add_milestone"[\s\S]*?\]/);
      if (arrayMatch) {
        const parsed = JSON.parse(arrayMatch[0]);
        if (Array.isArray(parsed)) {
          parsed.forEach((item: any) => {
            if (item.action === 'add_milestone' && item.milestone) {
              milestones.push(item.milestone);
            }
          });
          return milestones;
        }
      }
      
      // Try code blocks
      const codeBlockMatch = responseText.match(/```(?:json)?\s*(\{[\s\S]*"action"\s*:\s*"add_milestone"[\s\S]*?\})\s*```/);
      if (codeBlockMatch) {
        const parsed = JSON.parse(codeBlockMatch[1]);
        if (parsed.action === 'add_milestone' && parsed.milestone) {
          milestones.push(parsed.milestone);
          return milestones;
        }
      }
      
      // Try array in code block
      const arrayCodeBlockMatch = responseText.match(/```(?:json)?\s*(\[[\s\S]*"action"\s*:\s*"add_milestone"[\s\S]*?\])\s*```/);
      if (arrayCodeBlockMatch) {
        const parsed = JSON.parse(arrayCodeBlockMatch[1]);
        if (Array.isArray(parsed)) {
          parsed.forEach((item: any) => {
            if (item.action === 'add_milestone' && item.milestone) {
              milestones.push(item.milestone);
            }
          });
          return milestones;
        }
      }
    } catch (error) {
      console.error('Error parsing milestones from response:', error);
    }
    
    return milestones;
  };

  // Parse AI response for milestone creation (backward compatibility)
  const parseMilestoneFromResponse = (responseText: string): { title: string; startDate: string; endDate: string; phaseId: string; notes: string } | null => {
    const milestones = parseMilestonesFromResponse(responseText);
    return milestones.length > 0 ? milestones[0] : null;
  };

  const handleSendMessage = async () => {
    if (!inputText.trim() || isProcessing) return;

    let queryText = inputText;
    let urlContent = '';
    
    // Check if input contains a URL
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const urls = queryText.match(urlRegex);
    
    if (urls && urls.length > 0) {
      // Fetch content from URL
      try {
        setIsProcessing(true);
        const url = urls[0];
        urlContent = await fetchUrlContent(url);
        queryText += `\n\nContent from ${url}:\n${urlContent.substring(0, 10000)}${urlContent.length > 10000 ? '...' : ''}`;
      } catch (error: any) {
        setAiError(`Failed to fetch URL: ${error.message}`);
        setIsProcessing(false);
        return;
      }
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText,
      sender: 'user',
    };

    setMessages([...messages, userMessage]);
    const currentQuery = queryText;
    setInputText('');
    setIsProcessing(true);
    setAiError(null);

    try {
      let response = '';
      let milestonesAdded = 0;

      if (openAIConfigured && openai) {
        // Use OpenAI ChatGPT
        let documentContext = '';
        if (documents.length > 0) {
          documentContext = await searchDocuments(currentQuery);
        }

        // Build complete app context
        const appContext = buildAppContext();

        const systemPrompt = `You are a helpful AI assistant powered by GPT-4o-mini. You are a general-purpose AI that can help with a wide variety of tasks including:

- Answering questions on any topic
- Writing, editing, and creative tasks
- Analysis and problem-solving
- Coding and technical assistance
- General conversation and advice
- And much more!

You also have access to the user's project data, which includes:
1. TIMELINE & MILESTONES: All project milestones with dates, phases, status, and notes
2. WEEKLY PLANNER & TASKS: All tasks organized by date, including status, priority, category, crew assignments, and notes
3. PHASES: All project phases with names and colors
4. DOCUMENTS: All uploaded plans, contracts, and documents with titles, types, descriptions, and content
5. PHOTOS/REPORTS: All photos and reports with captions and dates
6. FILES: All uploaded files

When the user asks about their project, reference this data. When they ask general questions, answer naturally without forcing project context.

IMPORTANT: You can EXTRACT AND ADD MILESTONES to the timeline automatically! 

When the user provides text content that contains milestone information (dates, deadlines, tasks, schedules, project phases), AUTOMATICALLY extract and add them to the timeline. You should do this proactively - if you detect milestone information in the text, extract it even if the user doesn't explicitly ask.

Look for patterns like:
- Dates with task/milestone names
- Schedules or timelines
- Project phases with deadlines
- Task lists with dates
- "Start date", "End date", "Due date", "Deadline"
- Relative dates like "next week", "in 2 months" paired with tasks

When you detect milestone information in text:
1. Analyze the content for milestone information (tasks, deadlines, dates, project phases)
2. Extract ALL milestones you find with their titles, start dates, end dates, and any notes
3. Automatically respond with a JSON array in this format (for multiple milestones):
[
  {
    "action": "add_milestone",
    "milestone": {
      "title": "Milestone Title",
      "startDate": "YYYY-MM-DD",
      "endDate": "YYYY-MM-DD",
      "phaseId": "phase_id_here",
      "notes": "Optional notes"
    }
  }
]

Or for a single milestone:
{
  "action": "add_milestone",
  "milestone": {
    "title": "Milestone Title",
    "startDate": "YYYY-MM-DD",
    "endDate": "YYYY-MM-DD",
    "phaseId": "phase_id_here",
    "notes": "Optional notes"
  }
}

For phaseId, use the ID of an existing phase. If the user doesn't specify a phase, use the first available phase ID, or if no phases exist, use an empty string.

When extracting milestones:
- Look for dates, deadlines, task names, project phases
- Convert relative dates ("next week", "in 2 months") to actual dates
- Extract as many milestones as you can find in the content
- Include any relevant notes or descriptions

Be conversational, helpful, and natural. Answer questions directly and thoroughly. When project data is relevant, use it. When it's not, just answer the question normally.`;

        // Detect if the query contains milestone/schedule information
        const containsMilestoneInfo = currentQuery.toLowerCase().match(/\b(date|deadline|schedule|timeline|milestone|task|phase|start|end|due|january|february|march|april|may|june|july|august|september|october|november|december|\d{1,2}\/\d{1,2}|\d{4}-\d{2}-\d{2}|next week|in \d+ (days?|weeks?|months?))\b/);
        
        // Include project data if query is project-related OR contains milestone info
        const isProjectRelated = currentQuery.toLowerCase().match(/\b(milestone|task|phase|project|timeline|document|photo|schedule|deadline|construction|site)\b/) || containsMilestoneInfo;
        const projectDataMessage = isProjectRelated 
          ? { role: 'system' as const, content: `Here is the user's project data (use this when relevant):\n\n${appContext}\n\nAvailable phases: ${phases.map(p => `${p.name} (ID: ${p.id})`).join(', ') || 'No phases yet'}` }
          : null;
        
        // Enhance the user query if it contains milestone info but doesn't explicitly ask for extraction
        let enhancedQuery = currentQuery;
        if (containsMilestoneInfo && !currentQuery.toLowerCase().includes('extract') && !currentQuery.toLowerCase().includes('add milestone') && !currentQuery.toLowerCase().includes('create milestone')) {
          enhancedQuery = `${currentQuery}\n\n[Note: If this text contains milestone, task, or schedule information with dates, please automatically extract and add them to the timeline using the JSON format specified above.]`;
        }

        const messagesToSend = [
          { role: 'system' as const, content: systemPrompt },
          ...(projectDataMessage ? [projectDataMessage] : []),
          ...messages.slice(-10).map(msg => ({
            role: (msg.sender === 'user' ? 'user' : 'assistant') as 'user' | 'assistant',
            content: msg.text
          })),
          { role: 'user' as const, content: enhancedQuery + (documentContext ? `\n\nRelevant document context:\n${documentContext}` : '') }
        ];

        const completion = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: messagesToSend,
          temperature: 0.7,
          max_tokens: 4000,
        });

        response = completion.choices[0]?.message?.content || 'I apologize, but I encountered an error generating a response.';
        
        // Check if AI wants to add milestones (single or multiple)
        const extractedMilestones = parseMilestonesFromResponse(response);
        if (extractedMilestones.length > 0) {
          try {
            const validMilestones: Array<{ title: string; startDate: string; endDate: string; phaseId: string; notes: string }> = [];
            
            // Validate and prepare milestones
            for (const milestoneData of extractedMilestones) {
              if (milestoneData.title && milestoneData.startDate && milestoneData.endDate) {
                // Use provided phaseId or default to first phase
                let phaseId = milestoneData.phaseId;
                if (!phaseId && phases.length > 0) {
                  phaseId = phases[0].id;
                }
                
                validMilestones.push({
                  title: milestoneData.title,
                  startDate: milestoneData.startDate,
                  endDate: milestoneData.endDate,
                  phaseId: phaseId || '',
                  notes: milestoneData.notes || '',
                });
              }
            }
            
            if (validMilestones.length > 0) {
              // Add all valid milestones
              for (const milestone of validMilestones) {
                try {
                  await addMilestone(milestone);
                  milestonesAdded++;
                } catch (error: any) {
                  console.error('Error adding milestone:', error, milestone);
                }
              }
              
              // Remove JSON from response and add confirmation
              response = response.replace(/\{[\s\S]*"action"\s*:\s*"add_milestone"[\s\S]*?\}/g, '');
              response = response.replace(/\[[\s\S]*"action"\s*:\s*"add_milestone"[\s\S]*?\]/g, '');
              response = response.replace(/```(?:json)?\s*\{[\s\S]*"action"\s*:\s*"add_milestone"[\s\S]*?\}\s*```/g, '');
              response = response.replace(/```(?:json)?\s*\[[\s\S]*"action"\s*:\s*"add_milestone"[\s\S]*?\]\s*```/g, '');
              
              if (milestonesAdded > 0) {
                response += `\n\n✅ Successfully extracted and added ${milestonesAdded} milestone(s) to your timeline!`;
              } else {
                response += '\n\nI found milestone information but encountered errors adding them. Please check the data format.';
              }
            } else {
              response = response.replace(/\{[\s\S]*"action"\s*:\s*"add_milestone"[\s\S]*?\}/g, '');
              response += '\n\nI tried to extract milestones, but I need more information. Please provide: title, start date, and end date for each milestone.';
            }
          } catch (error: any) {
            console.error('Error processing milestones:', error);
            response = response.replace(/\{[\s\S]*"action"\s*:\s*"add_milestone"[\s\S]*?\}/g, '');
            response += `\n\n❌ I encountered an error processing the milestones: ${error.message || 'Unknown error'}`;
          }
        }
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
              type="file"
              ref={fileInputRef}
              accept=".txt,.xml"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  handleFileUpload(file);
                  e.target.value = ''; // Reset input
                }
              }}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isProcessing}
              className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 p-3 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors disabled:opacity-50"
              title="Upload file (.txt or .xml)"
            >
              <Upload size={20} />
            </button>
            <input
              type="text"
              placeholder="Type your message or paste a URL..."
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
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            💡 Tip: Just paste text with dates, deadlines, or schedules - I'll automatically extract milestones! Or upload a .txt/.xml file.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AIAssistantView;
