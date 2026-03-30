import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db, doc, getDoc, collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, increment, updateDoc, setDoc, deleteDoc, arrayUnion, arrayRemove } from '../firebase';
import { Video, Comment, Like } from '../types';
import { useAuth } from '../components/AuthProvider';
import { ThumbsUp, MessageSquare, Share2, Bookmark, User, Clock, Send, Trash2, Loader2, Settings, Check, Pencil, AlertTriangle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { motion, AnimatePresence } from 'motion/react';
import { handleFirestoreError, OperationType } from '../lib/firestoreUtils';

const VideoPlayer: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user, profile, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [video, setVideo] = useState<Video | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isLiked, setIsLiked] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showQualityMenu, setShowQualityMenu] = useState(false);
  const [currentUrl, setCurrentUrl] = useState('');
  const [selectedQuality, setSelectedQuality] = useState('Auto');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [deleteType, setDeleteType] = useState<'video' | 'comment' | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (!id) return;

    // Fetch video
    const fetchVideo = async () => {
      try {
        const videoDoc = await getDoc(doc(db, 'videos', id));
        if (videoDoc.exists()) {
          const videoData = { id: videoDoc.id, ...videoDoc.data() } as Video;
          setVideo(videoData);
          setCurrentUrl(videoData.url);
          
          // Add to watch history if logged in
          if (user) {
            await setDoc(doc(db, 'users', user.uid), {
              watchHistory: arrayUnion({ videoId: id, timestamp: new Date() })
            }, { merge: true });
          }
        } else {
          navigate('/');
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, `videos/${id}`);
      }
      setLoading(false);
    };

    fetchVideo();
// ... (rest of the useEffect remains the same)

    // Fetch comments
    let unsubscribeComments: (() => void) | undefined;
    if (id) {
      const q = query(collection(db, 'videos', id, 'comments'), orderBy('createdAt', 'desc'));
      unsubscribeComments = onSnapshot(q, (snapshot) => {
        setComments(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Comment)));
      }, (error) => {
        // Only log if it's not a permission error on a pending video (which is expected for non-owners)
        if (video?.status === 'approved' || isAdmin) {
          handleFirestoreError(error, OperationType.LIST, `videos/${id}/comments`);
        }
      });
    }

    // Check if liked
    let unsubscribeLike: (() => void) | undefined;
    let unsubscribeUser: (() => void) | undefined;

    if (user) {
      const likeId = `${user.uid}_${id}`;
      unsubscribeLike = onSnapshot(doc(db, 'likes', likeId), (doc) => {
        setIsLiked(doc.exists());
      }, (error) => {
        handleFirestoreError(error, OperationType.GET, `likes/${likeId}`);
      });
      
      // Check if bookmarked
      unsubscribeUser = onSnapshot(doc(db, 'users', user.uid), (doc) => {
        const userData = doc.data();
        setIsBookmarked(userData?.bookmarks?.includes(id || '') || false);
      }, (error) => {
        handleFirestoreError(error, OperationType.GET, `users/${user.uid}`);
      });
    }

    return () => {
      if (unsubscribeComments) unsubscribeComments();
      if (unsubscribeLike) unsubscribeLike();
      if (unsubscribeUser) unsubscribeUser();
    };
  }, [id, user, navigate, video?.status, isAdmin]);

  const handleLike = async () => {
    if (!user || !id) return;
    const likeId = `${user.uid}_${id}`;
    try {
      if (isLiked) {
        await deleteDoc(doc(db, 'likes', likeId));
        await updateDoc(doc(db, 'videos', id), { likesCount: increment(-1) });
      } else {
        await setDoc(doc(db, 'likes', likeId), {
          id: likeId,
          userId: user.uid,
          videoId: id,
          createdAt: serverTimestamp()
        });
        await updateDoc(doc(db, 'videos', id), { likesCount: increment(1) });
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, isLiked ? `likes/${likeId}` : `likes/${likeId}`);
    }
  };

  const handleBookmark = async () => {
    if (!user || !id) return;
    try {
      if (isBookmarked) {
        await updateDoc(doc(db, 'users', user.uid), { bookmarks: arrayRemove(id) });
      } else {
        await updateDoc(doc(db, 'users', user.uid), { bookmarks: arrayUnion(id) });
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}`);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !id || !newComment.trim()) return;

    const commentData = {
      videoId: id,
      userUid: user.uid,
      userName: user.displayName || 'Anonymous',
      userPhoto: user.photoURL || '',
      text: newComment,
      createdAt: serverTimestamp()
    };

    try {
      await addDoc(collection(db, 'videos', id, 'comments'), commentData);
      await updateDoc(doc(db, 'videos', id), { commentsCount: increment(1) });
      setNewComment('');
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `videos/${id}/comments`);
    }
  };

  const handleDeleteVideo = () => {
    if (!video) return;
    setDeleteConfirmId(video.id);
    setDeleteType('video');
  };

  const handleDeleteComment = (commentId: string) => {
    setDeleteConfirmId(commentId);
    setDeleteType('comment');
  };

  const confirmDelete = async () => {
    if (!deleteConfirmId || !deleteType) return;
    
    setIsDeleting(true);
    try {
      if (deleteType === 'video') {
        await deleteDoc(doc(db, 'videos', deleteConfirmId));
        navigate('/');
      } else {
        await deleteDoc(doc(db, 'videos', id!, 'comments', deleteConfirmId));
        await updateDoc(doc(db, 'videos', id!), { commentsCount: increment(-1) });
      }
      setDeleteConfirmId(null);
      setDeleteType(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, deleteType === 'video' ? `videos/${deleteConfirmId}` : `videos/${id}/comments/${deleteConfirmId}`);
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-40 gap-4">
        <Loader2 className="w-12 h-12 text-primary animate-spin" />
        <p className="text-text-muted font-bold">Loading video...</p>
      </div>
    );
  }

  if (!video) return null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
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
                <h3 className="text-2xl font-bold text-gray-900">Delete {deleteType === 'video' ? 'Video' : 'Comment'}?</h3>
                <p className="text-gray-500">
                  {deleteType === 'video' 
                    ? "This action cannot be undone. All comments and likes associated with this video will remain but the video itself will be gone."
                    : "Are you sure you want to remove this comment? This action cannot be undone."}
                </p>
              </div>
              <div className="flex gap-4">
                <button
                  onClick={() => {
                    setDeleteConfirmId(null);
                    setDeleteType(null);
                  }}
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
      <div className="lg:col-span-2 space-y-8">
        {/* Video Player */}
        <div className="relative aspect-video bg-black rounded-[2.5rem] overflow-hidden shadow-2xl ring-1 ring-gray-900/10 group">
          <video
            key={currentUrl}
            src={currentUrl}
            controls
            autoPlay
            className="w-full h-full"
            poster={video.thumbnail}
          />
          
          {/* Quality Selector Overlay */}
          <div className="absolute top-6 right-6 z-10">
            <div className="relative">
              <button
                onClick={() => setShowQualityMenu(!showQualityMenu)}
                className="bg-black/50 backdrop-blur-md text-white p-3 rounded-2xl hover:bg-black/70 transition-all border border-white/20 shadow-xl"
                title="Quality Settings"
              >
                <Settings className={`w-6 h-6 ${showQualityMenu ? 'rotate-90' : ''} transition-transform duration-300`} />
              </button>

              <AnimatePresence>
                {showQualityMenu && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: -10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: -10 }}
                    className="absolute right-0 mt-3 w-48 bg-surface rounded-2xl shadow-2xl border border-gray-100 overflow-hidden py-2 z-20"
                  >
                    <div className="px-4 py-3 text-[10px] font-black text-text-muted uppercase tracking-widest border-b border-gray-50">
                      Quality
                    </div>
                    {[
                      { label: 'Auto', url: video.url },
                      ...(video.qualities || [
                        { label: '1080p', url: video.url },
                        { label: '720p', url: video.url },
                        { label: '360p', url: video.url }
                      ])
                    ].map((q) => (
                      <button
                        key={q.label}
                        onClick={() => {
                          setCurrentUrl(q.url);
                          setSelectedQuality(q.label);
                          setShowQualityMenu(false);
                        }}
                        className="w-full px-4 py-3 text-sm text-left hover:bg-bg flex items-center justify-between group/item transition-colors"
                      >
                        <span className={`font-bold ${selectedQuality === q.label ? 'text-primary' : 'text-text-muted'}`}>
                          {q.label}
                        </span>
                        {selectedQuality === q.label && (
                          <Check className="w-4 h-4 text-primary" />
                        )}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Video Info */}
        <div className="bg-surface p-10 rounded-[2.5rem] shadow-xl border border-gray-100">
          <div className="flex flex-wrap items-center gap-3 mb-6">
            <span className="bg-primary/10 text-primary text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest">
              {video.category}
            </span>
            {video.tags?.map(tag => (
              <span key={tag} className="bg-bg text-text-muted text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest border border-gray-100">
                #{tag}
              </span>
            ))}
          </div>
          <h1 className="text-4xl font-black text-text tracking-tighter mb-6 leading-tight">{video.title}</h1>
          
          <div className="flex flex-wrap items-center justify-between gap-8 py-8 border-y border-gray-50 mb-8">
            <div className="flex items-center gap-5">
              <div className="bg-primary/10 p-4 rounded-[1.25rem]">
                <User className="w-8 h-8 text-primary" />
              </div>
              <div>
                <p className="font-black text-text text-lg tracking-tight">{video.uploaderName || 'Anonymous'}</p>
                <p className="text-xs text-text-muted font-bold flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  {video.createdAt?.toDate ? formatDistanceToNow(video.createdAt.toDate(), { addSuffix: true }) : 'just now'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {(isAdmin || video.uploaderUid === user?.uid) && (
                <>
                  <button
                    onClick={() => navigate(`/edit-video/${video.id}`)}
                    className="flex items-center gap-2 px-6 py-3.5 rounded-2xl font-black text-sm bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200 transition-all shadow-sm"
                  >
                    <Pencil className="w-5 h-5" />
                    <span>Edit</span>
                  </button>
                  <button
                    onClick={handleDeleteVideo}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold bg-red-50 text-red-700 hover:bg-red-100 border border-red-200 transition-all shadow-sm"
                  >
                    <Trash2 className="w-5 h-5" />
                    <span>Delete</span>
                  </button>
                </>
              )}
              <button
                onClick={handleLike}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold transition-all shadow-sm ${
                  isLiked ? 'bg-indigo-600 text-white shadow-indigo-200' : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                <ThumbsUp className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
                <span>{video.likesCount || 0}</span>
              </button>
              <button
                onClick={handleBookmark}
                className={`p-2.5 rounded-xl transition-all shadow-sm ${
                  isBookmarked ? 'bg-amber-500 text-white shadow-amber-200' : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                <Bookmark className={`w-5 h-5 ${isBookmarked ? 'fill-current' : ''}`} />
              </button>
              <button className="p-2.5 rounded-xl bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200 shadow-sm transition-all">
                <Share2 className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="prose prose-indigo max-w-none">
            <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">{video.description}</p>
          </div>
        </div>
      </div>

      {/* Comments Section */}
      <div className="lg:col-span-1 space-y-6">
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 flex flex-col h-full max-h-[800px]">
          <div className="flex items-center gap-2 mb-8">
            <MessageSquare className="w-6 h-6 text-indigo-600" />
            <h2 className="text-xl font-bold text-gray-900">Comments ({comments.length})</h2>
          </div>

          {user ? (
            <form onSubmit={handleAddComment} className="mb-8">
              <div className="relative">
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Share your thoughts..."
                  className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all resize-none h-24"
                />
                <button
                  type="submit"
                  disabled={!newComment.trim()}
                  className="absolute bottom-3 right-3 bg-indigo-600 text-white p-2 rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-indigo-200"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </form>
          ) : (
            <div className="bg-indigo-50 p-6 rounded-2xl text-center mb-8 border border-indigo-100">
              <p className="text-indigo-700 text-sm font-medium mb-3">Login to join the conversation</p>
              <button
                onClick={() => navigate('/login')}
                className="bg-indigo-600 text-white px-6 py-2 rounded-xl text-sm font-bold hover:bg-indigo-700 transition-all shadow-md shadow-indigo-200"
              >
                Login Now
              </button>
            </div>
          )}

          <div className="flex-1 overflow-y-auto space-y-6 pr-2 no-scrollbar">
            <AnimatePresence initial={false}>
              {comments.map((comment) => (
                <motion.div
                  key={comment.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  className="flex gap-4 group"
                >
                  <img
                    src={comment.userPhoto || `https://ui-avatars.com/api/?name=${comment.userName}`}
                    alt={comment.userName}
                    className="w-10 h-10 rounded-xl object-cover shadow-sm ring-1 ring-gray-100"
                    referrerPolicy="no-referrer"
                  />
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-bold text-gray-900">{comment.userName}</p>
                      <div className="flex items-center gap-2">
                        <p className="text-[10px] text-gray-400 font-medium">
                          {comment.createdAt?.toDate ? formatDistanceToNow(comment.createdAt.toDate(), { addSuffix: true }) : 'just now'}
                        </p>
                        {(isAdmin || comment.userUid === user?.uid) && (
                          <button
                            onClick={() => handleDeleteComment(comment.id)}
                            className="p-1 text-gray-300 hover:text-red-500 transition-colors"
                            title="Delete Comment"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 leading-relaxed">{comment.text}</p>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            {comments.length === 0 && (
              <div className="text-center py-10">
                <p className="text-gray-400 text-sm italic">No comments yet. Be the first to share your thoughts!</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoPlayer;
