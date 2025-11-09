import type {Edge} from "reactflow";
import type {Node} from "@xyflow/react";

export interface CustomNodeData {
    label: string;
    shapeType?: ShapeType;
}

export const ShapeTypes = {
    // Basic Shapes
    RECTANGLE: 'rectangle',
    CIRCLE: 'circle',
    TRIANGLE: 'triangle',
    DIAMOND: 'diamond',
    TEXT: 'text',
    LINE: 'line',
    ARROW: 'arrow',
    CYLINDER: 'cylinder',

    // UML Diagrams
    UML_CLASS: 'uml_class',
    UML_ACTOR: 'uml_actor',
    UML_USE_CASE: 'uml_use_case',
    UML_COMPONENT: 'uml_component',

    // Mind Maps
    MIND_MAP_CENTRAL: 'mind_map_central',
    MIND_MAP_TOPIC: 'mind_map_topic',
    MIND_MAP_SUBTOPIC: 'mind_map_subtopic',

    // Conceptual Diagrams
    CONCEPT_ENTITY: 'concept_entity',
    CONCEPT_PROCESS: 'concept_process',
    CONCEPT_DATABASE: 'concept_database',
} as const;

export type ShapeType = typeof ShapeTypes[keyof typeof ShapeTypes];

export const getShapeDimensions = (shapeType: ShapeType): { width: number; height: number } => {
    const dimensions: Record<string, { width: number; height: number }> = {
        rectangle: {width: 140, height: 80},
        circle: {width: 100, height: 100},
        triangle: {width: 120, height: 110},
        diamond: {width: 120, height: 120},
        cylinder: {width: 100, height: 120},
        text: {width: 150, height: 60},
        line: {width: 120, height: 20},
        arrow: {width: 140, height: 20},

        // UML shapes
        uml_class: {width: 160, height: 120},
        uml_actor: {width: 80, height: 120},
        uml_use_case: {width: 140, height: 80},
        uml_component: {width: 140, height: 90},

        // Mind map shapes
        mind_map_central: {width: 140, height: 140},
        mind_map_topic: {width: 130, height: 70},
        mind_map_subtopic: {width: 110, height: 50},

        // Conceptual shapes
        concept_entity: {width: 140, height: 80},
        concept_process: {width: 140, height: 80},
        concept_database: {width: 110, height: 130},
    };

    return dimensions[shapeType] || {width: 140, height: 80};
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

export interface CreateDiagramData {
    name: string;
    description?: string;
    nodes?: Node[];
    edges?: Edge[];
}

export interface DiagramResponse {
    _id: string;
    name: string;
    description?: string;
    createdBy: string;
    nodes: Node[];
    edges: Edge[];
    createdAt: string;
    updatedAt: string;
}