import type {ShapeType} from "../types/diagram.ts";
import ShapeMenu from "./shapeMenu.tsx";
import DiagramCanvas from "./diagramCanvas.tsx";
import {useEffect, useState} from "react";
import {type Edge, ReactFlowProvider} from "reactflow";
import {useParams} from "react-router-dom";
import {authApi} from "../services/service.ts";
import {UndoRedoManager} from "../store/undo-redo.ts";
import {WebsocketProvider} from "y-websocket";
import * as Y from 'yjs';
import type {Node} from "@xyflow/react";

function Diagram() {
    const [selectedShape, setSelectedShape] = useState<ShapeType>();
    const {id} = useParams();
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [shapeMenuOpen, setShapeMenuOpen] = useState(true);
    const [yDoc, setYDoc] = useState<Y.Doc | null>(null);
    const [provider, setProvider] = useState<WebsocketProvider | null>(null);

    useEffect(() => {
        if (id) {
            initializeYjsAndLoadDiagram(id);
        }
    }, [id]);

    const initializeYjsAndLoadDiagram = async (diagramId: string) => {
        try {
            const token = sessionStorage.getItem('token');
            if (!token) {
                console.log('Not authenticated');
                return;
            }
            const userString = sessionStorage.getItem('user');
            const user = JSON.parse(userString);
            // 1. Initialize Yjs
            console.log('Initializing Yjs...');
            const doc = new Y.Doc();
            UndoRedoManager.setYDoc(doc);
            UndoRedoManager.setUserId(user.id);
            UndoRedoManager.initializeUserUndoManager();
            UndoRedoManager.setDiagramId(diagramId);

            const wsProvider = new WebsocketProvider(
                'ws://localhost:1234/',
                String(diagramId), // room name
                doc
            );

            setYDoc(doc);
            setProvider(wsProvider);

            // 2. Load data from database
            const diagramData = await authApi.getDiagramById(diagramId, token);

            // 3. Load data into Yjs (which will automatically sync to React Flow)
            const yNodes = doc.getMap('nodes');
            const yEdges = doc.getMap('edges');

            // Clear any existing data and load from database
            yNodes.clear();
            yEdges.clear();

            diagramData.nodes.forEach((node: Node) => {
                yNodes.set(node.id, node);
            });

            diagramData.edges.forEach((edge: Edge) => {
                yEdges.set(edge.id, edge);
            });

        } catch (error) {
            console.error('Error loading diagram:', error);
            setError(error instanceof Error ? error.message : 'Failed to load diagram');
        } finally {
            setIsLoading(false);
        }
    };

    const handleShapeSelect = (shapeType: ShapeType) => {
        setSelectedShape(shapeType);
    };

    const handleShapeCreated = () => {
        setSelectedShape(undefined);
    };
    if (isLoading) {
        return (
            <div className="flex flex-1 items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading diagram...</p>
                </div>
            </div>
        );
    }
    if (error) {
        return (
            <div className="flex flex-1 items-center justify-center">
                <div className="text-center">
                    <div className="text-red-500 text-2xl mb-4">⚠️</div>
                    <h2 className="text-xl font-semibold text-gray-800 mb-2">Error Loading Diagram</h2>
                    <p className="text-gray-600 mb-4">{error}</p>
                    <button
                        onClick={() => id && initializeYjsAndLoadDiagram(id)}
                        className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
                    >
                        Try Again
                    </button>
                </div>
            </div>
        );
    }


    return (
        <div className="flex flex-1 relative">
            {/* Pull Handle */}
            <div
                className="lg:hidden fixed top-1/2 left-0 z-40 bg-gray-800 text-white p-2 rounded-r-lg cursor-pointer"
                onClick={() => setShapeMenuOpen(!shapeMenuOpen)}
            >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/>
                </svg>
            </div>

            {/* Slide-out Panel */}
            <div className={`
        fixed top-0 left-0 bottom-0 z-30 w-80 bg-gray-50 border-r border-gray-200
        transform transition-transform duration-300 ease-in-out
        ${shapeMenuOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:static lg:translate-x-0
    `}>
                <div className="p-4 h-full overflow-y-auto">
                    <ShapeMenu
                        onShapeSelect={handleShapeSelect}
                        selectedShape={selectedShape}
                    />
                </div>
            </div>

            {/* Overlay */}
            {shapeMenuOpen && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
                    onClick={() => setShapeMenuOpen(false)}
                />
            )}

            {/* Main Canvas Area */}
            <div className="flex-1 bg-gray-100">
                <ReactFlowProvider>
                    <DiagramCanvas
                        selectedShape={selectedShape!}
                        onShapeCreated={handleShapeCreated}
                        yDoc={yDoc}
                        provider={provider}
                    />
                </ReactFlowProvider>
            </div>
        </div>
    );
}

export default Diagram;