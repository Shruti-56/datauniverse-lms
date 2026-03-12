import React from 'react';

interface VideoWithWatermarkProps {
  videoUrl: string;
  title?: string;
  className?: string;
}

/**
 * Simple video player with institute logo watermark.
 * Used for interview recordings and any in-app video that should show the logo.
 */
const VideoWithWatermark: React.FC<VideoWithWatermarkProps> = ({
  videoUrl,
  title = 'Video',
  className = '',
}) => {
  return (
    <div className={`aspect-video rounded-xl overflow-hidden bg-black relative ${className}`}>
      {/* Institute logo watermark */}
      <div className="absolute inset-0 pointer-events-none z-10 flex items-center justify-center">
        <img
          src={import.meta.env.VITE_INSTITUTE_LOGO_URL || '/institute-logo.png'}
          alt=""
          className="max-w-[20%] max-h-[20%] w-auto h-auto object-contain opacity-25 rotate-[-15deg]"
        />
      </div>
      <video
        src={videoUrl}
        controls
        className="w-full h-full relative z-0"
        controlsList="nodownload"
        disablePictureInPicture
        onContextMenu={(e) => e.preventDefault()}
        playsInline
        title={title}
      >
        Your browser does not support the video tag.
      </video>
    </div>
  );
};

export default VideoWithWatermark;
