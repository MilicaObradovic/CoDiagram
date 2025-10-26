import { type EdgeType, EdgeTypes } from "../types/diagram.ts";

interface EdgeToolbarProps {
    selectedEdgeType: EdgeType;
    onEdgeTypeSelect: (edgeType: EdgeType) => void;
    selectedEdgeId?: string;
    onUpdateEdgeType?: (edgeId: string, edgeType: EdgeType) => void;
}

const EdgeToolbar: React.FC<EdgeToolbarProps> = ({
                                                     selectedEdgeType,
                                                     onEdgeTypeSelect,
                                                     selectedEdgeId,
                                                     onUpdateEdgeType
                                                 }) => {
    const edgeTypes = [
        {
            type: EdgeTypes.STEP,
            name: 'Step',
            icon: <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                <path d="M5 10 L8 7 L12 7 L15 10 L12 13 L8 13 Z" />
            </svg>
        },
        {
            type: EdgeTypes.SMOOTHSTEP,
            name: 'Smooth',
            icon: <svg width="20" height="20" viewBox="0 0 20 20">
                <path d="M5 7 C7 7, 8 13, 10 13 C12 13, 13 7, 15 7" fill="none" stroke="currentColor" strokeWidth="2"/>
            </svg>
        },
        {
            type: EdgeTypes.STRAIGHT,
            name: 'Straight',
            icon: <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                <line x1="5" y1="10" x2="15" y2="10" stroke="currentColor" strokeWidth="2"/>
            </svg>
        },
        {
            type: EdgeTypes.BEZIER,
            name: 'Curved',
            icon: <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                <path d="M5 15 Q10 5, 15 15" fill="none" stroke="currentColor" strokeWidth="2"/>
            </svg>
        },
    ];

    const handleEdgeTypeSelect = (edgeType: EdgeType) => {
        onEdgeTypeSelect(edgeType);
        if (selectedEdgeId && onUpdateEdgeType) {
            onUpdateEdgeType(selectedEdgeId, edgeType);
        }
    };

    return (
        <div className="w-16 bg-white border-l border-gray-200 flex flex-col py-4">
            <h4 className="text-xs text-gray-500 font-medium text-center mb-4 px-1">
                {selectedEdgeId ? 'Change Edge' : 'Edges'}
            </h4>

            <div className="flex-1 flex flex-col items-center space-y-3">
                {edgeTypes.map((edgeType) => (
                    <button
                        key={edgeType.type}
                        onClick={() => handleEdgeTypeSelect(edgeType.type)}
                        className={`w-12 h-12 flex items-center justify-center rounded-lg border-2 transition-all ${
                            selectedEdgeType === edgeType.type
                                ? 'bg-blue-50 border-blue-500 text-blue-600 shadow-sm'
                                : 'border-gray-200 text-gray-500 hover:border-gray-300 hover:bg-gray-50'
                        }`}
                        title={edgeType.name}
                    >
                        {edgeType.icon}
                    </button>
                ))}
            </div>
        </div>
    );
};

export default EdgeToolbar;