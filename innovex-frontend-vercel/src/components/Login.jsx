import React, { useState } from 'react';
import API from '../api';

export default function Login({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await API.post('/auth/login', { email, password });
      onLogin({
        token: response.data.token,
        name: response.data.name,
        email: response.data.email,
        expertise: response.data.expertise,
        is_admin: response.data.is_admin
      });
    } catch (e) {
      setError(e.response?.data?.error || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='login-container'>
      <div className='login-box'>
        <div className='login-header'>
          <div className='trophy-icon'>🏆</div>
          <h1>INNOVEX 2025</h1>
          <p className='subtitle'>Judging Portal</p>
          <p className='venue'>NMAM Institute of Technology, Nitte</p>
        </div>

        <form onSubmit={submit} className='login-form'>
          <div className='form-group'>
            <label>Email Address</label>
            <input
              type='email'
              value={email}
              onChange={e => setEmail(e.target.value)}
              className='input'
              placeholder='your.email@example.com'
              required
              disabled={loading}
            />
          </div>

          <div className='form-group'>
            <label>Password</label>
            <input
              type='password'
              value={password}
              onChange={e => setPassword(e.target.value)}
              className='input'
              placeholder='Enter your password'
              required
              disabled={loading}
            />
          </div>

          <button className='button primary' type='submit' disabled={loading}>
            {loading ? 'Logging in...' : 'Login'}
          </button>

          {error && <div className='error-message'>{error}</div>}

          <div className='demo-credentials'>
            <p className='demo-title'>Demo Credentials:</p>
            <p>Judge: sujith.kumar@niveus.in / judge123</p>
            <p>Admin: admin@innovex.nmamit.in / admin123</p>
          </div>
        </form>
      </div>
    </div>
  );
}