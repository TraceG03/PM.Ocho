import React, { useState, useRef } from 'react';
import { Bot, Send, Upload, FileText, Sparkles, X, AlertCircle, Link as LinkIcon } from 'lucide-react';
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
  const [isExtracting, setIsExtracting] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isFetchingUrl, setIsFetchingUrl] = useState(false);
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

  // Fetch content from URL
  const fetchUrlContent = async (url: string): Promise<string> => {
    try {
      // Try direct fetch first
      const response = await fetch(url, {
        mode: 'cors',
        headers: {
          'Accept': 'text/html,application/xhtml+xml,application/xml,text/plain,*/*',
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
        // For HTML, extract text content
        const html = await response.text();
        // Simple HTML to text conversion (remove tags and decode entities)
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = html;
        // Remove script and style elements
        const scripts = tempDiv.querySelectorAll('script, style');
        scripts.forEach(el => el.remove());
        text = tempDiv.textContent || tempDiv.innerText || '';
        // Clean up extra whitespace
        text = text.replace(/\s+/g, ' ').trim();
      } else {
        // For plain text or other types
        text = await response.text();
      }
      
      return text;
    } catch (error: any) {
      // If direct fetch fails due to CORS, try using a CORS proxy
      if (error.message.includes('CORS') || error.message.includes('Failed to fetch')) {
        try {
          const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`;
          const proxyResponse = await fetch(proxyUrl);
          const data = await proxyResponse.json();
          
          if (!data.contents) {
            throw new Error('No content received from proxy');
          }
          
          const html = data.contents;
          // Extract text from HTML
          const tempDiv = document.createElement('div');
          tempDiv.innerHTML = html;
          // Remove script and style elements
          const scripts = tempDiv.querySelectorAll('script, style');
          scripts.forEach(el => el.remove());
          let text = tempDiv.textContent || tempDiv.innerText || '';
          // Clean up extra whitespace
          text = text.replace(/\s+/g, ' ').trim();
          return text;
        } catch (proxyError: any) {
          throw new Error(`Failed to fetch URL: ${error.message}. Please ensure the URL is publicly accessible or paste the content directly.`);
        }
      }
      throw error;
    }
  };

  const handleFetchUrl = async () => {
    if (!urlInput.trim()) {
      alert('Please enter a URL');
      return;
    }

    // Validate URL format
    try {
      new URL(urlInput.trim());
    } catch {
      alert('Please enter a valid URL (e.g., https://example.com/document)');
      return;
    }

    try {
      setIsFetchingUrl(true);
      const content = await fetchUrlContent(urlInput.trim());
      setDocumentText(content);
      setUrlInput('');
      alert('Content fetched successfully! You can now extract milestones.');
    } catch (error: any) {
      alert(`Failed to fetch URL: ${error.message}`);
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
        // Build context about existing milestones
        const existingMilestonesContext = milestones.length > 0 
          ? `\n\nEXISTING MILESTONES (avoid duplicates):\n${milestones.slice(-10).map(m => `- ${m.title} (${m.startDate} to ${m.endDate})`).join('\n')}`
          : '';

        // Build phase information with keywords
        const phaseInfo = phases.length > 0
          ? phases.map(p => {
              const keywords = getPhaseKeywords(p.name);
              return `- "${p.name}" (keywords: ${keywords.slice(0, 3).join(', ')})`;
            }).join('\n')
          : 'No phases defined yet';

        // Use OpenAI to extract milestones with enhanced prompt
        const systemPrompt = `You are an AI assistant that extracts project milestones from construction documents, schedules, and timelines.

PROJECT CONTEXT:
- Current phases: ${phases.map(p => p.name).join(', ') || 'None defined'}
- Existing milestones: ${milestones.length} milestone(s) already in the timeline${existingMilestonesContext}

EXTRACTION RULES:
1. Extract meaningful construction milestones (not tasks or daily activities)
2. Milestones should represent significant project completion points or major phases
3. Dates must be in YYYY-MM-DD format (convert from any format found: MM/DD/YYYY, DD-MM-YYYY, "January 15, 2024", etc.)
4. If only one date is found, use it as both startDate and endDate
5. Titles should be clear and action-oriented (e.g., "Foundation Complete", "Roof Installation", "Electrical Rough-In")
6. Notes should describe what the milestone represents and its significance
7. Avoid creating duplicates of existing milestones

PHASE MATCHING:
Available phases:
${phaseInfo}

Match milestones to phases based on:
- Milestone title keywords
- Milestone notes content
- Construction phase terminology
- Suggest the best matching phase in the "suggestedPhase" field

DATE HANDLING:
- Accept dates in any format (MM/DD/YYYY, DD-MM-YYYY, "January 15, 2024", "Q1 2024", etc.)
- Convert all to YYYY-MM-DD format
- If relative dates found ("next week", "in 2 months"), calculate from today: ${new Date().toISOString().split('T')[0]}
- If only start date found, end date = start date
- If only end date found, start date = end date

Return your response as a JSON object with a "milestones" array in this exact format:
{
  "milestones": [
    {
      "title": "Milestone Name",
      "startDate": "YYYY-MM-DD",
      "endDate": "YYYY-MM-DD",
      "notes": "Brief description",
      "suggestedPhase": "Phase Name (optional)"
    }
  ]
}

If you cannot find clear dates or milestones, return: {"milestones": []}`;

        setAiError(null);
        
        const completion = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: `Extract milestones from this document:\n\n${textToAnalyze.substring(0, 8000)}` }
          ],
          temperature: 0.3,
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

        if (extractedMilestones.length === 0) {
          alert('⚠️ No milestones could be extracted from the document.\n\nPlease ensure the document contains:\n- Clear milestone information\n- Dates in any format\n- Construction project details');
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

        // Show detailed results
        let message = '';
        if (createdCount > 0) {
          message = `✅ Successfully extracted ${createdCount} milestone(s) using AI!`;
          if (skippedCount > 0) {
            message += `\n\n⚠️ ${skippedCount} milestone(s) were skipped:\n${skippedReasons.slice(0, 5).join('\n')}${skippedReasons.length > 5 ? `\n... and ${skippedReasons.length - 5} more` : ''}`;
          }
        } else {
          message = `⚠️ No milestones were created.\n\nReasons:\n${skippedReasons.slice(0, 5).join('\n')}${skippedReasons.length > 5 ? `\n... and ${skippedReasons.length - 5} more` : ''}`;
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
            <div className="mt-3">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Or enter a URL to fetch content
              </label>
              <div className="flex gap-2">
                <input
                  type="url"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  placeholder="https://example.com/document.pdf"
                  className="flex-1 px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-accent-purple"
                />
                <button
                  onClick={handleFetchUrl}
                  disabled={isFetchingUrl || !urlInput.trim()}
                  className="px-4 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {isFetchingUrl ? (
                    <>
                      <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                      <span>Fetching...</span>
                    </>
                  ) : (
                    <>
                      <LinkIcon size={18} />
                      <span>Fetch</span>
                    </>
                  )}
                </button>
              </div>
            </div>
            <textarea
              value={documentText}
              onChange={(e) => setDocumentText(e.target.value)}
              placeholder="Paste your project schedule, timeline, or document text here..."
              rows={10}
              className="w-full mt-3 px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-accent-purple resize-none"
            />
            <button
              onClick={handleExtractMilestones}
              disabled={isExtracting || (!documentText.trim() && !uploadedFile && !urlInput.trim())}
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
