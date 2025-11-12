import * as Y from 'yjs';

export const UndoRedoManager = {
    undoManagers: new Map<string, Y.UndoManager>(),
    yDoc: null as Y.Doc | null,
    userId: "" as string,

    setYDoc(doc: Y.Doc): void {
        this.yDoc = doc;
    },
    setUserId(uid: string): void {
        this.userId = uid;
    },

    initializeUserUndoManager(): void {
        if (!this.yDoc) return;

        const yNodes = this.yDoc.getMap('nodes');
        const yEdges = this.yDoc.getMap('edges');

        // Track both maps for this user
        const undoManager = new Y.UndoManager([yNodes, yEdges], {
            trackedOrigins: new Set([`user-${this.userId}`])
        });

        this.undoManagers.set(this.userId, undoManager);
    },

    canUndo(): boolean {
        const undoManager = this.undoManagers.get(this.userId);
        return undoManager ? undoManager.undoStack.length > 0 : false;
    },

    canRedo(): boolean {
        const undoManager = this.undoManagers.get(this.userId);
        return undoManager ? undoManager.redoStack.length > 0 : false;
    },

    undo(): void {
        const undoManager = this.undoManagers.get(this.userId);
        if (undoManager) {
            undoManager.undo();
        }
    },

    redo(): void {
        const undoManager = this.undoManagers.get(this.userId);
        if (undoManager) {
            undoManager.redo();
        }
    },

    // When making changes, specify the user origin
    makeChange(changeFunction: () => void): void {
        if (this.yDoc) {
            this.yDoc.transact(changeFunction, `user-${this.userId}`);
        }
    },

    // Clean up when user disconnects
    removeUserUndoManager(): void {
        this.undoManagers.delete(this.userId);
    }
};