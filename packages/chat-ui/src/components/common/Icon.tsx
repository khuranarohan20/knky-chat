import React from 'react';

export type IconFolder = 'stand-alone-icons' | 'icons';
export type IconType = 'outlined' | 'filled';

export interface IconProps
  extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, 'src' | 'alt' | 'width' | 'height'> {
  icon: string;
  type?: IconType;
  color?: 'gray' | 'pink' | 'red';
  size?: number;
  iconFolder?: IconFolder;
  /** Prefix for the asset path (host CDN/base); default '' resolves against the host's public/. */
  basePath?: string;
}

/**
 * Ported from the agency app verbatim: icons are SVGs served by the host at
 * `/icons/{icon}-{type}-{color}.svg` or `/stand-alone-icons/{icon}.svg`.
 * Renders identical markup, so the host's existing public assets resolve as-is.
 */
export function Icon({
  icon,
  type = 'outlined',
  color = 'gray',
  size = 24,
  iconFolder = 'icons',
  basePath = '',
  ...rest
}: IconProps): React.ReactElement {
  const src =
    iconFolder === 'stand-alone-icons'
      ? `${basePath}/stand-alone-icons/${icon}.svg`
      : `${basePath}/icons/${icon}-${type}-${color}.svg`;
  return <img src={src} width={size} height={size} alt={`${icon} icon`} {...rest} />;
}
