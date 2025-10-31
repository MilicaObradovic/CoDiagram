import type {ShapeType} from "../types/diagram.ts";
import ShapeMenu from "./shapeMenu.tsx";
import DiagramCanvas from "./diagramCanvas.tsx";
import {useState} from "react";
import {ReactFlowProvider} from "reactflow";

function Home() {


    const [selectedShape, setSelectedShape] = useState<ShapeType>();


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