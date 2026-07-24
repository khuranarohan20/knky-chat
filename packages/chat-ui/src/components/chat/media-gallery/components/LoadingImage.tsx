import React, { memo, useState } from 'react';

/** Image with a shimmer placeholder until loaded — ported from the agency LoadingImage. */
const LoadingImage = memo(function LoadingImage({
  src,
  alt,
  className,
  style,
  height,
  width,
  onClick,
  ...props
}: React.ImgHTMLAttributes<HTMLImageElement> & { src: string; height?: number | string; width?: number | string }) {
  const [loaded, setLoaded] = useState(false);
  return (
    <div className="relative" style={style}>
      {!loaded ? <div className="absolute inset-0 w-full animate-pulse bg-gray-200" style={{ height: height || '100%' }} /> : null}
      <img
        {...props}
        src={src}
        alt={alt}
        height={height}
        width={width}
        onClick={onClick}
        onLoad={() => setLoaded(true)}
        style={{ ...style, height, width }}
        className={`transition-opacity duration-300 ease-in-out ${loaded ? 'opacity-100' : 'opacity-0'} ${className || ''}`}
      />
    </div>
  );
});

export default LoadingImage;
