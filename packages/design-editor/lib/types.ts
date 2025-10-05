export type ObjectType =
  | "rectangle"
  | "circle"
  | "text"
  | "image"
  | "group"
  | "frame";

export interface CanvasObject {
  id: string;
  type: ObjectType;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  visible: boolean;
  locked: boolean;
  opacity: number;
  // Shape properties
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  cornerRadius?: number;
  // Text properties
  text?: string;
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: string;
  textAlign?: "left" | "center" | "right";
  lineHeight?: number;
  letterSpacing?: number;
  // Image properties
  src?: string;
  // Group/Frame properties
  children?: CanvasObject[];
  expanded?: boolean;
  // Box model properties
  marginTop?: number;
  marginRight?: number;
  marginBottom?: number;
  marginLeft?: number;
  paddingTop?: number;
  paddingRight?: number;
  paddingBottom?: number;
  paddingLeft?: number;
  borderTopWidth?: number;
  borderRightWidth?: number;
  borderBottomWidth?: number;
  borderLeftWidth?: number;
  // Layout properties
  clipContent?: boolean;
  autoLayout?: boolean;
  layoutDirection?: "horizontal" | "vertical";
  gap?: number;
  // Constraints
  horizontalConstraint?: "left" | "center" | "right" | "stretch";
  verticalConstraint?: "top" | "center" | "bottom" | "stretch";
}
