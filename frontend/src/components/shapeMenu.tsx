// components/ShapeMenu.tsx
import React from 'react';
import {type ShapeType, ShapeTypes} from '../types/diagram';

interface ShapeMenuProps {
    onShapeSelect: (shapeType: ShapeType) => void;
    selectedShape?: ShapeType;
}

const ShapeMenu: React.FC<ShapeMenuProps> = ({ onShapeSelect, selectedShape }) => {
    const shapes = [
        { type: ShapeTypes.RECTANGLE, icon: '□', name: 'Rectangle' },
        { type: ShapeTypes.CIRCLE, icon: '○', name: 'Circle' },
        { type: ShapeTypes.TRIANGLE, icon: '△', name: 'Triangle' },
        { type: ShapeTypes.DIAMOND, icon: '◇', name: 'Diamond' },
        { type: ShapeTypes.ARROW, icon: '→', name: 'Arrow' },
        { type: ShapeTypes.TEXT, icon: 'T', name: 'Text' },
    ];

    return (
        <div className="bg-white rounded-lg shadow-lg p-4 w-64">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Shapes</h3>
            <div className="grid grid-cols-4 gap-2">
                {shapes.map((shape) => (
                    <button
                        key={shape.type}
                        onClick={() => onShapeSelect(shape.type)}
                        className={`flex flex-col items-center p-2 rounded-lg border-2 transition-all hover:bg-blue-50 hover:border-blue-200 ${
                            selectedShape === shape.type
                                ? 'bg-blue-100 border-blue-500'
                                : 'bg-white border-gray-200'
                        }`}
                        title={shape.name}
                    >
                        <span className="text-xl mb-1">{shape.icon}</span>
                        <span className="text-xs text-gray-600">{shape.name}</span>
                    </button>
                ))}
            </div>
        </div>
    );
};

export default ShapeMenu;