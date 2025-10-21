import './App.css';
import Login from "./components/login.tsx";
import {Route, Routes} from "react-router-dom";
import Home from "./components/home.tsx";

function App() {
    return (
        <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<Home />} />
        </Routes>
    );
}

export default App;