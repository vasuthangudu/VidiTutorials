import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './components/AuthProvider';
import { auth, signOut } from './firebase';
import Home from './pages/Home';
import Login from './pages/Login';
import VideoPlayer from './pages/VideoPlayer';
import AdminDashboard from './pages/AdminDashboard';
import UploadVideo from './pages/UploadVideo';
import EditVideo from './pages/EditVideo';
import UserDashboard from './pages/UserDashboard';
import { LogOut, Video, User, LayoutDashboard, PlusCircle, Linkedin, Phone, Mail, Github } from 'lucide-react';

const Navbar: React.FC = () => {
  const { user, profile, isAdmin } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/login');
  };

  return (
    <nav className="glass sticky top-0 z-50 border-b border-gray-100/50 backdrop-blur-2xl">
      <div className="responsive-container py-5 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3 text-2xl font-black text-text tracking-tighter group">
          <div className="bg-primary text-white p-2 rounded-[1rem] shadow-xl shadow-primary/20 group-hover:scale-110 transition-transform duration-300">
            <Video className="w-6 h-6" />
          </div>
          <span className="hidden sm:inline">Vidi<span className="text-primary">Tutorials</span></span>
        </Link>

        <div className="flex items-center gap-2 sm:gap-8">
          {user && (
            <>
              <Link to="/" className="text-text-muted hover:text-primary font-black text-sm uppercase tracking-widest transition-colors hidden lg:block">Home</Link>
              {isAdmin && (
                <Link to="/admin" className="text-text-muted hover:text-primary font-black text-sm uppercase tracking-widest transition-colors flex items-center gap-2 group">
                  <LayoutDashboard className="w-5 h-5 group-hover:scale-110 transition-transform" />
                  <span className="hidden md:inline">Admin</span>
                </Link>
              )}
              <Link to="/upload" className="text-text-muted hover:text-primary font-black text-sm uppercase tracking-widest transition-colors flex items-center gap-2 group">
                <PlusCircle className="w-5 h-5 group-hover:scale-110 transition-transform" />
                <span className="hidden md:inline">Upload</span>
              </Link>
              <Link to="/dashboard" className="text-text-muted hover:text-primary font-black text-sm uppercase tracking-widest transition-colors flex items-center gap-2 group">
                <User className="w-5 h-5 group-hover:scale-110 transition-transform" />
                <span className="hidden md:inline">Profile</span>
              </Link>
              <button
                onClick={handleLogout}
                className="text-text-muted hover:text-red-500 font-black text-sm uppercase tracking-widest transition-colors flex items-center gap-2 group"
              >
                <LogOut className="w-5 h-5 group-hover:scale-110 transition-transform" />
                <span className="hidden md:inline">Logout</span>
              </button>
            </>
          )}
          {!user && (
            <Link
              to="/login"
              className="bg-primary text-white px-8 py-3 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-primary-dark transition-all shadow-xl shadow-primary/20"
            >
              Login
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
};

const Footer: React.FC = () => {
  return (
    <footer className="bg-surface border-t border-gray-100 pt-20 pb-10">
      <div className="responsive-container">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-20">
          <div className="col-span-1 md:col-span-2 space-y-6">
            <Link to="/" className="flex items-center gap-3 text-2xl font-black text-text tracking-tighter">
              <div className="bg-primary text-white p-2 rounded-[1rem] shadow-xl shadow-primary/20">
                <Video className="w-6 h-6" />
              </div>
              <span>Vidi<span className="text-primary">Tutorials</span></span>
            </Link>
            <p className="text-text-muted font-medium max-w-md leading-relaxed">
              The ultimate platform for high-quality video tutorials. Learn, share, and grow with our community of expert creators and eager learners.
            </p>
          </div>
          
          <div>
            <h4 className="text-xs font-black text-text uppercase tracking-widest mb-6">Platform</h4>
            <ul className="space-y-4">
              <li><Link to="/" className="text-text-muted hover:text-primary font-bold text-sm transition-colors">Browse Tutorials</Link></li>
              <li><Link to="/upload" className="text-text-muted hover:text-primary font-bold text-sm transition-colors">Upload Content</Link></li>
              <li><Link to="/dashboard" className="text-text-muted hover:text-primary font-bold text-sm transition-colors">User Dashboard</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-black text-text uppercase tracking-widest mb-6">Contact</h4>
            <ul className="space-y-4">
              <li>
                <a href="mailto:thanguduvasu2004@gmail.com" className="text-text-muted hover:text-primary font-bold text-sm transition-colors flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  thanguduvasu2004@gmail.com
                </a>
              </li>
              <li>
                <a href="tel:+919347893134" className="text-text-muted hover:text-primary font-bold text-sm transition-colors flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  +91 9347893134
                </a>
              </li>
              <li>
                <a 
                  href="https://www.linkedin.com/public-profile/settings/?trk=d_flagship3_profile_self_view_public_profile&lipi=urn%3Ali%3Apage%3Ad_flagship3_profile_view_base%3B9KBJK73iRty1ssct9kAHUA%3D%3D" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-text-muted hover:text-primary font-bold text-sm transition-colors flex items-center gap-2"
                >
                  <Linkedin className="w-4 h-4" />
                  LinkedIn Profile
                </a>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="pt-10 border-t border-gray-50 flex flex-col md:flex-row items-center justify-between gap-6">
          <p className="text-text-muted text-xs font-bold">
            © {new Date().getFullYear()} VidiTutorials. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <a 
              href="https://www.linkedin.com/public-profile/settings/?trk=d_flagship3_profile_self_view_public_profile&lipi=urn%3Ali%3Apage%3Ad_flagship3_profile_view_base%3B9KBJK73iRty1ssct9kAHUA%3D%3D" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-text-muted hover:text-primary transition-colors"
            >
              <span className="sr-only">LinkedIn</span>
              <Linkedin className="w-5 h-5" />
            </a>
            <a href="https://github.com/vasuthangudu" target="_blank" rel="noopener noreferrer" className="text-text-muted hover:text-primary transition-colors">
              <span className="sr-only">GitHub</span>
              <Github className="w-5 h-5" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

import ErrorBoundary from './components/ErrorBoundary';

const AppRoutes: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/" element={user ? <Home /> : <Login />} />
      <Route path="/login" element={user ? <Navigate to="/" /> : <Login />} />
      <Route path="/video/:id" element={<VideoPlayer />} />
      <Route path="/admin" element={<AdminDashboard />} />
      <Route path="/upload" element={<UploadVideo />} />
      <Route path="/edit-video/:id" element={<EditVideo />} />
      <Route path="/dashboard" element={<UserDashboard />} />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
};

const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <Router>
          <div className="min-h-screen bg-bg flex flex-col">
            <Navbar />
            <main className="responsive-container py-8 sm:py-12 flex-1">
              <AppRoutes />
            </main>
            <Footer />
          </div>
        </Router>
      </AuthProvider>
    </ErrorBoundary>
  );
};

export default App;
