import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Modal,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSiteManagerStore, Milestone } from '../store/siteManagerStore';
import DateTimePicker from '@react-native-community/datetimepicker';

type ViewMode = 'list' | 'calendar';

export default function TimelineScreen() {
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [showModal, setShowModal] = useState(false);
  const [editingMilestone, setEditingMilestone] = useState<Milestone | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [selectedPhase, setSelectedPhase] = useState('');
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  const { milestones, phases, addMilestone, updateMilestone, deleteMilestone } = useSiteManagerStore();

  const handleSave = () => {
    if (!title || !selectedPhase) return;

    const milestoneData = {
      title,
      description,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      phase: selectedPhase,
      completed: false,
    };

    if (editingMilestone) {
      updateMilestone(editingMilestone.id, milestoneData);
    } else {
      addMilestone(milestoneData);
    }

    resetForm();
    setShowModal(false);
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setStartDate(new Date());
    setEndDate(new Date());
    setSelectedPhase('');
    setEditingMilestone(null);
  };

  const handleEdit = (milestone: Milestone) => {
    setEditingMilestone(milestone);
    setTitle(milestone.title);
    setDescription(milestone.description || '');
    setStartDate(new Date(milestone.startDate));
    setEndDate(new Date(milestone.endDate));
    setSelectedPhase(milestone.phase);
    setShowModal(true);
  };

  const handleDelete = (id: string) => {
    deleteMilestone(id);
  };

  const toggleComplete = (milestone: Milestone) => {
    updateMilestone(milestone.id, { completed: !milestone.completed });
  };

  return (
    <View className="flex-1 bg-white">
      <View className="flex-row justify-between items-center px-4 py-3 border-b border-gray-200">
        <Text className="text-2xl font-bold text-gray-900">Timeline</Text>
        <View className="flex-row gap-2">
          <TouchableOpacity
            onPress={() => setViewMode('list')}
            className={`px-3 py-1 rounded ${viewMode === 'list' ? 'bg-blue-500' : 'bg-gray-200'}`}
          >
            <Text className={viewMode === 'list' ? 'text-white' : 'text-gray-700'}>List</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setViewMode('calendar')}
            className={`px-3 py-1 rounded ${viewMode === 'calendar' ? 'bg-blue-500' : 'bg-gray-200'}`}
          >
            <Text className={viewMode === 'calendar' ? 'text-white' : 'text-gray-700'}>Calendar</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => {
              resetForm();
              setShowModal(true);
            }}
            className="bg-blue-500 px-4 py-1 rounded"
          >
            <Ionicons name="add" size={20} color="white" />
          </TouchableOpacity>
        </View>
      </View>

      {viewMode === 'list' ? (
        <ScrollView className="flex-1 p-4">
          {milestones.length === 0 ? (
            <View className="items-center justify-center py-20">
              <Ionicons name="calendar-outline" size={64} color="#9ca3af" />
              <Text className="text-gray-500 mt-4 text-center">No milestones yet</Text>
              <Text className="text-gray-400 mt-2 text-center">Add your first milestone to get started</Text>
            </View>
          ) : (
            milestones.map((milestone) => {
              const phase = phases.find((p) => p.id === milestone.phase);
              return (
                <View
                  key={milestone.id}
                  className="bg-white border border-gray-200 rounded-lg p-4 mb-3 shadow-sm"
                >
                  <View className="flex-row items-start justify-between">
                    <View className="flex-1">
                      <View className="flex-row items-center gap-2 mb-2">
                        <TouchableOpacity onPress={() => toggleComplete(milestone)}>
                          <Ionicons
                            name={milestone.completed ? 'checkmark-circle' : 'ellipse-outline'}
                            size={24}
                            color={milestone.completed ? '#10b981' : '#9ca3af'}
                          />
                        </TouchableOpacity>
                        <Text className={`text-lg font-semibold ${milestone.completed ? 'line-through text-gray-400' : 'text-gray-900'}`}>
                          {milestone.title}
                        </Text>
                      </View>
                      {milestone.description && (
                        <Text className="text-gray-600 text-sm mb-2 ml-8">{milestone.description}</Text>
                      )}
                      <View className="flex-row items-center gap-4 ml-8">
                        <View className="flex-row items-center gap-1">
                          <Ionicons name="calendar-outline" size={16} color="#6b7280" />
                          <Text className="text-gray-600 text-xs">
                            {new Date(milestone.startDate).toLocaleDateString()} - {new Date(milestone.endDate).toLocaleDateString()}
                          </Text>
                        </View>
                        {phase && (
                          <View className="flex-row items-center gap-1">
                            <View
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: phase.color }}
                            />
                            <Text className="text-gray-600 text-xs">{phase.name}</Text>
                          </View>
                        )}
                      </View>
                    </View>
                    <View className="flex-row gap-2">
                      <TouchableOpacity onPress={() => handleEdit(milestone)}>
                        <Ionicons name="pencil" size={20} color="#3b82f6" />
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => handleDelete(milestone.id)}>
                        <Ionicons name="trash-outline" size={20} color="#ef4444" />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              );
            })
          )}
        </ScrollView>
      ) : (
        <ScrollView className="flex-1 p-4">
          <Text className="text-gray-500 mb-4">Calendar/Gantt view - Pinch to zoom</Text>
          {milestones.map((milestone) => {
            const phase = phases.find((p) => p.id === milestone.phase);
            const start = new Date(milestone.startDate);
            const end = new Date(milestone.endDate);
            const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
            
            return (
              <View key={milestone.id} className="mb-4">
                <Text className="text-sm font-semibold text-gray-700 mb-1">{milestone.title}</Text>
                <View className="flex-row items-center gap-2">
                  <View
                    className="h-8 rounded"
                    style={{
                      width: Math.max(days * 10, 50),
                      backgroundColor: phase?.color || '#3b82f6',
                      opacity: milestone.completed ? 0.5 : 1,
                    }}
                  />
                  <Text className="text-xs text-gray-500">{days} days</Text>
                </View>
              </View>
            );
          })}
        </ScrollView>
      )}

      <Modal visible={showModal} animationType="slide" transparent>
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-white rounded-t-3xl p-6 max-h-[90%]">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-xl font-bold text-gray-900">
                {editingMilestone ? 'Edit Milestone' : 'New Milestone'}
              </Text>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <Ionicons name="close" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>

            <ScrollView>
              <TextInput
                placeholder="Title"
                value={title}
                onChangeText={setTitle}
                className="border border-gray-300 rounded-lg p-3 mb-3"
              />
              <TextInput
                placeholder="Description (optional)"
                value={description}
                onChangeText={setDescription}
                multiline
                className="border border-gray-300 rounded-lg p-3 mb-3 h-24"
              />

              <TouchableOpacity
                onPress={() => setShowStartPicker(true)}
                className="border border-gray-300 rounded-lg p-3 mb-3 flex-row justify-between items-center"
              >
                <Text className="text-gray-700">Start Date: {startDate.toLocaleDateString()}</Text>
                <Ionicons name="calendar" size={20} color="#6b7280" />
              </TouchableOpacity>

              {showStartPicker && (
                <DateTimePicker
                  value={startDate}
                  mode="date"
                  display="default"
                  onChange={(event, date) => {
                    setShowStartPicker(false);
                    if (date) setStartDate(date);
                  }}
                />
              )}

              <TouchableOpacity
                onPress={() => setShowEndPicker(true)}
                className="border border-gray-300 rounded-lg p-3 mb-3 flex-row justify-between items-center"
              >
                <Text className="text-gray-700">End Date: {endDate.toLocaleDateString()}</Text>
                <Ionicons name="calendar" size={20} color="#6b7280" />
              </TouchableOpacity>

              {showEndPicker && (
                <DateTimePicker
                  value={endDate}
                  mode="date"
                  display="default"
                  onChange={(event, date) => {
                    setShowEndPicker(false);
                    if (date) setEndDate(date);
                  }}
                />
              )}

              <Text className="text-gray-700 mb-2 font-medium">Phase</Text>
              <ScrollView horizontal className="mb-4">
                <View className="flex-row gap-2">
                  {phases.map((phase) => (
                    <TouchableOpacity
                      key={phase.id}
                      onPress={() => setSelectedPhase(phase.id)}
                      className={`px-4 py-2 rounded-lg border-2 ${
                        selectedPhase === phase.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-300 bg-white'
                      }`}
                    >
                      <View className="flex-row items-center gap-2">
                        <View
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: phase.color }}
                        />
                        <Text className={selectedPhase === phase.id ? 'text-blue-600 font-semibold' : 'text-gray-700'}>
                          {phase.name}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>

              <TouchableOpacity
                onPress={handleSave}
                className="bg-blue-500 rounded-lg p-4 items-center"
              >
                <Text className="text-white font-semibold text-lg">Save</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

