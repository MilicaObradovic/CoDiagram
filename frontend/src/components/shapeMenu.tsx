import React, {useMemo, useState} from 'react';
import {
    Square,
    Circle,
    Triangle,
    Diamond,
    Type,
    Database,
    Box,
    User,
    Circle as CircleIcon,
    Settings,
    CircleDot,
    FileText,
    Workflow,
    HardDrive,
    ChevronDown
} from 'lucide-react';
import {
    type ShapeType,
    type DiagramCategory,
    type ShapeDefinition,
    ShapeTypes,
    DiagramCategories
} from '../types/diagram';

interface ShapeMenuProps {
    onShapeSelect: (shapeType: ShapeType) => void;
    selectedShape?: ShapeType;
}

const ShapeMenu: React.FC<ShapeMenuProps> = ({onShapeSelect, selectedShape}) => {
    const [openCategories, setOpenCategories] = useState<{ [key: string]: boolean }>({
        [DiagramCategories.BASIC_SHAPES]: true,
        [DiagramCategories.UML]: false,
        [DiagramCategories.MIND_MAP]: false,
        [DiagramCategories.CONCEPTUAL]: false,
    });

    const shapeDefinitions: ShapeDefinition[] = useMemo(() => [
        // Basic Shapes
        {type: ShapeTypes.RECTANGLE, icon: Square, name: 'Rectangle', category: DiagramCategories.BASIC_SHAPES},
        {type: ShapeTypes.CIRCLE, icon: Circle, name: 'Circle', category: DiagramCategories.BASIC_SHAPES},
        {type: ShapeTypes.TRIANGLE, icon: Triangle, name: 'Triangle', category: DiagramCategories.BASIC_SHAPES},
        {type: ShapeTypes.DIAMOND, icon: Diamond, name: 'Diamond', category: DiagramCategories.BASIC_SHAPES},
        {type: ShapeTypes.TEXT, icon: Type, name: 'Text', category: DiagramCategories.BASIC_SHAPES},
        {type: ShapeTypes.CYLINDER, icon: Database, name: 'Cylinder', category: DiagramCategories.BASIC_SHAPES},

        // UML Diagrams
        {type: ShapeTypes.UML_CLASS, icon: Box, name: 'Class', category: DiagramCategories.UML},
        {type: ShapeTypes.UML_ACTOR, icon: User, name: 'Actor', category: DiagramCategories.UML},
        {type: ShapeTypes.UML_USE_CASE, icon: CircleIcon, name: 'Use Case', category: DiagramCategories.UML},
        {type: ShapeTypes.UML_COMPONENT, icon: Settings, name: 'Component', category: DiagramCategories.UML},

        // Mind Maps
        {
            type: ShapeTypes.MIND_MAP_CENTRAL,
            icon: CircleDot,
            name: 'Central Idea',
            category: DiagramCategories.MIND_MAP
        },
        {type: ShapeTypes.MIND_MAP_TOPIC, icon: Circle, name: 'Main Topic', category: DiagramCategories.MIND_MAP},
        {type: ShapeTypes.MIND_MAP_SUBTOPIC, icon: CircleIcon, name: 'Subtopic', category: DiagramCategories.MIND_MAP},

        // Conceptual Diagrams
        {type: ShapeTypes.CONCEPT_ENTITY, icon: FileText, name: 'Entity', category: DiagramCategories.CONCEPTUAL},
        {type: ShapeTypes.CONCEPT_PROCESS, icon: Workflow, name: 'Process', category: DiagramCategories.CONCEPTUAL},
        {type: ShapeTypes.CONCEPT_DATABASE, icon: HardDrive, name: 'Database', category: DiagramCategories.CONCEPTUAL},
    ], []);

    const categories = useMemo(() => [
        {id: DiagramCategories.BASIC_SHAPES, name: 'Basic Shapes', icon: Square},
        {id: DiagramCategories.UML, name: 'UML Diagrams', icon: Box},
        {id: DiagramCategories.MIND_MAP, name: 'Mind Maps', icon: CircleDot},
        {id: DiagramCategories.CONCEPTUAL, name: 'Conceptual', icon: Workflow},
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
        <div className="w-full bg-background  border-border h-full flex flex-col">
            {/* Header */}
            <div className="px-4 py-3 border-b border-border">
                <h3 className="text-sm font-medium text-foreground">Elements</h3>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto">
                <div className="p-2 space-y-1.5">
                    {categories.map((category) => {
                        const shapes = getShapesByCategory(category.id);
                        const isOpen = openCategories[category.id];
                        const CategoryIcon = category.icon;

                        return (
                            <div key={category.id} className="border border-border rounded-md overflow-hidden">
                                {/* Category Header */}
                                <button
                                    onClick={() => toggleCategory(category.id)}
                                    className="w-full flex items-center justify-between px-3 py-2 hover:bg-muted/50 transition-colors"
                                >
                                    <div className="flex items-center gap-2">
                                        <CategoryIcon className="h-4 w-4 text-muted-foreground"/>
                                        <span className="text-sm font-medium text-foreground">
                      {category.name}
                    </span>
                                    </div>
                                    <ChevronDown
                                        className={`h-4 w-4 text-muted-foreground transition-transform ${isOpen ? 'rotate-180' : ''}`}
                                    />
                                </button>

                                {/* Category Content */}
                                {isOpen && (
                                    <div className="p-2 border-t border-border bg-muted/20">
                                        <div className="grid grid-cols-3 gap-1">
                                            {shapes.map((shape) => {
                                                const ShapeIcon = shape.icon;
                                                return (
                                                    <button
                                                        key={shape.type}
                                                        onClick={() => handleShapeSelect(shape.type)}
                                                        className={`flex flex-col items-center justify-center p-2 rounded transition-colors ${
                                                            selectedShape === shape.type
                                                                ? 'bg-primary text-primary-foreground'
                                                                : 'hover:bg-muted'
                                                        }`}
                                                        title={shape.name}
                                                    >
                                                        <ShapeIcon className="h-5 w-5 mb-1"/>
                                                        <span className="text-[10px] text-center leading-tight">
                              {shape.name}
                            </span>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

        </div>
    );
};

export default ShapeMenu;
