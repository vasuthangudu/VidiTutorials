import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './components/AuthProvider';
import { auth, signOut } from './firebase';
import Home from './pages/Home';
import Login from './pages/Login';
import VideoPlayer from './pages/VideoPlayer';
import AdminDashboard from './pages/AdminDashboard';
import UploadVideo from './pages/UploadVideo';
import EditVideo from './pages/EditVideo';
import UserDashboard from './pages/UserDashboard';
import { LogOut, Video, User, LayoutDashboard, PlusCircle } from 'lucide-react';

const Navbar: React.FC = () => {
  const { user, profile, isAdmin } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/login');
  };

  return (
    <nav className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between sticky top-0 z-50">
      <Link to="/" className="flex items-center gap-2 text-xl font-bold text-indigo-600">
        <Video className="w-8 h-8" />
        <span>VidiTutorials</span>
      </Link>

      <div className="flex items-center gap-6">
        <Link to="/" className="text-gray-600 hover:text-indigo-600 font-medium">Home</Link>
        {user ? (
          <>
            {isAdmin && (
              <Link to="/admin" className="text-gray-600 hover:text-indigo-600 font-medium flex items-center gap-1">
                <LayoutDashboard className="w-4 h-4" />
                Admin
              </Link>
            )}
            <Link to="/upload" className="text-gray-600 hover:text-indigo-600 font-medium flex items-center gap-1">
              <PlusCircle className="w-4 h-4" />
              Upload
            </Link>
            <Link to="/dashboard" className="text-gray-600 hover:text-indigo-600 font-medium flex items-center gap-1">
              <User className="w-4 h-4" />
              Profile
            </Link>
            <button
              onClick={handleLogout}
              className="text-gray-600 hover:text-red-600 font-medium flex items-center gap-1"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </>
        ) : (
          <Link
            to="/login"
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-indigo-700 transition-colors"
          >
            Login
          </Link>
        )}
      </div>
    </nav>
  );
};

import ErrorBoundary from './components/ErrorBoundary';

const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <Router>
          <div className="min-h-screen bg-gray-50 font-sans">
            <Navbar />
            <main className="container mx-auto px-4 py-8">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/video/:id" element={<VideoPlayer />} />
                <Route path="/admin" element={<AdminDashboard />} />
                <Route path="/upload" element={<UploadVideo />} />
                <Route path="/edit-video/:id" element={<EditVideo />} />
                <Route path="/dashboard" element={<UserDashboard />} />
              </Routes>
            </main>
          </div>
        </Router>
      </AuthProvider>
    </ErrorBoundary>
  );
};

export default App;
