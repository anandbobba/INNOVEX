import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import Admin from './components/Admin';
import { setToken } from './api';
import './App.css';

function App() {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  });

  useEffect(() => {
    if (user?.token) {
      setToken(user.token);
    }
  }, [user]);

  const login = (data) => {
    localStorage.setItem('user', JSON.stringify(data));
    localStorage.setItem('token', data.token);
    setUser(data);
    setToken(data.token);
  };

  const logout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    setUser(null);
    setToken(null);
  };

  return (
    <BrowserRouter
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true
      }}
    >
      <Routes>
        <Route 
          path='/' 
          element={user ? <Navigate to='/dashboard' /> : <Login onLogin={login} />} 
        />
        <Route 
          path='/dashboard' 
          element={user ? <Dashboard user={user} onLogout={logout} /> : <Navigate to='/' />} 
        />
        <Route 
          path='/admin' 
          element={user?.is_admin ? <Admin user={user} onLogout={logout} /> : <Navigate to='/' />} 
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;