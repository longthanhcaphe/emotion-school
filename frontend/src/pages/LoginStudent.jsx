// src/pages/LoginStudent.jsx
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { School, KeyRound, User, Sparkles } from 'lucide-react';

export default function LoginStudent() {
  const navigate = useNavigate();
  const { loginStudent } = useAuth();

  const [formData, setFormData] = useState({
    classCode: '',
    studentCode: '',
    name: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [needName, setNeedName] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await loginStudent(
        formData.classCode.toUpperCase(),
        formData.studentCode,
        formData.name
      );

      if (result.success) {
        navigate('/student');
      } else {
        setError(result.message);
        if (result.message?.includes('tên')) {
          setNeedName(true);
        }
      }
    } catch (err) {
      setError('Đã có lỗi xảy ra. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-20 w-72 h-72 bg-white opacity-10 rounded-full blur-3xl animate-pulse-slow"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-yellow-300 opacity-10 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-pink-300 opacity-10 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="max-w-md w-full relative z-10 animate-fadeIn">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white rounded-3xl mb-6 shadow-2xl animate-bounce-slow">
            <School className="w-10 h-10 text-purple-600" />
          </div>
          <h1 className="text-4xl font-black text-white mb-3 drop-shadow-lg">
            Xin chào! 👋
          </h1>
          <p className="text-white text-lg opacity-90 flex items-center justify-center gap-2">
            <Sparkles className="w-5 h-5" />
            Đăng nhập để chia sẻ cảm xúc hôm nay
          </p>
        </div>

        {/* Form Card */}
        <div className="glass rounded-3xl shadow-2xl p-8 backdrop-blur-xl">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Class Code */}
            <div className="animate-slideIn">
              <label className="block text-sm font-bold text-gray-700 mb-2">
                🏫 Mã lớp học
              </label>
              <div className="relative group">
                <KeyRound className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-purple-500 group-focus-within:text-purple-600 transition-colors" />
                <input
                  type="text"
                  name="classCode"
                  value={formData.classCode}
                  onChange={handleChange}
                  className="input pl-12 text-lg font-medium uppercase"
                  placeholder="VD: 6A2024"
                  required
                  autoFocus
                />
              </div>
              <p className="text-xs text-gray-600 mt-2 ml-1">
                💡 Hỏi cô giáo để biết mã lớp nhé!
              </p>
            </div>

            {/* Student Code */}
            <div className="animate-slideIn" style={{ animationDelay: '0.1s' }}>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                🎒 Mã học sinh
              </label>
              <div className="relative group">
                <User className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-purple-500 group-focus-within:text-purple-600 transition-colors" />
                <input
                  type="text"
                  name="studentCode"
                  value={formData.studentCode}
                  onChange={handleChange}
                  className="input pl-12 text-lg font-medium uppercase"
                  placeholder="VD: HS001-009"
                  required
                />
              </div>
            </div>

            {/* Name (conditional) */}
            {needName && (
              <div className="animate-fadeIn">
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  ✨ Tên của em
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="input text-lg"
                  placeholder="VD: Nguyễn Văn An"
                  required={needName}
                />
                <div className="mt-2 p-3 bg-blue-50 border-l-4 border-blue-400 rounded-lg">
                  <p className="text-sm text-blue-700 font-medium">
                    🎉 Lần đầu đăng nhập! Vui lòng cho cô biết tên em nhé
                  </p>
                </div>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="bg-red-50 border-l-4 border-red-500 text-red-700 px-4 py-3 rounded-lg animate-fadeIn">
                <div className="flex items-start gap-2">
                  <span className="text-xl">⚠️</span>
                  <span className="text-sm font-medium">{error}</span>
                </div>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary w-full py-4 text-lg font-bold shadow-glow disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-3">
                  <div className="animate-spin rounded-full h-5 w-5 border-3 border-white border-t-transparent"></div>
                  Đang đăng nhập...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  Đăng nhập
                  <span className="text-2xl">🚀</span>
                </span>
              )}
            </button>
          </form>

          {/* Teacher login link */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Bạn là giáo viên?{' '}
              <Link
                to="/login-teacher"
                className="text-purple-600 hover:text-purple-700 font-bold underline decoration-2 underline-offset-2"
              >
                Đăng nhập tại đây →
              </Link>
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-6">
          <p className="text-white text-sm opacity-80">
            Made with 💙 by Emotion School
          </p>
        </div>
      </div>
    </div>
  );
}