import React, {useEffect, useState} from 'react';
import type {ToolbarState} from "../types/diagram.ts";
import {useNavigate, useParams} from "react-router-dom";
import CollaboratorSearch from "./collaboratorSearch.tsx";
import type {CollaboratorsResponse, UserSearchResult} from "../types/auth.ts";
import {authApi} from "../services/service.ts";

interface ToolbarProps {
    toolbarState: ToolbarState;
    onToolbarStateChange: (state: Partial<ToolbarState>) => void;
}

const Toolbar: React.FC<ToolbarProps> = () => {
    const navigate = useNavigate();
    const [showCollaboratorModal, setShowCollaboratorModal] = useState(false);
    const {id} = useParams();
    const [collaborators, setCollaborators] = useState<UserSearchResult[]>([]);
    const [diagramName, setDiagramName] = useState<string>('');
    const [, setError] = useState('');
    const [, setIsLoading] = useState(true);
    const [isOwner, setIsOwner] = useState(false);
    const [owner, setOwner] = useState<UserSearchResult>();
    const userData = sessionStorage.getItem('user');
    const user = userData ? JSON.parse(userData) : null;
    useEffect(() => {
        fetchCollaborators();
    }, [id, showCollaboratorModal]);

    const fetchCollaborators = async () => {
        try {
            if (id == undefined) {
                setDiagramName("")
                return;
            }
            const token = sessionStorage.getItem('token');
            if (!token) {
                setError('Not authenticated');
                return;
            }

            const response: CollaboratorsResponse = await authApi.getDiagramCollaborators(id, token);

            setCollaborators(response.collaborators);
            if (user.id === response.diagram.createdBy.id) {
                setIsOwner(true);
            }
            setOwner(response.diagram.createdBy)
            setDiagramName(response.diagram.name);
        } catch (error) {
            console.error('Error fetching collaborators:', error);
            setError(error instanceof Error ? error.message : 'Failed to load collaborators');
        } finally {
            setIsLoading(false);
        }
    };

    const handleLogout = () => {
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('user');
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
        <>
            <div className="bg-gray-800 text-white p-3 flex items-center justify-between shadow-lg">
                {/* Left Section - Logo & Title */}
                <div className="flex items-center space-x-4 flex-shrink-0">
                    {/* Logo and Title */}
                    <div className="flex w-72 items-center space-x-3">
                        {/* Logo */}
                        <div
                            className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center flex-shrink-0">
                            <img
                                src="/logo.png"
                                alt="CoDiagram Logo"
                                className="w-full h-full object-contain"
                            />
                        </div>
                        {/* Title - hidden on small mobile, visible on sm and up */}
                        <h1 className="text-lg sm:text-xl font-bold text-white hidden sm:block">
                            CoDiagram
                        </h1>
                    </div>

                    {/* Vertical divider - hidden on mobile */}
                    <div className="w-px h-6 bg-gray-600 hidden lg:block"></div>
                </div>

                {/* Center Section - Diagram Name */}
                {diagramName && (
                    <div className="flex-1 flex justify-center min-w-0 mx-2 sm:mx-4">
                        <div
                            className="text-sm sm:text-lg font-semibold text-white px-3 py-1 sm:px-4 sm:py-2 bg-gray-700/30 rounded-xl truncate max-w-xs sm:max-w-md lg:max-w-xl">
                            {diagramName}
                        </div>
                    </div>
                )}

                {/* Right Section - User Info & Controls */}
                <div className="flex items-center space-x-2 sm:space-x-4 flex-shrink-0">
                    {/* Collaboration Status */}
                    <div className="flex items-center space-x-2">
                        {id && (
                            <>
                                <button
                                    onClick={() => setShowCollaboratorModal(true)}
                                    className="flex items-center space-x-1 sm:space-x-2 border border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white px-2 py-1 sm:px-3 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800"
                                >
                                    {/* Icon only on small screens, icon + text on larger */}
                                    <svg className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" fill="none"
                                         stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/>
                                    </svg>
                                    <span className="hidden sm:inline">Collaborators</span>
                                    {collaborators.length > 0 && (
                                        <span
                                            className="bg-blue-500 text-white px-1.5 py-0.5 rounded-full text-xs font-semibold min-w-5 flex-shrink-0">
                                    {collaborators.length}
                                </span>
                                    )}
                                </button>
                            </>
                        )}
                    </div>

                    {/* User Profile */}
                    {user && (
                        <div className="flex items-center space-x-2 sm:space-x-3">
                            {/* User Avatar with Dropdown */}
                            <div className="relative group">
                                <div
                                    className="flex items-center space-x-1 sm:space-x-2 cursor-pointer p-1 sm:p-2 rounded-lg hover:bg-gray-700 transition-colors min-w-0">
                                    {/* User Avatar */}
                                    <div
                                        className="w-6 h-6 sm:w-8 sm:h-8 bg-blue-500 rounded-full flex items-center justify-center text-xs sm:text-sm font-semibold flex-shrink-0">
                                        {getUserInitials()}
                                    </div>

                                    {/* User Name (hidden on small screens, visible on medium+) */}
                                    <div className="hidden md:block min-w-0">
                                <span className="text-sm font-medium text-white truncate block">
                                    {user.name}
                                </span>
                                    </div>

                                    {/* Dropdown Arrow */}
                                    <svg
                                        className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400 flex-shrink-0"
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
                                        <div className="text-sm font-medium text-white truncate">{user.name}</div>
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
                            className="px-2 py-1 sm:px-3 sm:py-2 rounded text-xs sm:text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white transition-colors focus:outline-none focus:ring-2 focus:bg-blue-700 focus:ring-offset-2 focus:ring-offset-blue-700 flex-shrink-0"
                            title="Logout"
                            onClick={handleLogout}
                        >
                            <span className="hidden sm:inline">Logout</span>
                            <svg className="w-4 h-4 sm:hidden" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                      d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
                            </svg>
                        </button>
                    )}
                </div>
            </div>
            {/* Collaborator Modal - Moved outside navbar */}
            {showCollaboratorModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-4 sm:p-6 mx-2">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-base sm:text-lg font-semibold">Add Collaborators</h3>
                            <button
                                onClick={() => setShowCollaboratorModal(false)}
                                className="text-gray-400 hover:text-gray-600 text-lg"
                            >
                                ×
                            </button>
                        </div>
                        <CollaboratorSearch
                            diagramId={id}
                            currentCollaborators={collaborators || []}
                            onClose={() => setShowCollaboratorModal(false)}
                            isOwner={isOwner}
                            owner={owner}
                        />
                    </div>
                </div>
            )}
        </>
    );
};

export default Toolbar;