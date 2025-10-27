import React from 'react';
import type {ShapeType, ToolbarState} from "../types/diagram.ts";
import {useNavigate} from "react-router-dom";

interface ToolbarProps {
    toolbarState: ToolbarState;
    onToolbarStateChange: (state: Partial<ToolbarState>) => void;
    onShapeSelect: (shapeType: ShapeType) => void;
}

const Toolbar: React.FC<ToolbarProps> = ({
                                             toolbarState,
                                             onToolbarStateChange,
                                         }) => {
    const tools = [];

    const navigate = useNavigate();

    const handleLogout = () => {
        // Your logout logic here (clear tokens, reset state, etc.)
        console.log('Logging out...');

        // Clear authentication state
        localStorage.removeItem('authToken');
        localStorage.removeItem('userData');

        // Redirect to login page
        navigate('/login');
    };

    return (
        <div className="bg-gray-800  text-white p-3 flex items-center justify-between shadow-lg">
            {/* Left Section - Logo, Title & Tools */}
            <div className="flex items-center space-x-4">
                {/* Logo and Title */}
                <div className="flex w-72 items-center justify-around ">
                    {/* Logo SVG */}
                    <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-lg flex items-center justify-center">
                            <img
                                src="/logo.png"
                                alt="CoDiagram Logo"
                                className="w-full h-full object-contain"
                            />
                        </div>
                        {/* Title */}
                        <h1 className="text-xl font-bold text-white">CoDiagram</h1>
                    </div>
                </div>

                <div className="w-px h-6 bg-gray-600"></div>

                {/* Main Tools */}
                <div className="flex space-x-1">
                    {tools.map((tool) => (
                        <button
                            key={tool.id}
                            onClick={() => onToolbarStateChange({selectedTool: tool.id})}
                            className={`p-2 rounded text-lg ${
                                toolbarState.selectedTool === tool.id
                                    ? 'bg-blue-600 text-white'
                                    : 'hover:bg-gray-700'
                            }`}
                            title={tool.name}
                        >
                            {tool.icon}
                        </button>
                    ))}
                </div>
            </div>

            {/* Right Section - Collaboration & Zoom */}
            <div className="flex items-center space-x-4">
                {/* Collaboration Status */}
                <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm text-gray-300">Connected</span>
                </div>
                <div className="flex items-center space-x-1">
                    <button
                        className="px-3 py-2 rounded text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white transition-colors focus:outline-none focus:ring-2 focus:bg-blue-700 focus:ring-offset-2 focus:ring-offset-blue-700"
                        title="Logout"
                        onClick={handleLogout}
                    >
                        Logout
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Toolbar;