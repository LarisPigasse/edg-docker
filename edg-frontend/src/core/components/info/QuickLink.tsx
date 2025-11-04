/**
 * QuickLink Component
 * 
 * Displays quick access links with icons and descriptions
 * 
 * Features:
 * - Internal and external links
 * - Icon support with Lucide icons
 * - Badge indicators (new, updated, beta)
 * - Various display sizes
 * - Hover effects and animations
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { ExternalLink, ArrowRight } from 'lucide-react';
import { ThemedText, ThemedSurface } from '../atomic';
import { Badge } from '../ui';
import { iconMap } from '../../utils';

interface QuickLinkProps {
  /**
   * Link title
   */
  title: string;
  
  /**
   * Link description (optional)
   */
  description?: string;
  
  /**
   * Link URL (internal or external)
   */
  href: string;
  
  /**
   * Icon name from iconMap
   */
  icon?: keyof typeof iconMap;
  
  /**
   * Badge indicator
   */
  badge?: {
    text: string;
    variant?: 'default' | 'success' | 'warning' | 'error' | 'info';
  };
  
  /**
   * Display size
   */
  size?: 'sm' | 'md' | 'lg';
  
  /**
   * Display variant
   */
  variant?: 'card' | 'list' | 'minimal';
  
  /**
   * Open external links in new tab
   */
  openInNewTab?: boolean;
  
  /**
   * Additional CSS classes
   */
  className?: string;
  
  /**
   * Click handler
   */
  onClick?: () => void;
}

export const QuickLink: React.FC<QuickLinkProps> = ({
  title,
  description,
  href,
  icon,
  badge,
  size = 'md',
  variant = 'card',
  openInNewTab = false,
  className = '',
  onClick,
}) => {
  // Check if link is external
  const isExternal = href.startsWith('http') || href.startsWith('mailto:');
  
  // Determine if should open in new tab
  const shouldOpenInNewTab = openInNewTab || isExternal;
  
  // Get icon component
  const IconComponent = icon ? iconMap[icon] : null;
  
  // Size configurations
  const sizeConfig = {
    sm: {
      padding: 'p-3',
      iconSize: 'w-4 h-4',
      titleSize: 'text-sm',
      descriptionSize: 'text-xs',
      gap: 'gap-2',
    },
    md: {
      padding: 'p-4',
      iconSize: 'w-5 h-5',
      titleSize: 'text-base',
      descriptionSize: 'text-sm',
      gap: 'gap-3',
    },
    lg: {
      padding: 'p-6',
      iconSize: 'w-6 h-6',
      titleSize: 'text-lg',
      descriptionSize: 'text-base',
      gap: 'gap-4',
    },
  };
  
  const config = sizeConfig[size];
  
  // Render content
  const renderContent = () => (
    <>
      {/* Icon */}
      {IconComponent && (
        <div className="flex-shrink-0">
          <IconComponent className={`${config.iconSize} text-text-primary`} />
        </div>
      )}
      
      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <ThemedText 
            variant="primary" 
            className={`font-medium ${config.titleSize} truncate`}
          >
            {title}
          </ThemedText>
          
          {badge && (
            <Badge 
              variant={badge.variant || 'default'} 
              size="sm"
            >
              {badge.text}
            </Badge>
          )}
        </div>
        
        {description && (
          <ThemedText 
            variant="secondary" 
            className={`${config.descriptionSize} line-clamp-2`}
          >
            {description}
          </ThemedText>
        )}
      </div>
      
      {/* Arrow indicator */}
      <div className="flex-shrink-0 transition-transform group-hover:translate-x-1">
        {isExternal ? (
          <ExternalLink className="w-4 h-4 text-text-secondary" />
        ) : (
          <ArrowRight className="w-4 h-4 text-text-secondary" />
        )}
      </div>
    </>
  );
  
  // Base classes
  const baseClasses = `
    group flex items-center ${config.gap} ${config.padding} 
    transition-all duration-200 ease-in-out
    hover:scale-[1.02] focus:scale-[1.02]
    focus:outline-none focus:ring-2 focus:ring-violet-500/20
    ${className}
  `;
  
  // Variant-specific classes
  const variantClasses = {
    card: 'rounded-lg shadow-sm hover:shadow-md',
    list: 'rounded-md hover:bg-bg-hover',
    minimal: 'hover:bg-bg-hover/50',
  };
  
  // Handle click
  const handleClick = () => {
    onClick?.();
  };
  
  // Render internal link
  if (!isExternal) {
    return (
      <ThemedSurface 
        variant={variant === 'card' ? 'primary' : 'base'}
        borderVariant={variant === 'card' ? 'default' : 'none'}
        as={Link}
        to={href}
        className={`${baseClasses} ${variantClasses[variant]} no-underline`}
        onClick={handleClick}
      >
        {renderContent()}
      </ThemedSurface>
    );
  }
  
  // Render external link
  return (
    <ThemedSurface 
      variant={variant === 'card' ? 'primary' : 'base'}
      borderVariant={variant === 'card' ? 'default' : 'none'}
      as="a"
      href={href}
      target={shouldOpenInNewTab ? '_blank' : undefined}
      rel={shouldOpenInNewTab ? 'noopener noreferrer' : undefined}
      className={`${baseClasses} ${variantClasses[variant]} no-underline`}
      onClick={handleClick}
    >
      {renderContent()}
    </ThemedSurface>
  );
};

export default QuickLink;