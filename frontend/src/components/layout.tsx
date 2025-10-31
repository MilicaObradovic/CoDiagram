import React, {useState} from 'react';
import Toolbar from './toolbar';
import type {ToolbarState} from "../types/diagram.ts";

interface LayoutProps {
    children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
    const [toolbarState, setToolbarState] = useState<ToolbarState>({
        selectedTool: 'select',
        fillColor: '#3B82F6',
        strokeColor: '#1E40AF',
        strokeWidth: 2,
        fontSize: 16,
    });
    const handleToolbarStateChange = (newState: Partial<ToolbarState>) => {
        setToolbarState(prev => ({...prev, ...newState}));
    };
    return (
        <div className="h-screen flex flex-col">
            <Toolbar
                toolbarState={toolbarState}
                onToolbarStateChange={handleToolbarStateChange}
            />
            <main>{children}</main>
        </div>
    );
};

export default Layout;