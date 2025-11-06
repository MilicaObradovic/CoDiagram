import {create} from 'zustand';
import type {HistoryState, StoreState} from '../types/store.ts';
import {UndoRedo} from './undo-redo';
import {addEdge, applyNodeChanges, type NodeChange, type Connection, type Node} from "@xyflow/react";
import {applyEdgeChanges, type Edge, type EdgeChange} from "reactflow";
import type {EdgeType, LineStyle} from "../types/diagram.ts";
import * as Y from 'yjs';

// useStore hook that can be used in components to get parts of the store and call actions
const useStore = create<StoreState>((set, get) => ({
        nodes: [],
        edges: [],
        nextNodeId: 1,
        isInitialized: false,
        currentUserId: null,

        setCurrentUser: (userId: string) => {
            UndoRedo.setCurrentUser(userId);
            set({currentUserId: userId});
        },

        initializeYjs: (doc: Y.Doc) => {
            const yNodes = doc.getMap('nodes'); // Change from getArray to getMap
            const yEdges = doc.getMap('edges'); // Change from getArray to getMap

            const initialNodes = Array.from(yNodes.values()); // Convert map values to array
            const initialEdges = Array.from(yEdges.values()); // Convert map values to array

            set({
                nodes: initialNodes,
                edges: initialEdges,
                isInitialized: true,
            });
            UndoRedo.setYDoc(doc);

            // Store references
            (get() as any).yNodes = yNodes;
            (get() as any).yEdges = yEdges;
        },
        setLoadedNodesAndEdges: (nodes: Node[], edges: Edge[]) => {
            const userId = get().currentUserId;
            if (userId) {
                UndoRedo.addUserHistory(userId, {nodes: nodes, edges: edges, type: "loaded"});
            }
        },
        createNode: (node: Node) => {
            const userId = get().currentUserId;
            if (!userId) return;

            // Add user metadata to the node
            const userNode = {
                ...node,
                data: {
                    ...node.data,
                    createdBy: userId,
                    lastModifiedBy: userId,
                    createdAt: Date.now()
                }
            };
            const nodes = [...get().nodes, userNode];
            set({nodes});
            UndoRedo.addUserHistory(userId, {nodes: nodes, edges: get().edges, type: "user"});
        },
        setNodes: (nodes: Node[], origin: 'user' | 'yjs' | 'loaded' | 'undo-redo' = 'user') => {
            set({nodes: nodes});

            // Save history only for user activity
            if (origin === 'user') {
                const userId = get().currentUserId;
                if (userId) {
                    UndoRedo.addUserHistory(userId, {nodes: get().nodes, edges: get().edges, type: origin});
                }
            }
        },

        setEdges: (edges: Edge[], origin: 'user' | 'yjs' | 'loaded' | 'undo-redo' = 'user') => {
            set({edges: edges});

            if (origin === 'user') {
                const userId = get().currentUserId;
                if (userId) {
                    UndoRedo.addUserHistory(userId, {nodes: get().nodes, edges: get().edges, type: origin});
                }
            }
        },
        onNodesChange: (changes: NodeChange[], origin: 'user' | 'yjs' | 'loaded' | 'undo-redo' = 'user') => {
            const userId = get().currentUserId;
            const updatedNodes = applyNodeChanges(changes, get().nodes);

            set({nodes: updatedNodes});

            const shouldSaveHistory = changes.some(change =>
                change.type === 'remove' ||
                (change.type === 'position' && change.dragging === false) ||
                (change.type === 'dimensions' && change.resizing === false)
            );

            if (shouldSaveHistory && origin === 'user' && userId) {
                UndoRedo.addUserHistory(userId, {nodes: updatedNodes, edges: get().edges, type: origin});
            }
        },

        onEdgesChange: (changes: EdgeChange[], origin: 'user' | 'yjs' | 'loaded' | 'undo-redo' = 'user') => {
            const {currentUserId} = get();
            const edges = get().edges;

            // Apply changes and add user metadata to new edges
            const updatedEdges = applyEdgeChanges(changes, edges);

            set({edges: updatedEdges});

            const shouldSaveHistory = changes.some(change =>
                change.type === 'remove' ||
                (change.type === 'add') ||
                (change.type === 'select' && !change.selected) // Save when deselection ends
            );

            if (shouldSaveHistory && origin === 'user' && currentUserId) {
                UndoRedo.addUserHistory(currentUserId, {nodes: get().nodes, edges: updatedEdges, type: origin});
            }
        },
        onEdgeClick: (edgeId: string, edgeType: EdgeType, lineStyle?: LineStyle, origin: 'user' | 'yjs' | 'loaded' | 'undo-redo' = 'user') => {
            const {currentUserId} = get();
            const edges = get().edges;

            const updatedEdges = edges.map(edge => {
                if (edge.id === edgeId) {
                    const updatedEdge = {
                        ...edge,
                        type: edgeType,
                        // Update last modified info for user actions
                        ...(origin === 'user' && currentUserId && {
                            data: {
                                ...edge.data,
                                lastModifiedBy: currentUserId,
                                lastModifiedAt: Date.now(),
                                ...(lineStyle && {lineStyle})
                            }
                        })
                    };

                    // Handle lineStyle separately to avoid overwriting
                    if (lineStyle && (!origin === 'user' || !currentUserId)) {
                        updatedEdge.data = {
                            ...updatedEdge.data,
                            lineStyle: lineStyle
                        };
                    }

                    return updatedEdge;
                }
                return edge;
            });

            set({edges: updatedEdges});

            // Save to user's history for user actions
            if (origin === 'user' && currentUserId) {
                UndoRedo.addUserHistory(currentUserId, {nodes: get().nodes, edges: updatedEdges, type: origin});
            }
        },

        onConnect: (connection: Connection, origin: 'user' | 'yjs' | 'loaded' | 'undo-redo' = 'user') => {
            const userId = get().currentUserId;
            const existingEdges: Edge[] = get().edges;
            const newEdges = addEdge(connection, existingEdges);

            // Add user metadata to new edge
            if (origin === 'user' && userId) {
                const newEdge = newEdges.find(edge =>
                    !existingEdges.some(existing => existing.id === edge.id)
                );
                if (newEdge) {
                    const edgeIndex = newEdges.findIndex(e => e.id === newEdge.id);
                    newEdges[edgeIndex] = {
                        ...newEdges[edgeIndex],
                        data: {
                            ...newEdges[edgeIndex].data,
                            createdBy: userId,
                            lastModifiedBy: userId,
                            createdAt: Date.now()
                        }
                    };
                }
            }

            set({edges: newEdges});

            if (origin === 'user' && userId) {
                UndoRedo.addUserHistory(userId, {nodes: get().nodes, edges: newEdges, type: origin});
            }
        },
        updateNodeLabel: (nodeId: string, label: string, origin: 'user' | 'yjs' | 'loaded' | 'undo-redo' = 'user') => {
            const state = get();
            const {nodes, edges, isInitialized, currentUserId} = state;

            const updatedNodes = nodes.map((node) => {
                if (node.id === nodeId) {
                    return {
                        ...node,
                        data: {
                            ...node.data,
                            label: label,
                            // Update last modified info for user actions
                            ...(origin === 'user' && currentUserId && {
                                lastModifiedBy: currentUserId,
                                lastModifiedAt: Date.now()
                            })
                        }
                    };
                }
                return node;
            });

            set({nodes: updatedNodes});

            // Sync to Yjs if initialized
            if (isInitialized && (get() as any).yNodes) {
                const yNodes = (get() as any).yNodes;
                const updatedNode = updatedNodes.find(n => n.id === nodeId);
                if (updatedNode) {
                    yNodes.set(nodeId, updatedNode);
                }
            }

            // Save to user's history for user actions
            if (origin === 'user' && currentUserId) {
                UndoRedo.addUserHistory(currentUserId, {nodes: updatedNodes, edges, type: origin});
            }
        },
        undo: () => {
            const userId = get().currentUserId;
            if (!userId) return;

            const state = UndoRedo.undo(userId);
            if (state && !UndoRedo.yDoc) {
                console.log('undo');
                get().setNodes(state.nodes, 'undo-redo');
                get().setEdges(state.edges, 'undo-redo');
            }
        },

        redo: () => {
            const userId = get().currentUserId;
            if (!userId) return;

            const state = UndoRedo.redo(userId);
            if (state && !UndoRedo.yDoc) {
                console.log('redo');
                get().setNodes(state.nodes, 'undo-redo');
                get().setEdges(state.edges, 'undo-redo');
            }
        },

        canUndo: () => {
            const userId = get().currentUserId;
            return userId ? UndoRedo.canUndo(userId) : false;
        },

        canRedo: () => {
            const userId = get().currentUserId;
            return userId ? UndoRedo.canRedo(userId) : false;
        },
    }))
;

export {useStore};
