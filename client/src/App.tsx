import { Routes, Route, Navigate } from 'react-router-dom';
import { Login } from './components/Login/Login';
import './App.css';
import { SignUp } from './components/SignUp/SignUp';

function App() {
  return (
    <Routes>
      <Route index element={<Navigate replace to="/login" />} />
      <Route path="/login" element={<Login />} />
      <Route path="signup" element={<SignUp />} />
      <Route path="*" element={<h1> 404 Not Found</h1>} />
    </Routes>
  );
}

export default App;
