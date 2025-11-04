// src/core/components/ui/skeleton/Skeleton.tsx
import React from "react";
import { cn } from "../../../utils";

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Classi CSS per definire dimensioni, forma, etc. */
  className?: string;
}

/**
 * Skeleton - Un componente segnaposto per indicare il caricamento di contenuti.
 * Usa l'animazione pulse di Tailwind e un colore di sfondo tematico.
 * La forma e le dimensioni sono controllate via className.
 */
export const Skeleton: React.FC<SkeletonProps> = ({ className, ...props }) => {
  return <div className={cn("animate-pulse rounded-md bg-bg-secondary", className)} {...props} />;
};

export default Skeleton;
