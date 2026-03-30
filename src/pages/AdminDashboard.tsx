import React, { useEffect, useState } from 'react';
import { useAuth } from '../components/AuthProvider';
import { db, collection, query, where, onSnapshot, updateDoc, doc, deleteDoc, orderBy } from '../firebase';
import { Video, UserProfile } from '../types';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, XCircle, Trash2, ExternalLink, ShieldCheck, Clock, AlertTriangle, Loader2, Pencil, Users, Plus, Mail, Calendar, Shield } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { formatDistanceToNow } from 'date-fns';
import { handleFirestoreError, OperationType } from '../lib/firestoreUtils';

const AdminDashboard: React.FC = () => {
  const { user, profile, isAdmin, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [videos, setVideos] = useState<Video[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'videos' | 'users'>('videos');
  const [bulkSuccess, setBulkSuccess] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (!authLoading && !isAdmin) {
      navigate('/');
      return;
    }

    if (authLoading) return;

    const q = query(collection(db, 'videos'), orderBy('createdAt', 'desc'));
    const unsubscribeVideos = onSnapshot(q, (snapshot) => {
      setVideos(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Video)));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'videos');
    });

    const unsubscribeUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
      setUsers(snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() } as UserProfile)));
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'users');
    });

    return () => {
      unsubscribeVideos();
      unsubscribeUsers();
    };
  }, [authLoading, isAdmin, navigate]);

  const handleStatus = async (videoId: string, status: 'approved' | 'rejected') => {
    try {
      await updateDoc(doc(db, 'videos', videoId), { status });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `videos/${videoId}`);
    }
  };

  const handleBulkApprove = async () => {
    const toApprove = pendingVideos.slice(0, 5);
    if (toApprove.length === 0) return;
    
    setLoading(true);
    try {
      await Promise.all(toApprove.map(video => 
        updateDoc(doc(db, 'videos', video.id), { status: 'approved' })
      ));
      setBulkSuccess(true);
      setTimeout(() => setBulkSuccess(false), 3000);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'videos/bulk');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (videoId: string) => {
    setDeleteConfirmId(videoId);
  };

  const confirmDelete = async () => {
    if (!deleteConfirmId) return;
    
    setIsDeleting(true);
    try {
      await deleteDoc(doc(db, 'videos', deleteConfirmId));
      setDeleteConfirmId(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `videos/${deleteConfirmId}`);
    } finally {
      setIsDeleting(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex flex-col items-center justify-center py-40 gap-4">
        <Loader2 className="w-12 h-12 text-primary animate-spin" />
        <p className="text-text-muted font-bold">Loading admin panel...</p>
      </div>
    );
  }

  const pendingVideos = videos.filter(v => v.status === 'pending');
  const otherVideos = videos.filter(v => v.status !== 'pending');

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
                <p className="text-gray-500">This action cannot be undone. As an admin, you are permanently removing this content from the platform.</p>
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

      <div className="bg-surface p-10 rounded-[2.5rem] shadow-xl border border-gray-100">
        <div className="flex items-center gap-5 mb-12">
          <div className="bg-primary/10 p-5 rounded-[1.5rem]">
            <ShieldCheck className="w-8 h-8 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-text tracking-tighter">Admin Dashboard</h1>
            <p className="text-text-muted font-bold">Manage video approvals and user content.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          <div className="bg-amber-50 p-6 rounded-2xl border border-amber-100">
            <p className="text-amber-600 text-[10px] font-black uppercase tracking-widest mb-1">Pending Review</p>
            <p className="text-4xl font-black text-amber-700">{pendingVideos.length}</p>
          </div>
          <div className="bg-green-50 p-6 rounded-2xl border border-green-100">
            <p className="text-green-600 text-[10px] font-black uppercase tracking-widest mb-1">Approved</p>
            <p className="text-4xl font-black text-green-700">{videos.filter(v => v.status === 'approved').length}</p>
          </div>
          <div className="bg-red-50 p-6 rounded-2xl border border-red-100">
            <p className="text-red-600 text-[10px] font-black uppercase tracking-widest mb-1">Rejected</p>
            <p className="text-4xl font-black text-red-700">{videos.filter(v => v.status === 'rejected').length}</p>
          </div>
          <div className="bg-primary/5 p-6 rounded-2xl border border-primary/10">
            <p className="text-primary text-[10px] font-black uppercase tracking-widest mb-1">Total Users</p>
            <p className="text-4xl font-black text-primary">{users.length}</p>
          </div>
        </div>

        <div className="flex gap-4 mb-8 border-b border-gray-100 pb-6">
          <button
            onClick={() => setActiveTab('videos')}
            className={`px-8 py-3 rounded-2xl font-black text-sm transition-all flex items-center gap-2 ${
              activeTab === 'videos' ? 'bg-primary text-white shadow-xl shadow-primary/20' : 'text-text-muted hover:bg-bg'
            }`}
          >
            <ShieldCheck className="w-5 h-5" />
            Video Management
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`px-8 py-3 rounded-2xl font-black text-sm transition-all flex items-center gap-2 ${
              activeTab === 'users' ? 'bg-primary text-white shadow-xl shadow-primary/20' : 'text-text-muted hover:bg-bg'
            }`}
          >
            <Users className="w-5 h-5" />
            User Management
          </button>
          <div className="flex-1" />
          <button
            onClick={() => navigate('/upload')}
            className="px-8 py-3 bg-primary/10 text-primary rounded-2xl font-black text-sm hover:bg-primary/20 transition-all flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Add New Video
          </button>
        </div>

        {activeTab === 'videos' ? (
          <>
            <section className="space-y-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-2 h-8 bg-amber-500 rounded-full"></div>
              <h2 className="text-2xl font-black text-text tracking-tight">Pending Approvals</h2>
            </div>
            <div className="flex items-center gap-4">
              <AnimatePresence>
                {bulkSuccess && (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="bg-green-50 text-green-700 px-6 py-3 rounded-2xl text-sm font-black flex items-center gap-2"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Approved 5 Videos!
                  </motion.div>
                )}
              </AnimatePresence>
              {pendingVideos.length > 0 && (
                <button
                  onClick={handleBulkApprove}
                  className="bg-green-600 text-white px-6 py-3 rounded-2xl text-sm font-black hover:bg-green-700 transition-all flex items-center gap-2 shadow-xl shadow-green-100"
                >
                  <CheckCircle className="w-4 h-4" />
                  Approve 5 Videos
                </button>
              )}
            </div>
          </div>
          {pendingVideos.length > 0 ? (
            <div className="overflow-hidden bg-bg border border-gray-100 rounded-[2rem]">
              <table className="w-full text-left">
                <thead className="bg-surface text-text-muted text-[10px] font-black uppercase tracking-widest">
                  <tr>
                    <th className="px-8 py-5">Video</th>
                    <th className="px-8 py-5">Uploader</th>
                    <th className="px-6 py-4">Category</th>
                    <th className="px-6 py-4">Date</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {pendingVideos.map((video) => (
                    <tr key={video.id} className="hover:bg-gray-50 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-4">
                          <img src={video.thumbnail} className="w-16 h-10 object-cover rounded-lg shadow-sm" alt="" />
                          <span className="font-bold text-gray-900 line-clamp-1">{video.title}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{video.uploaderName}</td>
                      <td className="px-6 py-4">
                        <span className="bg-gray-100 text-gray-600 text-[10px] font-bold px-2 py-1 rounded uppercase">
                          {video.category}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs text-gray-400">
                        {video.createdAt?.toDate ? formatDistanceToNow(video.createdAt.toDate(), { addSuffix: true }) : 'just now'}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => navigate(`/edit-video/${video.id}`)}
                            className="p-2 bg-amber-100 text-amber-600 rounded-lg hover:bg-amber-200 transition-all"
                            title="Edit"
                          >
                            <Pencil className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleStatus(video.id, 'approved')}
                            className="p-2 bg-green-100 text-green-600 rounded-lg hover:bg-green-200 transition-all"
                            title="Approve"
                          >
                            <CheckCircle className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleStatus(video.id, 'rejected')}
                            className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-all"
                            title="Reject"
                          >
                            <XCircle className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleDelete(video.id)}
                            className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-all"
                            title="Delete"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                          <a
                            href={video.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 bg-indigo-100 text-indigo-600 rounded-lg hover:bg-indigo-200 transition-all"
                            title="Preview"
                          >
                            <ExternalLink className="w-5 h-5" />
                          </a>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="bg-gray-50 p-10 rounded-2xl text-center border border-dashed border-gray-200">
              <p className="text-gray-400 font-medium">No pending videos to review.</p>
            </div>
          )}
        </section>

        <section className="mt-16 space-y-6">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-indigo-500" />
            Manage All Content
          </h2>
          <div className="overflow-hidden bg-white border border-gray-100 rounded-2xl">
            <table className="w-full text-left">
              <thead className="bg-gray-50 text-gray-400 text-[10px] font-bold uppercase tracking-widest">
                <tr>
                  <th className="px-6 py-4">Video</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Stats</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {otherVideos.map((video) => (
                  <tr key={video.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <img src={video.thumbnail} className="w-16 h-10 object-cover rounded-lg shadow-sm" alt="" />
                        <span className="font-bold text-gray-900 line-clamp-1">{video.title}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider ${
                        video.status === 'approved' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {video.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs text-gray-500">
                      {video.likesCount} likes • {video.commentsCount} comments
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => navigate(`/edit-video/${video.id}`)}
                          className="p-2 text-gray-400 hover:text-amber-600 transition-all"
                          title="Edit"
                        >
                          <Pencil className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleDelete(video.id)}
                          className="p-2 text-gray-400 hover:text-red-600 transition-all"
                          title="Delete"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
          </>
        ) : (
          <section className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Users className="w-5 h-5 text-indigo-500" />
                Registered Users
              </h2>
            </div>
            <div className="overflow-hidden bg-white border border-gray-100 rounded-2xl">
              <table className="w-full text-left">
                <thead className="bg-gray-50 text-gray-400 text-[10px] font-bold uppercase tracking-widest">
                  <tr>
                    <th className="px-6 py-4">User</th>
                    <th className="px-6 py-4">Email</th>
                    <th className="px-6 py-4">Role</th>
                    <th className="px-6 py-4">Joined</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {users.map((u) => (
                    <tr key={u.uid} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-4">
                          {u.photoURL ? (
                            <img src={u.photoURL} className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm" alt="" />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold">
                              {u.displayName?.[0] || u.email?.[0]?.toUpperCase() || '?'}
                            </div>
                          )}
                          <span className="font-bold text-gray-900">{u.displayName || 'Anonymous'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Mail className="w-4 h-4 text-gray-400" />
                          {u.email}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {u.role === 'admin' ? (
                            <span className="bg-indigo-100 text-indigo-700 text-[10px] font-bold px-2 py-1 rounded uppercase flex items-center gap-1">
                              <Shield className="w-3 h-3" />
                              Admin
                            </span>
                          ) : (
                            <span className="bg-gray-100 text-gray-600 text-[10px] font-bold px-2 py-1 rounded uppercase">
                              User
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-xs text-gray-400">
                          <Calendar className="w-4 h-4" />
                          {u.createdAt?.toDate ? formatDistanceToNow(u.createdAt.toDate(), { addSuffix: true }) : 'N/A'}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
