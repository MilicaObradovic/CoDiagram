import './App.css';
import Login from "./components/login.tsx";
import {Navigate, Route, Routes} from "react-router-dom";
import Diagram from "./components/diagram.tsx";
import Register from "./components/registration.tsx";
import DiagramsPage from "./components/diagramsList.tsx";
import Layout from "./components/layout.tsx";

function App() {
    return (
        <Routes>
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/diagram/:id" element={
                <Layout>
                    <Diagram />
                </Layout>
            } />
            <Route path="/diagrams" element={
                <Layout>
                    <DiagramsPage />
                </Layout>
            } />
            <Route path="/register" element={<Register />} />
            <Route path="/login" element={<Login />} />

        </Routes>
    );
}

export default App;