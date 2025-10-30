// src/utils/constants.js

export const EMOTIONS = {
  happy: {
    label: 'Vui vẻ',
    emoji: '😊',
    color: '#22c55e',
    bgColor: '#dcfce7',
  },
  neutral: {
    label: 'Bình thường',
    emoji: '😐',
    color: '#f59e0b',
    bgColor: '#fef3c7',
  },
  sad: {
    label: 'Buồn',
    emoji: '😔',
    color: '#3b82f6',
    bgColor: '#dbeafe',
  },
  angry: {
    label: 'Tức giận',
    emoji: '😡',
    color: '#ef4444',
    bgColor: '#fee2e2',
  },
  tired: {
    label: 'Mệt mỏi',
    emoji: '😴',
    color: '#8b5cf6',
    bgColor: '#ede9fe',
  },
};

export const EMOTION_OPTIONS = [
  { value: 'happy', ...EMOTIONS.happy },
  { value: 'neutral', ...EMOTIONS.neutral },
  { value: 'sad', ...EMOTIONS.sad },
  { value: 'angry', ...EMOTIONS.angry },
  { value: 'tired', ...EMOTIONS.tired },
];

export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';