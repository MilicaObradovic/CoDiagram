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
                        x="2" y="2" width={width - 4} height={height - 4}
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        rx="4"
                    />
                    <text
                        x={width / 2} y={height / 2}
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

        case 'circle': {
            const circleRadiusX = width / 2 - 4;
            const circleRadiusY = height / 2 - 4;
            return (
                <svg width={width} height={height} className={baseClasses}>
                    <ellipse
                        cx={width / 2} cy={height / 2} rx={circleRadiusX} ry={circleRadiusY}
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                    />
                    <text
                        x={width / 2} y={height / 2}
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

        case 'triangle':
            return (
                <svg width={width} height={height} className={baseClasses}>
                    <polygon
                        points={`${width / 2},5 ${width - 5},${height - 5} 5,${height - 5}`}
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinejoin="round"
                    />
                    <text
                        x={width / 2} y={height / 2}
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
                        points={`${width / 2},5 ${width - 5},${height / 2} ${width / 2},${height - 5} 5,${height / 2}`}
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinejoin="round"
                    />
                    <text
                        x={width / 2} y={height / 2}
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

        case 'cylinder': {
            const cylinderRadiusX = width / 2;
            const cylinderRadiusY = cylinderRadiusX / 4;
            return (
                <svg width={width} height={height} className={baseClasses}>
                    {/* Top ellipse */}
                    <ellipse
                        cx={width / 2}
                        cy={cylinderRadiusY + 2}
                        rx={cylinderRadiusX}
                        ry={cylinderRadiusY}
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                    />
                    {/* Left side line */}
                    <line
                        x1={width / 2 - cylinderRadiusX}
                        y1={cylinderRadiusY + 2}
                        x2={width / 2 - cylinderRadiusX}
                        y2={height - cylinderRadiusY - 2}
                        stroke="currentColor"
                        strokeWidth="2"
                    />
                    {/* Right side line */}
                    <line
                        x1={width / 2 + cylinderRadiusX}
                        y1={cylinderRadiusY + 2}
                        x2={width / 2 + cylinderRadiusX}
                        y2={height - cylinderRadiusY - 2}
                        stroke="currentColor"
                        strokeWidth="2"
                    />
                    {/* Bottom ellipse */}
                    <ellipse
                        cx={width / 2}
                        cy={height - cylinderRadiusY - 2}
                        rx={cylinderRadiusX}
                        ry={cylinderRadiusY}
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                    />
                    {/* Text label */}
                    <text
                        x={width / 2}
                        y={height / 2}
                        textAnchor="middle"
                        alignmentBaseline="middle"
                        fill="currentColor"
                        fontSize={Math.min(13, width * 0.08)}
                        fontWeight="500"
                    >
                        {currentLabel}
                    </text>
                </svg>
            );
        }

        case 'uml_actor': {
            const headRadius = Math.min(width, height) * 0.1; // Smaller head for more body space
            const bodyHeight = height * 0.4;
            const legLength = height * 0.25;

            return (
                <svg width={width} height={height} className={baseClasses}>
                    {/* Head */}
                    <circle
                        cx={width / 2}
                        cy={headRadius + 5}
                        r={headRadius}
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                    />
                    {/* Body */}
                    <line
                        x1={width / 2}
                        y1={headRadius * 2 + 5}
                        x2={width / 2}
                        y2={headRadius * 2 + 5 + bodyHeight}
                        stroke="currentColor"
                        strokeWidth="2"
                    />
                    {/* Arms - stretch almost full width */}
                    <line
                        x1={width * 0.05} // 5% from left edge
                        y1={headRadius * 2 + 5 + bodyHeight * 0.3}
                        x2={width * 0.95} // 95% from left edge
                        y2={headRadius * 2 + 5 + bodyHeight * 0.3}
                        stroke="currentColor"
                        strokeWidth="2"
                    />
                    {/* Legs - spread wider */}
                    <line
                        x1={width / 2}
                        y1={headRadius * 2 + 5 + bodyHeight}
                        x2={width * 0.2} // 20% from left edge
                        y2={headRadius * 2 + 5 + bodyHeight + legLength}
                        stroke="currentColor"
                        strokeWidth="2"
                    />
                    <line
                        x1={width / 2}
                        y1={headRadius * 2 + 5 + bodyHeight}
                        x2={width * 0.8} // 80% from left edge
                        y2={headRadius * 2 + 5 + bodyHeight + legLength}
                        stroke="currentColor"
                        strokeWidth="2"
                    />
                    {/* Label */}
                    <text
                        x={width / 2}
                        y={height - 5}
                        textAnchor="middle"
                        fill="currentColor"
                        fontSize={Math.min(12, width * 0.08)}
                        fontWeight="500"
                    >
                        {currentLabel}
                    </text>
                </svg>
            );
        }

        case 'uml_class':
            return (
                <svg width={width} height={height} className={baseClasses}>
                    <rect
                        x="2" y="2" width={width - 4} height={height - 4}
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                    />
                    <line
                        x1="2" y1={height * 0.3} x2={width - 2} y2={height * 0.3}
                        stroke="currentColor"
                        strokeWidth="2"
                    />
                    <line
                        x1="2" y1={height * 0.6} x2={width - 2} y2={height * 0.6}
                        stroke="currentColor"
                        strokeWidth="2"
                    />
                    <text
                        x={width / 2} y={height * 0.18}
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

        case 'uml_use_case': {
            const useCaseRadiusX = width / 2 - 4;
            const useCaseRadiusY = height / 2 - 4;
            return (
                <svg width={width} height={height} className={baseClasses}>
                    <ellipse
                        cx={width / 2} cy={height / 2} rx={useCaseRadiusX} ry={useCaseRadiusY}
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                    />
                    <text
                        x={width / 2} y={height / 2}
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
        case 'uml_component':
            return (
                <svg width={width} height={height} className={baseClasses}>
                    <rect
                        x="2" y={height * 0.22} width={width - 4} height={height * 0.76}
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                    />
                    <rect
                        x={width * 0.07} y="2" width={width * 0.18} height={height * 0.17}
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                    />
                    <rect
                        x={width * 0.29} y="2" width={width * 0.18} height={height * 0.17}
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                    />
                    <text
                        x={width / 2} y={height * 0.67}
                        textAnchor="middle"
                        alignmentBaseline="middle"
                        fill="currentColor"
                        fontSize={Math.min(13, width * 0.09)}
                        fontWeight="500"
                    >
                        {currentLabel}
                    </text>
                </svg>
            );

        case 'mind_map_central': {
            const mindmapRadiusX = width / 2 - 4;
            const mindmapRadiusY = height / 2 - 4;
            return (
                <svg width={width} height={height} className={baseClasses}>
                    <ellipse
                        cx={width / 2} cy={height / 2} rx={mindmapRadiusX} ry={mindmapRadiusY}
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="5"
                    />
                    <text
                        x={width / 2} y={height / 2}
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

        case 'mind_map_topic':
            return (
                <svg width={width} height={height} className={baseClasses}>
                    <rect
                        x="2" y="2" width={width - 4} height={height - 4}
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3"
                        rx={Math.min(width, height) * 0.15}
                    />
                    <text
                        x={width / 2} y={height / 2}
                        textAnchor="middle"
                        alignmentBaseline="middle"
                        fill="currentColor"
                        fontSize={Math.min(13, width * 0.1)}
                        fontWeight="500"
                    >
                        {currentLabel}
                    </text>
                </svg>
            );

        case 'mind_map_subtopic':
            return (
                <svg width={width} height={height} className={baseClasses}>
                    <rect
                        x="2" y="2" width={width - 4} height={height - 4}
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1"
                        rx={Math.min(width, height) * 0.1}
                    />
                    <text
                        x={width / 2} y={height / 2}
                        textAnchor="middle"
                        alignmentBaseline="middle"
                        fill="currentColor"
                        fontSize={Math.min(12, width * 0.09)}
                        fontWeight="500"
                    >
                        {currentLabel}
                    </text>
                </svg>
            );

        case 'concept_entity':
            return (
                <svg width={width} height={height} className={baseClasses}>
                    <rect
                        x="2" y="2" width={width - 4} height={height - 4}
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        rx="3"
                    />
                    <line
                        x1="2" y1={height * 0.375} x2={width - 2} y2={height * 0.375}
                        stroke="currentColor"
                        strokeWidth="1.5"
                    />
                    <text
                        x={width / 2} y={height * 0.25}
                        textAnchor="middle"
                        alignmentBaseline="middle"
                        fill="currentColor"
                        fontSize={Math.min(13, width * 0.09)}
                        fontWeight="600"
                    >
                        {currentLabel}
                    </text>
                </svg>
            );

        case 'concept_process':
            return (
                <svg width={width} height={height} className={baseClasses}>
                    <rect
                        x="2" y="2" width={width - 4} height={height - 4}
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        rx="8"
                    />
                    <circle cx={width * 0.14} cy={height / 2} r={Math.min(width, height) * 0.03} fill="currentColor"/>
                    <circle cx={width * 0.86} cy={height / 2} r={Math.min(width, height) * 0.03} fill="currentColor"/>
                    <text
                        x={width / 2} y={height / 2}
                        textAnchor="middle"
                        alignmentBaseline="middle"
                        fill="currentColor"
                        fontSize={Math.min(13, width * 0.09)}
                        fontWeight="500"
                    >
                        {currentLabel}
                    </text>
                </svg>
            );

        case 'concept_database': {
            const dbRadiusX = width / 2;
            const dbRadiusY = dbRadiusX / 4;
            const dbTopY = dbRadiusY + 2;
            const dbBottomY = height - dbRadiusY - 2;

            return (
                <svg width={width} height={height} className={baseClasses}>
                    <ellipse
                        cx={width / 2} cy={dbTopY} rx={dbRadiusX} ry={dbRadiusY}
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                    />
                    <line
                        x1={width / 2 - dbRadiusX} y1={dbTopY}
                        x2={width / 2 - dbRadiusX} y2={dbBottomY}
                        stroke="currentColor"
                        strokeWidth="2"
                    />
                    <line
                        x1={width / 2 + dbRadiusX} y1={dbTopY}
                        x2={width / 2 + dbRadiusX} y2={dbBottomY}
                        stroke="currentColor"
                        strokeWidth="2"
                    />
                    <ellipse
                        cx={width / 2} cy={dbBottomY} rx={dbRadiusX} ry={dbRadiusY}
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                    />
                    {/* Dashed internal ellipses */}
                    <ellipse
                        cx={width / 2} cy={dbTopY + (dbBottomY - dbTopY) * 0.25}
                        rx={dbRadiusX} ry={dbRadiusY}
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1"
                        strokeDasharray="3,3"
                    />
                    <ellipse
                        cx={width / 2} cy={dbTopY + (dbBottomY - dbTopY) * 0.5}
                        rx={dbRadiusX} ry={dbRadiusY}
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1"
                        strokeDasharray="3,3"
                    />
                    <ellipse
                        cx={width / 2} cy={dbTopY + (dbBottomY - dbTopY) * 0.75}
                        rx={dbRadiusX} ry={dbRadiusY}
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1"
                        strokeDasharray="3,3"
                    />
                    <text
                        x={width / 2} y={height / 2}
                        textAnchor="middle"
                        alignmentBaseline="middle"
                        fill="currentColor"
                        fontSize={Math.min(12, width * 0.08)}
                        fontWeight="500"
                    >
                        {currentLabel}
                    </text>
                </svg>
            );
        }

        case 'text':
            return (
                <div
                    className={`p-3 min-w-[100px] max-w-[200px] border border-dashed border-foreground/40 rounded bg-background/50 ${baseClasses}`}>
                    <p className="text-sm font-medium text-foreground text-center">{currentLabel}</p>
                </div>
            );

        default:
            return (
                <svg width={width} height={height} className={baseClasses}>
                    <rect
                        x="2" y="2" width={width - 4} height={height - 4}
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        rx="4"
                    />
                    <text
                        x={width / 2} y={height / 2}
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