import type {ShapeType} from "../types/diagram.ts";
import ShapeMenu from "./shapeMenu.tsx";
import DiagramCanvas from "./diagramCanvas.tsx";
import {useCallback, useEffect, useState} from "react";
import {type Edge, ReactFlowProvider} from "reactflow";
import {useParams} from "react-router-dom";
import {authApi} from "../services/authApi.ts";
import {useStore} from "../store";
import {UndoRedo} from "../store/undo-redo.ts";
import {WebsocketProvider} from "y-websocket";
import * as Y from 'yjs';
import type {Node} from "@xyflow/react";

function Diagram() {
    const [selectedShape, setSelectedShape] = useState<ShapeType>();
    const {id} = useParams();
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const {
        nodes,
        edges,
        setLoadedNodesAndEdges,
        initializeYjs
    } = useStore();
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

            // 1. Initialize Yjs FIRST
            console.log('Initializing Yjs...');
            const doc = new Y.Doc();
            UndoRedo.setYDoc(doc);

            const wsProvider = new WebsocketProvider(
                'ws://localhost:1234/',
                String(diagramId), // Use diagramId as room name
                doc
            );

            setYDoc(doc);
            setProvider(wsProvider);

            // 2. Initialize store with Yjs
            initializeYjs(doc);

            // 3. Load data from database
            const diagramData = await authApi.getDiagramById(diagramId, token);

            // 4. Load data into Yjs (which will automatically sync to React Flow)
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
            setLoadedNodesAndEdges(diagramData.nodes, diagramData.edges);

        } catch (error) {
            console.error('Error loading diagram:', error);
            setError(error instanceof Error ? error.message : 'Failed to load diagram');
        } finally {
            setIsLoading(false);
        }
    };
    const useDebouncedSave = (diagramId: string | undefined, nodes: Node[], edges: Edge[], delay: number = 3000) => {
        const saveDiagram = useCallback(async () => {
            try {
                const token = sessionStorage.getItem('token');
                if (!token) return;

                await authApi.updateDiagram(diagramId, {nodes, edges}, token);
                console.log('Diagram auto-saved');
            } catch (error) {
                console.error('Auto-save failed:', error);
            }
        }, [diagramId, nodes, edges]);

        useEffect(() => {
            if (!diagramId || nodes.length === 0) return;

            const timer = setTimeout(saveDiagram, delay);
            return () => clearTimeout(timer);
        }, [saveDiagram, delay, diagramId, nodes.length]);
    };
    useDebouncedSave(id, nodes, edges, 3000);

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
        <div className="flex flex-1">
            {/* Sidebar with Shape Menu */}
            <div className="w-80 bg-gray-50 border-r border-gray-200 p-4">
                <ShapeMenu
                    onShapeSelect={handleShapeSelect}
                    selectedShape={selectedShape}
                />
            </div>

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