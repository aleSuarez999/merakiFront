import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useRef } from 'react';

const isProduction = import.meta.env.VITE_PRODUCTION === 'true';
const loginURL = isProduction ? 'api/login' : 'http://localhost:4000/api/login';

function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();


const alreadyHandled = useRef(false);

useEffect(() => {
  if (alreadyHandled.current) return;

  alreadyHandled.current = true;

  const reason = localStorage.getItem('logout_reason');
  if (reason === 'expirado') {
    setError('Sesión expirada. Por favor, inicia sesión nuevamente.');
    localStorage.removeItem('logout_reason');
  }

}, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(`${loginURL}`, {
        username,
        password
      });

      if (res.data.token) {
        localStorage.setItem('jwt_token', res.data.token);
        sessionStorage.removeItem('already_redirected');
        //navigate('/');
        navigate('/', { replace: true });
      } else {
        setError('Error inesperado. Intenta nuevamente.');
      }
    } catch (err) {
      setError('Credenciales inválidas');
    }
  };

  return (
    <div className="login__container">
      <form onSubmit={handleLogin}>
        <h2>Iniciar sesión</h2>
        <input
          type="text"
          placeholder="Usuario"
          autoComplete="username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <input
          type="password"
          placeholder="Clave"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button type="submit">Ingresar</button>
        {error && <p className="error">{error}</p>}
      </form>
    </div>
  );
}

export default Login;
