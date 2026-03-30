import React, { useState } from 'react';
import { useAuth } from '../components/AuthProvider';
import { db, collection, doc, setDoc, serverTimestamp } from '../firebase';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Upload, FileVideo, CheckCircle, AlertCircle, Loader2, Image as ImageIcon, Tag, LayoutGrid } from 'lucide-react';
import { handleFirestoreError, OperationType } from '../lib/firestoreUtils';

const CATEGORIES = [
  'Development',
  'Design',
  'Marketing',
  'Business',
  'Photography',
  'Music',
  'Cooking',
  'Fitness',
  'Other'
];

const UploadVideo: React.FC = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    url: '',
    thumbnail: '',
    category: 'Development',
    tags: '',
    q1080: '',
    q720: '',
    q360: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return navigate('/login');

    setLoading(true);
    setError(null);

    try {
      const newVideoRef = doc(collection(db, 'videos'));
      
      const qualities = [];
      if (formData.q1080) qualities.push({ label: '1080p', url: formData.q1080 });
      if (formData.q720) qualities.push({ label: '720p', url: formData.q720 });
      if (formData.q360) qualities.push({ label: '360p', url: formData.q360 });

      const videoData = {
        id: newVideoRef.id,
        title: formData.title,
        description: formData.description,
        url: formData.url,
        qualities: qualities.length > 0 ? qualities : null,
        thumbnail: formData.thumbnail,
        category: formData.category,
        tags: formData.tags.split(',').map(t => t.trim()).filter(t => t !== ''),
        status: 'pending',
        uploaderUid: user.uid,
        uploaderName: user.displayName || 'Anonymous',
        createdAt: serverTimestamp(),
        likesCount: 0,
        commentsCount: 0,
      };

      // Remove null qualities if empty
      if (!videoData.qualities) delete videoData.qualities;

      try {
        await setDoc(newVideoRef, videoData);
      } catch (err: any) {
        handleFirestoreError(err, OperationType.CREATE, `videos/${newVideoRef.id}`);
      }

      setSuccess(true);
      setTimeout(() => navigate('/'), 2000);
    } catch (err: any) {
      // If it's the JSON error from handleFirestoreError, parse it for a better message
      try {
        const parsedError = JSON.parse(err.message);
        setError(`Permission Denied: ${parsedError.error}. Please check if you are logged in and the data is valid.`);
      } catch {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center py-40 gap-6">
        <AlertCircle className="w-16 h-16 text-amber-500" />
        <h2 className="text-2xl font-black text-text tracking-tight">Login Required</h2>
        <p className="text-text-muted font-medium">You must be logged in to upload tutorials.</p>
        <button
          onClick={() => navigate('/login')}
          className="bg-primary text-white px-10 py-4 rounded-2xl font-black hover:bg-primary-dark transition-all shadow-xl shadow-primary/20"
        >
          Login Now
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-surface p-10 rounded-[2.5rem] shadow-xl border border-gray-100"
      >
        <div className="flex items-center gap-5 mb-12">
          <div className="bg-primary/10 p-5 rounded-[1.5rem]">
            <Upload className="w-8 h-8 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-text tracking-tighter">Upload Tutorial</h1>
            <p className="text-text-muted font-bold">Share your knowledge with the community.</p>
          </div>
        </div>

        {success ? (
          <div className="flex flex-col items-center justify-center py-20 gap-6 text-center">
            <div className="bg-green-50 p-8 rounded-full">
              <CheckCircle className="w-16 h-16 text-green-500" />
            </div>
            <h2 className="text-3xl font-black text-text tracking-tight">Upload Successful!</h2>
            <p className="text-text-muted max-w-md font-medium">Your video has been submitted for review. You'll be redirected to the home page shortly.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div>
                  <label className="flex items-center gap-2 text-xs font-black text-text-muted uppercase tracking-widest mb-3">
                    <FileVideo className="w-4 h-4 text-primary" />
                    Tutorial Title
                  </label>
                  <input
                    type="text"
                    name="title"
                    required
                    value={formData.title}
                    onChange={handleChange}
                    placeholder="e.g. Advanced React Patterns"
                    className="w-full p-4 bg-bg border border-gray-100 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium"
                  />
                </div>

                <div>
                  <label className="flex items-center gap-2 text-xs font-black text-text-muted uppercase tracking-widest mb-3">
                    <LayoutGrid className="w-4 h-4 text-primary" />
                    Category
                  </label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    className="w-full p-4 bg-bg border border-gray-100 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all appearance-none cursor-pointer font-medium"
                  >
                    {CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="flex items-center gap-2 text-xs font-black text-text-muted uppercase tracking-widest mb-3">
                    <Tag className="w-4 h-4 text-primary" />
                    Tags (comma separated)
                  </label>
                  <input
                    type="text"
                    name="tags"
                    value={formData.tags}
                    onChange={handleChange}
                    placeholder="e.g. react, hooks, performance"
                    className="w-full p-4 bg-bg border border-gray-100 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium"
                  />
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="flex items-center gap-2 text-xs font-black text-text-muted uppercase tracking-widest mb-3">
                    <Upload className="w-4 h-4 text-primary" />
                    Video URL (MP4)
                  </label>
                  <input
                    type="url"
                    name="url"
                    required
                    value={formData.url}
                    onChange={handleChange}
                    placeholder="https://example.com/video.mp4"
                    className="w-full p-4 bg-bg border border-gray-100 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium"
                  />
                </div>

                <div>
                  <label className="flex items-center gap-2 text-xs font-black text-text-muted uppercase tracking-widest mb-3">
                    <ImageIcon className="w-4 h-4 text-primary" />
                    Thumbnail URL (Image)
                  </label>
                  <input
                    type="url"
                    name="thumbnail"
                    value={formData.thumbnail}
                    onChange={handleChange}
                    placeholder="https://example.com/image.jpg"
                    className="w-full p-4 bg-bg border border-gray-100 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium"
                  />
                </div>

                <div>
                  <label className="flex items-center gap-2 text-xs font-black text-text-muted uppercase tracking-widest mb-3">
                    Description
                  </label>
                  <textarea
                    name="description"
                    rows={4}
                    value={formData.description}
                    onChange={handleChange}
                    placeholder="What will students learn in this tutorial?"
                    className="w-full p-4 bg-bg border border-gray-100 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all resize-none font-medium"
                  />
                </div>

                <div className="space-y-4 pt-6 border-t border-gray-50">
                  <h3 className="text-xs font-black text-text uppercase tracking-widest">Additional Qualities (Optional)</h3>
                  <div className="grid grid-cols-1 gap-4">
                    <input
                      type="url"
                      name="q1080"
                      value={formData.q1080}
                      onChange={handleChange}
                      placeholder="1080p URL"
                      className="w-full p-3.5 bg-bg border border-gray-100 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium"
                    />
                    <input
                      type="url"
                      name="q720"
                      value={formData.q720}
                      onChange={handleChange}
                      placeholder="720p URL"
                      className="w-full p-3.5 bg-bg border border-gray-100 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium"
                    />
                    <input
                      type="url"
                      name="q360"
                      value={formData.q360}
                      onChange={handleChange}
                      placeholder="360p URL"
                      className="w-full p-3.5 bg-bg border border-gray-100 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium"
                    />
                  </div>
                </div>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 text-red-600 p-4 rounded-2xl text-sm flex items-center gap-3 border border-red-100">
                <AlertCircle className="w-5 h-5" />
                {error}
              </div>
            )}

            <div className="pt-6">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-primary text-white py-5 rounded-2xl font-black text-lg hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-xl shadow-primary/20 flex items-center justify-center gap-3"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-6 h-6 animate-spin" />
                    <span>Uploading...</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-6 h-6" />
                    <span>Submit for Review</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </motion.div>
    </div>
  );
};

export default UploadVideo;
