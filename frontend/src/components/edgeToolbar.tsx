import {type EdgeType, EdgeTypes, type LineStyle, LineStyles} from "../types/diagram.ts";
import {useState} from "react";

interface EdgeToolbarProps {
    selectedEdgeType: EdgeType;
    onEdgeTypeSelect: (edgeType: EdgeType) => void;
    selectedEdgeId?: string;
    onUpdateEdge?: (edgeId: string, edgeType: EdgeType, lineStyle: LineStyle) => void;
    selectedLineStyle?: LineStyle;
    onLineStyleSelect: (lineStyle: LineStyle) => void;
}

const EdgeToolbar: React.FC<EdgeToolbarProps> = ({
                                                     selectedEdgeType,
                                                     onEdgeTypeSelect,
                                                     selectedEdgeId,
                                                     onUpdateEdge,
                                                     selectedLineStyle = LineStyles.SOLID,
                                                     onLineStyleSelect
                                                 }) => {
    const [isLineStyleOpen, setIsLineStyleOpen] = useState(false);
    const [isEdgeTypeOpen, setIsEdgeTypeOpen] = useState(false);

    const edgeTypes = [
        {
            type: EdgeTypes.STEP,
            name: 'Step',
            icon: <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M5 7 L10 7 L10 13 L15 13" strokeLinecap="round"/>
            </svg>
        },
        {
            type: EdgeTypes.SMOOTHSTEP,
            name: 'Smooth',
            icon: <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M5 7 L8 7 Q10 7, 10 10 Q10 13, 12 13 L15 13"/>
            </svg>
        },
        {
            type: EdgeTypes.BEZIER,
            name: 'Curved',
            icon: <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M5 7 C7 5, 8 5, 10 10 C12 15, 13 15, 15 13"/>
            </svg>
        },
        {
            type: EdgeTypes.STRAIGHT,
            name: 'Straight',
            icon: <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                <line x1="5" y1="10" x2="15" y2="10" stroke="currentColor" strokeWidth="2"/>
            </svg>
        },
    ];
    const lineStyles = [
        {
            style: LineStyles.SOLID,
            name: 'Solid',
            icon: <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="5" y1="10" x2="15" y2="10"/>
            </svg>
        },
        {
            style: LineStyles.DASHED,
            name: 'Dashed',
            icon: <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2"
                       strokeDasharray="4,2">
                <line x1="5" y1="10" x2="15" y2="10"/>
            </svg>
        },
        {
            style: LineStyles.DOTTED,
            name: 'Dotted',
            icon: <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2"
                       strokeDasharray="2,2">
                <line x1="5" y1="10" x2="15" y2="10"/>
            </svg>
        },
    ];

    const handleEdgeTypeSelect = (edgeType: EdgeType) => {
        onEdgeTypeSelect(edgeType);
        if (selectedEdgeId && onUpdateEdge) {
            onUpdateEdge(selectedEdgeId, edgeType, selectedLineStyle);
        }
        setIsEdgeTypeOpen(false);
    };

    const handleLineStyleSelect = (lineStyle: LineStyle) => {
        onLineStyleSelect(lineStyle);
        if (selectedEdgeId && onUpdateEdge) {
            onUpdateEdge(selectedEdgeId, selectedEdgeType, lineStyle);
        }
        setIsLineStyleOpen(false);
    };
    const getEdgeTypeIcon = (type: EdgeType) => {
        return edgeTypes.find(et => et.type === type)?.icon;
    };

    return (
        <div className="w-20 bg-white border-l border-gray-200 flex flex-col py-4 space-y-4">
            <h4 className="text-xs text-gray-500 font-medium text-center px-1">
                {selectedEdgeId ? 'Change Edge' : 'Edges'}
            </h4>

            {/* Edge Type Dropdown */}
            <div className="relative">
                <button
                    onClick={() => setIsEdgeTypeOpen(!isEdgeTypeOpen)}
                    className="w-12 h-12 mx-auto flex items-center justify-center rounded-lg border-2 border-gray-200 text-gray-500 hover:border-gray-300 hover:bg-gray-50 transition-all"
                    title="Edge Type"
                >
                    {getEdgeTypeIcon(selectedEdgeType)}
                </button>

                {isEdgeTypeOpen && (
                    <div
                        className="absolute top-full left-1/2 transform -translate-x-1/2 mb-2 bg-white border border-gray-200 rounded-lg shadow-lg p-2 z-10">
                        <div className="flex flex-col space-y-2">
                            {edgeTypes.map((edgeType) => (
                                <button
                                    key={edgeType.type}
                                    onClick={() => handleEdgeTypeSelect(edgeType.type)}
                                    className={`w-10 h-10 flex items-center justify-center rounded border transition-all ${
                                        selectedEdgeType === edgeType.type
                                            ? 'bg-blue-50 border-blue-500 text-blue-600'
                                            : 'border-gray-200 text-gray-500 hover:border-gray-300 hover:bg-gray-50'
                                    }`}
                                    title={edgeType.name}
                                >
                                    {edgeType.icon}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Line Style Dropdown */}
            <div className="relative">
                <button
                    onClick={() => setIsLineStyleOpen(!isLineStyleOpen)}
                    className="w-12 h-12 mx-auto flex items-center justify-center rounded-lg border-2 border-gray-200 text-gray-500 hover:border-gray-300 hover:bg-gray-50 transition-all"
                    title="Line Style"
                >
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="5" y1="10" x2="15" y2="10"
                              strokeDasharray={
                                  selectedLineStyle === LineStyles.DASHED ? "4,2" :
                                      selectedLineStyle === LineStyles.DOTTED ? "2,2" : "none"
                              }
                        />
                    </svg>
                </button>

                {isLineStyleOpen && (
                    <div
                        className="absolute top-full left-1/2 transform -translate-x-1/2 mb-2 bg-white border border-gray-200 rounded-lg shadow-lg p-2 z-10">
                        <div className="flex flex-col space-y-2">
                            {lineStyles.map((lineStyle) => (
                                <button
                                    key={lineStyle.style}
                                    onClick={() => handleLineStyleSelect(lineStyle.style)}
                                    className={`w-10 h-10 flex items-center justify-center rounded border transition-all ${
                                        selectedLineStyle === lineStyle.style
                                            ? 'bg-blue-50 border-blue-500 text-blue-600'
                                            : 'border-gray-200 text-gray-500 hover:border-gray-300 hover:bg-gray-50'
                                    }`}
                                    title={lineStyle.name}
                                >
                                    {lineStyle.icon}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default EdgeToolbar;