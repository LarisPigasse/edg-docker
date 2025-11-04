# Changelog

All notable changes to the EDG Frontend Template project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- **Advanced UI Components Suite**
  - `DatePicker` component with calendar integration and date validation
  - `TimePicker` component with hours/minutes selection and 12/24h formats
  - `Avatar` component with image fallback, initials, and status indicators
  - `NavigationMenu` component with nested dropdown navigation and responsive design
  - `Accordion` component with single/multiple modes and Radix UI integration
  - `Progress` component with 5 semantic variants and indeterminate mode
  - `Tabs` component with 3 visual variants (default, pills, underline)
  - `Toast` component with complete notification system and queue management

- **Date/Time System Infrastructure**
  - Advanced date picker with calendar popup and input validation
  - Time picker with 12/24 hour format support and step controls
  - Complete date/time handling with proper accessibility
  - Keyboard navigation and screen reader support

- **Enhanced Navigation Components**
  - Multi-level navigation menu with Radix UI integration
  - Responsive behavior with mobile-first design
  - Keyboard navigation and focus management
  - Icon integration with consistent styling

- **Avatar System**
  - Image with fallback to initials generation
  - Multiple size variants and status indicators
  - Hover effects and accessibility features
  - Integration with user profile systems

- **Toast System Infrastructure**
  - `useToast` hook with context-based state management
  - ToastProvider with configurable positioning and behavior
  - 4 semantic variants (default, success, warning, danger) with automatic icons
  - Action buttons support with custom callbacks
  - Auto-dismiss with customizable duration and queue management
  - Complete Radix UI integration with animations and accessibility

- **Enhanced Component Integration**
  - `ToastShowcaseDemo` component for comprehensive toast demonstrations
  - Updated UI component exports and barrel files
  - Extended showcase system with new component categories

### Dependencies
- Added Radix UI components: `@radix-ui/react-accordion`, `@radix-ui/react-progress`, `@radix-ui/react-toast`, `@radix-ui/react-popover`, `@radix-ui/react-navigation-menu`, `@radix-ui/react-avatar`

### Planned
- Complete navigation components (FooterMenu, MainMenu, ProfileMenu)
- Implement missing hooks (useLocalStorage, useModal, useThemeStyles)
- Add ShowFeedback and ShowActions showcase components
- Authentication system implementation
- Advanced form validation patterns

---

## [2.1.0] - 2025-07-24

### Added
- **API Service Infrastructure**
  - Complete HTTP client with GET, POST, PUT, PATCH, DELETE, UPLOAD methods
  - Authentication support with token management
  - Typed error handling with `ApiError` interface
  - Request/Response interceptors with timeout management
  - Environment-based configuration
  - File upload support with FormData handling

- **Info Components Suite**
  - `VersionInfo` component with app version, environment badges, and build timestamps
  - `ConnectionStatus` component with real-time backend monitoring and polling
  - `QuickLink` component with internal/external link support, icons, and badges

- **Layout Utility Components**
  - `CenteredPage` component for full viewport centering with animations
  - `CenteredSection` component for flexible section centering with icons

- **Enhanced Barrel Exports**
  - Services barrel file with typed exports
  - Updated info and layout component exports
  - Clean import patterns across all component categories

### Changed
- Updated `edg-frontend-template.md` with completed component status (🟡→🟢)
- Enhanced documentation with detailed component specifications
- Improved TypeScript interfaces across all new components

### Technical Improvements
- Zero `any` types - Complete TypeScript safety
- Consistent error handling patterns
- Responsive design patterns for all new components
- Accessibility-first approach with ARIA labels and keyboard navigation

---

## [2.0.0] - 2025-07-07

### Added
- **Complete Form System** (8 components + wrapper)
  - `Input` component with floating labels and validation
  - `TextArea` component with auto-resize and character counter
  - `Select` component with Radix UI integration
  - `Checkbox` component with advanced states
  - `Switch` component with iOS-style design
  - `RadioGroup` component with orientations and descriptions
  - `FormField` universal wrapper for consistent layouts
  - `Label` standalone component with semantic variants

- **UI Components Suite**
  - `Card` component with variants and theming
  - `Separator` component with orientation support
  - `Alert` component with dismissible functionality
  - Enhanced `Button` component with `loadingText` feature

- **Data Display Components**
  - `Table` component with responsive design
  - `TableLink` component for clickable table elements
  - `InfoCard` component with structured content
  - `Badge` component with color variants

- **Action Components**
  - `ActionMenu` dropdown for CRUD operations
  - `CreateAction`, `EditAction`, `DeleteAction` components
  - Integrated confirmation dialogs

### Enhanced
- **CSS System Extensions**
  - 4 semantic underline states for form components
  - Autofill override CSS for browser consistency
  - Extended theme variables for form elements
  - Complete light/dark mode integration

- **Showcase System**
  - `ShowForms` component with complete form demonstrations
  - `ShowDataDisplay` component for table and badge examples
  - `ComponentExplorer` for interactive component documentation
  - `ComponentModal` for detailed component viewing

### Dependencies
- Added Radix UI components: `@radix-ui/react-select`, `@radix-ui/react-checkbox`, `@radix-ui/react-switch`, `@radix-ui/react-radio-group`

---

## [1.3.0] - 2025-06-30

### Added
- **Dual Menu System**
  - `UserMenu` component for profile management
  - `SettingsMenu` component for app configuration
  - Smart menu exclusivity (only one open at a time)
  - Auto-close behavior with Redux integration

- **Enhanced UI Components**
  - `UserAvatar` component with initials and hover effects
  - `HeaderGroup` component for optimized title/subtitle spacing
  - `TitledSurface` component with fieldset-style title borders

- **Redux State Extensions**
  - Dual menu state management (userMenuOpen, settingsMenuOpen)
  - Mobile menu state integration
  - Enhanced UI hooks with exclusive menu actions

### Changed
- **Header System Restructuring**
  - 3-zone layout: LEFT (Logo + Mobile menu), CENTER (Navigation), RIGHT (User controls)
  - Responsive behavior with conditional element visibility
  - Integrated user controls with avatar and settings icon

- **Layout Improvements**
  - Updated MainLayout for menu integration
  - Enhanced responsive patterns for mobile/desktop
  - Improved spacing and alignment consistency

---

## [1.2.0] - 2025-06-26

### Added
- **Core Layout System**
  - `MainLayout` component with grid structure and responsive behavior
  - `Header` component with logo, navigation, and user controls
  - `Sidebar` component with expandable/collapsible states
  - `Footer` component with minimal design and version info

- **Theme System Infrastructure**
  - Complete CSS custom properties for light/dark mode
  - Automatic theme switching with DOM class management
  - Theme persistence via localStorage middleware

- **Redux State Management**
  - `uiSlice` with complete UI state (sidebar, footer, theme)
  - Persistence middleware for automatic localStorage sync
  - Typed hooks and selectors for clean state access

### Enhanced
- **Atomic Components**
  - `ThemedSurface` with 8 semantic variants
  - `ThemedText` with complete text semantic system
  - `ThemedImage` with automatic theme-based switching
  - `ThemedBorder` and `ThemedShadow` utilities

- **Image System**
  - `useThemedImage` hook for automatic light/dark switching
  - Asset management for theme-responsive images
  - Performance optimization with useMemo

### Fixed
- Border styling conflicts in sidebar layout
- Page height overflow issues with proper container chains
- Button consistency across responsive breakpoints

---

## [1.1.0] - 2025-06-25

### Added
- **Atomic Design System**
  - `ThemedSurface` component for backgrounds and surfaces
  - `ThemedText` component for semantic text styling
  - CSS custom properties for complete theme customization
  - Responsive design patterns with mobile-first approach

- **Navigation System**
  - Route configuration with centralized definitions
  - Navigation configuration with icon mapping
  - React Router integration with typed routes

- **Base UI Components**
  - `Button` component with variants and loading states
  - `Modal` and `ConfirmModal` components
  - `Spinner` component for loading indicators

### Technical
- TypeScript configuration optimization
- Barrel file exports for clean imports
- ESLint and Prettier configuration
- Vite build optimization

---

## [1.0.0] - 2025-06-20

### Added
- **Initial Project Setup**
  - React 18 + Vite + TypeScript foundation
  - Tailwind CSS configuration with custom theme
  - Redux Toolkit setup with persistence middleware
  - Lucide React icons integration

- **Development Environment**
  - Environment configuration (.env files)
  - Development and production build scripts
  - Hot reload and fast refresh setup

- **Project Structure**
  - Feature-based architecture
  - Atomic design component organization
  - Scalable folder structure with clear separation of concerns

### Technical Foundation
- Modern React patterns with hooks and functional components
- TypeScript strict mode configuration
- CSS-in-JS ready architecture
- Mobile-first responsive design setup

---

## Version Numbering Guidelines

### Major Version (X.0.0)
- Breaking changes to component APIs
- Major architectural changes
- Removal of deprecated features
- New major feature sets that change core functionality

### Minor Version (X.Y.0)
- New components or features
- Enhancements to existing components
- New hooks or utilities
- Backward-compatible API changes

### Patch Version (X.Y.Z)
- Bug fixes
- Performance improvements
- Documentation updates
- Small tweaks and adjustments

---

## Contributing Guidelines

When adding entries to this changelog:

1. **Always add new entries to the [Unreleased] section first**
2. **Use clear, descriptive language for changes**
3. **Group changes by type: Added, Changed, Deprecated, Removed, Fixed, Security**
4. **Include component locations for new additions**
5. **Mention breaking changes prominently**
6. **Link to relevant documentation or issues when applicable**

---

## Links and References

- [Project Repository](https://github.com/LarisPigasse/edg-frontend-template)
- [Component Documentation](./COMPONENTS.md)
- [Project Architecture](./edg-frontend-template.md)
- [Keep a Changelog](https://keepachangelog.com/)
- [Semantic Versioning](https://semver.org/)

---

*This changelog is maintained automatically as part of the development process and reflects the current state of the EDG Frontend Template.*