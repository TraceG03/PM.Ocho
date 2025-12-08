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
  const [urlInput, setUrlInput] = useState('');
  const [asanaApiKey, setAsanaApiKey] = useState('');
  const [isExtracting, setIsExtracting] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isFetchingUrl, setIsFetchingUrl] = useState(false);
  const [isFetchingAsana, setIsFetchingAsana] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const suggestedChips = ['Timeline planning', 'Safety guidelines', 'Material estimates'];

  // Helper function to get phase keywords for better matching
  const getPhaseKeywords = (phaseName: string): string[] => {
    const keywords: { [key: string]: string[] } = {
      'Foundation': ['foundation', 'excavation', 'concrete', 'footing', 'slab', 'base', 'groundwork'],
      'Framing': ['frame', 'framing', 'walls', 'structure', 'studs', 'joists', 'beams', 'skeleton'],
      'Roofing': ['roof', 'roofing', 'shingles', 'gutter', 'eaves', 'truss', 'rafter'],
      'Electrical': ['electrical', 'wiring', 'outlets', 'panel', 'circuit', 'breaker', 'conduit'],
      'Plumbing': ['plumbing', 'pipes', 'fixtures', 'drain', 'water', 'sewer', 'faucet'],
      'HVAC': ['hvac', 'heating', 'cooling', 'ventilation', 'ductwork', 'air conditioning', 'furnace'],
      'Interior': ['drywall', 'paint', 'flooring', 'trim', 'finish', 'cabinets', 'interior'],
      'Exterior': ['siding', 'exterior', 'landscaping', 'driveway', 'deck', 'patio', 'outside'],
      'Planning': ['plan', 'planning', 'design', 'permit', 'approval', 'preparation'],
      'Site Work': ['site', 'clearing', 'grading', 'excavation', 'utilities', 'site prep']
    };
    
    // Check for exact match
    if (keywords[phaseName]) {
      return keywords[phaseName];
    }
    
    // Check for partial match
    for (const [key, values] of Object.entries(keywords)) {
      if (phaseName.toLowerCase().includes(key.toLowerCase()) || key.toLowerCase().includes(phaseName.toLowerCase())) {
        return values;
      }
    }
    
    // Default: return phase name as keyword
    return [phaseName.toLowerCase()];
  };

  // Helper function to normalize dates to YYYY-MM-DD format
  const normalizeDate = (dateStr: string): string | null => {
    if (!dateStr || typeof dateStr !== 'string') return null;
    
    // Already in YYYY-MM-DD format
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr.trim())) {
      const date = new Date(dateStr.trim());
      if (!isNaN(date.getTime())) return dateStr.trim();
    }
    
    // Try parsing various formats
    const date = new Date(dateStr.trim());
    if (!isNaN(date.getTime())) {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
    
    return null;
  };

  // Improved phase matching with keyword-based scoring
  const findBestPhase = (milestone: any): string => {
    if (!phases.length) return '';
    
    // Check if AI suggested a phase
    if (milestone.suggestedPhase) {
      const suggested = phases.find(p => 
        p.name.toLowerCase() === milestone.suggestedPhase.toLowerCase()
      );
      if (suggested) return suggested.id;
    }
    
    // Score-based matching
    const phaseScores = phases.map(phase => {
      const keywords = getPhaseKeywords(phase.name);
      const text = `${milestone.title} ${milestone.notes || ''}`.toLowerCase();
      
      let score = 0;
      keywords.forEach(keyword => {
        if (text.includes(keyword)) score += 2;
      });
      if (text.includes(phase.name.toLowerCase())) score += 3;
      
      return { phase, score };
    });
    
    phaseScores.sort((a, b) => b.score - a.score);
    return phaseScores[0].score > 0 ? phaseScores[0].phase.id : phases[0].id;
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

  // Enhanced HTML parsing for project management tools
  const extractProjectManagementData = (html: string, url: string): string => {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    
    // Remove unwanted elements
    const unwanted = tempDiv.querySelectorAll('script, style, nav, header, footer, aside, .ad, .advertisement, [class*="ad"]');
    unwanted.forEach(el => el.remove());
    
    // Detect project management tool type (for future enhancements)
    // const isProjectManager = url.includes('projectmanager.com') || url.includes('projectmanager');
    // const isMonday = url.includes('monday.com');
    // const isSmartsheet = url.includes('smartsheet.com');
    // const isWrike = url.includes('wrike.com');
    // const isTrello = url.includes('trello.com');
    // const isJira = url.includes('atlassian.com') || url.includes('jira');
    // const isAsana = url.includes('asana.com');
    // const isClickUp = url.includes('clickup.com');
    // const isBasecamp = url.includes('basecamp.com');
    
    let extractedText = '';
    
    // Try to extract structured data from common project management patterns
    // Look for timeline, gantt, task, milestone, schedule elements
    const timelineSelectors = [
      '[class*="timeline"]',
      '[class*="gantt"]',
      '[class*="task"]',
      '[class*="milestone"]',
      '[class*="schedule"]',
      '[class*="project"]',
      '[class*="phase"]',
      '[id*="timeline"]',
      '[id*="gantt"]',
      '[id*="task"]',
      '[data-testid*="task"]',
      '[data-testid*="timeline"]',
      'table',
      '[role="row"]',
      '[role="gridcell"]',
    ];
    
    // Try to find timeline/task related content
    let foundContent = false;
    for (const selector of timelineSelectors) {
      const elements = tempDiv.querySelectorAll(selector);
      if (elements.length > 0) {
        elements.forEach((el, idx) => {
          if (idx < 50) { // Limit to first 50 elements to avoid too much data
            const text = el.textContent || (el as HTMLElement).innerText || '';
            if (text.trim().length > 10) { // Only include substantial text
              extractedText += text.trim() + '\n';
              foundContent = true;
            }
          }
        });
        if (foundContent) break;
      }
    }
    
    // If no specific timeline content found, extract all meaningful text
    if (!foundContent || extractedText.length < 100) {
      // Extract paragraphs and list items that might contain timeline info
      const contentElements = tempDiv.querySelectorAll('p, li, td, th, [class*="card"], [class*="item"], [class*="row"]');
      contentElements.forEach(el => {
        const text = el.textContent || (el as HTMLElement).innerText || '';
        // Look for date patterns or task-like content
        if (text.match(/\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}|\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2}|(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2}/i) ||
            text.length > 20 && text.length < 500) {
          extractedText += text.trim() + '\n';
        }
      });
    }
    
    // Fallback: extract all text if still not enough
    if (extractedText.length < 200) {
      extractedText = tempDiv.textContent || tempDiv.innerText || '';
    }
    
    // Clean up the extracted text
    extractedText = extractedText
      .replace(/\s+/g, ' ') // Normalize whitespace
      .replace(/\n{3,}/g, '\n\n') // Remove excessive newlines
      .trim();
    
    // Add context about the source
    const sourceInfo = `Content extracted from: ${url}\n\n`;
    
    return sourceInfo + extractedText;
  };

  // Fetch content from URL
  const fetchUrlContent = async (url: string): Promise<string> => {
    try {
      // Try direct fetch first
      const response = await fetch(url, {
        mode: 'cors',
        headers: {
          'Accept': 'text/html,application/xhtml+xml,application/xml,text/plain,*/*',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const contentType = response.headers.get('content-type') || '';
      let text = '';
      
      if (contentType.includes('application/json')) {
        const json = await response.json();
        text = JSON.stringify(json, null, 2);
      } else if (contentType.includes('text/html')) {
        // For HTML, use enhanced extraction
        const html = await response.text();
        text = extractProjectManagementData(html, url);
      } else {
        // For plain text or other types
        text = await response.text();
      }
      
      return text;
    } catch (error: any) {
      // If direct fetch fails due to CORS, try using a CORS proxy
      if (error.message.includes('CORS') || error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        try {
          const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`;
          const proxyResponse = await fetch(proxyUrl);
          const data = await proxyResponse.json();
          
          if (!data.contents) {
            throw new Error('No content received from proxy');
          }
          
          const html = data.contents;
          // Use enhanced extraction for proxy content too
          const extractedText = extractProjectManagementData(html, url);
          return extractedText;
        } catch (proxyError: any) {
          // Try alternative proxy
          try {
            const altProxyUrl = `https://corsproxy.io/?${encodeURIComponent(url)}`;
            const altProxyResponse = await fetch(altProxyUrl);
            const html = await altProxyResponse.text();
            const extractedText = extractProjectManagementData(html, url);
            return extractedText;
          } catch (altError: any) {
            throw new Error(`Failed to fetch URL: ${error.message}. The page may require authentication or be blocked by CORS. Please try copying the timeline content and pasting it directly.`);
          }
        }
      }
      throw error;
    }
  };

  // Fetch tasks from Asana API
  const fetchAsanaTasks = async (url: string, apiKey: string): Promise<string> => {
    try {
      setIsFetchingAsana(true);
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Accept': 'application/json',
        }
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Invalid Asana API key. Please check your API key.');
        }
        throw new Error(`Asana API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      // Convert Asana tasks to readable text format for AI extraction
      if (data.data && Array.isArray(data.data)) {
        const tasksText = data.data.map((task: any) => {
          const dueDate = task.due_on || task.due_at || 'No due date';
          const name = task.name || 'Unnamed task';
          const notes = task.notes || '';
          const completed = task.completed ? 'Completed' : 'Incomplete';
          return `${name} - Due: ${dueDate} - Status: ${completed}${notes ? ` - Notes: ${notes}` : ''}`;
        }).join('\n');
        
        return `Asana Project Tasks:\n\n${tasksText}`;
      }
      
      return JSON.stringify(data, null, 2);
    } catch (error: any) {
      throw new Error(`Failed to fetch from Asana: ${error.message}`);
    } finally {
      setIsFetchingAsana(false);
    }
  };

  const handleFetchUrl = async () => {
    if (!urlInput.trim()) {
      alert('Please enter a URL');
      return;
    }

    // Check if it's an Asana API URL
    const isAsanaUrl = urlInput.includes('asana.com/api');
    
    if (isAsanaUrl) {
      if (!asanaApiKey.trim()) {
        alert('Asana API key is required for Asana URLs. Please enter your Asana Personal Access Token.');
        return;
      }
      
      try {
        setIsFetchingUrl(true);
        const content = await fetchAsanaTasks(urlInput.trim(), asanaApiKey.trim());
        setDocumentText(content);
        setUrlInput('');
        alert('Asana tasks fetched successfully! You can now extract milestones.');
      } catch (error: any) {
        alert(`Failed to fetch from Asana: ${error.message}`);
      } finally {
        setIsFetchingUrl(false);
      }
      return;
    }

    // Validate URL format for regular URLs
    let validatedUrl = urlInput.trim();
    try {
      new URL(validatedUrl);
    } catch {
      // Try adding https:// if missing
      if (!validatedUrl.startsWith('http://') && !validatedUrl.startsWith('https://')) {
        validatedUrl = 'https://' + validatedUrl;
        try {
          new URL(validatedUrl);
        } catch {
          alert('Please enter a valid URL (e.g., https://example.com/document)');
          return;
        }
      } else {
        alert('Please enter a valid URL (e.g., https://example.com/document)');
        return;
      }
    }

    try {
      setIsFetchingUrl(true);
      const content = await fetchUrlContent(validatedUrl);
      
      if (!content || content.trim().length < 50) {
        alert('⚠️ Limited content extracted from URL. The page may require authentication or have restricted access. Try:\n\n1. Making sure the URL is publicly accessible\n2. Copying the timeline content and pasting it directly\n3. Exporting the timeline as a document and uploading it');
        setDocumentText(content || '');
      } else {
        setDocumentText(content);
        alert(`✅ Content fetched successfully! Extracted ${content.length} characters. You can now extract milestones.`);
      }
      setUrlInput('');
    } catch (error: any) {
      const errorMsg = error.message || 'Unknown error';
      alert(`❌ Failed to fetch URL: ${errorMsg}\n\nTips:\n- Ensure the URL is publicly accessible\n- Some pages require login (try copying content instead)\n- The page may block automated access\n\nAlternative: Copy the timeline content and paste it directly into the text area.`);
    } finally {
      setIsFetchingUrl(false);
    }
  };

  const handleExtractMilestones = async () => {
    if (!documentText.trim() && !uploadedFile && !urlInput.trim()) {
      alert('Please upload a document, paste text, or provide a URL');
      return;
    }

    setIsExtracting(true);

    try {
      let textToAnalyze = documentText;

      // If we have a URL, fetch its content first
      if (urlInput.trim() && !textToAnalyze.trim()) {
        try {
          textToAnalyze = await fetchUrlContent(urlInput.trim());
        } catch (error: any) {
          alert(`Failed to fetch URL: ${error.message}`);
          setIsExtracting(false);
          return;
        }
      }

      // If we have an uploaded file, try to get its content
      if (uploadedFile && !textToAnalyze.trim()) {
        const fileData = getFile(uploadedFile);
        if (fileData) {
          try {
            // Try to extract text from various file types
            if (fileData.type === 'text/plain' || fileData.name.endsWith('.txt')) {
              const base64Match = fileData.dataUrl.match(/^data:text\/plain;base64,(.+)$/);
              if (base64Match) {
                textToAnalyze = atob(base64Match[1]);
              }
            } else if (fileData.type === 'application/pdf' || fileData.name.endsWith('.pdf')) {
              // For PDFs, we can't extract text directly in the browser without a library
              // But we can try to get metadata or prompt user to paste content
              textToAnalyze = `PDF file "${fileData.name}" uploaded. Please paste the text content from this PDF below, or use a URL to a text version of the document.`;
            } else if (fileData.type.includes('text/') || fileData.name.match(/\.(txt|md|html|htm)$/i)) {
              // Try to extract from any text-based file
              const base64Match = fileData.dataUrl.match(/^data:[^;]+;base64,(.+)$/);
              if (base64Match) {
                try {
                  textToAnalyze = atob(base64Match[1]);
                } catch (e) {
                  console.error('Error decoding file:', e);
                }
              }
            } else {
              // For other file types, prompt user to paste content
              textToAnalyze = `File "${fileData.name}" (${fileData.type}) uploaded. Please paste the relevant text content from this file below.`;
            }
          } catch (e) {
            console.error('Error reading file:', e);
            textToAnalyze = `File "${fileData.name}" uploaded. Please paste the text content from this file below.`;
          }
        }
      }

      if (!textToAnalyze.trim()) {
        alert('No text content found to analyze');
        setIsExtracting(false);
        return;
      }

      if (openAIConfigured && openai) {
        // Simple ChatGPT-style prompt for timeline data extraction
        const systemPrompt = `You are a helpful AI assistant. A user has uploaded a document and wants you to extract timeline data from it.

Your task: Extract ANY dates, milestones, tasks, events, or scheduled items from the document. Be thorough and extract everything you find, even if dates are approximate or in different formats.

Available project phases: ${phases.map(p => p.name).join(', ') || 'None defined'}

IMPORTANT: 
- Extract everything with a date or timeframe, even if it seems minor
- Convert dates to YYYY-MM-DD format (handle MM/DD/YYYY, DD-MM-YYYY, "January 15, 2024", etc.)
- If only one date exists, use it for both startDate and endDate
- If you see relative dates like "Week 1" or "Month 2", estimate based on today: ${new Date().toISOString().split('T')[0]}
- Be lenient - extract items even if not perfectly formatted

Return a JSON object with this structure:
{
  "milestones": [
    {
      "title": "Item name",
      "startDate": "YYYY-MM-DD",
      "endDate": "YYYY-MM-DD",
      "notes": "Description",
      "suggestedPhase": "Phase name (optional)"
    }
  ]
}

If you find ANY dates or time-related items, extract them. Only return an empty array if there are truly no dates or time-related information in the document.`;

        setAiError(null);
        
        // Show document preview for debugging
        const documentPreview = textToAnalyze.substring(0, 1000);
        console.log('Document preview:', documentPreview);
        
        const completion = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: `Extract all timeline data from this document. Find ANY dates, milestones, tasks, events, or scheduled items - be thorough and extract everything you find. Return them in JSON format:\n\n${textToAnalyze.substring(0, 8000)}` }
          ],
          temperature: 0.4, // Slightly higher for more creative extraction
          max_tokens: 2000,
          response_format: { type: "json_object" } // Force structured JSON output
        });

        const response = completion.choices[0]?.message?.content || '{}';
        let extractedMilestones: any[] = [];
        
        try {
          // Parse JSON response (should be structured now)
          const parsed = JSON.parse(response);
          extractedMilestones = Array.isArray(parsed) ? parsed : (parsed.milestones || []);
        } catch (e) {
          // Fallback: Try to extract JSON from markdown code blocks
          const jsonMatch = response.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
          if (jsonMatch) {
            try {
              const parsed = JSON.parse(jsonMatch[1]);
              extractedMilestones = Array.isArray(parsed) ? parsed : (parsed.milestones || []);
            } catch (e2) {
              // Try to extract JSON object directly
              const objMatch = response.match(/\{[\s\S]*"milestones"[\s\S]*\}/);
              if (objMatch) {
                try {
                  const parsed = JSON.parse(objMatch[0]);
                  extractedMilestones = parsed.milestones || [];
                } catch (e3) {
                  console.error('Failed to parse JSON:', e3);
                  throw new Error('Failed to parse AI response. Please try again.');
                }
              } else {
                throw new Error('Invalid response format from AI. Please try again.');
              }
            }
          } else {
            // Try to find JSON object in response
            const objMatch = response.match(/\{[\s\S]*\}/);
            if (objMatch) {
              try {
                const parsed = JSON.parse(objMatch[0]);
                extractedMilestones = parsed.milestones || (Array.isArray(parsed) ? parsed : []);
              } catch (e3) {
                console.error('Failed to parse JSON:', e3);
                throw new Error('Failed to parse AI response. Please try again.');
              }
            } else {
              throw new Error('No valid JSON found in AI response.');
            }
          }
        }

        // Log the AI response for debugging
        console.log('AI Response:', response);
        console.log('AI Response Type:', typeof response);
        console.log('AI Response Length:', response.length);
        console.log('Extracted Milestones:', extractedMilestones);
        console.log('Extracted Milestones Length:', extractedMilestones.length);

        if (extractedMilestones.length === 0) {
          // Show the actual AI response to help debug
          console.error('No milestones extracted. Full AI response:', response);
          console.error('Document preview (first 500 chars):', textToAnalyze.substring(0, 500));
          
          // Try to extract dates manually as a fallback to provide helpful feedback
          const datePattern = /\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}|\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2}|(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s+\d{4}|\d{1,2}\s+(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4}/gi;
          const dates = textToAnalyze.match(datePattern);
          
          // Check if response contains useful information
          if (response && response.length > 0) {
            // Try to parse what the AI actually returned
            try {
              const parsed = JSON.parse(response);
              if (parsed && typeof parsed === 'object' && !parsed.milestones) {
                // AI returned something but not milestones
                console.warn('AI returned object without milestones:', parsed);
              }
            } catch (e) {
              // Response is not valid JSON
              console.warn('AI response is not valid JSON:', response.substring(0, 200));
            }
          }
          
          if (dates && dates.length > 0) {
            const fallbackMessage = `⚠️ AI couldn't extract structured milestones, but found ${dates.length} date(s) in the document:\n\n${dates.slice(0, 5).join(', ')}${dates.length > 5 ? `\n... and ${dates.length - 5} more` : ''}\n\nPlease try:\n- Adding more context about milestones (e.g., "Foundation Complete: January 15, 2024")\n- Ensuring dates are clearly associated with milestone descriptions\n- Using a document with explicit milestone information\n- Check the browser console (F12) for more details`;
            alert(fallbackMessage);
          } else {
            alert('⚠️ No milestones could be extracted from the document.\n\nPossible reasons:\n- Document doesn\'t contain clear milestone information\n- Dates are not present or not clearly formatted\n- Document may need more construction-specific context\n\nTips:\n- Include milestone names with dates (e.g., "Foundation Complete: January 15, 2024")\n- Use explicit project timeline language\n- Ensure dates are in a recognizable format (MM/DD/YYYY, DD-MM-YYYY, or "Month Day, Year")\n- Check the browser console (F12) for debugging information');
          }
          setIsExtracting(false);
          return;
        }

        // Create milestones with validation and normalization
        let createdCount = 0;
        let skippedCount = 0;
        const skippedReasons: string[] = [];

        for (const milestone of extractedMilestones) {
          // Validate title
          if (!milestone.title || !milestone.title.trim()) {
            skippedCount++;
            skippedReasons.push('Missing title');
            continue;
          }

          // Normalize and validate dates
          let normalizedStart = normalizeDate(milestone.startDate);
          let normalizedEnd = normalizeDate(milestone.endDate);

          // Support single-date milestones
          if (normalizedStart && !normalizedEnd) {
            normalizedEnd = normalizedStart;
          } else if (normalizedEnd && !normalizedStart) {
            normalizedStart = normalizedEnd;
          }

          if (!normalizedStart || !normalizedEnd) {
            skippedCount++;
            skippedReasons.push(`"${milestone.title}" - Invalid or missing dates`);
            continue;
          }

          // Ensure end date is not before start date
          const startDate = new Date(normalizedStart);
          const endDate = new Date(normalizedEnd);
          if (endDate < startDate) {
            normalizedEnd = normalizedStart; // Use start date as end date
          }

          // Find best matching phase
          const phaseId = findBestPhase(milestone);

          try {
            await addMilestone({
              title: milestone.title.trim(),
              startDate: normalizedStart,
              endDate: normalizedEnd,
              phaseId: phaseId,
              notes: (milestone.notes || 'Extracted by AI from document').trim(),
            });
            createdCount++;
          } catch (error: any) {
            console.error('Error adding milestone:', error);
            skippedCount++;
            skippedReasons.push(`"${milestone.title}" - ${error.message || 'Failed to add'}`);
          }
        }

        // Show detailed results with better formatting
        let message = '';
        if (createdCount > 0) {
          message = `✅ Successfully extracted ${createdCount} milestone(s) using AI!`;
          if (createdCount === 1) {
            message = `✅ Successfully extracted 1 milestone using AI!`;
          }
          if (skippedCount > 0) {
            message += `\n\n⚠️ ${skippedCount} milestone(s) were skipped:`;
            skippedReasons.slice(0, 5).forEach((reason, idx) => {
              message += `\n${idx + 1}. ${reason}`;
            });
            if (skippedReasons.length > 5) {
              message += `\n... and ${skippedReasons.length - 5} more`;
            }
          }
          message += `\n\nYou can view the extracted milestones in the Timeline view.`;
        } else {
          message = `⚠️ No milestones were created from the extracted data.`;
          if (skippedReasons.length > 0) {
            message += `\n\nReasons:`;
            skippedReasons.slice(0, 5).forEach((reason, idx) => {
              message += `\n${idx + 1}. ${reason}`;
            });
            if (skippedReasons.length > 5) {
              message += `\n... and ${skippedReasons.length - 5} more`;
            }
          }
          message += `\n\nPlease check:\n- The document contains valid dates\n- Milestone titles are present\n- Dates are in a recognizable format`;
        }

        alert(message);
        
        if (createdCount > 0) {
          setDocumentText('');
          setUploadedFile(null);
          setUrlInput('');
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
        setUrlInput('');
      }
    } catch (error: any) {
      console.error('Error extracting milestones:', error);
      setAiError(error.message || 'Unknown error');
      
      let errorMessage = '❌ Error extracting milestones';
      if (error.message) {
        errorMessage += `:\n\n${error.message}`;
      }
      errorMessage += '\n\nPlease check:\n- Your OpenAI API key is valid\n- You have internet connection\n- The document contains readable text';
      
      alert(errorMessage);
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
        <div className="px-4 mt-4">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">AI Timeline Extractor</h1>
            <p className="text-sm text-gray-500">Paste project docs to auto-extract milestones</p>
          </div>

          {/* Project Information Card */}
          <div className="bg-white rounded-3xl shadow-sm p-6 relative">
            {/* AI Powered Badge */}
            <div className="absolute top-6 right-6">
              <span className="px-3 py-1 bg-blue-50 text-blue-600 text-xs font-medium rounded-full">
                AI Powered
              </span>
            </div>

            <h2 className="text-xl font-bold text-gray-900 mb-4">Project Information</h2>

            {/* Upload Section */}
            <input ref={fileInputRef} type="file" onChange={(e) => e.target.files?.[0] && processFile(e.target.files[0])} className="hidden" />
            {!uploadedFile ? (
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`w-full border-2 border-dashed rounded-2xl p-8 text-center transition-all cursor-pointer mb-4 ${
                  isDragging ? 'border-blue-500 bg-blue-50 scale-105' : 'border-blue-300 bg-blue-50/50 hover:border-blue-400'
                } ${uploading ? 'opacity-50' : ''}`}
              >
                <Upload size={48} className={`mx-auto mb-3 ${isDragging ? 'text-blue-500' : 'text-blue-400'}`} />
                <p className="text-base font-medium text-blue-600 mb-1">Upload Document</p>
                <p className="text-sm text-gray-500">PDF, Word, or Text files</p>
              </div>
            ) : (
              <div className="border-2 border-blue-400 rounded-2xl p-4 mb-4 bg-blue-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FileText size={24} className="text-blue-600" />
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

            {/* Or paste text */}
            <p className="text-sm text-gray-700 mb-3">Or paste project document or schedule</p>

            {/* Text Area with Example */}
            <textarea
              value={documentText}
              onChange={(e) => setDocumentText(e.target.value)}
              placeholder={`Paste your project schedule, contract, or
any document with dates and milestones...
Example:
Foundation work begins May 15, 2025
Masonry phase from June 1 - June 20
Electrical installation: July 5th
PTAR delivery scheduled for July 15
Inspection required by August 1`}
              rows={12}
              className="w-full px-4 py-4 rounded-2xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none bg-gray-50 text-gray-700 placeholder-gray-400"
            />

            {/* URL Input - Always visible but subtle */}
            <div className="mt-3">
              <input
                type="url"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="Or enter a URL to fetch content from..."
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white"
              />
              {urlInput.includes('asana.com/api') && (
                <input
                  type="password"
                  value={asanaApiKey}
                  onChange={(e) => setAsanaApiKey(e.target.value)}
                  placeholder="Asana API Key (Personal Access Token)"
                  className="w-full mt-2 px-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white"
                />
              )}
              {urlInput.trim() && (
                <button
                  onClick={handleFetchUrl}
                  disabled={(isFetchingUrl || isFetchingAsana) || !urlInput.trim()}
                  className="mt-2 w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors disabled:opacity-50 text-sm font-medium"
                >
                  {(isFetchingUrl || isFetchingAsana) ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                      Fetching...
                    </span>
                  ) : (
                    'Fetch URL Content'
                  )}
                </button>
              )}
            </div>

            {/* Extract Button */}
            <button
              onClick={handleExtractMilestones}
              disabled={isExtracting || (!documentText.trim() && !uploadedFile && !urlInput.trim())}
              className="w-full mt-6 bg-gray-200 text-gray-700 py-4 rounded-2xl font-medium shadow-sm hover:bg-gray-300 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isExtracting ? (
                <>
                  <Sparkles size={20} className="animate-pulse text-blue-500" />
                  <span>Extracting milestones...</span>
                </>
              ) : (
                <>
                  <Sparkles size={20} className="text-blue-500" />
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
