import React, { useState, useEffect } from 'react';

// Dynamic API Base URL depending on environment
const API_BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? 'http://localhost:8080'
  : 'https://pg-backend-v364.onrender.com';

// ================= LOGOTIPO GRUPO PG =================
const LogoPG = () => (
  <svg height="60" viewBox="0 0 300 120" xmlns="http://www.w3.org/2000/svg" style={{ display: 'block', margin: '0 auto 10px auto' }}>
    <text transform="translate(35, 88) rotate(-90)" fill="#ffffff" fontFamily="Arial Black, Impact, sans-serif" fontSize="26" fontWeight="900" letterSpacing="1">GRUPO</text>
    <text x="45" y="88" fill="#ffffff" fontFamily="Arial Black, Impact, sans-serif" fontSize="110" fontWeight="900" letterSpacing="-8">PG</text>
    <rect x="45" y="94" width="225" height="22" fill="#E60000" />
    <text x="157" y="111" fill="#FFF" fontFamily="Arial Black, sans-serif" fontSize="15" fontWeight="900" textAnchor="middle" letterSpacing="0.5">WWW.GRUPO-PG.ES</text>
  </svg>
);

export default function Login({ onLoginSuccess, sessionMessage }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingLong, setLoadingLong] = useState(false);
  const [inactivityNotice, setInactivityNotice] = useState(sessionMessage || '');

  useEffect(() => {
    // Limpiar contraseñas guardadas inseguras del almacenamiento local
    localStorage.removeItem('pg_remembered_password');

    // Comprobar si hay aviso de inactividad o caducidad en sessionStorage
    const storedReason = sessionStorage.getItem('pg_logout_reason');
    if (storedReason === 'inactivity') {
      setInactivityNotice('Tu sesión se ha cerrado automáticamente tras 15 minutos de inactividad. Por seguridad, introduce de nuevo tus credenciales.');
      sessionStorage.removeItem('pg_logout_reason');
    } else if (storedReason === 'expired') {
      setInactivityNotice('Tu sesión ha expirado. Por favor, vuelve a iniciar sesión.');
      sessionStorage.removeItem('pg_logout_reason');
    }
  }, []);

  // Temporizador para avisar si Render tarda en despertar (cold start)
  useEffect(() => {
    let timer;
    if (loading) {
      timer = setTimeout(() => {
        setLoadingLong(true);
      }, 4000);
    } else {
      setLoadingLong(false);
    }
    return () => clearTimeout(timer);
  }, [loading]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setInactivityNotice('');
    setLoading(true);

    const cleanUser = username.trim().toLowerCase();
    const cleanPass = password.trim();

    if (!cleanUser || !cleanPass) {
      setError('Por favor, completa todos los campos.');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/usuarios/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: cleanUser, password: cleanPass })
      });

      if (response.ok) {
        const userObj = await response.json();

        // Almacenamiento seguro de sesión con Token
        localStorage.setItem('pg_token', userObj.token);
        localStorage.setItem('pg_session', 'authenticated');
        localStorage.setItem('pg_user', JSON.stringify(userObj));
        localStorage.setItem('pg_last_activity', Date.now().toString());

        // Aseguramos que nunca se guarde la contraseña en texto plano en el navegador
        localStorage.removeItem('pg_remembered_password');
        sessionStorage.removeItem('pg_logout_reason');

        onLoginSuccess(userObj);
      } else {
        const status = response.status;
        if (status === 429) {
          const msg = await response.text();
          setError(msg || 'Demasiados intentos fallidos. Cuenta bloqueada temporalmente por seguridad.');
        } else if (status === 401) {
          setError('Usuario o contraseña incorrectos.');
        } else {
          const msg = await response.text();
          setError(msg || 'Error al iniciar sesión. Inténtalo de nuevo.');
        }
      }
    } catch (err) {
      console.error(err);
      setError('Error de conexión con el servidor. Si el host gratuito de Render estaba suspendido, puede tardar hasta 45 segundos en despertar. Por favor, reintenta.');
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
          100% { transform: translateY(20px) scale(1.05); }
        }

        .login-card {
          width: 100%;
          max-width: 420px;
          background: rgba(25, 25, 25, 0.75);
          backdrop-filter: blur(16px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 20px;
          padding: 40px 35px;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.05);
          text-align: center;
          z-index: 10;
          animation: fadeIn 0.6s cubic-bezier(0.16, 1, 0.3, 1);
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .login-subtitle {
          color: #a0a0a0;
          font-size: 14px;
          margin-top: 5px;
          margin-bottom: 25px;
          font-weight: 400;
        }

        .security-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: rgba(46, 204, 113, 0.12);
          border: 1px solid rgba(46, 204, 113, 0.3);
          color: #2ecc71;
          font-size: 11px;
          font-weight: 600;
          padding: 4px 10px;
          border-radius: 20px;
          margin-bottom: 18px;
          letter-spacing: 0.5px;
        }

        .inactivity-notice {
          background: rgba(243, 156, 18, 0.15);
          border: 1.5px solid rgba(243, 156, 18, 0.4);
          color: #f39c12;
          border-radius: 12px;
          padding: 14px;
          font-size: 13.5px;
          margin-bottom: 22px;
          text-align: left;
          line-height: 1.45;
          display: flex;
          align-items: flex-start;
          gap: 10px;
        }

        .inactivity-notice strong {
          color: #f1c40f;
          display: block;
          margin-bottom: 3px;
        }

        .error-message {
          background: rgba(230, 0, 0, 0.15);
          border: 1px solid rgba(230, 0, 0, 0.3);
          color: #ff6b6b;
          border-radius: 10px;
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

        .server-wake-hint {
          background: rgba(52, 152, 219, 0.15);
          border: 1px solid rgba(52, 152, 219, 0.3);
          color: #3498db;
          border-radius: 8px;
          padding: 10px;
          font-size: 12.5px;
          margin-bottom: 18px;
          animation: pulse 1.5s infinite alternate;
        }

        @keyframes pulse {
          0% { opacity: 0.7; }
          100% { opacity: 1; }
        }

        .input-group {
          margin-bottom: 20px;
          text-align: left;
        }

        .input-label {
          display: block;
          color: #e0e0e0;
          font-size: 13px;
          margin-bottom: 8px;
          font-weight: 500;
          letter-spacing: 0.5px;
        }

        .input-control-wrapper {
          position: relative;
          display: flex;
          align-items: center;
        }

        .input-icon {
          position: absolute;
          left: 15px;
          color: #E60000;
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
          margin-top: 10px;
        }

        .btn-submit:hover:not(:disabled) {
          background: #ff1a1a;
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(230, 0, 0, 0.45);
        }

        .btn-submit:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .footer-note {
          margin-top: 25px;
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

        <div className="security-badge">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
          </svg>
          Sesión protegida por cifrado y token
        </div>

        {inactivityNotice && (
          <div className="inactivity-notice">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0, marginTop: '2px' }}>
              <circle cx="12" cy="12" r="10"/>
              <polyline points="12 6 12 12 16 14"/>
            </svg>
            <div>
              <strong>Seguridad por Inactividad</strong>
              {inactivityNotice}
            </div>
          </div>
        )}

        {error && <div className="error-message">{error}</div>}

        {loadingLong && (
          <div className="server-wake-hint">
            ⏳ Despertando el servidor en Render (arranque en frío)... Por favor aguarda unos segundos.
          </div>
        )}

        <form onSubmit={handleSubmit} autoComplete="off">
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
                autoComplete="off"
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
                autoComplete="new-password"
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

          {/* Botón de envío */}
          <button type="submit" className="btn-submit" disabled={loading}>
            {loading ? 'Verificando credenciales...' : 'Iniciar Sesión'}
          </button>
        </form>

        <div className="footer-note">
          © {new Date().getFullYear()} Grupo PG. Todos los derechos reservados.
        </div>
      </div>
    </div>
  );
}