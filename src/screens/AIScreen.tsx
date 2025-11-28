import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSiteManagerStore } from '../store/siteManagerStore';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.EXPO_PUBLIC_OPENAI_API_KEY || '',
});

type AIMode = 'chat' | 'extractor';

export default function AIScreen() {
  const [mode, setMode] = useState<AIMode>('chat');
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([]);
  const [loading, setLoading] = useState(false);
  const [documentText, setDocumentText] = useState('');

  const { milestones, documents, addMilestone } = useSiteManagerStore();

  const handleSendMessage = async () => {
    if (!message.trim()) return;

    const userMessage = message;
    setMessage('');
    setMessages((prev) => [...prev, { role: 'user', content: userMessage }]);
    setLoading(true);

    try {
      const contextMessages = [
        {
          role: 'system' as const,
          content: 'You are a construction site management assistant. Help with project planning, milestones, and construction-related questions.',
        },
        ...messages,
        { role: 'user' as const, content: userMessage },
      ];

      const completion = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: contextMessages,
      });

      const assistantMessage = completion.choices[0]?.message?.content || 'Sorry, I could not generate a response.';
      setMessages((prev) => [...prev, { role: 'assistant', content: assistantMessage }]);
    } catch (error) {
      console.error('Error:', error);
      Alert.alert('Error', 'Failed to get AI response. Please check your API key.');
      setMessages((prev) => prev.slice(0, -1));
    } finally {
      setLoading(false);
    }
  };

  const extractMilestones = async () => {
    if (!documentText.trim()) {
      Alert.alert('No text', 'Please paste document text first');
      return;
    }

    setLoading(true);
    try {
      const prompt = `Extract construction milestones from this document text. Return a JSON array of milestones with this structure:
[
  {
    "title": "Milestone name",
    "description": "Description",
    "startDate": "YYYY-MM-DD",
    "endDate": "YYYY-MM-DD",
    "phase": "Phase name"
  }
]

Document text:
${documentText}`;

      const completion = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
      });

      const response = JSON.parse(completion.choices[0]?.message?.content || '{}');
      const extractedMilestones = response.milestones || [];

      if (extractedMilestones.length > 0) {
        extractedMilestones.forEach((m: any) => {
          const phase = useSiteManagerStore.getState().phases.find(
            (p) => p.name.toLowerCase().includes(m.phase?.toLowerCase() || '')
          );
          addMilestone({
            title: m.title,
            description: m.description,
            startDate: m.startDate || new Date().toISOString(),
            endDate: m.endDate || new Date().toISOString(),
            phase: phase?.id || useSiteManagerStore.getState().phases[0].id,
            completed: false,
          });
        });
        Alert.alert('Success', `Extracted ${extractedMilestones.length} milestones`);
        setDocumentText('');
      } else {
        Alert.alert('No milestones', 'Could not extract milestones from the document');
      }
    } catch (error) {
      console.error('Error:', error);
      Alert.alert('Error', 'Failed to extract milestones');
    } finally {
      setLoading(false);
    }
  };

  const shareViaWhatsApp = (text: string) => {
    const url = `whatsapp://send?text=${encodeURIComponent(text)}`;
    Linking.openURL(url).catch(() => {
      Alert.alert('Error', 'WhatsApp is not installed');
    });
  };

  return (
    <View className="flex-1 bg-white">
      <View className="px-4 py-3 border-b border-gray-200">
        <View className="flex-row justify-between items-center mb-3">
          <Text className="text-2xl font-bold text-gray-900">AI Assistant</Text>
        </View>
        <View className="flex-row gap-2">
          <TouchableOpacity
            onPress={() => setMode('chat')}
            className={`flex-1 px-4 py-2 rounded-lg border-2 ${
              mode === 'chat'
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-300 bg-white'
            }`}
          >
            <Text className={`text-center ${mode === 'chat' ? 'text-blue-600 font-semibold' : 'text-gray-700'}`}>
              AI Chat
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setMode('extractor')}
            className={`flex-1 px-4 py-2 rounded-lg border-2 ${
              mode === 'extractor'
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-300 bg-white'
            }`}
          >
            <Text className={`text-center ${mode === 'extractor' ? 'text-blue-600 font-semibold' : 'text-gray-700'}`}>
              Timeline Extractor
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {mode === 'chat' ? (
        <View className="flex-1">
          <ScrollView className="flex-1 p-4">
            {messages.length === 0 ? (
              <View className="items-center justify-center py-20">
                <Ionicons name="sparkles" size={64} color="#9ca3af" />
                <Text className="text-gray-500 mt-4 text-center">Start a conversation</Text>
                <Text className="text-gray-400 mt-2 text-center">Ask me anything about your construction project</Text>
              </View>
            ) : (
              messages.map((msg, index) => (
                <View
                  key={index}
                  className={`mb-4 ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
                >
                  <View
                    className={`max-w-[80%] rounded-lg p-3 ${
                      msg.role === 'user'
                        ? 'bg-blue-500'
                        : 'bg-gray-100'
                    }`}
                  >
                    <Text className={msg.role === 'user' ? 'text-white' : 'text-gray-900'}>
                      {msg.content}
                    </Text>
                  </View>
                  {msg.role === 'assistant' && (
                    <TouchableOpacity
                      onPress={() => shareViaWhatsApp(msg.content)}
                      className="mt-1 flex-row items-center gap-1"
                    >
                      <Ionicons name="logo-whatsapp" size={16} color="#25D366" />
                      <Text className="text-xs text-gray-500">Share</Text>
                    </TouchableOpacity>
                  )}
                </View>
              ))
            )}
            {loading && (
              <View className="items-start mb-4">
                <View className="bg-gray-100 rounded-lg p-3">
                  <Text className="text-gray-500">Thinking...</Text>
                </View>
              </View>
            )}
          </ScrollView>
          <View className="border-t border-gray-200 p-4">
            <View className="flex-row gap-2">
              <TextInput
                placeholder="Ask a question..."
                value={message}
                onChangeText={setMessage}
                multiline
                className="flex-1 border border-gray-300 rounded-lg p-3"
                onSubmitEditing={handleSendMessage}
              />
              <TouchableOpacity
                onPress={handleSendMessage}
                disabled={loading || !message.trim()}
                className="bg-blue-500 rounded-lg p-3 justify-center"
              >
                <Ionicons name="send" size={20} color="white" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      ) : (
        <View className="flex-1 p-4">
          <Text className="text-lg font-semibold text-gray-900 mb-2">
            Extract Milestones from Document
          </Text>
          <Text className="text-gray-600 text-sm mb-4">
            Paste document text below and AI will extract milestones automatically
          </Text>
          <TextInput
            placeholder="Paste document text here..."
            value={documentText}
            onChangeText={setDocumentText}
            multiline
            className="border border-gray-300 rounded-lg p-3 mb-4 h-64"
            textAlignVertical="top"
          />
          <TouchableOpacity
            onPress={extractMilestones}
            disabled={loading || !documentText.trim()}
            className="bg-green-500 rounded-lg p-4 items-center"
          >
            {loading ? (
              <Text className="text-white font-semibold text-lg">Extracting...</Text>
            ) : (
              <Text className="text-white font-semibold text-lg">Extract Milestones</Text>
            )}
          </TouchableOpacity>
          {milestones.length > 0 && (
            <View className="mt-6">
              <Text className="text-lg font-semibold text-gray-900 mb-2">
                Recent Milestones ({milestones.length})
              </Text>
              <ScrollView className="max-h-48">
                {milestones.slice(-5).map((milestone) => (
                  <View
                    key={milestone.id}
                    className="bg-gray-50 rounded-lg p-3 mb-2"
                  >
                    <Text className="font-semibold text-gray-900">{milestone.title}</Text>
                    <Text className="text-xs text-gray-500">
                      {new Date(milestone.startDate).toLocaleDateString()} - {new Date(milestone.endDate).toLocaleDateString()}
                    </Text>
                  </View>
                ))}
              </ScrollView>
            </View>
          )}
        </View>
      )}
    </View>
  );
}

