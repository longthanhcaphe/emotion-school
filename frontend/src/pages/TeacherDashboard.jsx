// src/pages/TeacherDashboard.jsx
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { classesAPI, feelingsAPI, aiAPI } from '../services/api';
import { EMOTION_OPTIONS } from '../utils/constants';
import { Users, TrendingUp, Brain, AlertCircle } from 'lucide-react';
import Navbar from '../components/Navbar';
import LoadingSpinner from '../components/LoadingSpinner';

export default function TeacherDashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [myClass, setMyClass] = useState(null);
  const [todayFeelings, setTodayFeelings] = useState([]);
  const [analysis, setAnalysis] = useState(null);
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Get my class
      const classRes = await classesAPI.getMyClass();
      setMyClass(classRes.data.data);

      // Get today's feelings
      const todayRes = await feelingsAPI.getClassToday(classRes.data.data._id);
      setTodayFeelings(todayRes.data.data);
    } catch (error) {
      console.error('Load data error:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAnalysis = async () => {
    if (!myClass) return;
    
    setLoadingAnalysis(true);
    try {
      const response = await aiAPI.analyzeClass(myClass._id, 7);
      setAnalysis(response.data.data);
    } catch (error) {
      console.error('Analysis error:', error);
      alert('Không thể phân tích. Vui lòng thử lại.');
    } finally {
      setLoadingAnalysis(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  if (!myClass) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="card text-center py-12">
            <div className="text-6xl mb-4">📚</div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              Chưa có lớp học
            </h2>
            <p className="text-gray-600">
              Bạn chưa được phân công lớp nào. Vui lòng liên hệ admin.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const stats = todayFeelings.reduce((acc, item) => {
    acc.total++;
    if (item.submitted) acc.submitted++;
    return acc;
  }, { total: 0, submitted: 0 });

  const emotionCounts = todayFeelings
    .filter(item => item.feeling)
    .reduce((acc, item) => {
      acc[item.feeling.emotion] = (acc[item.feeling.emotion] || 0) + 1;
      return acc;
    }, {});

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Dashboard Giáo viên
          </h1>
          <p className="text-gray-600 mt-1">
            Lớp {myClass.name} - {myClass.code}
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Total Students */}
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Tổng số học sinh</p>
                <p className="text-3xl font-bold text-gray-900">
                  {stats.total}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          {/* Submitted Today */}
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Đã gửi hôm nay</p>
                <p className="text-3xl font-bold text-green-600">
                  {stats.submitted}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
            </div>
            <div className="mt-2">
              <div className="flex justify-between text-xs text-gray-600 mb-1">
                <span>Tỷ lệ tham gia</span>
                <span>{((stats.submitted / stats.total) * 100).toFixed(0)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-green-600 h-2 rounded-full transition-all"
                  style={{ width: `${(stats.submitted / stats.total) * 100}%` }}
                />
              </div>
            </div>
          </div>

          {/* AI Analysis */}
          <div className="card bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-sm text-gray-700 mb-1">Phân tích AI</p>
                <p className="text-sm text-gray-600">7 ngày gần đây</p>
              </div>
              <Brain className="w-8 h-8 text-purple-600" />
            </div>
            <button
              onClick={loadAnalysis}
              disabled={loadingAnalysis}
              className="btn btn-primary w-full text-sm"
            >
              {loadingAnalysis ? 'Đang phân tích...' : 'Xem phân tích'}
            </button>
          </div>
        </div>

        {/* Emotion Distribution */}
        {Object.keys(emotionCounts).length > 0 && (
          <div className="card mb-8">
            <h3 className="font-semibold text-gray-900 mb-4">
              Phân bố cảm xúc hôm nay
            </h3>
            <div className="grid grid-cols-5 gap-4">
              {EMOTION_OPTIONS.map((emotion) => {
                const count = emotionCounts[emotion.value] || 0;
                return (
                  <div
                    key={emotion.value}
                    className="text-center p-4 rounded-lg"
                    style={{ backgroundColor: emotion.bgColor }}
                  >
                    <div className="text-4xl mb-2">{emotion.emoji}</div>
                    <div className="text-sm font-medium text-gray-700">
                      {emotion.label}
                    </div>
                    <div className="text-2xl font-bold text-gray-900 mt-1">
                      {count}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* AI Analysis Results */}
        {analysis && analysis.hasData && (
          <div className="space-y-6">
            {/* Summary */}
            <div className="card bg-gradient-to-r from-blue-50 to-purple-50">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Brain className="w-5 h-5 text-purple-600" />
                Tóm tắt phân tích
              </h3>
              <p className="text-gray-700 leading-relaxed">
                {analysis.analysis.summary}
              </p>
            </div>

            {/* Key Findings */}
            <div className="card">
              <h3 className="font-semibold text-gray-900 mb-3">
                📌 Phát hiện chính
              </h3>
              <ul className="space-y-2">
                {analysis.analysis.keyFindings.map((finding, index) => (
                  <li key={index} className="flex items-start gap-2 text-gray-700">
                    <span className="text-blue-600 mt-1">•</span>
                    <span>{finding}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Action Suggestions */}
            <div className="card">
              <h3 className="font-semibold text-gray-900 mb-4">
                💡 Gợi ý hành động
              </h3>
              <div className="space-y-3">
                {analysis.analysis.actionSuggestions.map((suggestion, index) => (
                  <div
                    key={index}
                    className={`p-4 rounded-lg border-l-4 ${
                      suggestion.priority === 'high'
                        ? 'bg-red-50 border-red-500'
                        : suggestion.priority === 'medium'
                        ? 'bg-yellow-50 border-yellow-500'
                        : 'bg-green-50 border-green-500'
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <span className="text-lg">
                        {suggestion.priority === 'high' ? '🔴' : 
                         suggestion.priority === 'medium' ? '🟡' : '🟢'}
                      </span>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">
                          {suggestion.action}
                        </p>
                        <p className="text-sm text-gray-600 mt-1">
                          → {suggestion.reason}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Concerning Students */}
            {analysis.concerningStudents && analysis.concerningStudents.length > 0 && (
              <div className="card border-orange-200 bg-orange-50">
                <h3 className="font-semibold text-orange-900 mb-4 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5" />
                  Học sinh cần quan tâm ({analysis.concerningStudents.length})
                </h3>
                <div className="space-y-3">
                  {analysis.concerningStudents.map((item) => (
                    <div
                      key={item.student._id}
                      className="bg-white p-4 rounded-lg"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-900">
                            {item.student.name} ({item.student.studentCode})
                          </p>
                          <p className="text-sm text-gray-600 mt-1">
                            {item.negativeCount} lần cảm xúc tiêu cực • {item.consecutiveNegative} lần liên tiếp
                          </p>
                        </div>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            item.riskLevel === 'high'
                              ? 'bg-red-100 text-red-700'
                              : 'bg-yellow-100 text-yellow-700'
                          }`}
                        >
                          {item.riskLevel === 'high' ? 'Ưu tiên cao' : 'Cần theo dõi'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Positive Note */}
            {analysis.analysis.positiveNotes && (
              <div className="card bg-green-50 border-green-200">
                <p className="text-green-900">
                  ✨ {analysis.analysis.positiveNotes}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Students List */}
        <div className="card mt-8">
          <h3 className="font-semibold text-gray-900 mb-4">
            Danh sách học sinh ({stats.total})
          </h3>
          <div className="space-y-2">
            {todayFeelings.map((item) => (
              <div
                key={item.student._id}
                className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <img
                    src={item.student.avatar}
                    alt={item.student.name}
                    className="w-10 h-10 rounded-full"
                  />
                  <div>
                    <p className="font-medium text-gray-900">
                      {item.student.name}
                    </p>
                    <p className="text-sm text-gray-500">
                      {item.student.studentCode}
                    </p>
                  </div>
                </div>
                <div>
                  {item.submitted ? (
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">
                        {EMOTION_OPTIONS.find(e => e.value === item.feeling.emotion)?.emoji}
                      </span>
                      <span className="text-sm text-gray-600">
                        {EMOTION_OPTIONS.find(e => e.value === item.feeling.emotion)?.label}
                      </span>
                    </div>
                  ) : (
                    <span className="text-sm text-gray-400">Chưa gửi</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}