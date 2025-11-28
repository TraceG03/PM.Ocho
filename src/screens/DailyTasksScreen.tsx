import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSiteManagerStore, Task } from '../store/siteManagerStore';

export default function DailyTasksScreen() {
  const [showModal, setShowModal] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<'Normal' | 'High' | 'Critical'>('Normal');
  const [dueDate, setDueDate] = useState('');
  const [filterDate, setFilterDate] = useState('');

  const { tasks, milestones, documents, addTask, updateTask, deleteTask } = useSiteManagerStore();

  const filteredTasks = filterDate
    ? tasks.filter((t) => t.dueDate === filterDate)
    : tasks;

  const handleSave = () => {
    if (!title) return;

    const taskData = {
      title,
      description,
      priority,
      dueDate: dueDate || undefined,
      completed: false,
    };

    if (editingTask) {
      updateTask(editingTask.id, taskData);
    } else {
      addTask(taskData);
    }

    resetForm();
    setShowModal(false);
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setPriority('Normal');
    setDueDate('');
    setEditingTask(null);
  };

  const handleEdit = (task: Task) => {
    setEditingTask(task);
    setTitle(task.title);
    setDescription(task.description || '');
    setPriority(task.priority);
    setDueDate(task.dueDate || '');
    setShowModal(true);
  };

  const toggleComplete = (task: Task) => {
    updateTask(task.id, { completed: !task.completed });
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Critical':
        return '#ef4444';
      case 'High':
        return '#f59e0b';
      default:
        return '#3b82f6';
    }
  };

  return (
    <View className="flex-1 bg-white">
      <View className="px-4 py-3 border-b border-gray-200">
        <View className="flex-row justify-between items-center mb-3">
          <Text className="text-2xl font-bold text-gray-900">Daily Tasks</Text>
          <TouchableOpacity
            onPress={() => {
              resetForm();
              setShowModal(true);
            }}
            className="bg-blue-500 px-4 py-2 rounded-lg"
          >
            <Ionicons name="add" size={20} color="white" />
          </TouchableOpacity>
        </View>
        <TextInput
          placeholder="Filter by date (YYYY-MM-DD)"
          value={filterDate}
          onChangeText={setFilterDate}
          className="border border-gray-300 rounded-lg p-2 text-sm"
        />
      </View>

      <ScrollView className="flex-1 p-4">
        {filteredTasks.length === 0 ? (
          <View className="items-center justify-center py-20">
            <Ionicons name="checkmark-circle-outline" size={64} color="#9ca3af" />
            <Text className="text-gray-500 mt-4 text-center">No tasks yet</Text>
            <Text className="text-gray-400 mt-2 text-center">Add your first task to get started</Text>
          </View>
        ) : (
          filteredTasks.map((task) => (
            <View
              key={task.id}
              className="bg-white border border-gray-200 rounded-lg p-4 mb-3 shadow-sm"
            >
              <View className="flex-row items-start justify-between">
                <View className="flex-1">
                  <View className="flex-row items-center gap-2 mb-2">
                    <TouchableOpacity onPress={() => toggleComplete(task)}>
                      <Ionicons
                        name={task.completed ? 'checkmark-circle' : 'ellipse-outline'}
                        size={24}
                        color={task.completed ? '#10b981' : '#9ca3af'}
                      />
                    </TouchableOpacity>
                    <Text className={`text-lg font-semibold flex-1 ${task.completed ? 'line-through text-gray-400' : 'text-gray-900'}`}>
                      {task.title}
                    </Text>
                    <View
                      className="px-2 py-1 rounded"
                      style={{ backgroundColor: getPriorityColor(task.priority) + '20' }}
                    >
                      <Text
                        className="text-xs font-semibold"
                        style={{ color: getPriorityColor(task.priority) }}
                      >
                        {task.priority}
                      </Text>
                    </View>
                  </View>
                  {task.description && (
                    <Text className="text-gray-600 text-sm mb-2 ml-8">{task.description}</Text>
                  )}
                  <View className="flex-row items-center gap-4 ml-8">
                    {task.dueDate && (
                      <View className="flex-row items-center gap-1">
                        <Ionicons name="calendar-outline" size={16} color="#6b7280" />
                        <Text className="text-gray-600 text-xs">{task.dueDate}</Text>
                      </View>
                    )}
                    {task.milestoneId && (
                      <View className="flex-row items-center gap-1">
                        <Ionicons name="flag-outline" size={16} color="#6b7280" />
                        <Text className="text-gray-600 text-xs">
                          {milestones.find((m) => m.id === task.milestoneId)?.title || 'Milestone'}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
                <View className="flex-row gap-2 ml-2">
                  <TouchableOpacity onPress={() => handleEdit(task)}>
                    <Ionicons name="pencil" size={20} color="#3b82f6" />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => deleteTask(task.id)}>
                    <Ionicons name="trash-outline" size={20} color="#ef4444" />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      <Modal visible={showModal} animationType="slide" transparent>
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-white rounded-t-3xl p-6">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-xl font-bold text-gray-900">
                {editingTask ? 'Edit Task' : 'New Task'}
              </Text>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <Ionicons name="close" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>

            <TextInput
              placeholder="Task title"
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

            <Text className="text-gray-700 mb-2 font-medium">Priority</Text>
            <View className="flex-row gap-2 mb-4">
              {(['Normal', 'High', 'Critical'] as const).map((p) => (
                <TouchableOpacity
                  key={p}
                  onPress={() => setPriority(p)}
                  className={`flex-1 px-4 py-2 rounded-lg border-2 ${
                    priority === p
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-300 bg-white'
                  }`}
                >
                  <Text className={`text-center ${priority === p ? 'text-blue-600 font-semibold' : 'text-gray-700'}`}>
                    {p}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TextInput
              placeholder="Due date (YYYY-MM-DD, optional)"
              value={dueDate}
              onChangeText={setDueDate}
              className="border border-gray-300 rounded-lg p-3 mb-4"
            />

            <TouchableOpacity
              onPress={handleSave}
              className="bg-blue-500 rounded-lg p-4 items-center"
            >
              <Text className="text-white font-semibold text-lg">Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

