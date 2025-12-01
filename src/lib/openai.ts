import OpenAI from 'openai';

const apiKey = import.meta.env.VITE_OPENAI_API_KEY || '';

if (!apiKey) {
  console.warn('OpenAI API key not found. Please set VITE_OPENAI_API_KEY in your .env file');
}

export const openai = apiKey ? new OpenAI({
  apiKey: apiKey,
  dangerouslyAllowBrowser: true, // Note: In production, use a backend proxy for security
}) : null;

// Helper function to check if OpenAI is configured
export const isOpenAIConfigured = () => {
  return !!apiKey && !!openai;
};


