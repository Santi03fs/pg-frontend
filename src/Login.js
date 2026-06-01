import React, { useState } from 'react';

// ================= LOGOTIPO GRUPO PG =================
const LogoPG = () => (
  <svg height="60" viewBox="0 0 300 120" xmlns="http://www.w3.org/2000/svg" style={{ display: 'block', margin: '0 auto 10px auto' }}>
    <text transform="translate(35, 88) rotate(-90)" fill="#ffffff" fontFamily="Arial Black, Impact, sans-serif" fontSize="26" fontWeight="900" letterSpacing="1">GRUPO</text>
    <text x="45" y="88" fill="#ffffff" fontFamily="Arial Black, Impact, sans-serif" fontSize="110" fontWeight="900" letterSpacing="-8">PG</text>
    <rect x="45" y="94" width="225" height="22" fill="#E60000" />
    <text x="157" y="111" fill="#FFF" fontFamily="Arial Black, sans-serif" fontSize="15" fontWeight="900" textAnchor="middle" letterSpacing="0.5">WWW.GRUPO-PG.ES</text>
  </svg>
);

export default function Login({ onLoginSuccess }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    const cleanUser = username.trim().toLowerCase();
    const cleanPass = password.trim();

    try {
      const response = await fetch('https://pg-backend-v364.onrender.com/api/usuarios/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: cleanUser, password: cleanPass })
      });

      if (response.ok) {
        const userObj = await response.json();
        
        if (rememberMe) {
          localStorage.setItem('pg_session', 'authenticated');
          localStorage.setItem('pg_user', JSON.stringify(userObj));
        } else {
          sessionStorage.setItem('pg_session', 'authenticated');
          sessionStorage.setItem('pg_user', JSON.stringify(userObj));
        }
        
        onLoginSuccess(userObj);
      } else {
        const msg = await response.text();
        setError(msg || '⚠️ Usuario o contraseña incorrectos.');
      }
    } catch (err) {
      console.error(err);
      setError('❌ Error de conexión con el servidor. Inténtalo de nuevo (Render puede tardar en arrancar).');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-wrapper">
      <style>{`
        .login-wrapper {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: radial-gradient(circle at 10% 20%, rgb(43, 43, 43) 0%, rgb(18, 18, 18) 90.2%);
          font-family: 'Outfit', 'Inter', "Segoe UI", sans-serif;
          padding: 20px;
          box-sizing: border-box;
          position: relative;
          overflow: hidden;
        }

        /* Elementos decorativos de fondo */
        .bg-shape-1 {
          position: absolute;
          width: 300px;
          height: 300px;
          border-radius: 50%;
          background: rgba(230, 0, 0, 0.15);
          filter: blur(80px);
          top: -50px;
          right: -50px;
          animation: float 8s ease-in-out infinite alternate;
        }

        .bg-shape-2 {
          position: absolute;
          width: 400px;
          height: 400px;
          border-radius: 50%;
          background: rgba(230, 0, 0, 0.08);
          filter: blur(100px);
          bottom: -100px;
          left: -100px;
          animation: float 12s ease-in-out infinite alternate-reverse;
        }

        @keyframes float {
          0% { transform: translateY(0) scale(1); }
          100% { transform: translateY(20px) scale(1.1); }
        }

        /* Contenedor principal de Glassmorphism */
        .login-card {
          width: 100%;
          max-width: 440px;
          background: rgba(30, 30, 30, 0.65);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border: 1px solid rgba(255, 255, 255, 0.07);
          border-radius: 20px;
          padding: 40px;
          box-shadow: 0 15px 35px rgba(0, 0, 0, 0.5);
          z-index: 10;
          text-align: center;
          box-sizing: border-box;
          animation: fadeIn 0.6s ease-out;
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .login-subtitle {
          color: #a0a0a0;
          font-size: 14px;
          margin-top: 5px;
          margin-bottom: 30px;
          font-weight: 400;
          letter-spacing: 0.5px;
        }

        .input-group {
          margin-bottom: 22px;
          text-align: left;
          position: relative;
        }

        .input-label {
          display: block;
          color: #e0e0e0;
          font-size: 13px;
          font-weight: 600;
          margin-bottom: 8px;
          text-transform: uppercase;
          letter-spacing: 0.8px;
        }

        .input-control-wrapper {
          position: relative;
          display: flex;
          align-items: center;
        }

        .input-icon {
          position: absolute;
          left: 15px;
          color: #888;
          display: flex;
          align-items: center;
          justify-content: center;
          pointer-events: none;
        }

        .input-control {
          width: 100%;
          padding: 14px 15px 14px 45px;
          background: rgba(255, 255, 255, 0.05);
          border: 1.5px solid rgba(255, 255, 255, 0.08);
          border-radius: 10px;
          color: #ffffff;
          font-size: 15px;
          outline: none;
          transition: all 0.3s ease;
          box-sizing: border-box;
        }

        .input-control:focus {
          background: rgba(255, 255, 255, 0.08);
          border-color: #E60000;
          box-shadow: 0 0 10px rgba(230, 0, 0, 0.25);
        }

        .password-toggle {
          position: absolute;
          right: 15px;
          background: none;
          border: none;
          color: #888;
          cursor: pointer;
          padding: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: color 0.2s;
        }

        .password-toggle:hover {
          color: #ffffff;
        }

        .login-options {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 30px;
        }

        .checkbox-container {
          display: flex;
          align-items: center;
          cursor: pointer;
          color: #b0b0b0;
          font-size: 13.5px;
          user-select: none;
        }

        .checkbox-container input {
          display: none;
        }

        .custom-checkbox {
          width: 18px;
          height: 18px;
          border: 1.5px solid rgba(255, 255, 255, 0.2);
          border-radius: 5px;
          margin-right: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
          background: rgba(255, 255, 255, 0.02);
        }

        .checkbox-container:hover .custom-checkbox {
          border-color: rgba(255, 255, 255, 0.4);
        }

        .checkbox-container input:checked + .custom-checkbox {
          background: #E60000;
          border-color: #E60000;
        }

        .checkbox-container input:checked + .custom-checkbox::after {
          content: '✓';
          color: white;
          font-size: 11px;
          font-weight: bold;
        }

        .btn-submit {
          width: 100%;
          padding: 14px;
          background: #E60000;
          color: #ffffff;
          border: none;
          border-radius: 10px;
          font-size: 16px;
          font-weight: bold;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 4px 15px rgba(230, 0, 0, 0.3);
          letter-spacing: 0.5px;
          text-transform: uppercase;
        }

        .btn-submit:hover {
          background: #ff1a1a;
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(230, 0, 0, 0.45);
        }

        .btn-submit:active {
          transform: translateY(0);
        }

        .error-message {
          background: rgba(230, 0, 0, 0.15);
          border: 1px solid rgba(230, 0, 0, 0.3);
          color: #ff6b6b;
          border-radius: 8px;
          padding: 12px;
          font-size: 13.5px;
          margin-bottom: 22px;
          display: flex;
          align-items: center;
          justify-content: center;
          animation: shake 0.4s ease;
        }

        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-6px); }
          75% { transform: translateX(6px); }
        }

        .footer-note {
          margin-top: 30px;
          font-size: 11px;
          color: #666;
          letter-spacing: 0.5px;
        }
      `}</style>

      {/* Círculos decorativos de fondo */}
      <div className="bg-shape-1"></div>
      <div className="bg-shape-2"></div>

      <div className="login-card">
        <LogoPG />
        <h3 style={{ color: '#ffffff', margin: '15px 0 0 0', fontSize: '22px', fontWeight: '700', letterSpacing: '0.5px' }}>
          Acceso Autorizado
        </h3>
        <p className="login-subtitle">Gestión Constructora e Informes</p>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit}>
          {/* Input Usuario */}
          <div className="input-group">
            <label className="input-label">Usuario</label>
            <div className="input-control-wrapper">
              <span className="input-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </span>
              <input
                type="text"
                className="input-control"
                placeholder="Ingresa tu usuario"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                autoComplete="username"
              />
            </div>
          </div>

          {/* Input Contraseña */}
          <div className="input-group">
            <label className="input-label">Contraseña</label>
            <div className="input-control-wrapper">
              <span className="input-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              </span>
              <input
                type={showPassword ? 'text' : 'password'}
                className="input-control"
                placeholder="Ingresa tu contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                style={{ paddingRight: '45px' }}
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                title={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              >
                {showPassword ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Opciones (Recordarme) */}
          <div className="login-options">
            <label className="checkbox-container">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              <span className="custom-checkbox"></span>
              Recordarme en este equipo
            </label>
          </div>

          {/* Botón de envío */}
          <button type="submit" className="btn-submit" disabled={loading}>
            {loading ? '⏳ Iniciando sesión...' : 'Iniciar Sesión'}
          </button>
        </form>

        <div className="footer-note">
          © {new Date().getFullYear()} Grupo PG. Todos los derechos reservados.
        </div>
      </div>
    </div>
  );
}
