import React, {useState, useCallback, useEffect} from 'react';
import {authApi} from '../services/authApi';
import type {UserSearchResult} from '../types/auth';

interface CollaboratorSearchProps {
    diagramId: string|undefined;
    currentCollaborators: UserSearchResult[];
    onClose: () => void;
    isOwner: boolean;
    owner: UserSearchResult|undefined;
}

const CollaboratorSearch: React.FC<CollaboratorSearchProps> = ({
                                                                   diagramId,
                                                                   currentCollaborators,
                                                                   onClose,
                                                                   isOwner,
                                                                   owner
                                                               }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<UserSearchResult[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [selectedCollaborators, setSelectedCollaborators] = useState<UserSearchResult[]>(currentCollaborators);

    // Check if there are changes to save
    const hasChanges = () => {
        // Compare current selection with original collaborators
        const currentIds = selectedCollaborators.map(c => c.id).sort();
        const originalIds = currentCollaborators.map(c => c.id).sort();

        // Check if arrays are different
        return JSON.stringify(currentIds) !== JSON.stringify(originalIds);
    };

    // Debounced search
    const searchUsers = useCallback(async (query: string) => {
        if (query.length < 2) {
            setSearchResults([]);
            return;
        }

        setIsSearching(true);
        try {
            const token = localStorage.getItem('token');
            if (!token) return;

            const users = await authApi.searchUsers(query, token);
            // Filter out already selected users
            const filteredUsers = users.filter(user =>
                !selectedCollaborators.some(collab => collab.id === user.id)
            );
            setSearchResults(filteredUsers);
        } catch (error) {
            console.error('Error searching users:', error);
        } finally {
            setIsSearching(false);
        }
    }, [selectedCollaborators]);

    useEffect(() => {
        const timer = setTimeout(() => {
            searchUsers(searchQuery);
        }, 300); // 300ms debounce

        return () => clearTimeout(timer);
    }, [searchQuery, searchUsers]);

    const handleAddCollaborator = (user: UserSearchResult) => {
        const newCollaborators = [...selectedCollaborators, user];
        setSelectedCollaborators(newCollaborators);
        setSearchQuery('');
        setSearchResults([]);
        setIsDropdownOpen(false);
    };

    const handleRemoveCollaborator = (userId: string) => {
        const newCollaborators = selectedCollaborators.filter(collab => collab.id !== userId);
        setSelectedCollaborators(newCollaborators);
    };

    const handleRemoveAll = () => {
        setSelectedCollaborators([]);
    };

    const handleSaveCollaborators = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) return;

            const collaboratorIds = selectedCollaborators.map(collab => collab.id);
            await authApi.updateDiagramCollaborators(diagramId, collaboratorIds, token);

            console.log('Collaborators updated successfully');
            onClose();
        } catch (error) {
            console.error('Error updating collaborators:', error);
        }
    };

    // Calculate added/removed counts for better UX
    const getChangeCounts = () => {
        const currentIds = new Set(selectedCollaborators.map(c => c.id));
        const originalIds = new Set(currentCollaborators.map(c => c.id));

        const added = selectedCollaborators.filter(c => !originalIds.has(c.id)).length;
        const removed = currentCollaborators.filter(c => !currentIds.has(c.id)).length;

        return {added, removed, totalChanges: added + removed};
    };

    const {added, removed, totalChanges} = getChangeCounts();

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="text-center">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {isOwner ? 'Manage Collaborators' : 'View Collaborators'}
                </h3>
                <p className="text-sm text-gray-500">
                    {isOwner
                        ? 'Add users who can view and edit this diagram'
                        : 'Only the diagram owner can manage collaborators'
                    }
                </p>
                {!isOwner && (
                    <div className="mt-2 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                        <div className="flex items-center">
                            <svg className="w-4 h-4 text-yellow-600 mr-2" fill="none" stroke="currentColor"
                                 viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z"/>
                            </svg>
                            <span className="text-yellow-700 text-sm">Read-only mode</span>
                        </div>
                    </div>
                )}
            </div>
            {/* Owner Section */}
            <div className="space-y-3">
                <h4 className="font-medium text-gray-900 text-sm">Diagram Owner</h4>
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
                            {owner?.name?.charAt(0)?.toUpperCase() || 'O'}
                        </div>
                        <div>
                            <div className="font-medium text-gray-900">{owner?.name}</div>
                            <div className="text-sm text-gray-500">{owner?.email}</div>
                        </div>
                    </div>
                    <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                        Owner
                    </span>
                </div>
            </div>

            {/* Current Collaborators Section */}
            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <h4 className="font-medium text-gray-900 text-sm">
                        Current Collaborators
                        <span className="ml-2 bg-gray-200 text-gray-700 px-2 py-1 rounded-full text-xs">
                            {selectedCollaborators.length}
                        </span>
                    </h4>
                    {isOwner && selectedCollaborators.length > 0 && (
                        <button
                            onClick={handleRemoveAll}
                            className="text-red-600 hover:text-red-800 text-sm font-medium"
                        >
                            Remove All
                        </button>
                    )}
                </div>

                {/* Selected Collaborators */}
                {selectedCollaborators.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                        {selectedCollaborators.map(collaborator => {
                            const isNew = !currentCollaborators.some(c => c.id === collaborator.id);
                            return (
                                <div
                                    key={collaborator.id}
                                    className={`flex items-center px-3 py-1 rounded-full text-sm ${
                                        isNew
                                            ? 'bg-green-100 text-green-800 border border-green-200'
                                            : 'bg-blue-100 text-blue-800'
                                    }`}
                                >
                                    <span>{collaborator.name} ({collaborator.email})</span>
                                    {isNew && isOwner && (
                                        <span
                                            className="ml-1 text-xs bg-green-200 text-green-800 px-1 rounded">new</span>
                                    )}
                                    {isOwner && (
                                        <button
                                            onClick={() => handleRemoveCollaborator(collaborator.id)}
                                            className="ml-2 hover:opacity-70 text-lg font-bold"
                                            title="Remove collaborator"
                                        >
                                            ×
                                        </button>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="bg-gray-50 rounded-lg p-4 text-center">
                        <svg className="w-8 h-8 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor"
                             viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                  d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"/>
                        </svg>
                        <p className="text-gray-500 text-sm">No collaborators added yet</p>
                    </div>
                )}
            </div>

            {/* Add Collaborators Section */}
            {isOwner && (
                <div className="space-y-3">
                    <h4 className="font-medium text-gray-900 text-sm">Add New Collaborators</h4>

                    {/* Search Input */}
                    <div className="relative">
                        <input
                            id="collaborator-search"
                            type="text"
                            value={searchQuery}
                            onChange={(e) => {
                                setSearchQuery(e.target.value);
                                setIsDropdownOpen(true);
                            }}
                            onFocus={() => setIsDropdownOpen(true)}
                            placeholder="Type to search users..."
                            className="w-full text-gray-900 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />

                        {/* Search Results Dropdown */}
                        {isDropdownOpen && searchQuery.length >= 2 && (
                            <div
                                className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                                <div className="px-3 py-2 bg-gray-50 border-b border-gray-200">
                                    <span className="text-xs font-medium text-gray-500">SEARCH RESULTS</span>
                                </div>
                                {isSearching ? (
                                    <div className="px-4 py-3 text-gray-500 flex items-center">
                                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-blue-500" fill="none"
                                             viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor"
                                                    strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor"
                                                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Searching users...
                                    </div>
                                ) : searchResults.length === 0 ? (
                                    <div className="px-4 py-3 text-gray-500 text-center">
                                        <svg className="w-6 h-6 mx-auto mb-1 text-gray-400" fill="none"
                                             stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                                  d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                                        </svg>
                                        No users found for "{searchQuery}"
                                    </div>
                                ) : (
                                    searchResults.map(user => (
                                        <button
                                            key={user.id}
                                            onClick={() => handleAddCollaborator(user)}
                                            className="w-full text-left px-4 py-3 hover:bg-gray-50 focus:bg-gray-50 focus:outline-none border-b border-gray-100 last:border-b-0"
                                        >
                                            <div className="flex items-center space-x-3">
                                                <div
                                                    className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                                                    {user.name?.charAt(0)?.toUpperCase() || 'U'}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div
                                                        className="font-medium text-gray-900 truncate">{user.name}</div>
                                                    <div className="text-sm text-gray-500 truncate">{user.email}</div>
                                                </div>
                                            </div>
                                        </button>
                                    ))
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Save Button */}
            {isOwner && (
                <div className="pt-4 border-t border-gray-200">
                    <button
                        onClick={handleSaveCollaborators}
                        disabled={!hasChanges()}
                        className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                    >
                        {!hasChanges() ? (
                            'No Changes to Save'
                        ) : (
                            <div className="flex items-center justify-center space-x-2">
                                <span>Save Changes</span>
                                {totalChanges > 0 && (
                                    <span
                                        className="bg-blue-700 text-blue-100 px-2 py-1 rounded-full text-xs font-semibold">
                                    {added > 0 && `+${added}`}
                                        {removed > 0 && added > 0 && '/'}
                                        {removed > 0 && `-${removed}`}
                                </span>
                                )}
                            </div>
                        )}
                    </button>
                </div>
            )}
        </div>
    );
};

export default CollaboratorSearch;