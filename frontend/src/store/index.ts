import {create} from 'zustand';
import type {StoreState} from '../types/store.ts';
import {UndoRedo} from './undo-redo';
import {addEdge, applyNodeChanges, type NodeChange, type Connection, type Node} from "@xyflow/react";
import {applyEdgeChanges, type Edge, type EdgeChange} from "reactflow";
import type {EdgeType, LineStyle} from "../types/diagram.ts";
import * as Y from 'yjs';

UndoRedo.addHistory({nodes: [], edges: []});
// useStore hook that can be used in components to get parts of the store and call actions
const useStore = create<StoreState>((set, get) => ({
    nodes: [],
    edges: [],
    nextNodeId: 1,
    isInitialized: false,

    initializeYjs: (doc: Y.Doc) => {
        const yNodes = doc.getMap('nodes'); // Change from getArray to getMap
        const yEdges = doc.getMap('edges'); // Change from getArray to getMap

        const initialNodes = Array.from(yNodes.values()); // Convert map values to array
        const initialEdges = Array.from(yEdges.values()); // Convert map values to array

        set({
            nodes: initialNodes,
            edges: initialEdges,
            isInitialized: true
        });

        // Store references
        (get() as any).yNodes = yNodes;
        (get() as any).yEdges = yEdges;
    },

    setNodes: (nodes: Node[], origin: 'user' | 'yjs' | 'undo-redo' = 'user') => {
        set({nodes});

        // save history only for user activity
        if (origin === 'user') {
            UndoRedo.addHistory({nodes: get().nodes, edges: get().edges});
        }
    },

    setEdges: (edges: Edge[], origin: 'user' | 'yjs' | 'undo-redo' = 'user') => {
        set({edges});

        if (origin === 'user') {
            UndoRedo.addHistory({nodes: get().nodes, edges: get().edges});
        }
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
    onEdgeClick: (edgeId: string, edgeType: EdgeType, lineStyle?: LineStyle) => {
        const edges = get().edges;
        const updatedEdges = edges.map(edge => {
            if (edge.id === edgeId) {
                const updatedEdge = {
                    ...edge,
                    type: edgeType, // Update the edge type
                };

                if (lineStyle) {
                    updatedEdge.data = {
                        ...edge.data,
                        lineStyle: lineStyle
                    };
                }

                return updatedEdge;
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
        const state = get();
        const { nodes, edges, isInitialized } = state;

        const updatedNodes = nodes.map((node) => {
            if (node.id === nodeId) {
                return {
                    ...node,
                    data: {
                        ...node.data,
                        label: label
                    }
                };
            }
            return node;
        });

        set({ nodes: updatedNodes });

        // Sync to Yjs if initialized
        if (isInitialized && (get() as any).yNodes) {
            const yNodes = (get() as any).yNodes;
            const updatedNode = updatedNodes.find(n => n.id === nodeId);
            if (updatedNode) {
                yNodes.set(nodeId, updatedNode); // Update the node in Yjs map
            }
        }

        UndoRedo.addHistory({ nodes: updatedNodes, edges });
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
        if (state && !UndoRedo.yDoc) {
            get().setNodes(state.nodes, 'undo-redo');
            get().setEdges(state.edges, 'undo-redo');
        }
    },

    redo: () => {
        const state = UndoRedo.redo();
        if (state && !UndoRedo.yDoc) {
            get().setNodes(state.nodes, 'undo-redo');
            get().setEdges(state.edges, 'undo-redo');
        }
    },
    canUndo: () => UndoRedo.canUndo(),
    canRedo: () => UndoRedo.canRedo(),
}));

export {useStore};
