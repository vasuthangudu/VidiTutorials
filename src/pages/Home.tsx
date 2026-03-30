import React, { useEffect, useState } from 'react';
import { db, collection, query, where, orderBy, onSnapshot } from '../firebase';
import { Video } from '../types';
import VideoCard from '../components/VideoCard';
import FilterBar from '../components/FilterBar';
import SearchBar from '../components/SearchBar';
import { motion, AnimatePresence } from 'motion/react';
import { Loader2, Video as VideoIcon, Play, ArrowRight, Sparkles, GraduationCap, Users } from 'lucide-react';
import { handleFirestoreError, OperationType } from '../lib/firestoreUtils';
import { useAuth } from '../components/AuthProvider';
import { useNavigate } from 'react-router-dom';

const Home: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    let q = query(
      collection(db, 'videos'),
      where('status', '==', 'approved'),
      orderBy('createdAt', 'desc')
    );

    if (category) {
      q = query(q, where('category', '==', category));
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const videoData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Video));
      setVideos(videoData);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'videos');
    });

    return () => unsubscribe();
  }, [category]);

  const filteredVideos = videos.filter(v => 
    v.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    v.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    v.tags?.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  if (authLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-40 gap-4">
        <Loader2 className="w-12 h-12 text-indigo-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-12 pb-20">
      {/* Hero Section for Guests */}
      {!user && (
        <section className="relative overflow-hidden bg-white rounded-[2.5rem] border border-gray-100 shadow-xl shadow-indigo-100/20">
          <div className="absolute top-0 right-0 -mt-20 -mr-20 w-96 h-96 bg-indigo-50 rounded-full blur-3xl opacity-50" />
          <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-96 h-96 bg-purple-50 rounded-full blur-3xl opacity-50" />
          
          <div className="relative px-8 py-20 md:py-32 text-center max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-50 text-indigo-600 text-xs font-bold uppercase tracking-wider mb-8"
            >
              <Sparkles className="w-4 h-4" />
              The Future of Learning
            </motion.div>
            
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-5xl md:text-7xl font-black text-gray-900 mb-8 leading-[1.1] tracking-tight"
            >
              Master Any Skill with <span className="text-indigo-600">Expert Tutorials</span>
            </motion.h1>
            
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-lg md:text-xl text-gray-500 mb-12 max-w-2xl mx-auto leading-relaxed"
            >
              Join thousands of learners and creators in the most advanced video tutorial platform. 
              High-quality content, community-driven, and completely free.
            </motion.p>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4"
            >
              <button
                onClick={() => navigate('/login')}
                className="w-full sm:w-auto bg-indigo-600 text-white px-8 py-4 rounded-2xl font-bold text-lg hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-200 flex items-center justify-center gap-2 group"
              >
                Get Started Now
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
              <button className="w-full sm:w-auto bg-white text-gray-600 px-8 py-4 rounded-2xl font-bold text-lg hover:bg-gray-50 transition-all border border-gray-200 flex items-center justify-center gap-2">
                <Play className="w-5 h-5 fill-current" />
                Watch Demo
              </button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="grid grid-cols-3 gap-8 mt-20 pt-20 border-t border-gray-50"
            >
              <div className="text-center">
                <div className="bg-indigo-50 w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <GraduationCap className="w-6 h-6 text-indigo-600" />
                </div>
                <p className="text-2xl font-black text-gray-900">500+</p>
                <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Courses</p>
              </div>
              <div className="text-center">
                <div className="bg-purple-50 w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Users className="w-6 h-6 text-purple-600" />
                </div>
                <p className="text-2xl font-black text-gray-900">10k+</p>
                <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Students</p>
              </div>
              <div className="text-center">
                <div className="bg-amber-50 w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Sparkles className="w-6 h-6 text-amber-600" />
                </div>
                <p className="text-2xl font-black text-gray-900">4.9/5</p>
                <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Rating</p>
              </div>
            </motion.div>
          </div>
        </section>
      )}

      {/* Main Content Area */}
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100">
          <div className="flex-1 max-w-xl">
            <h2 className="text-3xl font-black text-gray-900 mb-2 tracking-tight">
              {user ? `Welcome back, ${user.displayName?.split(' ')[0]}!` : 'Explore Tutorials'}
            </h2>
            <p className="text-gray-500 font-medium">
              {user ? 'Continue your learning journey where you left off.' : 'Browse our collection of high-quality educational content.'}
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
            <SearchBar onSearch={setSearchQuery} />
          </div>
        </div>

        <FilterBar selectedCategory={category} onSelectCategory={setCategory} />

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
            <p className="text-gray-500 font-medium">Loading tutorials...</p>
          </div>
        ) : filteredVideos.length > 0 ? (
          <motion.div 
            layout
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8"
          >
            <AnimatePresence mode="popLayout">
              {filteredVideos.map((video) => (
                <VideoCard key={video.id} video={video} />
              ))}
            </AnimatePresence>
          </motion.div>
        ) : (
          <div className="flex flex-col items-center justify-center py-32 gap-6 bg-white rounded-[2.5rem] border-2 border-dashed border-gray-100">
            <div className="bg-gray-50 p-6 rounded-full">
              <VideoIcon className="w-16 h-16 text-gray-300" />
            </div>
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">No tutorials found</h2>
              <p className="text-gray-500">Try adjusting your search or filters to find what you're looking for.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;
