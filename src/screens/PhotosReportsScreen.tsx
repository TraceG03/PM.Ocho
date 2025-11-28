import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  Image,
  Alert,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as MailComposer from 'expo-mail-composer';
import { Ionicons } from '@expo/vector-icons';
import { useSiteManagerStore, Photo, Report } from '../store/siteManagerStore';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.EXPO_PUBLIC_OPENAI_API_KEY || '',
});

export default function PhotosReportsScreen() {
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const [caption, setCaption] = useState('');
  const [reportType, setReportType] = useState<'daily' | 'weekly'>('daily');
  const [generatingReport, setGeneratingReport] = useState(false);

  const { photos, reports, addPhoto, deletePhoto, addReport, deleteReport } = useSiteManagerStore();

  const handleTakePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Camera permission is required to take photos');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: false,
        quality: 1,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        addPhoto({
          uri: asset.uri,
          caption: caption || undefined,
          date: new Date().toISOString(),
        });
        setCaption('');
        setShowPhotoModal(false);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
    }
  };

  const handlePickPhoto = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 1,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        addPhoto({
          uri: asset.uri,
          caption: caption || undefined,
          date: new Date().toISOString(),
        });
        setCaption('');
        setShowPhotoModal(false);
      }
    } catch (error) {
      console.error('Error picking photo:', error);
    }
  };

  const generateReport = async () => {
    if (photos.length === 0) {
      Alert.alert('No photos', 'Please add photos before generating a report');
      return;
    }

    setGeneratingReport(true);
    try {
      const recentPhotos = photos.slice(-10);
      const photoDescriptions = recentPhotos.map((p, i) => 
        `Photo ${i + 1}: ${p.caption || 'No caption'} - ${new Date(p.date).toLocaleDateString()}`
      ).join('\n');

      const prompt = `Generate a ${reportType} construction site report based on these photos:
${photoDescriptions}

Include:
- Summary of work progress
- Key observations
- Issues or concerns
- Next steps

Format as a professional construction report.`;

      const completion = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [{ role: 'user', content: prompt }],
      });

      const reportContent = completion.choices[0]?.message?.content || 'Failed to generate report';

      addReport({
        type: reportType,
        content: reportContent,
        photos: recentPhotos.map((p) => p.id),
        date: new Date().toISOString(),
      });

      setShowReportModal(false);
    } catch (error) {
      console.error('Error generating report:', error);
      Alert.alert('Error', 'Failed to generate report. Please check your API key.');
    } finally {
      setGeneratingReport(false);
    }
  };

  const sendReportEmail = async (report: Report) => {
    try {
      const isAvailable = await MailComposer.isAvailableAsync();
      if (!isAvailable) {
        Alert.alert('Email not available', 'Email composer is not available on this device');
        return;
      }

      const reportPhotos = photos.filter((p) => report.photos.includes(p.id));
      const attachments = reportPhotos.map((p) => p.uri);

      await MailComposer.composeAsync({
        subject: `${report.type.charAt(0).toUpperCase() + report.type.slice(1)} Construction Report - ${new Date(report.date).toLocaleDateString()}`,
        body: report.content,
        recipients: [],
        attachments,
      });
    } catch (error) {
      console.error('Error sending email:', error);
      Alert.alert('Error', 'Failed to send email');
    }
  };

  return (
    <View className="flex-1 bg-white">
      <View className="px-4 py-3 border-b border-gray-200">
        <View className="flex-row justify-between items-center">
          <Text className="text-2xl font-bold text-gray-900">Photos & Reports</Text>
          <TouchableOpacity
            onPress={() => setShowPhotoModal(true)}
            className="bg-blue-500 px-4 py-2 rounded-lg"
          >
            <Ionicons name="camera" size={20} color="white" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView className="flex-1 p-4">
        <View className="mb-6">
          <View className="flex-row justify-between items-center mb-3">
            <Text className="text-xl font-bold text-gray-900">Photos</Text>
            <Text className="text-gray-500 text-sm">{photos.length} photos</Text>
          </View>
          {photos.length === 0 ? (
            <View className="items-center justify-center py-10 bg-gray-50 rounded-lg">
              <Ionicons name="images-outline" size={48} color="#9ca3af" />
              <Text className="text-gray-500 mt-2">No photos yet</Text>
            </View>
          ) : (
            <View className="flex-row flex-wrap gap-2">
              {photos.map((photo) => (
                <TouchableOpacity
                  key={photo.id}
                  onPress={() => setSelectedPhoto(photo)}
                  className="w-[48%] aspect-square rounded-lg overflow-hidden"
                >
                  <Image source={{ uri: photo.uri }} className="w-full h-full" />
                  {photo.caption && (
                    <View className="absolute bottom-0 left-0 right-0 bg-black/50 p-2">
                      <Text className="text-white text-xs" numberOfLines={1}>
                        {photo.caption}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        <View>
          <View className="flex-row justify-between items-center mb-3">
            <Text className="text-xl font-bold text-gray-900">Reports</Text>
            <TouchableOpacity
              onPress={() => setShowReportModal(true)}
              className="bg-green-500 px-4 py-2 rounded-lg"
            >
              <Ionicons name="document-text" size={20} color="white" />
            </TouchableOpacity>
          </View>
          {reports.length === 0 ? (
            <View className="items-center justify-center py-10 bg-gray-50 rounded-lg">
              <Ionicons name="document-text-outline" size={48} color="#9ca3af" />
              <Text className="text-gray-500 mt-2">No reports yet</Text>
            </View>
          ) : (
            reports.map((report) => (
              <View
                key={report.id}
                className="bg-white border border-gray-200 rounded-lg p-4 mb-3"
              >
                <View className="flex-row justify-between items-start mb-2">
                  <View className="flex-1">
                    <View className="flex-row items-center gap-2 mb-1">
                      <Text className="text-lg font-semibold text-gray-900 capitalize">
                        {report.type} Report
                      </Text>
                      <Text className="text-xs text-gray-500">
                        {new Date(report.date).toLocaleDateString()}
                      </Text>
                    </View>
                    <Text className="text-gray-700 text-sm" numberOfLines={3}>
                      {report.content}
                    </Text>
                  </View>
                  <TouchableOpacity onPress={() => deleteReport(report.id)}>
                    <Ionicons name="trash-outline" size={20} color="#ef4444" />
                  </TouchableOpacity>
                </View>
                <TouchableOpacity
                  onPress={() => sendReportEmail(report)}
                  className="bg-blue-500 rounded-lg p-2 items-center mt-2"
                >
                  <Ionicons name="mail-outline" size={16} color="white" />
                  <Text className="text-white text-xs font-semibold">Email Report</Text>
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      <Modal visible={showPhotoModal} animationType="slide" transparent>
        <View className="flex-1 bg-black/50 justify-center items-center">
          <View className="bg-white rounded-2xl p-6 w-11/12">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-xl font-bold text-gray-900">Add Photo</Text>
              <TouchableOpacity onPress={() => setShowPhotoModal(false)}>
                <Ionicons name="close" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>
            <TextInput
              placeholder="Caption (optional)"
              value={caption}
              onChangeText={setCaption}
              className="border border-gray-300 rounded-lg p-3 mb-3"
            />
            <TouchableOpacity
              onPress={handleTakePhoto}
              className="bg-blue-500 rounded-lg p-4 items-center mb-3"
            >
              <Ionicons name="camera" size={24} color="white" />
              <Text className="text-white font-semibold mt-2">Take Photo</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handlePickPhoto}
              className="bg-green-500 rounded-lg p-4 items-center"
            >
              <Ionicons name="image" size={24} color="white" />
              <Text className="text-white font-semibold mt-2">Pick from Gallery</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={selectedPhoto !== null} animationType="fade" transparent>
        <View className="flex-1 bg-black">
          <View className="absolute top-12 left-4 right-4 z-10 flex-row justify-between">
            <TouchableOpacity
              onPress={() => setSelectedPhoto(null)}
              className="bg-white/90 rounded-full p-2"
            >
              <Ionicons name="close" size={24} color="#000" />
            </TouchableOpacity>
            {selectedPhoto && (
              <TouchableOpacity
                onPress={() => deletePhoto(selectedPhoto.id)}
                className="bg-red-500/90 rounded-full p-2"
              >
                <Ionicons name="trash" size={24} color="#fff" />
              </TouchableOpacity>
            )}
          </View>
          {selectedPhoto && (
            <Image
              source={{ uri: selectedPhoto.uri }}
              className="flex-1"
              resizeMode="contain"
            />
          )}
        </View>
      </Modal>

      <Modal visible={showReportModal} animationType="slide" transparent>
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-white rounded-t-3xl p-6">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-xl font-bold text-gray-900">Generate Report</Text>
              <TouchableOpacity onPress={() => setShowReportModal(false)}>
                <Ionicons name="close" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>
            <Text className="text-gray-700 mb-3 font-medium">Report Type</Text>
            <View className="flex-row gap-2 mb-4">
              {(['daily', 'weekly'] as const).map((type) => (
                <TouchableOpacity
                  key={type}
                  onPress={() => setReportType(type)}
                  className={`flex-1 px-4 py-2 rounded-lg border-2 ${
                    reportType === type
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-300 bg-white'
                  }`}
                >
                  <Text className={`text-center capitalize ${reportType === type ? 'text-blue-600 font-semibold' : 'text-gray-700'}`}>
                    {type}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity
              onPress={generateReport}
              disabled={generatingReport}
              className="bg-green-500 rounded-lg p-4 items-center"
            >
              {generatingReport ? (
                <Text className="text-white font-semibold text-lg">Generating...</Text>
              ) : (
                <Text className="text-white font-semibold text-lg">Generate Report</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

