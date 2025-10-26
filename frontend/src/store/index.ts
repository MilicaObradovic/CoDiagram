import {create} from 'zustand';
import type {StoreState} from '../types/store.ts';
import {UndoRedo} from './undo-redo';
import {addEdge, applyNodeChanges, type NodeChange, type Connection, type Node} from "@xyflow/react";
import {applyEdgeChanges, type Edge, type EdgeChange} from "reactflow";
import type {EdgeType} from "../types/diagram.ts";

UndoRedo.addHistory({nodes: [], edges: []});

// useStore hook that can be used in components to get parts of the store and call actions
const useStore = create<StoreState>((set, get) => ({
    nodes: [],
    edges: [],
    nextNodeId: 1,

    setNodes: (nodes: Node[]) => {
        set({nodes});
        UndoRedo.addHistory({nodes: get().nodes, edges: get().edges});
    },
    setEdges: (edges: Edge[]) => {
        set({edges});
        UndoRedo.addHistory({nodes: get().nodes, edges: get().edges});
    },
    onNodesChange: (changes: NodeChange[]) => {
        set({
            nodes: applyNodeChanges(changes, get().nodes),
        });
        const shouldSaveHistory = changes.some(change =>
            change.type === 'remove' ||
            (change.type === 'position' && change.dragging === false)|| // Only when drag ends
            (change.type === 'dimensions' && change.resizing === false)  // Resize end
        );

        if (shouldSaveHistory) {
            UndoRedo.addHistory({nodes: get().nodes, edges: get().edges});
        }
    },

    onEdgesChange: (changes: EdgeChange[]) => {
        const edges = get().edges;
        set({edges: applyEdgeChanges(changes, edges)});
        const shouldSaveHistory = changes.some(change =>
            change.type === 'remove'
        );

        if (shouldSaveHistory) {
            UndoRedo.addHistory({nodes: get().nodes, edges: get().edges});
        }
    },
    onEdgeClick: (edgeId: string, edgeType: EdgeType) => {
        const edges = get().edges;
        const updatedEdges = edges.map(edge => {
            if (edge.id === edgeId) {
                return {
                    ...edge,
                    type: edgeType, // Update the edge type
                };
            }
            return edge;
        });

        set({ edges: updatedEdges });
        UndoRedo.addHistory({ nodes: get().nodes, edges: updatedEdges });
    },

    onConnect: (connection: Connection) => {
        const existingEdges: Edge[] = get().edges;
        const newEdges = addEdge(connection, existingEdges);
        set({edges: newEdges});
        UndoRedo.addHistory({nodes: get().nodes, edges: newEdges});
    },

    updateNodeLabel: (nodeId: string, label: string) => {
        set({
            nodes: get().nodes.map((node) => {
                if (node.id === nodeId) {
                    node.data = {...node.data, label};
                }

                return node;
            }),
        });
        UndoRedo.addHistory({nodes: get().nodes, edges: get().edges});
    },

    updateEdgeLabel: (edgeId: string, label: string) => {
        set({
            edges: get().edges.map((edge) => {
                if (edge.id === edgeId) {
                    edge.label = label;
                }

                return edge;
            }),
        });
    },

    undo: () => {
        const state = UndoRedo.undo();
        if (state) {
            set({nodes: state.nodes, edges: state.edges});
        }
    },

    redo: () => {
        const state = UndoRedo.redo();
        if (state) {
            set({nodes: state.nodes, edges: state.edges});
        }
    },
    canUndo: () => UndoRedo.canUndo(),
    canRedo: () => UndoRedo.canRedo(),
}));

export {useStore};
