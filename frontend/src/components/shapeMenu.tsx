import React, { useMemo, useState } from 'react';
import { type ShapeType, DiagramCategory, type ShapeDefinition, ShapeTypes } from '../types/diagram';

interface ShapeMenuProps {
    onShapeSelect: (shapeType: ShapeType) => void;
    selectedShape?: ShapeType;
}

const ShapeMenu: React.FC<ShapeMenuProps> = ({ onShapeSelect, selectedShape }) => {
    const [openCategories, setOpenCategories] = useState<{ [key: string]: boolean }>({
        [DiagramCategory.BASIC_SHAPES]: true,
        [DiagramCategory.UML]: false,
        [DiagramCategory.MIND_MAP]: false,
        [DiagramCategory.CONCEPTUAL]: false,
    });

    const shapeDefinitions: ShapeDefinition[] = useMemo(() => [
        // Basic Shapes
        { type: ShapeTypes.RECTANGLE, icon: '□', name: 'Rectangle', category: DiagramCategory.BASIC_SHAPES },
        { type: ShapeTypes.CIRCLE, icon: '○', name: 'Circle', category: DiagramCategory.BASIC_SHAPES },
        { type: ShapeTypes.TRIANGLE, icon: '△', name: 'Triangle', category: DiagramCategory.BASIC_SHAPES },
        { type: ShapeTypes.DIAMOND, icon: '◇', name: 'Diamond', category: DiagramCategory.BASIC_SHAPES },
        { type: ShapeTypes.TEXT, icon: 'T', name: 'Text', category: DiagramCategory.BASIC_SHAPES },
        { type: ShapeTypes.LINE, icon: '─', name: 'Line', category: DiagramCategory.BASIC_SHAPES },
        { type: ShapeTypes.ARROW, icon: '→', name: 'Arrow', category: DiagramCategory.BASIC_SHAPES },
        { type: ShapeTypes.CYLINDER, icon: '⛁', name: 'Cylinder', category: DiagramCategory.BASIC_SHAPES },

        // UML Diagrams
        { type: ShapeTypes.UML_CLASS, icon: 'C', name: 'Class', category: DiagramCategory.UML },
        { type: ShapeTypes.UML_ACTOR, icon: 'A', name: 'Actor', category: DiagramCategory.UML },
        { type: ShapeTypes.UML_USE_CASE, icon: 'U', name: 'Use Case', category: DiagramCategory.UML },
        { type: ShapeTypes.UML_COMPONENT, icon: '⚙', name: 'Component', category: DiagramCategory.UML },

        // Mind Maps
        { type: ShapeTypes.MIND_MAP_CENTRAL, icon: '●', name: 'Central Idea', category: DiagramCategory.MIND_MAP },
        { type: ShapeTypes.MIND_MAP_TOPIC, icon: '○', name: 'Main Topic', category: DiagramCategory.MIND_MAP },
        { type: ShapeTypes.MIND_MAP_SUBTOPIC, icon: '◐', name: 'Subtopic', category: DiagramCategory.MIND_MAP },

        // Conceptual Diagrams
        { type: ShapeTypes.CONCEPT_ENTITY, icon: 'E', name: 'Entity', category: DiagramCategory.CONCEPTUAL },
        { type: ShapeTypes.CONCEPT_PROCESS, icon: 'P', name: 'Process', category: DiagramCategory.CONCEPTUAL },
        { type: ShapeTypes.CONCEPT_DATABASE, icon: '🗄', name: 'Database', category: DiagramCategory.CONCEPTUAL },
    ], []);

    const categories = useMemo(() => [
        { id: DiagramCategory.BASIC_SHAPES, name: 'Basic Shapes', icon: '🟦' },
        { id: DiagramCategory.UML, name: 'UML Diagrams', icon: '📐' },
        { id: DiagramCategory.MIND_MAP, name: 'Mind Maps', icon: '🧠' },
        { id: DiagramCategory.CONCEPTUAL, name: 'Conceptual Diagrams', icon: '🔗' },
    ], []);

    const toggleCategory = (categoryId: DiagramCategory) => {
        setOpenCategories(prev => ({
            ...prev,
            [categoryId]: !prev[categoryId]
        }));
    };

    const handleShapeSelect = (shapeType: ShapeType) => {
        onShapeSelect(shapeType);
    };

    const getShapesByCategory = (categoryId: DiagramCategory) => {
        return shapeDefinitions.filter(shape => shape.category === categoryId);
    };

    return (
        <div className="w-64 bg-white border-r border-gray-200 h-full flex flex-col">
            {/* Header */}
            <div className="p-4 border-b border-gray-200">
                <h3 className="text-sm font-semibold text-gray-700">Diagram Elements</h3>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto">
                <div className="p-4 space-y-4">
                    {categories.map((category) => {
                        const shapes = getShapesByCategory(category.id);
                        const isOpen = openCategories[category.id];

                        return (
                            <div key={category.id} className="border border-gray-200 rounded-lg">
                                {/* Category Header */}
                                <button
                                    onClick={() => toggleCategory(category.id)}
                                    className="w-full flex items-center justify-between p-3 hover:bg-gray-50 rounded-t-lg transition-colors"
                                >
                                    <div className="flex items-center gap-2">
                                        <span className="text-base">{category.icon}</span>
                                        <span className="text-sm font-medium text-gray-700">
                                            {category.name}
                                        </span>
                                    </div>
                                    <svg
                                        className={`w-4 h-4 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </button>

                                {/* Category Content */}
                                {isOpen && (
                                    <div className="p-3 border-t border-gray-200">
                                        <div className="grid grid-cols-3 gap-2">
                                            {shapes.map((shape) => (
                                                <button
                                                    key={shape.type}
                                                    onClick={() => handleShapeSelect(shape.type)}
                                                    className={`flex flex-col items-center justify-center p-2 rounded border transition-all hover:bg-gray-50 hover:border-gray-300 ${
                                                        selectedShape === shape.type
                                                            ? 'bg-blue-50 border-blue-300 shadow-sm'
                                                            : 'bg-white border-gray-200'
                                                    }`}
                                                    title={shape.name}
                                                >
                                                    <span className="text-lg mb-1">{shape.icon}</span>
                                                    <span className="text-xs text-gray-600 text-center leading-tight">
                                                        {shape.name}
                                                    </span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Selected Shape Info */}
            {selectedShape && (
                <div className="p-4 border-t border-gray-200 bg-gray-50">
                    <p className="text-xs text-gray-600 text-center">
                        Selected: <span className="font-medium">{shapeDefinitions.find(s => s.type === selectedShape)?.name}</span>
                    </p>
                </div>
            )}
        </div>
    );
};

export default ShapeMenu;