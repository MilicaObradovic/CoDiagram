import type {DiagramResponse, ShapeType} from "../types/diagram.ts";
import ShapeMenu from "./shapeMenu.tsx";
import DiagramCanvas from "./diagramCanvas.tsx";
import {useCallback, useEffect, useState} from "react";
import {type Edge, ReactFlowProvider} from "reactflow";
import {useParams} from "react-router-dom";
import {authApi} from "../services/authApi.ts";
import {useStore} from "../store";

function Home() {
    const [selectedShape, setSelectedShape] = useState<ShapeType>();
    const { id } = useParams();
    const [error, setError] = useState('');
    const [diagram, setDiagram] = useState<DiagramResponse | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const {
        nodes,
        edges,
        setNodes,
        setEdges,
    } = useStore();

    useEffect(() => {
        if (id) {
            loadDiagram(id);
        }
    }, [id]);
    const useDebouncedSave = (diagramId: string, nodes: Node[], edges: Edge[], delay: number = 3000) => {

        console.log(nodes);
        console.log(edges);
        const saveDiagram = useCallback(async () => {
            try {
                const token = localStorage.getItem('token');
                if (!token) return;

                await authApi.updateDiagram(diagramId, { nodes, edges }, token);
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

    const loadDiagram = async (diagramId: string) => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                setError('Not authenticated');
                return;
            }

            const diagramData = await authApi.getDiagramById(diagramId, token);
            setDiagram(diagramData);
            console.log(diagramData.nodes);
            console.log('Diagram loaded');
            setNodes(diagramData.nodes)
            setEdges(diagramData.edges)
            console.log(diagramData);
        } catch (error) {
            console.error('Error loading diagram:', error);
            setError(error instanceof Error ? error.message : 'Failed to load diagram');
        } finally {
            setIsLoading(false);
        }
    };
    useDebouncedSave(id, nodes, edges, 3000);

    const handleShapeSelect = (shapeType: ShapeType) => {
        setSelectedShape(shapeType);
    };

    const handleShapeCreated = () => {
        setSelectedShape(undefined);
    };

    return (
        <div className="h-screen flex flex-col">
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
                        />
                    </ReactFlowProvider>
                </div>
            </div>
        </div>
    );
}

export default Home;