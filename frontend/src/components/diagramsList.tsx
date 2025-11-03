import React, {useState, useEffect} from 'react';
import {useNavigate} from 'react-router-dom';
import {authApi} from '../services/authApi';
import type {Edge} from "reactflow";

interface Diagram {
    _id: string;
    name: string;
    description?: string;
    createdAt: string;
    updatedAt: string;
    nodes: Node[];
    edges: Edge[];
}

const DiagramsPage: React.FC = () => {
    const [diagrams, setDiagrams] = useState<Diagram[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [isCreating, setIsCreating] = useState(false);
    const [newDiagramName, setNewDiagramName] = useState('');
    const navigate = useNavigate();
    const [isEmpty, setIsEmpty] = useState(false);
    const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; diagramId: string | null; diagramName: string }>({
        isOpen: false,
        diagramId: null,
        diagramName: ''
    });

    useEffect(() => {
        fetchDiagrams();
    }, []);
    useEffect(() => {
        if (error) {
            const timer = setTimeout(() => {
                setError('');
            }, 5000); // Disappears after 5 seconds

            // Cleanup the timer if the component unmounts or error changes
            return () => clearTimeout(timer);
        }
    }, [error]);

    const fetchDiagrams = async () => {
        try {
            const userData = localStorage.getItem('user');
            console.log('Raw user data:', userData); // This will show the string

            // Parse the JSON string to get the user object
            const user = userData ? JSON.parse(userData) : null;
            const id = user?.id; // Now you can access the id property
            console.log('User ID:', id);
            const token = localStorage.getItem('token');
            console.log(token);
            if (!token) {
                navigate('/login');
                return;
            }
            if (!id) {
                navigate('/login');
                return;
            }

            const userDiagrams = await authApi.getDiagrams(token);
            setDiagrams(userDiagrams);
            if (userDiagrams.length === 0) {
                setIsEmpty(true);
            }
        } catch (error) {
            console.error('Error fetching diagrams:', error);
            setError('Failed to load diagrams');
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreateDiagram = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newDiagramName.trim()) return;

        try {
            const token = localStorage.getItem('token');
            if (!token) {
                navigate('/login');
                return;
            }

            const diagramData = {
                name: newDiagramName.trim(),
                description: '',
                nodes: [],
                edges: []
            };

            const newDiagram = await authApi.createDiagram(diagramData, token);
            setDiagrams(prev => [newDiagram, ...prev]);
            setNewDiagramName('');
            setIsCreating(false);

            // Navigate to the diagram editor
            // navigate(`/diagram/${newDiagram._id}`);
            console.log("Diagram created");
        } catch (error) {
            console.error('Error creating diagram:', error);
            setError('Failed to create diagram');
        }
    };

    const handleDeleteClick = (diagramId: string, diagramName: string) => {
        setDeleteModal({
            isOpen: true,
            diagramId,
            diagramName
        });
    };
    const handleDeleteCancel = () => {
        setDeleteModal({isOpen: false, diagramId: null, diagramName: ''});
    };

    const handleDeleteConfirm = async () => {
        if (!deleteModal.diagramId) return;

        try {
            const token = localStorage.getItem('token');
            if (!token) return;

            await authApi.deleteDiagram(deleteModal.diagramId, token);
            setDiagrams(prev => prev.filter(d => d._id !== deleteModal.diagramId));
            setDeleteModal({isOpen: false, diagramId: null, diagramName: ''});
        } catch (error) {
            console.error('Error deleting diagram:', error);
            setError('Failed to delete diagram');
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    if (isLoading) {
        return (
            <div className="flex flex-1 bg-gradient-to-br from-blue-50 to-indigo-100  items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading your diagrams...</p>
                </div>
            </div>
        );
    }


    return (
        <div
            className="flex flex-1 bg-gradient-to-br from-blue-50 to-indigo-100 overflow-auto"> {/* Add overflow-auto */}
            <div className="flex-1 py-8"> {/* Remove max-w-6xl mx-auto from outer div */}
                <div className="max-w-6xl mx-auto px-4">
                    {/* Header */}
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">My Diagrams</h1>
                        <p className="text-gray-600">Create and manage your flowcharts and diagrams</p>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 max-w-2xl mx-auto">
                            <div className="flex items-center justify-center">
                                <svg className="h-5 w-5 text-red-400 mr-2" fill="none" viewBox="0 0 24 24"
                                     stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                          d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                                </svg>
                                <p className="text-red-700 text-sm">{error}</p>
                            </div>
                        </div>
                    )}

                    {/* Create New Diagram Card */}
                    {isCreating ? (
                        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 max-w-2xl mx-auto">
                            <form onSubmit={handleCreateDiagram} className="space-y-4">
                                <div>
                                    <label htmlFor="diagramName"
                                           className="block text-sm font-medium text-gray-700 mb-2">
                                        Diagram Name
                                    </label>
                                    <input
                                        type="text"
                                        id="diagramName"
                                        value={newDiagramName}
                                        onChange={(e) => setNewDiagramName(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="Enter diagram name"
                                        autoFocus
                                    />
                                </div>
                                <div className="flex space-x-3">
                                    <button
                                        type="submit"
                                        className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
                                    >
                                        Create Diagram
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setIsCreating(false)}
                                        className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        </div>
                    ) : (
                        !isEmpty ? (
                            <div className="text-center mb-8">
                                <button
                                    onClick={() => setIsCreating(true)}
                                    className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors shadow-sm"
                                >
                                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                              d="M12 4v16m8-8H4"/>
                                    </svg>
                                    Create New Diagram
                                </button>
                            </div>
                        ) : (
                            <div></div>
                        )
                    )}

                    {/* Diagrams Grid */
                    }
                    {
                        diagrams.length === 0 ? (
                            <div className="bg-white rounded-2xl shadow-lg p-8 text-center max-w-2xl mx-auto">
                                <div
                                    className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor"
                                         viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                              d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                                    </svg>
                                </div>
                                <h3 className="text-lg font-medium text-gray-900 mb-2">No diagrams yet</h3>
                                <p className="text-gray-500 mb-4">Create your first diagram to get started</p>
                                <button
                                    onClick={() => setIsCreating(true)}
                                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
                                >
                                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                              d="M12 4v16m8-8H4"/>
                                    </svg>
                                    Create new Diagram
                                </button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {diagrams.map((diagram) => (
                                    <div
                                        key={diagram._id}
                                        className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-200 overflow-hidden"
                                    >
                                        <div className="p-6">
                                            {/* Diagram Preview Placeholder */}
                                            <div
                                                className="w-full h-32 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-lg mb-4 flex items-center justify-center">
                                                <svg className="w-12 h-12 text-blue-400" fill="none"
                                                     stroke="currentColor"
                                                     viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                                                          d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                                                </svg>
                                            </div>

                                            {/* Diagram Info */}
                                            <h3 className="font-semibold text-gray-900 text-lg mb-2 truncate">{diagram.name}</h3>
                                            {diagram.description && (
                                                <p className="text-gray-500 text-sm mb-4 line-clamp-2">{diagram.description}</p>
                                            )}

                                            <div className="flex items-center justify-between text-sm text-gray-400">
                                                <span>Created {formatDate(diagram.createdAt)}</span>
                                                <span>{diagram.nodes.length} nodes</span>
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        <div className="bg-gray-50 px-6 py-4 border-t border-gray-100">
                                            <div className="flex space-x-2">
                                                <button
                                                    onClick={() => navigate(`/diagram/${diagram._id}`)}
                                                    className="flex-1 bg-blue-600 text-white py-2 px-3 rounded-lg text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
                                                >
                                                    Open
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteClick(diagram._id, diagram.name)}
                                                    className="p-2 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors"
                                                    title="Delete diagram"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor"
                                                         viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round"
                                                              strokeWidth={2}
                                                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                                                    </svg>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )
                    }
                    {/* Delete Confirmation Modal */}
                    {deleteModal.isOpen && (
                        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                            <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
                                <div className="text-center">
                                    {/* Warning Icon */}
                                    <div
                                        className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
                                        <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor"
                                             viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z"/>
                                        </svg>
                                    </div>

                                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                        Delete Diagram
                                    </h3>
                                    <p className="text-gray-500 mb-6">
                                        Are you sure you want to delete "<span
                                        className="font-medium text-gray-900">{deleteModal.diagramName}</span>"? This
                                        action cannot be undone.
                                    </p>

                                    <div className="flex space-x-3">
                                        <button
                                            onClick={handleDeleteCancel}
                                            className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg font-medium hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={handleDeleteConfirm}
                                            className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors"
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
        ;
};

export default DiagramsPage;