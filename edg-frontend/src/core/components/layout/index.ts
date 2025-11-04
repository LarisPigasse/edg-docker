// Barrel file per i componenti di layout
export { default as Header } from "./custom/Header";
export { default as Footer } from "./custom/Footer";
export { default as Sidebar } from "./custom/Sidebar";
export { default as HeaderGroup } from "./custom/HeaderGroup";
export { default as TitledSurface } from "./custom/TitledSurface";
export { default as CenteredPage } from "./custom/CenteredPage";
export { default as CenteredSection } from "./custom/CenteredSection";

// Re-export dei tipi
export type { default as HeaderProps } from "./custom/Header";
export type { default as FooterProps } from "./custom/Footer";
export type { default as SidebarProps } from "./custom/Sidebar";
export type { default as HeaderGroupProps } from "./custom/HeaderGroup";
export type { default as TitledSurfaceProps } from "./custom/TitledSurface";

//Card
export { default as Card } from "./card/Card";
export { default as CardShowcase } from "./card/Card.showcase";
export { cardData } from "./card/Card.data";
export type { CardVariant, CardPadding } from "./card/Card";

// Separator
export { default as Separator } from "./separator/Separator";
export { separatorData } from "./separator/Separator.data";
export { SeparatorShowcase } from "./separator/Separator.showcase";
export type { SeparatorOrientation, SeparatorVariant } from "./separator/Separator";

// Sheet
export { default as Sheet } from "./sheet/Sheet";
export { sheetData } from "./sheet/Sheet.data";
export { SheetShowcase } from "./sheet/Sheet.showcase";
export type { SheetSide } from "./sheet/Sheet";
