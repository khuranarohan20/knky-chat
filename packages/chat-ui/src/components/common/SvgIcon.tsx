import React, { memo } from 'react';

/** Circular SVG button wrapper — ported verbatim from the agency SvgIcon. */
function SvgIconBase(props: {
  src: string;
  alt: string;
  size: number;
  className?: string;
  wrapperStyle?: React.CSSProperties;
  imgStyle?: React.CSSProperties;
  onClick?: () => void;
}): React.ReactElement {
  return (
    <div
      className={props.className}
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '0.25em',
        borderRadius: '50%',
        cursor: 'pointer',
        width: props.size,
        height: props.size,
        ...props.wrapperStyle,
      }}
      onClick={props.onClick}
    >
      <img src={props.src} alt={props.alt} className="h-full w-full" style={props.imgStyle} fetchPriority="high" />
    </div>
  );
}

export const SvgIcon = memo(SvgIconBase);
