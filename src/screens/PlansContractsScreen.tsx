import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  Image,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { useSiteManagerStore, Document, Note } from '../store/siteManagerStore';
import { WebView } from 'react-native-webview';

export default function PlansContractsScreen() {
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [showViewer, setShowViewer] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [noteCategory, setNoteCategory] = useState('');

  const { documents, notes, addDocument, deleteDocument, addNote, deleteNote } = useSiteManagerStore();

  const handlePickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/*'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        addDocument({
          name: asset.name,
          uri: asset.uri,
          type: asset.mimeType?.includes('pdf') ? 'pdf' : 'image',
        });
        setShowUploadModal(false);
      }
    } catch (error) {
      console.error('Error picking document:', error);
    }
  };

  const handlePickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 1,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        addDocument({
          name: asset.fileName || `image_${Date.now()}.jpg`,
          uri: asset.uri,
          type: 'image',
        });
        setShowUploadModal(false);
      }
    } catch (error) {
      console.error('Error picking image:', error);
    }
  };

  const handleSaveNote = () => {
    if (!noteTitle || !noteContent) return;

    addNote({
      title: noteTitle,
      content: noteContent,
      category: noteCategory || 'General',
      documentId: selectedDocument?.id,
    });

    setNoteTitle('');
    setNoteContent('');
    setNoteCategory('');
    setShowNoteModal(false);
  };

  return (
    <View className="flex-1 bg-white">
      <View className="px-4 py-3 border-b border-gray-200">
        <View className="flex-row justify-between items-center">
          <Text className="text-2xl font-bold text-gray-900">Plans & Contracts</Text>
          <TouchableOpacity
            onPress={() => setShowUploadModal(true)}
            className="bg-blue-500 px-4 py-2 rounded-lg"
          >
            <Ionicons name="add" size={20} color="white" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView className="flex-1 p-4">
        {documents.length === 0 ? (
          <View className="items-center justify-center py-20">
            <Ionicons name="document-text-outline" size={64} color="#9ca3af" />
            <Text className="text-gray-500 mt-4 text-center">No documents yet</Text>
            <Text className="text-gray-400 mt-2 text-center">Upload PDFs or images to get started</Text>
          </View>
        ) : (
          <>
            {documents.map((doc) => (
              <View
                key={doc.id}
                className="bg-white border border-gray-200 rounded-lg p-4 mb-3 shadow-sm"
              >
                <View className="flex-row items-center justify-between">
                  <View className="flex-1">
                    <View className="flex-row items-center gap-2 mb-2">
                      <Ionicons
                        name={doc.type === 'pdf' ? 'document-text' : 'image'}
                        size={24}
                        color="#3b82f6"
                      />
                      <Text className="text-lg font-semibold text-gray-900 flex-1" numberOfLines={1}>
                        {doc.name}
                      </Text>
                    </View>
                    <Text className="text-gray-500 text-sm">
                      {new Date(doc.createdAt).toLocaleDateString()}
                    </Text>
                  </View>
                  <View className="flex-row gap-2">
                    <TouchableOpacity
                      onPress={() => {
                        setSelectedDocument(doc);
                        setShowViewer(true);
                      }}
                    >
                      <Ionicons name="eye-outline" size={20} color="#3b82f6" />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => deleteDocument(doc.id)}>
                      <Ionicons name="trash-outline" size={20} color="#ef4444" />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ))}

            <View className="mt-6">
              <Text className="text-xl font-bold text-gray-900 mb-3">Notes</Text>
              {notes.length === 0 ? (
                <Text className="text-gray-500 text-center py-4">No notes yet</Text>
              ) : (
                notes.map((note) => (
                  <View
                    key={note.id}
                    className="bg-white border border-gray-200 rounded-lg p-4 mb-3"
                  >
                    <View className="flex-row justify-between items-start mb-2">
                      <View className="flex-1">
                        <Text className="text-lg font-semibold text-gray-900">{note.title}</Text>
                        <Text className="text-xs text-gray-500 mt-1">{note.category}</Text>
                      </View>
                      <TouchableOpacity onPress={() => deleteNote(note.id)}>
                        <Ionicons name="trash-outline" size={20} color="#ef4444" />
                      </TouchableOpacity>
                    </View>
                    <Text className="text-gray-700">{note.content}</Text>
                  </View>
                ))
              )}
              <TouchableOpacity
                onPress={() => {
                  setSelectedDocument(null);
                  setShowNoteModal(true);
                }}
                className="bg-green-500 rounded-lg p-4 items-center mt-2"
              >
                <Ionicons name="add-circle-outline" size={20} color="white" />
                <Text className="text-white font-semibold mt-1">Add Note</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </ScrollView>

      <Modal visible={showUploadModal} animationType="slide" transparent>
        <View className="flex-1 bg-black/50 justify-center items-center">
          <View className="bg-white rounded-2xl p-6 w-11/12">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-xl font-bold text-gray-900">Upload Document</Text>
              <TouchableOpacity onPress={() => setShowUploadModal(false)}>
                <Ionicons name="close" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              onPress={handlePickDocument}
              className="bg-blue-500 rounded-lg p-4 items-center mb-3"
            >
              <Ionicons name="document-text" size={24} color="white" />
              <Text className="text-white font-semibold mt-2">Pick PDF or Image</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handlePickImage}
              className="bg-green-500 rounded-lg p-4 items-center"
            >
              <Ionicons name="image" size={24} color="white" />
              <Text className="text-white font-semibold mt-2">Pick from Gallery</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={showViewer} animationType="slide" transparent>
        <View className="flex-1 bg-black">
          <View className="absolute top-12 left-4 right-4 z-10 flex-row justify-between">
            <TouchableOpacity
              onPress={() => setShowViewer(false)}
              className="bg-white/90 rounded-full p-2"
            >
              <Ionicons name="close" size={24} color="#000" />
            </TouchableOpacity>
          </View>
          {selectedDocument?.type === 'pdf' ? (
            <WebView
              source={{ uri: selectedDocument.uri }}
              className="flex-1"
            />
          ) : (
            <Image
              source={{ uri: selectedDocument?.uri }}
              className="flex-1"
              resizeMode="contain"
            />
          )}
        </View>
      </Modal>

      <Modal visible={showNoteModal} animationType="slide" transparent>
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-white rounded-t-3xl p-6">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-xl font-bold text-gray-900">New Note</Text>
              <TouchableOpacity onPress={() => setShowNoteModal(false)}>
                <Ionicons name="close" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>
            <TextInput
              placeholder="Note title"
              value={noteTitle}
              onChangeText={setNoteTitle}
              className="border border-gray-300 rounded-lg p-3 mb-3"
            />
            <TextInput
              placeholder="Category (optional)"
              value={noteCategory}
              onChangeText={setNoteCategory}
              className="border border-gray-300 rounded-lg p-3 mb-3"
            />
            <TextInput
              placeholder="Note content"
              value={noteContent}
              onChangeText={setNoteContent}
              multiline
              className="border border-gray-300 rounded-lg p-3 mb-4 h-32"
            />
            <TouchableOpacity
              onPress={handleSaveNote}
              className="bg-green-500 rounded-lg p-4 items-center"
            >
              <Text className="text-white font-semibold text-lg">Save Note</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

