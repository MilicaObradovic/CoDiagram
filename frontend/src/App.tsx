import './App.css';
import Login from "./components/login.tsx";
import {Route, Routes} from "react-router-dom";
import Home from "./components/home.tsx";
import Register from "./components/registration.tsx";
import DiagramsPage from "./components/diagramsList.tsx";
import Layout from "./components/layout.tsx";

function App() {
    return (
        <Routes>
            <Route path="/" element={
                <Layout>
                    <Home />
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