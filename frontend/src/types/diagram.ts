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
    | 'cylinder'
    | 'uml_class'
    | 'uml_actor'
    | 'uml_use_case'
    | 'uml_component'
    | 'mindmap_central'
    | 'mindmap_topic'
    | 'mindmap_subtopic'
    | 'concept_entity'
    | 'concept_process'
    | 'concept_database';

export const ShapeTypes = {
    // Basic Shapes
    RECTANGLE: 'rectangle' as ShapeType,
    CIRCLE: 'circle' as ShapeType,
    TRIANGLE: 'triangle' as ShapeType,
    LINE: 'line' as ShapeType,
    ARROW: 'arrow' as ShapeType,
    TEXT: 'text' as ShapeType,
    DIAMOND: 'diamond' as ShapeType,
    CYLINDER: 'cylinder' as ShapeType,

    // UML Shapes
    UML_CLASS: 'uml_class' as ShapeType,
    UML_ACTOR: 'uml_actor' as ShapeType,
    UML_USE_CASE: 'uml_use_case' as ShapeType,
    UML_COMPONENT: 'uml_component' as ShapeType,

    // Mind Map Shapes
    MIND_MAP_CENTRAL: 'mindmap_central' as ShapeType,
    MIND_MAP_TOPIC: 'mindmap_topic' as ShapeType,
    MIND_MAP_SUBTOPIC: 'mindmap_subtopic' as ShapeType,

    // Conceptual Diagrams
    CONCEPT_ENTITY: 'concept_entity' as ShapeType,
    CONCEPT_PROCESS: 'concept_process' as ShapeType,
    CONCEPT_DATABASE: 'concept_database' as ShapeType,
};
export type DiagramCategory =
    | 'basic'
    | 'uml'
    | 'mindmap'
    | 'conceptual';

export const DiagramCategories = {
    BASIC_SHAPES: 'basic' as DiagramCategory,
    UML: 'uml' as DiagramCategory,
    MIND_MAP: 'mindmap' as DiagramCategory,
    CONCEPTUAL: 'conceptual' as DiagramCategory,
}

export interface ShapeDefinition {
    type: ShapeType;
    icon: string;
    name: string;
    category: DiagramCategory;
}

export interface ToolbarState {
    selectedTool: string;
    fillColor: string;
    strokeColor: string;
    strokeWidth: number;
    fontSize: number;
}

export type EdgeType =
    | 'step'
    | 'smoothstep'
    | 'straight'
    | 'bezier';

export const EdgeTypes = {
    STEP: 'step' as EdgeType,
    SMOOTHSTEP: 'smoothstep' as EdgeType,
    STRAIGHT: 'straight' as EdgeType,
    BEZIER: 'bezier' as EdgeType,
}
export type LineStyle =
    | 'solid'
    | 'dashed'
    | 'dotted';

export const LineStyles = {
    SOLID: 'solid' as LineStyle,
    DASHED: 'dashed' as LineStyle,
    DOTTED: 'dotted' as LineStyle,
}