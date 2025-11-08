import type {HistoryState} from '../types/store.ts'
import * as Y from 'yjs';

export const UndoRedo = {
    maxHistory: 50,
    userHistories: new Map<string, { history: HistoryState[], position: number }>(),
    currentUserId: null as string | null,
    yDoc: null as Y.Doc | null,

    setYDoc(doc: Y.Doc|null): void {
        this.yDoc = doc;
    },

    setCurrentUser(userId: string): void {
        this.currentUserId = userId;
        if (!this.userHistories.has(userId)) {
            this.userHistories.set(userId, { history: [], position: 0 });
        }
    },
    canUndo(userId?: string): boolean {
        const targetUserId = userId || this.currentUserId;
        if (!targetUserId) return false;

        const userHistory = this.userHistories.get(targetUserId);
        return userHistory ? userHistory.position > 0 && userHistory.history[userHistory.position].type !== "loaded" : false;
    },

    canRedo(userId?: string): boolean {
        const targetUserId = userId || this.currentUserId;
        if (!targetUserId) return false;

        const userHistory = this.userHistories.get(targetUserId);
        return userHistory ? userHistory.position < userHistory.history.length - 1 : false;
    },

    undo(userId?: string): HistoryState | undefined {
        const targetUserId = userId || this.currentUserId;
        if (!targetUserId) return;

        const userHistory = this.userHistories.get(targetUserId);
        if (userHistory && userHistory.position > 0) {
            userHistory.position--;
            const state = userHistory.history[userHistory.position];

            if (this.yDoc && state) {
                this.applyUserStateToYjs(targetUserId, state);
            }
            return state;
        }
    },

    redo(userId?: string): HistoryState | undefined {
        const targetUserId = userId || this.currentUserId;
        if (!targetUserId) return;

        const userHistory = this.userHistories.get(targetUserId);
        if (userHistory && userHistory.position < userHistory.history.length - 1) {
            userHistory.position++;
            const state = userHistory.history[userHistory.position];

            if (this.yDoc && state) {
                this.applyUserStateToYjs(targetUserId, state);
            }
            return state;
        }
    },

    applyUserStateToYjs(userId: string, state: HistoryState): void {
        if (!this.yDoc) return;

        this.yDoc.transact(() => {
            const yNodes = this.yDoc!.getMap('nodes');
            const yEdges = this.yDoc!.getMap('edges');

            // For undo/redo, we only revert changes made by this specific user
            // This prevents affecting other users' work
            state.nodes.forEach(node => {
                const currentYNode = yNodes.get(node.id);
                // Only update if this user owns the node or it's in the desired state
                if (node.data?.createdBy === userId || !currentYNode) {
                    yNodes.set(node.id, node);
                }
            });

            state.edges.forEach(edge => {
                const currentYEdge = yEdges.get(edge.id);
                if (edge.data?.createdBy === userId || !currentYEdge) {
                    yEdges.set(edge.id, edge);
                }
            });

            // Remove nodes/edges that were deleted by this user
            const currentYNodes = Array.from(yNodes.values());
            const currentYEdges = Array.from(yEdges.values());

            currentYNodes.forEach(currentNode => {
                const shouldExist = state.nodes.some(node => node.id === currentNode.id);
                if (!shouldExist && currentNode.data?.createdBy === userId) {
                    yNodes.delete(currentNode.id);
                }
            });

            currentYEdges.forEach(currentEdge => {
                const shouldExist = state.edges.some(edge => edge.id === currentEdge.id);
                if (!shouldExist && currentEdge.data?.createdBy === userId) {
                    yEdges.delete(currentEdge.id);
                }
            });
        }, `undo-redo-${userId}`);
    },

    addUserHistory(userId: string, item: HistoryState): void {
        if (!this.userHistories.has(userId)) {
            this.userHistories.set(userId, { history: [], position: 0 });
        }

        const userHistory = this.userHistories.get(userId)!;
        userHistory.history = userHistory.history
            .slice(0, userHistory.position + 1)
            .concat(structuredClone(item))
            .slice(-this.maxHistory);
        userHistory.position = userHistory.history.length - 1;
    },
};