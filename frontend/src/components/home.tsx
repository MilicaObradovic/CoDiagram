import type {ShapeType, ToolbarState} from "../types/diagram.ts";
import Toolbar from "./toolbar.tsx";
import ShapeMenu from "./shapeMenu.tsx";
import DiagramCanvas from "./diagramCanvas.tsx";
import {useState} from "react";
import {ReactFlowProvider} from "reactflow";

function Home() {
    const [toolbarState, setToolbarState] = useState<ToolbarState>({
        selectedTool: 'select',
        fillColor: '#3B82F6',
        strokeColor: '#1E40AF',
        strokeWidth: 2,
        fontSize: 16,
    });

    const [selectedShape, setSelectedShape] = useState<ShapeType>();

    const handleToolbarStateChange = (newState: Partial<ToolbarState>) => {
        setToolbarState(prev => ({...prev, ...newState}));
    };

    const handleShapeSelect = (shapeType: ShapeType) => {
        setSelectedShape(shapeType);
        setToolbarState(prev => ({...prev, selectedTool: 'shape'}));
    };

    const handleUndo = () => {
        // Implement undo logic
        console.log('Undo');
    };

    const handleRedo = () => {
        // Implement redo logic
        console.log('Redo');
    };

    return (
        <div className="h-screen flex flex-col">
            <Toolbar
                toolbarState={toolbarState}
                onToolbarStateChange={handleToolbarStateChange}
                onShapeSelect={handleShapeSelect}
                onUndo={handleUndo}
                onRedo={handleRedo}
                canUndo={true}
                canRedo={false}
            />

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
                            toolbarState={toolbarState}
                            selectedShape={selectedShape!}
                        />
                    </ReactFlowProvider>
                </div>
            </div>
        </div>
    );
}

export default Home;