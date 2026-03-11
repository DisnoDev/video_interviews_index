import { useState } from 'react';

interface Video {
  id: string;
  concept: string;
  title: string;
  author: string;
  thumbnail: string;
}

interface VideoCardProps {
  video: Video;
  isDarkMode: boolean;
}

export function VideoCard({ video, isDarkMode }: VideoCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  return (
    <a
      href="#"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="group block overflow-hidden"
    >
      {/* Thumbnail */}
      <div className="relative w-full aspect-square overflow-hidden bg-neutral-100 dark:bg-neutral-900 mb-2">
        <img
          src={video.thumbnail}
          alt={video.title}
          onLoad={() => setImageLoaded(true)}
          className={`w-full h-full object-cover transition-all duration-700 ${
            imageLoaded ? 'opacity-100' : 'opacity-0'
          } ${
            isHovered ? 'scale-110 opacity-40' : 'scale-100'
          }`}
        />
        
        {/* Title Overlay on Hover */}
        <div 
          className={`absolute inset-0 flex items-center justify-center p-4 transition-opacity duration-500 ${
            isHovered ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <h3 className="text-white text-center text-base md:text-lg leading-tight uppercase tracking-wide">
            {video.title}
          </h3>
        </div>
      </div>

      {/* Title - Emphasized */}
      <h3 className="text-xs md:text-sm text-black dark:text-white mb-1 leading-tight">
        {video.title}
      </h3>

      {/* Author - Secondary */}
      <p className="text-[10px] md:text-xs text-neutral-500 dark:text-neutral-400">
        {video.author}
      </p>
    </a>
  );
}
