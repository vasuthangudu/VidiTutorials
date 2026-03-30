import React, { useState, useEffect } from 'react';
import { useAuth } from '../components/AuthProvider';
import { db, doc, getDoc, updateDoc, serverTimestamp } from '../firebase';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'motion/react';
import { Save, FileVideo, CheckCircle, AlertCircle, Loader2, Image as ImageIcon, Tag, LayoutGrid, ArrowLeft, Upload } from 'lucide-react';
import { handleFirestoreError, OperationType } from '../lib/firestoreUtils';
import { Video } from '../types';

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

const EditVideo: React.FC = () => {
  const { user, profile, isAdmin } = useAuth();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
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

  useEffect(() => {
    const fetchVideo = async () => {
      if (!id) return;
      try {
        const videoDoc = await getDoc(doc(db, 'videos', id));
        if (videoDoc.exists()) {
          const data = videoDoc.data() as Video;
          
          // Check permissions: owner or admin
          if (!isAdmin && data.uploaderUid !== user?.uid) {
            setError('You do not have permission to edit this video.');
            setLoading(false);
            return;
          }

          setFormData({
            title: data.title,
            description: data.description || '',
            url: data.url,
            thumbnail: data.thumbnail || '',
            category: data.category,
            tags: data.tags?.join(', ') || '',
            q1080: data.qualities?.find(q => q.label === '1080p')?.url || '',
            q720: data.qualities?.find(q => q.label === '720p')?.url || '',
            q360: data.qualities?.find(q => q.label === '360p')?.url || '',
          });
        } else {
          setError('Video not found.');
        }
      } catch (err: any) {
        setError('Failed to fetch video details.');
      } finally {
        setLoading(false);
      }
    };

    if (user) fetchVideo();
  }, [id, user, isAdmin]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !id) return;

    setSaving(true);
    setError(null);

    try {
      const qualities = [];
      if (formData.q1080) qualities.push({ label: '1080p', url: formData.q1080 });
      if (formData.q720) qualities.push({ label: '720p', url: formData.q720 });
      if (formData.q360) qualities.push({ label: '360p', url: formData.q360 });

      const updateData: any = {
        title: formData.title,
        description: formData.description,
        url: formData.url,
        qualities: qualities.length > 0 ? qualities : null,
        thumbnail: formData.thumbnail,
        category: formData.category,
        tags: formData.tags.split(',').map(t => t.trim()).filter(t => t !== ''),
        updatedAt: serverTimestamp(),
      };

      if (!updateData.qualities) delete updateData.qualities;

      try {
        await updateDoc(doc(db, 'videos', id), updateData);
      } catch (err: any) {
        handleFirestoreError(err, OperationType.UPDATE, `videos/${id}`);
      }

      setSuccess(true);
      setTimeout(() => navigate(-1), 2000);
    } catch (err: any) {
      try {
        const parsedError = JSON.parse(err.message);
        setError(`Permission Denied: ${parsedError.error}`);
      } catch {
        setError(err.message);
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-40 gap-4">
        <Loader2 className="w-12 h-12 text-indigo-600 animate-spin" />
        <p className="text-gray-500 font-medium">Loading video details...</p>
      </div>
    );
  }

  if (error && !formData.title) {
    return (
      <div className="max-w-2xl mx-auto py-20 text-center space-y-6">
        <AlertCircle className="w-16 h-16 text-red-500 mx-auto" />
        <h2 className="text-2xl font-bold text-gray-900">{error}</h2>
        <button
          onClick={() => navigate(-1)}
          className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-indigo-700 transition-all"
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-gray-500 hover:text-indigo-600 font-bold mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Dashboard
      </button>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white p-10 rounded-3xl shadow-xl border border-gray-100"
      >
        <div className="flex items-center gap-4 mb-10">
          <div className="bg-indigo-100 p-4 rounded-2xl">
            <FileVideo className="w-8 h-8 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Edit Tutorial</h1>
            <p className="text-gray-500 font-medium">Update the details of your tutorial.</p>
          </div>
        </div>

        {success ? (
          <div className="flex flex-col items-center justify-center py-20 gap-6 text-center">
            <div className="bg-green-100 p-6 rounded-full">
              <CheckCircle className="w-16 h-16 text-green-600" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900">Update Successful!</h2>
            <p className="text-gray-500 max-w-md">Your changes have been saved. Redirecting you back...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div>
                  <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2">
                    <FileVideo className="w-4 h-4 text-indigo-500" />
                    Tutorial Title
                  </label>
                  <input
                    type="text"
                    name="title"
                    required
                    value={formData.title}
                    onChange={handleChange}
                    className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                  />
                </div>

                <div>
                  <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2">
                    <LayoutGrid className="w-4 h-4 text-indigo-500" />
                    Category
                  </label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all appearance-none cursor-pointer"
                  >
                    {CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2">
                    <Tag className="w-4 h-4 text-indigo-500" />
                    Tags (comma separated)
                  </label>
                  <input
                    type="text"
                    name="tags"
                    value={formData.tags}
                    onChange={handleChange}
                    className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                  />
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2">
                    <Upload className="w-4 h-4 text-indigo-500" />
                    Video URL (MP4)
                  </label>
                  <input
                    type="url"
                    name="url"
                    required
                    value={formData.url}
                    onChange={handleChange}
                    className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                  />
                </div>

                <div>
                  <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2">
                    <ImageIcon className="w-4 h-4 text-indigo-500" />
                    Thumbnail URL (Image)
                  </label>
                  <input
                    type="url"
                    name="thumbnail"
                    value={formData.thumbnail}
                    onChange={handleChange}
                    className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                  />
                </div>

                <div>
                  <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    name="description"
                    rows={4}
                    value={formData.description}
                    onChange={handleChange}
                    className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all resize-none"
                  />
                </div>

                <div className="space-y-4 pt-4 border-t border-gray-100">
                  <h3 className="text-sm font-bold text-gray-900">Additional Qualities (Optional)</h3>
                  <div className="grid grid-cols-1 gap-4">
                    <input
                      type="url"
                      name="q1080"
                      value={formData.q1080}
                      onChange={handleChange}
                      placeholder="1080p URL"
                      className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                    />
                    <input
                      type="url"
                      name="q720"
                      value={formData.q720}
                      onChange={handleChange}
                      placeholder="720p URL"
                      className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                    />
                    <input
                      type="url"
                      name="q360"
                      value={formData.q360}
                      onChange={handleChange}
                      placeholder="360p URL"
                      className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
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
                disabled={saving}
                className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-bold text-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-xl shadow-indigo-200 flex items-center justify-center gap-3"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-6 h-6 animate-spin" />
                    <span>Saving Changes...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-6 h-6" />
                    <span>Save Changes</span>
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

export default EditVideo;
