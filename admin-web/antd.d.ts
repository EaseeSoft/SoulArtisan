// Fix React 19 + antd 5.x type compatibility issues
// This file resolves JSX element type errors for antd components

import type { CardProps, ImageProps, UploadProps, UploadFile } from 'antd';
import type { FC, ComponentType } from 'react';

declare module 'antd' {
  const Card: FC<CardProps>;
  const Image: FC<ImageProps>;
}

declare module 'antd/es/upload' {
  interface UploadProps {
    capture?: boolean | 'user' | 'environment';
  }

  interface UploadFile {
    'aria-label'?: string;
    'aria-labelledby'?: string;
  }
}
