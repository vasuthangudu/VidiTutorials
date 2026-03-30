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
        <Loader2 className="w-12 h-12 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-12 pb-20">
      {/* Main Content Area */}
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-surface p-6 sm:p-8 rounded-[2rem] shadow-sm border border-gray-100">
          <div className="flex-1 max-w-xl">
            <h2 className="text-2xl sm:text-3xl font-black text-text mb-2 tracking-tight">
              {user ? `Welcome back, ${user.displayName?.split(' ')[0]}!` : 'Explore Tutorials'}
            </h2>
            <p className="text-text-muted font-medium">
              {user ? 'Continue your learning journey where you left off.' : 'Browse our collection of high-quality educational content.'}
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
            <SearchBar onSearch={setSearchQuery} />
          </div>
        </div>

        <FilterBar selectedCategory={category} onSelectCategory={setCategory} />

        {loading ? (
          <div className="flex flex-col items-center justify-center py-40 gap-4">
            <Loader2 className="w-12 h-12 text-primary animate-spin" />
            <p className="text-text-muted font-bold">Loading tutorials...</p>
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
          <div className="flex flex-col items-center justify-center py-40 gap-6 bg-surface rounded-[2.5rem] border border-gray-100 shadow-sm">
            <div className="bg-bg p-8 rounded-full border border-gray-100">
              <VideoIcon className="w-16 h-16 text-text-muted" />
            </div>
            <div className="text-center">
              <h2 className="text-2xl font-black text-text mb-2 tracking-tight">No tutorials found</h2>
              <p className="text-text-muted font-medium">Try adjusting your search or filters to find what you're looking for.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;
