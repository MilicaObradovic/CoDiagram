// import {create} from 'zustand';
// import type {HistoryState, StoreState} from '../types/store.ts';
// import {UndoRedoManager} from './undo-redo';
// import * as Y from 'yjs';
//
// const useStore = create<StoreState>((set, get) => ({
//
//
//     updateNodeLabel: (nodeId: string, label: string, origin: string) => {
//         const {currentUserId, isInitialized} = get();
//
//         if (!isInitialized || !currentUserId) {
//             console.warn('Cannot update node label: store not initialized or no user');
//             return;
//         }
//
//         // Get Y.js document reference (you might need to store this in your store)
//         const yDoc = UndoRedo.yDoc;
//         if (!yDoc) {
//             console.warn('Cannot update node label: Y.js document not available');
//             return;
//         }
//
//         const yNodes = yDoc.getMap('nodes');
//         const existingNode = yNodes.get(nodeId);
//
//         if (!existingNode) {
//             console.warn(`Cannot update node label: node ${nodeId} not found`);
//             return;
//         }
//
//         // Update the node in Y.js
//         yDoc.transact(() => {
//             const updatedNode = {
//                 ...existingNode,
//                 data: {
//                     ...existingNode.data,
//                     label: label,
//                     // Update last modified info for user actions
//                     ...(origin === 'user' && {
//                         lastModifiedBy: currentUserId,
//                         lastModifiedAt: Date.now()
//                     })
//                 }
//             };
//
//             yNodes.set(nodeId, updatedNode);
//             console.log(`Updated node label: ${nodeId} -> "${label}"`);
//         });
//
//         // Save to history for user actions
//         if (origin === 'user') {
//             const currentNodes = Array.from(yNodes.values());
//             const yEdges = yDoc.getMap('edges');
//             const currentEdges = Array.from(yEdges.values());
//
//             UndoRedo.addUserHistory(currentUserId, {
//                 nodes: currentNodes,
//                 edges: currentEdges,
//                 type: 'user'
//             });
//         }
//     }
// }));
//
// export {useStore};