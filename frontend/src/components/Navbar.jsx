// src/components/Navbar.jsx
import { useAuth } from '../context/AuthContext';
import { LogOut, User, GraduationCap } from 'lucide-react';

export default function Navbar() {
  const { user, logout } = useAuth();

  return (
    <nav className="bg-white/80 backdrop-blur-md shadow-md border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-2xl">🎓</span>
            </div>
            <span className="text-2xl font-black gradient-text">
              Emotion School
            </span>
          </div>

          {/* User Info */}
          {user && (
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3 px-4 py-2 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-200">
                {user.role === 'student' ? (
                  <User className="w-5 h-5 text-blue-600" />
                ) : (
                  <GraduationCap className="w-5 h-5 text-purple-600" />
                )}
                <div className="text-sm">
                  <div className="font-bold text-gray-900">{user.name}</div>
                  <div className="text-gray-600 text-xs">
                    {user.role === 'student' ? `HS ${user.studentCode}` : 'Giáo viên'}
                  </div>
                </div>
              </div>

              <button
                onClick={logout}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-red-50 hover:text-red-600 rounded-xl transition-all border-2 border-transparent hover:border-red-200"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Đăng xuất</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}