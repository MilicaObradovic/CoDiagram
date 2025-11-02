import React from 'react';
import type {ShapeType, ToolbarState} from "../types/diagram.ts";
import {Link, useNavigate} from "react-router-dom";

interface ToolbarProps {
    toolbarState: ToolbarState;
    onToolbarStateChange: (state: Partial<ToolbarState>) => void;
}

const Toolbar: React.FC<ToolbarProps> = ({
                                             toolbarState,
                                             onToolbarStateChange,
                                         }) => {
    const tools = [];

    const navigate = useNavigate();

    // Get user data from localStorage
    const userData = localStorage.getItem('user');
    const user = userData ? JSON.parse(userData) : null;

    const handleLogout = () => {
        // Your logout logic here (clear tokens, reset state, etc.)
        console.log('Logging out...');

        // Clear authentication state
        localStorage.removeItem('token');
        localStorage.removeItem('user');

        // Redirect to login page
        navigate('/login');
    };
    // Get user initials for avatar
    const getUserInitials = () => {
        if (!user?.name) return 'U';
        return user.name
            .split(' ')
            .map(word => word[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
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

            {/* Right Section - User Info & Controls */}
            <div className="flex items-center space-x-4">
                {/* Collaboration Status */}
                <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm text-gray-300">Connected</span>
                </div>

                {/* User Profile */}
                {user && (
                    <div className="flex items-center space-x-3">
                        {/* User Avatar with Dropdown */}
                        <div className="relative group">
                            <div
                                className="flex items-center space-x-2 cursor-pointer p-2 rounded-lg hover:bg-gray-700 transition-colors">
                                {/* User Avatar */}
                                <div
                                    className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-sm font-semibold">
                                    {getUserInitials()}
                                </div>

                                {/* User Name (hidden on small screens, visible on medium+) */}
                                <div className="hidden md:block">
                                    <span className="text-sm font-medium text-white">
                                        {user.name}
                                    </span>
                                </div>

                                {/* Dropdown Arrow */}
                                <svg
                                    className="w-4 h-4 text-gray-400"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                          d="M19 9l-7 7-7-7"/>
                                </svg>
                            </div>

                            {/* Dropdown Menu */}
                            <div
                                className="absolute right-0 top-full mt-1 w-48 bg-gray-700 rounded-lg shadow-lg py-1 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                                {/* User Info in Dropdown */}
                                <div className="px-4 py-2 border-b border-gray-600">
                                    <div className="text-sm font-medium text-white">{user.name}</div>
                                    <div className="text-xs text-gray-400 truncate">{user.email}</div>
                                </div>

                                {/* Dropdown Items */}
                                <button
                                    className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-600 transition-colors flex items-center space-x-2"
                                    onClick={() => navigate(`/diagrams`)}
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                              d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"/>
                                    </svg>
                                    <span>My diagrams</span>
                                </button>

                                <div className="border-t border-gray-600 mt-1"></div>

                                <button
                                    className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-gray-600 transition-colors flex items-center space-x-2"
                                    onClick={handleLogout}
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
                                    </svg>
                                    <span>Logout</span>
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Logout Button (fallback if no user data) */}
                {!user && (
                    <button
                        className="px-3 py-2 rounded text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white transition-colors focus:outline-none focus:ring-2 focus:bg-blue-700 focus:ring-offset-2 focus:ring-offset-blue-700"
                        title="Logout"
                        onClick={handleLogout}
                    >
                        Logout
                    </button>
                )}
            </div>
        </div>
    );
};

export default Toolbar;