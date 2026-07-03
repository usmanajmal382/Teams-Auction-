import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import AdminSetup from './pages/AdminSetup';
import Admin from './pages/Admin';
import Auction from './pages/Auction';
import Players from './pages/Players';
import Teams from './pages/Teams';
import SetBudget from './pages/SetBudget';
import RetainedPlayers from './pages/RetainedPlayers';
import ChangePassword from './pages/ChangePassword';

function App() {
    return (
        <BrowserRouter>
            <Navbar />
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/admin-setup" element={<AdminSetup />} />
                <Route path="/admin" element={<Admin />} />
                <Route path="/admin/budget" element={<SetBudget />} />
                <Route path="/admin/retained" element={<RetainedPlayers />} />
                <Route path="/admin/password" element={<ChangePassword />} />
                <Route path="/auction" element={<Auction />} />
                <Route path="/players" element={<Players />} />
                <Route path="/teams" element={<Teams />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;
