import type {Edge} from "reactflow";
import type {Connection, EdgeChange, Node, NodeChange} from "@xyflow/react";
import type {EdgeType, LineStyle} from "./diagram.ts";
import * as Y from 'yjs';
export interface StoreState {
    updateNodeLabel: (nodeId: string, label: string, origin: string) => void;
    createOnNodesChange: (
        yDoc: Y.Doc | null,
        nodes: Node[],
        setNodes: (nodes: Node[]) => void
    ) => (changes: NodeChange[]) => void;

    createOnEdgesChange: (
        yDoc: Y.Doc | null,
        setEdges: (edges: Edge[]) => void
    ) => (changes: EdgeChange[]) => void;

    createOnConnect: (
        yDoc: Y.Doc | null,
        selectedEdgeType: EdgeType,
        selectedLineStyle: LineStyle,
        provider: any
    ) => (connection: Connection) => void;

    handleEdgeClick: (
        yDoc: Y.Doc | null,
        provider: any
    ) => (edgeId: string, edgeType: EdgeType, lineStyle?: LineStyle, origin?: 'user' | 'yjs' | 'loaded' | 'undo-redo') => void;

    createNewShape: (
        reactFlowInstance: any,
        yDoc: Y.Doc | null,
        onShapeCreated: () => void,
        provider: any
    ) => (shapeType: string) => void;
}

export interface HistoryState {
    nodes: Node[];
    edges: Edge[];
    type: string;
}