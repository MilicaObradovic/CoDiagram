import {create} from 'zustand';
import type {HistoryState, StoreState} from '../types/store.ts';
import {UndoRedo} from './undo-redo';
import * as Y from 'yjs';

const useStore = create<StoreState>((set, get) => ({
    currentUserId: null,
    isInitialized: false,

    setCurrentUser: (userId: string) => {
        UndoRedo.setCurrentUser(userId);
        set({currentUserId: userId});
    },

    initializeYjs: (doc: Y.Doc) => {
        UndoRedo.setYDoc(doc);
        set({isInitialized: true});
    },

    undo: () => {
        const userId = get().currentUserId;
        if (!userId) return;
        UndoRedo.undo(userId);
    },

    redo: () => {
        const userId = get().currentUserId;
        if (!userId) return;
        UndoRedo.redo(userId);
    },

    canUndo: () => {
        const userId = get().currentUserId;
        return userId ? UndoRedo.canUndo(userId) : false;
    },

    canRedo: () => {
        const userId = get().currentUserId;
        return userId ? UndoRedo.canRedo(userId) : false;
    },

    addUserHistory: (state: HistoryState) => {
        const userId = get().currentUserId;
        if (userId) {
            UndoRedo.addUserHistory(userId, state);
        }
    },

    updateNodeLabel: (nodeId: string, label: string, origin: string) => {
        const {currentUserId, isInitialized} = get();

        if (!isInitialized || !currentUserId) {
            console.warn('Cannot update node label: store not initialized or no user');
            return;
        }

        // Get Y.js document reference (you might need to store this in your store)
        const yDoc = UndoRedo.yDoc;
        if (!yDoc) {
            console.warn('Cannot update node label: Y.js document not available');
            return;
        }

        const yNodes = yDoc.getMap('nodes');
        const existingNode = yNodes.get(nodeId);

        if (!existingNode) {
            console.warn(`Cannot update node label: node ${nodeId} not found`);
            return;
        }

        // Update the node in Y.js
        yDoc.transact(() => {
            const updatedNode = {
                ...existingNode,
                data: {
                    ...existingNode.data,
                    label: label,
                    // Update last modified info for user actions
                    ...(origin === 'user' && {
                        lastModifiedBy: currentUserId,
                        lastModifiedAt: Date.now()
                    })
                }
            };

            yNodes.set(nodeId, updatedNode);
            console.log(`Updated node label: ${nodeId} -> "${label}"`);
        });

        // Save to history for user actions
        if (origin === 'user') {
            const currentNodes = Array.from(yNodes.values());
            const yEdges = yDoc.getMap('edges');
            const currentEdges = Array.from(yEdges.values());

            UndoRedo.addUserHistory(currentUserId, {
                nodes: currentNodes,
                edges: currentEdges,
                type: 'user'
            });
        }
    }
}));

export {useStore};