import React from 'react';
import { Link } from 'react-router-dom';
import { Video } from '../types';
import { motion } from 'motion/react';
import { Play, Clock, ThumbsUp, MessageSquare, User, Pencil, Trash2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface VideoCardProps {
  video: Video;
  onEdit?: (video: Video) => void;
  onDelete?: (videoId: string) => void;
  showActionsAlways?: boolean;
  isManagementMode?: boolean;
}

const VideoCard: React.FC<VideoCardProps> = ({ 
  video, 
  onEdit, 
  onDelete, 
  showActionsAlways = false,
  isManagementMode = false
}) => {
  const formattedDate = video.createdAt?.toDate ? 
    formatDistanceToNow(video.createdAt.toDate(), { addSuffix: true }) : 
    'just now';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className="group bg-surface rounded-[2rem] overflow-hidden shadow-sm hover:shadow-2xl hover:shadow-primary/10 transition-all border border-gray-100 flex flex-col h-full relative"
    >
      {/* Status Badge for Management Mode */}
      {isManagementMode && video.status && (
        <div className="absolute top-3 right-3 z-20">
          <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider shadow-sm border ${
            video.status === 'approved' ? 'bg-green-50 text-green-700 border-green-100' : 
            video.status === 'pending' ? 'bg-amber-50 text-amber-700 border-amber-100' : 
            'bg-red-50 text-red-700 border-red-100'
          }`}>
            {video.status}
          </span>
        </div>
      )}

      {(onEdit || onDelete) && !isManagementMode && (
        <div className={`absolute top-3 left-3 z-20 flex gap-2 transition-opacity ${showActionsAlways ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
          {onEdit && (
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onEdit(video);
              }}
              className="p-2 bg-surface/90 backdrop-blur-sm rounded-xl shadow-sm hover:bg-primary hover:text-white transition-all text-text-muted"
              title="Edit Video"
            >
              <Pencil className="w-4 h-4" />
            </button>
          )}
          {onDelete && (
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onDelete(video.id);
              }}
              className="p-2 bg-surface/90 backdrop-blur-sm rounded-xl shadow-sm hover:bg-red-500 hover:text-white transition-all text-text-muted"
              title="Delete Video"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      )}
      <Link to={`/video/${video.id}`} className="relative aspect-video overflow-hidden">
        <img
          src={video.thumbnail || `https://picsum.photos/seed/${video.id}/640/360`}
          alt={video.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-black/10 group-hover:bg-black/30 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
          <div className="bg-white/30 backdrop-blur-xl p-5 rounded-full transform scale-90 group-hover:scale-100 transition-transform">
            <Play className="w-8 h-8 text-white fill-current" />
          </div>
        </div>
        <div className="absolute bottom-4 right-4 glass text-text text-[10px] font-black px-3 py-1.5 rounded-full uppercase tracking-widest">
          {video.category}
        </div>
      </Link>

      <div className="p-5 flex flex-col flex-1">
        <div className="flex items-start justify-between gap-2 mb-3">
          <Link to={`/video/${video.id}`} className="text-xl font-black text-text line-clamp-2 hover:text-primary transition-colors leading-[1.2] tracking-tight">
            {video.title}
          </Link>
        </div>

        <div className="flex items-center gap-3 text-xs text-text-muted mb-6">
          <div className="flex items-center gap-1.5">
            <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="w-3 h-3 text-primary" />
            </div>
            <span className="font-bold">{video.uploaderName || 'Anonymous'}</span>
          </div>
          <span className="opacity-30">•</span>
          <div className="flex items-center gap-1.5">
            <Clock className="w-3 h-3" />
            <span className="font-medium">{formattedDate}</span>
          </div>
        </div>

        <div className="mt-auto pt-5 border-t border-gray-50 flex items-center justify-between text-xs font-bold text-text-muted">
          {isManagementMode ? (
            <div className="flex items-center gap-3 w-full">
              {onEdit && (
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onEdit(video);
                  }}
                  className="flex-1 flex items-center justify-center gap-2 py-3 bg-primary/5 text-primary rounded-2xl hover:bg-primary hover:text-white transition-all border border-primary/10 font-black"
                >
                  <Pencil className="w-3.5 h-3.5" />
                  <span>Edit</span>
                </button>
              )}
              {onDelete && (
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onDelete(video.id);
                  }}
                  className="flex-1 flex items-center justify-center gap-2 py-3 bg-red-50 text-red-500 rounded-2xl hover:bg-red-500 hover:text-white transition-all border border-red-100 font-black"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete</span>
                </button>
              )}
            </div>
          ) : (
            <>
              <div className="flex items-center gap-5">
                <div className="flex items-center gap-2">
                  <ThumbsUp className="w-4 h-4 text-primary" />
                  <span>{video.likesCount || 0}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-purple-500" />
                  <span>{video.commentsCount || 0}</span>
                </div>
              </div>
              <Link to={`/video/${video.id}`} className="text-primary hover:underline font-black tracking-tight">
                Watch Now
              </Link>
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default VideoCard;
