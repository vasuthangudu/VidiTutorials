import React, { useEffect, useState } from 'react';
import { useAuth } from '../components/AuthProvider';
import { db, collection, query, where, getDocs, doc, getDoc, onSnapshot, orderBy, limit, deleteDoc } from '../firebase';
import { Video } from '../types';
import VideoCard from '../components/VideoCard';
import { motion, AnimatePresence } from 'motion/react';
import { Bookmark, History, User, Mail, Shield, Clock, Loader2, Video as VideoIcon, Lock, Upload, AlertTriangle, Trash2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { handleFirestoreError, OperationType } from '../lib/firestoreUtils';

const UserDashboard: React.FC = () => {
  const { user, profile, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [bookmarkedVideos, setBookmarkedVideos] = useState<Video[]>([]);
  const [historyVideos, setHistoryVideos] = useState<Video[]>([]);
  const [myUploads, setMyUploads] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'bookmarks' | 'history' | 'uploads' | 'settings'>('bookmarks');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (!user || !profile) return;

    const fetchVideos = async () => {
      setLoading(true);
      
      // Fetch bookmarks
      if (profile.bookmarks && profile.bookmarks.length > 0) {
        const bookmarkPromises = profile.bookmarks.map((id: string) => getDoc(doc(db, 'videos', id)));
        const bookmarkDocs = await Promise.all(bookmarkPromises);
        setBookmarkedVideos(bookmarkDocs.filter(d => d.exists()).map(d => ({ id: d.id, ...d.data() } as Video)));
      } else {
        setBookmarkedVideos([]);
      }

      // Fetch history (unique video IDs from history)
      if (profile.watchHistory && profile.watchHistory.length > 0) {
        const historyIds = [...new Set(profile.watchHistory.map(h => h.videoId))].slice(0, 10);
        const historyPromises = historyIds.map((id: string) => getDoc(doc(db, 'videos', id)));
        const historyDocs = await Promise.all(historyPromises);
        setHistoryVideos(historyDocs.filter(d => d.exists()).map(d => ({ id: d.id, ...d.data() } as Video)));
      } else {
        setHistoryVideos([]);
      }

      // Fetch my uploads
      const uploadsQuery = query(
        collection(db, 'videos'),
        where('uploaderUid', '==', user.uid),
        orderBy('createdAt', 'desc')
      );
      const uploadsSnapshot = await getDocs(uploadsQuery);
      setMyUploads(uploadsSnapshot.docs.map(d => ({ id: d.id, ...d.data() } as Video)));

      setLoading(false);
    };

    fetchVideos();
  }, [user, profile]);

  const handleDeleteVideo = async (videoId: string) => {
    setDeleteConfirmId(videoId);
  };

  const confirmDelete = async () => {
    if (!deleteConfirmId) return;
    
    setIsDeleting(true);
    try {
      await deleteDoc(doc(db, 'videos', deleteConfirmId));
      setMyUploads(prev => prev.filter(v => v.id !== deleteConfirmId));
      setBookmarkedVideos(prev => prev.filter(v => v.id !== deleteConfirmId));
      setHistoryVideos(prev => prev.filter(v => v.id !== deleteConfirmId));
      setDeleteConfirmId(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `videos/${deleteConfirmId}`);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleEditVideo = (video: Video) => {
    navigate(`/edit-video/${video.id}`);
  };

  if (authLoading || loading) {
    return (
      <div className="flex flex-col items-center justify-center py-40 gap-4">
        <Loader2 className="w-12 h-12 text-primary animate-spin" />
        <p className="text-text-muted font-bold">Loading your profile...</p>
      </div>
    );
  }

  if (!user || !profile) return null;

  return (
    <div className="space-y-12">
      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteConfirmId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl space-y-6"
            >
              <div className="bg-red-50 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto">
                <AlertTriangle className="w-8 h-8 text-red-600" />
              </div>
              <div className="text-center space-y-2">
                <h3 className="text-2xl font-bold text-gray-900">Delete Video?</h3>
                <p className="text-gray-500">This action cannot be undone. All comments and likes associated with this video will remain but the video itself will be gone.</p>
              </div>
              <div className="flex gap-4">
                <button
                  onClick={() => setDeleteConfirmId(null)}
                  className="flex-1 px-6 py-3 rounded-xl font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  disabled={isDeleting}
                  className="flex-1 px-6 py-3 rounded-xl font-bold text-white bg-red-600 hover:bg-red-700 transition-all shadow-lg shadow-red-200 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isDeleting ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <Trash2 className="w-5 h-5" />
                      Delete
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Profile Header */}
      <div className="bg-surface p-10 rounded-[2.5rem] shadow-xl border border-gray-100 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-10 opacity-5">
          <User className="w-64 h-64" />
        </div>
        <div className="flex flex-col md:flex-row items-center gap-8 relative z-10">
          <img
            src={user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName}`}
            alt={user.displayName || 'User'}
            className="w-32 h-32 rounded-[2rem] object-cover shadow-2xl ring-4 ring-primary/10"
            referrerPolicy="no-referrer"
          />
          <div className="text-center md:text-left space-y-6">
            <div>
              <h1 className="text-4xl font-black text-text tracking-tighter mb-3">{user.displayName}</h1>
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-[10px] font-black uppercase tracking-widest text-text-muted">
                <div className="flex items-center gap-2 bg-bg px-4 py-2 rounded-xl border border-gray-100">
                  <Mail className="w-4 h-4 text-primary" />
                  <span>{user.email}</span>
                </div>
                <div className="flex items-center gap-2 bg-bg px-4 py-2 rounded-xl border border-gray-100">
                  <Shield className="w-4 h-4 text-primary" />
                  <span className="capitalize">{profile.role}</span>
                </div>
                <div className="flex items-center gap-2 bg-bg px-4 py-2 rounded-xl border border-gray-100">
                  <Clock className="w-4 h-4 text-primary" />
                  <span>Joined {profile.createdAt?.toDate ? formatDistanceToNow(profile.createdAt.toDate(), { addSuffix: true }) : 'recently'}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-center md:justify-start gap-4 pt-2">
              <div className="bg-bg px-6 py-3 rounded-2xl text-center border border-gray-100 min-w-[100px]">
                <p className="text-[10px] text-text-muted font-black uppercase tracking-widest mb-1">Bookmarks</p>
                <p className="text-2xl font-black text-primary">{profile.bookmarks?.length || 0}</p>
              </div>
              <div className="bg-bg px-6 py-3 rounded-2xl text-center border border-gray-100 min-w-[100px]">
                <p className="text-[10px] text-text-muted font-black uppercase tracking-widest mb-1">History</p>
                <p className="text-2xl font-black text-primary">{profile.watchHistory?.length || 0}</p>
              </div>
              <div className="bg-bg px-6 py-3 rounded-2xl text-center border border-gray-100 min-w-[100px]">
                <p className="text-[10px] text-text-muted font-black uppercase tracking-widest mb-1">Uploads</p>
                <p className="text-2xl font-black text-primary">{myUploads.length}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content Tabs */}
      <div className="space-y-10">
        <div className="flex items-center gap-8 border-b border-gray-100">
          <button
            onClick={() => setActiveTab('bookmarks')}
            className={`px-4 py-5 text-sm font-black uppercase tracking-widest transition-all border-b-4 flex items-center gap-2 ${
              activeTab === 'bookmarks' ? 'border-primary text-primary' : 'border-transparent text-text-muted hover:text-text'
            }`}
          >
            <Bookmark className="w-4 h-4" />
            Saved Tutorials
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-4 py-5 text-sm font-black uppercase tracking-widest transition-all border-b-4 flex items-center gap-2 ${
              activeTab === 'history' ? 'border-primary text-primary' : 'border-transparent text-text-muted hover:text-text'
            }`}
          >
            <History className="w-4 h-4" />
            Watch History
          </button>
          <button
            onClick={() => setActiveTab('uploads')}
            className={`px-4 py-5 text-sm font-black uppercase tracking-widest transition-all border-b-4 flex items-center gap-2 ${
              activeTab === 'uploads' ? 'border-primary text-primary' : 'border-transparent text-text-muted hover:text-text'
            }`}
          >
            <Upload className="w-4 h-4" />
            My Uploads
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`px-6 py-4 text-sm font-bold transition-all border-b-2 flex items-center gap-2 ${
              activeTab === 'settings' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-400 hover:text-gray-600'
            }`}
          >
            <Shield className="w-4 h-4" />
            Profile Settings
          </button>
        </div>

        <motion.div
          layout
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
        >
          <AnimatePresence mode="popLayout">
            {activeTab === 'bookmarks' ? (
              bookmarkedVideos.length > 0 ? (
                bookmarkedVideos.map(video => <VideoCard key={video.id} video={video} />)
              ) : (
                <div className="col-span-full py-20 bg-white rounded-3xl border border-dashed border-gray-200 text-center space-y-4">
                  <Bookmark className="w-12 h-12 text-gray-200 mx-auto" />
                  <p className="text-gray-400 font-medium">No saved tutorials yet.</p>
                </div>
              )
            ) : activeTab === 'history' ? (
              historyVideos.length > 0 ? (
                historyVideos.map(video => <VideoCard key={video.id} video={video} />)
              ) : (
                <div className="col-span-full py-20 bg-white rounded-3xl border border-dashed border-gray-200 text-center space-y-4">
                  <History className="w-12 h-12 text-gray-200 mx-auto" />
                  <p className="text-gray-400 font-medium">Your watch history is empty.</p>
                </div>
              )
            ) : activeTab === 'uploads' ? (
              myUploads.length > 0 ? (
                myUploads.map(video => (
                  <VideoCard 
                    key={video.id} 
                    video={video} 
                    onEdit={handleEditVideo}
                    onDelete={handleDeleteVideo}
                    isManagementMode={true}
                  />
                ))
              ) : (
                <div className="col-span-full py-20 bg-white rounded-3xl border border-dashed border-gray-200 text-center space-y-4">
                  <VideoIcon className="w-12 h-12 text-gray-200 mx-auto" />
                  <p className="text-gray-400 font-medium">You haven't uploaded any videos yet.</p>
                </div>
              )
            ) : (
              <div className="col-span-full bg-white p-10 rounded-3xl border border-gray-100 shadow-sm space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <h3 className="text-lg font-bold text-gray-900 border-b pb-2">Account Information</h3>
                    <div className="space-y-4">
                      <div>
                        <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">Display Name</p>
                        <p className="text-gray-700 font-medium">{user.displayName || 'Not set'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">Email Address</p>
                        <p className="text-gray-700 font-medium">{user.email || 'Not set'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">Phone Number</p>
                        <p className="text-gray-700 font-medium">{user.phoneNumber || profile.phone || 'Not set'}</p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-6">
                    <h3 className="text-lg font-bold text-gray-900 border-b pb-2">Security & Access</h3>
                    <div className="bg-indigo-50 p-6 rounded-2xl border border-indigo-100">
                      <h4 className="text-indigo-700 font-bold mb-2 flex items-center gap-2">
                        <Lock className="w-4 h-4" />
                        Password Management
                      </h4>
                      <p className="text-sm text-indigo-600 leading-relaxed mb-4">
                        If you signed up with a phone number and password, you can reset your password by logging out and using the <strong>"Forgot Password? Use Phone OTP"</strong> option on the login page.
                      </p>
                      <p className="text-xs text-indigo-400 italic">
                        Phone OTP provides a more secure, passwordless way to access your account.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
};

export default UserDashboard;
