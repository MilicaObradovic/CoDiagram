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
            console.log("undo")
            undoManager.undo();
        }
    },
    redo(): void {
        const undoManager = this.undoManagers.get(this.userId);
        if (undoManager) {
            undoManager.redo();
        }
    },
    removeUserUndoManager(): void {
        this.undoManagers.delete(this.userId);
    }
};
// Bind the methods to preserve 'this' context
UndoRedoManager.undo = UndoRedoManager.undo.bind(UndoRedoManager);
UndoRedoManager.redo = UndoRedoManager.redo.bind(UndoRedoManager);
UndoRedoManager.canUndo = UndoRedoManager.canUndo.bind(UndoRedoManager);
UndoRedoManager.canRedo = UndoRedoManager.canRedo.bind(UndoRedoManager);