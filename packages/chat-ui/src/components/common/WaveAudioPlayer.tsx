import { PauseCircle, PlayCircle } from 'lucide-react';
import { memo, useCallback, useEffect, useRef, useState } from 'react';
import WaveSurfer from 'wavesurfer.js';

import { cn } from '../../lib/utils';

interface Props {
  url: string;
  progressColor?: string;
  waveColor?: string;
  height?: number;
  className?: string;
  style?: React.CSSProperties;
  btnStyle?: React.CSSProperties;
  disable?: boolean;
}

interface CurrentPlayingRef {
  wavesurfer: WaveSurfer | null;
}

// Module-level singleton so only one clip plays at a time across the whole chat.
const currentPlayingRef: CurrentPlayingRef = { wavesurfer: null };

const WaveAudioPlayer = (props: Props) => {
  const wavesurferRef = useRef<WaveSurfer | null>(null);
  const divRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    if (divRef.current) {
      wavesurferRef.current = WaveSurfer.create({
        container: divRef.current,
        progressColor: props.progressColor || '#AC1991',
        waveColor: props.waveColor,
        height: props.height || 50,
        barWidth: 3,
        barHeight: 4,
        barRadius: 3,
        url: props.url,
      });

      wavesurferRef.current.on('interaction', () => {
        if (props.disable) return;
        wavesurferRef.current?.playPause();
      });

      wavesurferRef.current.on('pause', () => {
        setIsPlaying(false);
      });

      wavesurferRef.current.on('play', () => {
        setIsPlaying(true);

        if (currentPlayingRef.wavesurfer && currentPlayingRef.wavesurfer !== wavesurferRef.current) {
          currentPlayingRef.wavesurfer.pause();
        }

        currentPlayingRef.wavesurfer = wavesurferRef.current;
      });
    }

    return () => {
      wavesurferRef.current?.destroy();
    };
  }, [props]);

  const onClick = useCallback(
    (e: { stopPropagation: () => void }) => {
      e.stopPropagation();
      if (props.disable) return;

      if (isPlaying) {
        wavesurferRef.current?.pause();
        setIsPlaying(false);
      } else {
        if (currentPlayingRef.wavesurfer && currentPlayingRef.wavesurfer !== wavesurferRef.current) {
          currentPlayingRef.wavesurfer.pause();
          setIsPlaying(false);
        }

        wavesurferRef.current?.play();
        setIsPlaying(true);
      }
    },
    [isPlaying],
  );

  return (
    <div className={cn('flex items-center justify-center gap-2', props.className, props.disable ? 'cursor-not-allowed opacity-50' : '')} style={props.style}>
      {isPlaying ? <PauseCircle onClick={onClick} /> : <PlayCircle onClick={onClick} />}
      <div ref={divRef} className="flex-grow"></div>
    </div>
  );
};

export default memo(WaveAudioPlayer);
