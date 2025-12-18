import MuxPlayer from "@mux/mux-player-react";

interface MuxVideoPlayerProps {
  playbackId: string;
  title?: string;
  className?: string;
  autoPlay?: boolean;
}

export function MuxVideoPlayer({ 
  playbackId, 
  title, 
  className = "", 
  autoPlay = false 
}: MuxVideoPlayerProps) {
  return (
    <div className={`w-full h-full overflow-hidden rounded-lg bg-black ${className}`}>
      <MuxPlayer
        playbackId={playbackId}
        metadata={{
          video_title: title,
        }}
        streamType="on-demand"
        autoPlay={autoPlay}
        theme="classic"
        className="w-full h-full"
        style={{ height: '100%', width: '100%' }}
      />
    </div>
  );
}
