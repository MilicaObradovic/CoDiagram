import React from 'react';

interface ShapeRendererProps {
    shapeType: string;
    width: number;
    height: number;
    currentLabel: React.ReactNode;
    selected: boolean;
}

export const ShapeRenderer: React.FC<ShapeRendererProps> = ({
                                                                shapeType,
                                                                width,
                                                                height,
                                                                currentLabel,
                                                                selected
                                                            }) => {
    const baseClasses = `transition-all ${selected ? 'drop-shadow-lg' : ''}`;
    switch (shapeType) {
        case 'rectangle':
            return (
                <svg width={width} height={height} className={baseClasses}>
                    <rect
                        x="2" y="2" width={width-4} height={height-4}
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        rx="4"
                    />
                    <text
                        x={width/2} y={height/2}
                        textAnchor="middle"
                        alignmentBaseline="middle"
                        fill="currentColor"
                        fontSize="13"
                        fontWeight="500"
                    >
                        {currentLabel}
                    </text>
                </svg>
            );

        case 'circle':
            const circleRadius = Math.min(width, height) / 2 - 4;
            return (
                <svg width={width} height={height} className={baseClasses}>
                    <circle
                        cx={width/2} cy={height/2} r={circleRadius}
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                    />
                    <text
                        x={width/2} y={height/2}
                        textAnchor="middle"
                        alignmentBaseline="middle"
                        fill="currentColor"
                        fontSize="13"
                        fontWeight="500"
                    >
                        {currentLabel}
                    </text>
                </svg>
            );

        case 'triangle':
            return (
                <svg width={width} height={height} className={baseClasses}>
                    <polygon
                        points={`${width/2},5 ${width-5},${height-5} 5,${height-5}`}
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinejoin="round"
                    />
                    <text
                        x={width/2} y={height/2}
                        textAnchor="middle"
                        alignmentBaseline="middle"
                        fill="currentColor"
                        fontSize="13"
                        fontWeight="500"
                    >
                        {currentLabel}
                    </text>
                </svg>
            );

        case 'diamond':
            return (
                <svg width={width} height={height} className={baseClasses}>
                    <polygon
                        points={`${width/2},5 ${width-5},${height/2} ${width/2},${height-5} 5,${height/2}`}
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinejoin="round"
                    />
                    <text
                        x={width/2} y={height/2}
                        textAnchor="middle"
                        alignmentBaseline="middle"
                        fill="currentColor"
                        fontSize="13"
                        fontWeight="500"
                    >
                        {currentLabel}
                    </text>
                </svg>
            );

        case 'cylinder':
            const cylinderRadius = Math.min(width, height) / 3;
            return (
                <svg width={width} height={height} className={baseClasses}>
                    <ellipse
                        cx={width/2} cy={cylinderRadius} rx={cylinderRadius} ry={cylinderRadius/3}
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                    />
                    <line
                        x1={width/2 - cylinderRadius} y1={cylinderRadius}
                        x2={width/2 - cylinderRadius} y2={height - cylinderRadius}
                        stroke="currentColor"
                        strokeWidth="2"
                    />
                    <line
                        x1={width/2 + cylinderRadius} y1={cylinderRadius}
                        x2={width/2 + cylinderRadius} y2={height - cylinderRadius}
                        stroke="currentColor"
                        strokeWidth="2"
                    />
                    <ellipse
                        cx={width/2} cy={height - cylinderRadius} rx={cylinderRadius} ry={cylinderRadius/3}
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                    />
                    <text
                        x={width/2} y={height/2}
                        textAnchor="middle"
                        alignmentBaseline="middle"
                        fill="currentColor"
                        fontSize="13"
                        fontWeight="500"
                    >
                        {currentLabel}
                    </text>
                </svg>
            );

        case 'uml_actor':
            const actorSize = Math.min(width, height);
            const headRadius = actorSize * 0.15;
            const bodyHeight = actorSize * 0.35;
            const legLength = actorSize * 0.25;
            const armLength = actorSize * 0.3;
            return (
                <svg width={width} height={height} className={baseClasses}>
                    {/* Head */}
                    <circle
                        cx={width/2} cy={headRadius + 5} r={headRadius}
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                    />
                    {/* Body */}
                    <line
                        x1={width/2} y1={headRadius * 2 + 5}
                        x2={width/2} y2={headRadius * 2 + 5 + bodyHeight}
                        stroke="currentColor"
                        strokeWidth="2"
                    />
                    {/* Arms */}
                    <line
                        x1={width/2 - armLength} y1={headRadius * 2 + 5 + bodyHeight * 0.3}
                        x2={width/2 + armLength} y2={headRadius * 2 + 5 + bodyHeight * 0.3}
                        stroke="currentColor"
                        strokeWidth="2"
                    />
                    {/* Legs */}
                    <line
                        x1={width/2} y1={headRadius * 2 + 5 + bodyHeight}
                        x2={width/2 - legLength} y2={headRadius * 2 + 5 + bodyHeight + legLength}
                        stroke="currentColor"
                        strokeWidth="2"
                    />
                    <line
                        x1={width/2} y1={headRadius * 2 + 5 + bodyHeight}
                        x2={width/2 + legLength} y2={headRadius * 2 + 5 + bodyHeight + legLength}
                        stroke="currentColor"
                        strokeWidth="2"
                    />
                    {/* Label */}
                    <text
                        x={width/2} y={height - 5}
                        textAnchor="middle"
                        fill="currentColor"
                        fontSize="11"
                        fontWeight="500"
                    >
                        {currentLabel}
                    </text>
                </svg>
            );

        case 'uml_class':
            return (
                <svg width={width} height={height} className={baseClasses}>
                    <rect
                        x="2" y="2" width={width-4} height={height-4}
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                    />
                    <line
                        x1="2" y1={height * 0.3} x2={width-2} y2={height * 0.3}
                        stroke="currentColor"
                        strokeWidth="2"
                    />
                    <line
                        x1="2" y1={height * 0.6} x2={width-2} y2={height * 0.6}
                        stroke="currentColor"
                        strokeWidth="2"
                    />
                    <text
                        x={width/2} y={height * 0.18}
                        textAnchor="middle"
                        fill="currentColor"
                        fontSize="13"
                        fontWeight="600"
                    >
                        {currentLabel}
                    </text>
                    <text
                        x="10" y={height * 0.45}
                        fill="currentColor"
                        fontSize="11"
                    >
                        - attributes
                    </text>
                    <text
                        x="10" y={height * 0.75}
                        fill="currentColor"
                        fontSize="11"
                    >
                        + methods()
                    </text>
                </svg>
            );

        case 'uml_use_case':
            const useCaseRadiusX = width/2 - 4;
            const useCaseRadiusY = height/2 - 4;
            return (
                <svg width={width} height={height} className={baseClasses}>
                    <ellipse
                        cx={width/2} cy={height/2} rx={useCaseRadiusX} ry={useCaseRadiusY}
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                    />
                    <text
                        x={width/2} y={height/2}
                        textAnchor="middle"
                        alignmentBaseline="middle"
                        fill="currentColor"
                        fontSize="13"
                        fontWeight="500"
                    >
                        {currentLabel}
                    </text>
                </svg>
            );

        case 'text':
            return (
                <div className={`p-3 min-w-[100px] max-w-[200px] border border-dashed border-foreground/40 rounded bg-background/50 ${baseClasses}`}>
                    <p className="text-sm font-medium text-foreground text-center">{currentLabel}</p>
                </div>
            );

        default:
            return (
                <svg width={width} height={height} className={baseClasses}>
                    <rect
                        x="2" y="2" width={width-4} height={height-4}
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        rx="4"
                    />
                    <text
                        x={width/2} y={height/2}
                        textAnchor="middle"
                        alignmentBaseline="middle"
                        fill="currentColor"
                        fontSize="13"
                        fontWeight="500"
                    >
                        {currentLabel}
                    </text>
                </svg>
            );
    }
};

export default ShapeRenderer;