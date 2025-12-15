import { Routes, Route, Navigate } from 'react-router-dom';
import { Login } from './components/Login/Login';
import './App.css';

function App() {
  return (
    <Routes>
      <Route index element={<Navigate replace to="/login" />} />
      <Route path="/login" element={<Login />} />
      <Route
        path="signup"
        element={<div>Sign Up Page (to be implemented)</div>}
      />
      <Route path="*" element={<h1> 404 Not Found</h1>} />
    </Routes>
  );
}

export default App;
