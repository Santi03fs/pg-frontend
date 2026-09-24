// Interceptor global de seguridad para fetch (PG Constructora)
const originalFetch = window.fetch;

window.fetch = async function (input, init = {}) {
  let url = typeof input === 'string' ? input : (input && input.url ? input.url : '');

  // Si la peticion va dirigida a endpoints de nuestra API
  if (url && url.includes('/api/')) {
    init = init || {};
    const headers = new Headers(init.headers || {});

    // Adjuntar token Bearer si no es el endpoint de login o de salud
    if (!url.includes('/api/usuarios/login') && !url.includes('/api/health')) {
      const token = localStorage.getItem('pg_token') || sessionStorage.getItem('pg_token');
      if (token && !headers.has('Authorization')) {
        headers.set('Authorization', 'Bearer ' + token);
      }
    }
    init.headers = headers;
  }

  const response = await originalFetch(input, init);

  // Si el backend responde con 401 (Sesion expirada o no autorizada)
  if (response.status === 401 && url && !url.includes('/api/usuarios/login')) {
    window.dispatchEvent(new CustomEvent('pg_session_expired', {
      detail: { reason: 'unauthorized', status: response.status }
    }));
  }

  return response;
};
