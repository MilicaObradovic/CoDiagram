import type {Edge, OnEdgeUpdateFunc} from "reactflow";
import type {OnConnect, OnEdgesChange, OnNodesChange} from "@xyflow/react";


export type StoreState = {
    nodes: Node[];
    edges: Edge[];
    setNodes: (nodes: Node[]) => void;
    setEdges: (edges: Edge[]) => void;
    nextNodeId: number,
    onNodesChange: OnNodesChange;
    onEdgesChange: OnEdgesChange;
    onEdgeUpdate: OnEdgeUpdateFunc,
    onConnect: OnConnect;
    updateNodeLabel: (nodeId: string, label: string) => void;
    updateEdgeLabel: (nodeId: string, label: string) => void;
    undo: () => void;
    redo: () => void;
    canUndo: () => void;
    canRedo: () => void;
};