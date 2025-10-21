export interface Shape {
    id: string;
    type: ShapeType;
    x: number;
    y: number;
    width: number;
    height: number;
    fill: string;
    stroke: string;
    strokeWidth: number;
    text?: string;
}
export interface CustomNodeData {
    label: string;
}

export interface CustomNode extends Node {
    data: CustomNodeData;
}


export type ShapeType =
    | 'rectangle'
    | 'circle'
    | 'triangle'
    | 'line'
    | 'arrow'
    | 'text'
    | 'diamond'
    | 'cylinder';

export const ShapeTypes = {
    RECTANGLE: 'rectangle' as ShapeType,
    CIRCLE: 'circle' as ShapeType,
    TRIANGLE: 'triangle' as ShapeType,
    LINE: 'line' as ShapeType,
    ARROW: 'arrow' as ShapeType,
    TEXT: 'text' as ShapeType,
    DIAMOND: 'diamond' as ShapeType,
    CYLINDER: 'cylinder' as ShapeType,
};

export interface Tool {
    id: string;
    name: string;
    type: 'select' | 'shape' | 'connection' | 'text' | 'zoom' | 'hand';
    icon: string;
    shortcut?: string;
}

export interface ToolbarState {
    selectedTool: string;
    fillColor: string;
    strokeColor: string;
    strokeWidth: number;
    fontSize: number;
}