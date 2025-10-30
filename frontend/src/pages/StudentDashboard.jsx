// src/pages/StudentDashboard.jsx
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { feelingsAPI } from '../services/api';
import { EMOTION_OPTIONS } from '../utils/constants';
import { Calendar, TrendingUp, MessageSquare, Sparkles } from 'lucide-react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import Navbar from '../components/Navbar';
import LoadingSpinner from '../components/LoadingSpinner';

export default function StudentDashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  const [todayFeeling, setTodayFeeling] = useState(null);
  const [history, setHistory] = useState([]);
  const [encouragement, setEncouragement] = useState(null);

  const [selectedEmotion, setSelectedEmotion] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Check today's feeling
      const todayRes = await feelingsAPI.getToday();
      if (todayRes.data.submitted) {
        setTodayFeeling(todayRes.data.data);
        setEncouragement(todayRes.data.encouragement);
      }

      // Load history
      const historyRes = await feelingsAPI.getMyHistory(7);
      setHistory(historyRes.data.data);
    } catch (error) {
      console.error('Load data error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedEmotion) return;

    setSubmitting(true);
    try {
      const response = await feelingsAPI.submit(selectedEmotion, message);
      setTodayFeeling(response.data.data);
      setEncouragement(response.data.encouragement);
      setSelectedEmotion('');
      setMessage('');
      
      // Reload history
      const historyRes = await feelingsAPI.getMyHistory(7);
      setHistory(historyRes.data.data);
    } catch (error) {
      alert(error.response?.data?.message || 'Có lỗi xảy ra');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      <Navbar />

      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Welcome Header */}
        <div className="mb-8 animate-fadeIn">
          <div className="text-center md:text-left">
            <h1 className="text-4xl md:text-5xl font-black mb-3">
              <span className="gradient-text">Xin chào, {user?.name}!</span>
              <span className="ml-3 inline-block animate-bounce-slow">👋</span>
            </h1>
            <p className="text-gray-600 text-lg">
              Hôm nay em cảm thấy thế nào?
            </p>
          </div>
        </div>

        {todayFeeling ? (
          // Already submitted
          <div className="space-y-6">
            {/* Thank You Card */}
            <div className="card-gradient border-green-200 shadow-soft animate-fadeIn">
              <div className="text-center py-8">
                <div className="text-8xl mb-6 animate-bounce-slow">
                  {EMOTION_OPTIONS.find(e => e.value === todayFeeling.emotion)?.emoji}
                </div>
                <h2 className="text-3xl font-black text-gray-900 mb-3">
                  Cảm ơn em đã chia sẻ! 💛
                </h2>
                <p className="text-gray-600 text-lg mb-6">
                  Em đã gửi cảm xúc hôm nay rồi
                </p>

                {/* Encouragement */}
                {encouragement && (
                  <div className="bg-white rounded-2xl p-6 text-left max-w-2xl mx-auto shadow-lg animate-slideIn">
                    <div className="flex items-start gap-3 mb-4">
                      <span className="text-3xl">{encouragement.emoji}</span>
                      <p className="text-gray-800 text-lg leading-relaxed flex-1">
                        {encouragement.message}
                      </p>
                    </div>
                    <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-4 border border-blue-200">
                      <p className="text-sm font-bold text-blue-900 mb-2 flex items-center gap-2">
                        <Sparkles className="w-4 h-4" />
                        Gợi ý cho em:
                      </p>
                      <p className="text-sm text-blue-700 leading-relaxed">
                        {encouragement.tip}
                      </p>
                    </div>
                  </div>
                )}

                <div className="mt-6 inline-flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-md">
                  <Calendar className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-600 font-medium">
                    Hẹn gặp lại em vào ngày mai! 🌟
                  </span>
                </div>
              </div>
            </div>

            {/* Today's Detail Card */}
            <div className="card shadow-soft animate-slideIn">
              <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2 text-lg">
                <Calendar className="w-6 h-6 text-purple-600" />
                Cảm xúc hôm nay
              </h3>
              <div className="flex items-start gap-5 p-5 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl">
                <div 
                  className="text-6xl p-4 rounded-2xl shadow-lg"
                  style={{ backgroundColor: EMOTION_OPTIONS.find(e => e.value === todayFeeling.emotion)?.bgColor }}
                >
                  {EMOTION_OPTIONS.find(e => e.value === todayFeeling.emotion)?.emoji}
                </div>
                <div className="flex-1">
                  <div className="font-bold text-xl text-gray-900 mb-2">
                    {EMOTION_OPTIONS.find(e => e.value === todayFeeling.emotion)?.label}
                  </div>
                  {todayFeeling.message && (
                    <p className="text-gray-700 mb-3 text-base italic">
                      "{todayFeeling.message}"
                    </p>
                  )}
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <span>📅</span>
                    <span>{format(new Date(todayFeeling.date), 'HH:mm - dd/MM/yyyy')}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          // Submit Form
          <div className="card shadow-soft animate-fadeIn">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-black text-gray-900 mb-2">
                Chọn cảm xúc của em hôm nay
              </h2>
              <p className="text-gray-600">Nhấn vào biểu tượng cảm xúc phù hợp nhé!</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Emotion Selector */}
              <div className="grid grid-cols-5 gap-4">
                {EMOTION_OPTIONS.map((emotion, index) => (
                  <button
                    key={emotion.value}
                    type="button"
                    onClick={() => setSelectedEmotion(emotion.value)}
                    className={`emotion-card ${
                      selectedEmotion === emotion.value ? 'emotion-card-selected' : ''
                    }`}
                    style={{
                      backgroundColor: selectedEmotion === emotion.value ? emotion.bgColor : 'white',
                      borderColor: selectedEmotion === emotion.value ? emotion.color : '#e5e7eb',
                      animationDelay: `${index * 0.1}s`
                    }}
                  >
                    <div className="text-5xl mb-3">{emotion.emoji}</div>
                    <div className="text-sm font-bold text-gray-700">
                      {emotion.label}
                    </div>
                  </button>
                ))}
              </div>

              {/* Message Input */}
              {selectedEmotion && (
                <div className="animate-fadeIn">
                  <label className="block text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-purple-600" />
                    Em muốn nói gì thêm không? <span className="text-gray-400 font-normal">(không bắt buộc)</span>
                  </label>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="input text-base"
                    rows="4"
                    placeholder="VD: Hôm nay em học được bài mới rất thú vị..."
                  />
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={!selectedEmotion || submitting}
                className="btn btn-success w-full py-4 text-lg font-bold shadow-glow disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <span className="flex items-center justify-center gap-3">
                    <div className="animate-spin rounded-full h-5 w-5 border-3 border-white border-t-transparent"></div>
                    Đang gửi...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    Gửi cảm xúc
                    <span className="text-2xl">💛</span>
                  </span>
                )}
              </button>
            </form>
          </div>
        )}

        {/* History */}
        {history.length > 0 && (
          <div className="card shadow-soft mt-8 animate-slideIn">
            <h3 className="font-bold text-gray-900 mb-6 flex items-center gap-2 text-xl">
              <TrendingUp className="w-6 h-6 text-purple-600" />
              Lịch sử 7 ngày gần đây
            </h3>

            <div className="grid gap-4">
              {history.map((feeling, index) => (
                <div
                  key={feeling._id}
                  className="flex items-center gap-5 p-4 rounded-xl hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 transition-all duration-300 border-2 border-transparent hover:border-purple-200 cursor-pointer group"
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  <div 
                    className="text-5xl p-3 rounded-xl shadow-md group-hover:scale-110 transition-transform"
                    style={{ backgroundColor: EMOTION_OPTIONS.find(e => e.value === feeling.emotion)?.bgColor }}
                  >
                    {EMOTION_OPTIONS.find(e => e.value === feeling.emotion)?.emoji}
                  </div>
                  <div className="flex-1">
                    <div className="font-bold text-lg text-gray-900">
                      {EMOTION_OPTIONS.find(e => e.value === feeling.emotion)?.label}
                    </div>
                    {feeling.message && (
                      <p className="text-sm text-gray-600 mt-1 italic">"{feeling.message}"</p>
                    )}
                  </div>
                  <div className="text-sm font-medium text-gray-500 flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    {format(new Date(feeling.date), 'dd/MM', { locale: vi })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
