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
      className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all border border-gray-100 flex flex-col h-full relative"
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
              className="p-2 bg-white/90 backdrop-blur-sm rounded-lg shadow-sm hover:bg-indigo-600 hover:text-white transition-all text-gray-600"
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
              className="p-2 bg-white/90 backdrop-blur-sm rounded-lg shadow-sm hover:bg-red-600 hover:text-white transition-all text-gray-600"
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
        <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
          <div className="bg-white/20 backdrop-blur-md p-4 rounded-full">
            <Play className="w-8 h-8 text-white fill-current" />
          </div>
        </div>
        <div className="absolute bottom-3 right-3 bg-black/60 backdrop-blur-md text-white text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider">
          {video.category}
        </div>
      </Link>

      <div className="p-5 flex flex-col flex-1">
        <div className="flex items-start justify-between gap-2 mb-2">
          <Link to={`/video/${video.id}`} className="text-lg font-bold text-gray-900 line-clamp-2 hover:text-indigo-600 transition-colors leading-tight">
            {video.title}
          </Link>
        </div>

        <div className="flex items-center gap-2 text-xs text-gray-500 mb-4">
          <div className="flex items-center gap-1">
            <User className="w-3 h-3" />
            <span className="font-medium">{video.uploaderName || 'Anonymous'}</span>
          </div>
          <span>•</span>
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            <span>{formattedDate}</span>
          </div>
        </div>

        <div className="mt-auto pt-4 border-t border-gray-50 flex items-center justify-between text-xs font-semibold text-gray-400">
          {isManagementMode ? (
            <div className="flex items-center gap-2 w-full">
              {onEdit && (
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onEdit(video);
                  }}
                  className="flex-1 flex items-center justify-center gap-2 py-2 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-600 hover:text-white transition-all border border-indigo-100"
                >
                  <Pencil className="w-3 h-3" />
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
                  className="flex-1 flex items-center justify-center gap-2 py-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-600 hover:text-white transition-all border border-red-100"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Delete</span>
                </button>
              )}
            </div>
          ) : (
            <>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5">
                  <ThumbsUp className="w-4 h-4" />
                  <span>{video.likesCount || 0}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <MessageSquare className="w-4 h-4" />
                  <span>{video.commentsCount || 0}</span>
                </div>
              </div>
              <Link to={`/video/${video.id}`} className="text-indigo-600 hover:underline">
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
