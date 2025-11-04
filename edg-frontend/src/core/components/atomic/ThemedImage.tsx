// src/core/components/ui/ThemedImage.tsx
import React from "react";
import { useThemedImage, type ThemedImageKey } from "../../hooks/useThemedImage";

interface ThemedImageProps extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, "src"> {
  imageKey: ThemedImageKey;
  alt: string;
  className?: string;
}

const ThemedImage: React.FC<ThemedImageProps> = ({ imageKey, alt, className = "", ...rest }) => {
  const src = useThemedImage(imageKey);

  return <img src={src} alt={alt} className={`transition-opacity duration-200 ${className}`} {...rest} />;
};

export default ThemedImage;
