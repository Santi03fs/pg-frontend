import React, { useState, useEffect, useRef } from 'react';
import './apiInterceptor';
import * as XLSX from 'xlsx-js-style';
import './App.css';
import Login from './Login';

const API_BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? 'http://localhost:8080'
  : 'https://pg-backend-v364.onrender.com';

// ================= LOGOTIPO GRUPO PG =================
const LogoPG = () => (
  <svg height="50" viewBox="0 0 300 120" xmlns="http://www.w3.org/2000/svg" style={{ display: 'block', maxWidth: '100%' }}>
    <text transform="translate(35, 88) rotate(-90)" fill="#000" fontFamily="Arial Black, Impact, sans-serif" fontSize="26" fontWeight="900" letterSpacing="1">GRUPO</text>
    <text x="45" y="88" fill="#000" fontFamily="Arial Black, Impact, sans-serif" fontSize="110" fontWeight="900" letterSpacing="-8">PG</text>
    <rect x="45" y="94" width="225" height="22" fill="#E60000" />
    <text x="157" y="111" fill="#FFF" fontFamily="Arial Black, sans-serif" fontSize="15" fontWeight="900" textAnchor="middle" letterSpacing="0.5">WWW.GRUPO-PG.ES</text>
  </svg>
);

const plantillaPartidasPredefinidas = Array.from({length: 30}, (_, i) => `Partida ${i+1}`);
const plantillaFasesPredefinidas = Array.from({length: 30}, (_, i) => `Fase ${i+1}`);


// ================= HORARIOS Y FRANJAS =================
const horariosPredefinidos = [
  { label: "08:00 a 18:00", horas: 10 },
  { label: "07:30 a 16:30", horas: 9 },
  { label: "12:00 a 21:00", horas: 9 },
  { label: "08:00 a 17:00", horas: 9 },
  { label: "09:00 a 17:00", horas: 8 }
];

// Array de horas (de media en media) para los selectores de Partes
const horasDisponibles = [];
for (let i = 6; i <= 22; i++) {
  const hh = String(i).padStart(2, '0');
  horasDisponibles.push(`${hh}:00`);
  horasDisponibles.push(`${hh}:30`);
}

// Constantes de seguridad e inactividad (15 minutos)
const INACTIVITY_TIMEOUT = 15 * 60 * 1000;
const WARNING_TIME = 14 * 60 * 1000; // Aviso a los 14 min (60s restantes)

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [usuarioActual, setUsuarioActual] = useState(null);
  const [seccionActiva, setSeccionActiva] = useState('diario');

  // Estados de control de inactividad y seguridad
  const [showInactivityWarning, setShowInactivityWarning] = useState(false);
  const [countdownSeconds, setCountdownSeconds] = useState(60);
  const [sessionMessage, setSessionMessage] = useState('');
  const lastActivityRef = useRef(Date.now()); 

  // ================= ESTADOS GENERALES =================
  const [obras, setObras] = useState([]);

  // ================= ESTADOS USUARIOS =================
  const [usuarios, setUsuarios] = useState([]);
  const [usernameNuevo, setUsernameNuevo] = useState('');
  const [passwordNuevo, setPasswordNuevo] = useState('');
  const [rolNuevo, setRolNuevo] = useState('USER');
  const [nombreNuevo, setNombreNuevo] = useState('');
  const [trabajadores, setTrabajadores] = useState([]);
  const [asistencias, setAsistencias] = useState([]);
  const [gastos, setGastos] = useState([]);

  // ================= ESTADOS PARTIDAS =================
  const [partidas, setPartidas] = useState([]);
  const [fases, setFases] = useState([]);
  const [obraSeleccionadaPartidas, setObraSeleccionadaPartidas] = useState(null);
  const [obraSeleccionadaFases, setObraSeleccionadaFases] = useState(null);
  const [partidasObra, setPartidasObra] = useState([]);
  const [fasesObra, setFasesObra] = useState([]);

  // Estados para Edición de Trabajador
  const [idTrabajadorEdit, setIdTrabajadorEdit] = useState(null);
  const [horasJornadaTrabajador, setHorasJornadaTrabajador] = useState('8.0');
  const [pagoDiarioTrabajador, setPagoDiarioTrabajador] = useState('0.0');
  const [rolTrabajador, setRolTrabajador] = useState('Obra'); // 'Oficina', 'Obra', 'Hotel'
  const [esExtraTrabajador, setEsExtraTrabajador] = useState(false);

  // Estados para Edición de Obra
  const [idObraEdit, setIdObraEdit] = useState(null);

  // Estados para el Control Diario
  const [fechaControlDiario, setFechaControlDiario] = useState(new Date().toISOString().slice(0, 10));
  const [filasDiario, setFilasDiario] = useState([]);
  const [filtroRolDiario, setFiltroRolDiario] = useState('Todos'); // 'Todos', 'Oficina', 'Obra', 'Hotel'
  const [ordenDiario, setOrdenDiario] = useState('rol'); // 'rol', 'nombre'
  const [idsAEliminar, setIdsAEliminar] = useState([]);
  const [guardando, setGuardando] = useState(false);

  // ================= ESTADOS FORMULARIOS =================
  const [cliente, setCliente] = useState('');
  const [nombreObra, setNombreObra] = useState('');
  const [fechaInicio, setFechaInicio] = useState('');
  
  const [nombreTrabajador, setNombreTrabajador] = useState('');
  

  
  const [idObraSelGasto, setIdObraSelGasto] = useState('');
  const [partidaGasto, setPartidaGasto] = useState('');
  const [faseGasto, setFaseGasto] = useState('');
  const [categoria, setCategoria] = useState('');
  const [fechaGasto, setFechaGasto] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [provTrabajador, setProvTrabajador] = useState('');
  const [udsHoras, setUdsHoras] = useState('');
  const [precioNeto, setPrecioNeto] = useState('');
  const [precioPvp, setPrecioPvp] = useState('');

  // ================= ESTADOS INFORME EDITABLE Y FILTROS =================
  const [mesFiltro, setMesFiltro] = useState(new Date().toISOString().slice(0, 7));
  const [trabajadorFiltro, setTrabajadorFiltro] = useState('');
  const [cuadrante, setCuadrante] = useState([]); 
  
  const [filtroObraGastos, setFiltroObraGastos] = useState('');


  // ================= SEGURIDAD E INACTIVIDAD =================
  const updateActivity = () => {
    const now = Date.now();
    if (now - lastActivityRef.current > 1000) {
      lastActivityRef.current = now;
      localStorage.setItem('pg_last_activity', now.toString());
      if (showInactivityWarning) {
        setShowInactivityWarning(false);
      }
    }
  };

  const handleLogout = (reason = 'manual') => {
    localStorage.removeItem('pg_session');
    localStorage.removeItem('pg_token');
    localStorage.removeItem('pg_user');
    localStorage.removeItem('pg_last_activity');
    localStorage.removeItem('pg_remembered_password');
    sessionStorage.removeItem('pg_session');
    sessionStorage.removeItem('pg_token');
    sessionStorage.removeItem('pg_user');

    if (reason === 'inactivity') {
      sessionStorage.setItem('pg_logout_reason', 'inactivity');
      setSessionMessage('Tu sesión ha expirado tras 15 minutos de inactividad. Por favor, introduce tus credenciales de nuevo.');
    } else if (reason === 'expired') {
      sessionStorage.setItem('pg_logout_reason', 'expired');
      setSessionMessage('Tu sesión ha caducado. Por favor, vuelve a iniciar sesión.');
    } else {
      sessionStorage.removeItem('pg_logout_reason');
      setSessionMessage('');
    }

    if (reason !== 'storage') {
      localStorage.setItem('pg_logout_broadcast', Date.now().toString());
      setTimeout(() => localStorage.removeItem('pg_logout_broadcast'), 1000);
    }

    setShowInactivityWarning(false);
    setUsuarioActual(null);
    setIsAuthenticated(false);
  };

  // Comprobar sesión al inicio y verificar si expiró por inactividad
  useEffect(() => {
    const session = localStorage.getItem('pg_session') || sessionStorage.getItem('pg_session');
    const token = localStorage.getItem('pg_token') || sessionStorage.getItem('pg_token');
    const lastActStr = localStorage.getItem('pg_last_activity');
    const lastAct = lastActStr ? parseInt(lastActStr, 10) : 0;
    const now = Date.now();

    if (session === 'authenticated' && token) {
      if (lastAct && (now - lastAct >= INACTIVITY_TIMEOUT)) {
        handleLogout('inactivity');
        return;
      }
      setIsAuthenticated(true);
      const userStored = localStorage.getItem('pg_user') || sessionStorage.getItem('pg_user');
      if (userStored) {
        try {
          setUsuarioActual(JSON.parse(userStored));
        } catch (e) {
          console.error("Error parseando usuario guardado:", e);
        }
      }
      localStorage.setItem('pg_last_activity', now.toString());
      lastActivityRef.current = now;
    } else {
      handleLogout('clean');
    }
  }, []);

  // Monitor continuo de inactividad (15 min), sincronización de pestañas y 401 de API
  useEffect(() => {
    if (!isAuthenticated) return;

    const checkInterval = setInterval(() => {
      const lastActStr = localStorage.getItem('pg_last_activity');
      const lastAct = lastActStr ? parseInt(lastActStr, 10) : Date.now();
      const idleTime = Date.now() - lastAct;

      if (idleTime >= INACTIVITY_TIMEOUT) {
        handleLogout('inactivity');
      } else if (idleTime >= WARNING_TIME) {
        const remaining = Math.max(0, Math.ceil((INACTIVITY_TIMEOUT - idleTime) / 1000));
        setCountdownSeconds(remaining);
        setShowInactivityWarning(true);
      } else {
        if (showInactivityWarning) {
          setShowInactivityWarning(false);
        }
      }
    }, 1000);

    const handleStorageChange = (e) => {
      if (e.key === 'pg_logout_broadcast') {
        handleLogout('storage');
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        const lastActStr = localStorage.getItem('pg_last_activity');
        const lastAct = lastActStr ? parseInt(lastActStr, 10) : Date.now();
        if (Date.now() - lastAct >= INACTIVITY_TIMEOUT) {
          handleLogout('inactivity');
        }
      }
    };

    const handleApiExpired = () => {
      handleLogout('expired');
    };

    window.addEventListener('storage', handleStorageChange);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('pg_session_expired', handleApiExpired);

    const events = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart', 'click'];
    const onUserActivity = () => updateActivity();
    events.forEach(ev => window.addEventListener(ev, onUserActivity, { passive: true }));

    return () => {
      clearInterval(checkInterval);
      window.removeEventListener('storage', handleStorageChange);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('pg_session_expired', handleApiExpired);
      events.forEach(ev => window.removeEventListener(ev, onUserActivity));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, showInactivityWarning]);

  useEffect(() => {
    if (isAuthenticated) {
      cargarTodo();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  const cargarTodo = () => {
    cargarObras(); 
    cargarTrabajadores(); 
    cargarAsistencias(); 
    cargarGastos();
    cargarPartidas();
    cargarFases();
    
    const userStored = localStorage.getItem('pg_user') || sessionStorage.getItem('pg_user');
    if (userStored) {
      const u = JSON.parse(userStored);
      if (u.rol === 'ADMIN') {
        fetch(`${API_BASE_URL}/api/usuarios`)
          .then(res => res.json())
          .then(setUsuarios)
          .catch(err => console.error("Error al cargar usuarios inicial:", err));
      }
    }
  };

  const cargarPartidas = () => fetch(`${API_BASE_URL}/api/partidas`).then(res => res.json()).then(setPartidas).catch(err => console.error("Error al cargar partidas:", err));
  const cargarFases = () => fetch(`${API_BASE_URL}/api/fases`).then(res => res.json()).then(setFases).catch(err => console.error("Error al cargar fases:", err));
  const cargarUsuarios = () => fetch(`${API_BASE_URL}/api/usuarios`).then(res => res.json()).then(setUsuarios).catch(err => console.error("Error al cargar usuarios:", err));
  const cargarObras = () => fetch(`${API_BASE_URL}/api/obras`).then(res => res.json()).then(setObras).catch(err => console.error("Error al cargar obras:", err));
  const cargarTrabajadores = () => fetch(`${API_BASE_URL}/api/trabajadores`).then(res => res.json()).then(setTrabajadores).catch(err => console.error("Error al cargar trabajadores:", err));
  const cargarAsistencias = () => fetch(`${API_BASE_URL}/api/asistencias`).then(res => res.json()).then(setAsistencias).catch(err => console.error("Error al cargar asistencias:", err));
  const cargarGastos = () => fetch(`${API_BASE_URL}/api/gastos`).then(res => res.json()).then(setGastos).catch(err => console.error("Error al cargar gastos:", err));

  // ================= HELPERS Y CÁLCULOS FILTRADOS =================

  const getNombreObra = (id) => obras.find(o => Number(o.id) === Number(id))?.nombreObra || '';
  const getNombreTrabajador = (id) => trabajadores.find(t => Number(t.id) === Number(id))?.nombre || 'Desconocido';
  
  const getRolBadge = (rol) => {
    const r = rol || 'Obra';
    let bg = '#e67e22'; // Obra (naranja)
    let icon = '🏗️';
    if (r === 'Oficina') {
      bg = '#2980b9'; // Oficina (azul)
      icon = '🏢';
    } else if (r === 'Hotel') {
      bg = '#16a085'; // Hotel (verde azulado)
      icon = '🏨';
    } else if (r === 'EXTRA') {
      bg = '#d35400'; // EXTRA (naranja destacado)
      icon = '⭐';
    }
    return (
      <span style={{ backgroundColor: bg, color: 'white', padding: '3px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 'bold', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
        {icon} {r}
      </span>
    );
  };

  const getExtraBadge = () => {
    return (
      <span 
        style={{ 
          backgroundColor: '#e67e22', 
          color: 'white', 
          padding: '3px 8px', 
          borderRadius: '12px', 
          fontSize: '11px', 
          fontWeight: 'bold', 
          display: 'inline-flex', 
          alignItems: 'center', 
          gap: '4px',
          boxShadow: '0 1px 3px rgba(230, 126, 34, 0.35)',
          letterSpacing: '0.3px'
        }}
        title="Asistencia Excepcional (EXTRA)"
      >
        ⭐ EXTRA
      </span>
    );
  };

  const gastosFiltrados = filtroObraGastos 
    ? gastos.filter(g => Number(g.idObra) === parseInt(filtroObraGastos)) 
    : gastos;

  const totalGastosNeto = gastosFiltrados.reduce((s, g) => s + (g.precioNeto || 0), 0);
  const totalFacturadoPvp = gastosFiltrados.reduce((s, g) => s + (g.precioPvp || 0), 0);
  const beneficioTotal = totalFacturadoPvp - totalGastosNeto;

  // ================= LÓGICA DEL CUADRANTE EDITABLE (INFORMES) =================
  useEffect(() => {
    if (mesFiltro && trabajadorFiltro && obras.length > 0) {
      const [year, month] = mesFiltro.split('-');
      const diasEnMes = new Date(year, month, 0).getDate();
      const nombresDias = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
      const nombresMeses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
      
      const nuevoCuadrante = [];
      for (let i = 1; i <= diasEnMes; i++) {
        const fechaActual = new Date(year, month - 1, i);
        const diaSemana = fechaActual.getDay();
        const fechaStr = `${year}-${month}-${String(i).padStart(2, '0')}`;
        
        const partesDb = asistencias.filter(a => Number(a.idTrabajador) === parseInt(trabajadorFiltro) && a.fecha === fechaStr);
        
        if (partesDb.length === 0) {
          nuevoCuadrante.push({
            nDia: i, nMes: nombresMeses[fechaActual.getMonth()], nSem: nombresDias[diaSemana], esFinde: diaSemana === 0 || diaSemana === 6,
            fechaStr, idAsis: null, asistencia: '', horario: '', idObra: '', partida: '', horas: '', horasExtra: '', descripcionExtra: '', tipoPago: 'Normal', pagoDia: 0.0
          });
        } else {
          partesDb.forEach(parteDb => {
            nuevoCuadrante.push({
              nDia: i, nMes: nombresMeses[fechaActual.getMonth()], nSem: nombresDias[diaSemana], esFinde: diaSemana === 0 || diaSemana === 6,
              fechaStr, idAsis: parteDb.id, asistencia: parteDb.estadoAsistencia === 'Vacaciones' ? 'Vacaciones' : (parteDb.haAsistido ? 'Sí' : 'No'),
              horario: parteDb.horario || '', idObra: parteDb.idObra || '', partida: parteDb.partida || '', 
              horas: parteDb.horasTrabajadas !== undefined && parteDb.horasTrabajadas !== null ? parteDb.horasTrabajadas : '',
              horasExtra: parteDb.horasExtra !== undefined && parteDb.horasExtra !== null ? parteDb.horasExtra : '',
              descripcionExtra: parteDb.descripcion || '', tipoPago: parteDb.tipoPago || 'Normal', pagoDia: parteDb.pagoDia !== undefined && parteDb.pagoDia !== null ? parteDb.pagoDia : 0.0
            });
          });
        }
      }
      setCuadrante(nuevoCuadrante);
    }
  }, [mesFiltro, trabajadorFiltro, asistencias, obras]);

  const handleAddRowCuadrante = (index) => {
    const targetDay = cuadrante[index];
    const newRow = {
      ...targetDay, idAsis: null, asistencia: 'Sí', horario: targetDay.horario, idObra: '', partida: '', horas: '', horasExtra: '', descripcionExtra: '', isNewRow: true
    };
    const copia = [...cuadrante];
    copia.splice(index + 1, 0, newRow);
    setCuadrante(copia);
  };

  const handleRemoveRowCuadrante = async (index) => {
    const targetRow = cuadrante[index];
    if (targetRow.idAsis) {
      if (window.confirm("⚠️ ¿Estás seguro de que quieres eliminar este parte de asistencia?")) {
        try {
          const res = await fetch(`${API_BASE_URL}/api/asistencias/${targetRow.idAsis}`, { method: 'DELETE' });
          if (res.ok) cargarAsistencias();
          else alert("Error al eliminar el registro.");
        } catch (e) { console.error("Error al eliminar:", e); }
      }
    } else {
      const copia = [...cuadrante];
      copia.splice(index, 1);
      setCuadrante(copia);
    }
  };

  const handleEditCuadrante = (index, campo, valor) => {
    const copia = [...cuadrante];
    copia[index][campo] = valor;
    setCuadrante(copia);
  };

  const guardarCambiosCuadrante = async () => {
    // Filtrar cualquier fila que tenga datos (id existente, obra, partida, descripción, horas, asistencia, etc.)
    const editados = cuadrante.filter(d => 
      d.idAsis !== null || 
      d.isNewRow ||
      (d.asistencia && d.asistencia.trim() !== '') || 
      (d.idObra && String(d.idObra).trim() !== '') || 
      (d.partida && d.partida.trim() !== '') || 
      (d.descripcionExtra && d.descripcionExtra.trim() !== '') || 
      (d.horas && String(d.horas).trim() !== '') || 
      (d.horasExtra && String(d.horasExtra).trim() !== '') ||
      (d.horario && d.horario.trim() !== '' && d.horario !== ' a ')
    );

    const lotes = editados.map(dia => {
      const tieneAsistencia = dia.asistencia === 'Sí' || dia.asistencia === 'Si' || dia.asistencia === 'Presente';
      const esVacaciones = dia.asistencia === 'Vacaciones';
      const esAusente = dia.asistencia === 'No' || dia.asistencia === 'Ausente';
      
      let haAsistidoVal = true;
      let estadoVal = 'Presente';
      if (esVacaciones) {
        haAsistidoVal = false;
        estadoVal = 'Vacaciones';
      } else if (esAusente) {
        haAsistidoVal = false;
        estadoVal = 'Ausente';
      } else if (tieneAsistencia) {
        haAsistidoVal = true;
        estadoVal = 'Presente';
      } else {
        // Si no seleccionó nada en el desplegable de asistencia pero rellenó datos:
        haAsistidoVal = true;
        estadoVal = 'Presente';
      }

      return {
        id: dia.idAsis || null,
        fecha: dia.fechaStr,
        idTrabajador: parseInt(trabajadorFiltro),
        idObra: dia.idObra ? parseInt(dia.idObra) : null,
        haAsistido: haAsistidoVal,
        estadoAsistencia: estadoVal,
        horasTrabajadas: dia.horas !== '' && dia.horas !== null && !isNaN(parseFloat(dia.horas)) ? parseFloat(dia.horas) : null,
        horasExtra: dia.horasExtra !== '' && dia.horasExtra !== null && !isNaN(parseFloat(dia.horasExtra)) ? parseFloat(dia.horasExtra) : 0.0,
        horario: dia.horario || '',
        partida: dia.partida || '',
        descripcion: dia.descripcionExtra || '',
        tipoPago: dia.tipoPago || 'Normal',
        pagoDia: parseFloat(dia.pagoDia) || 0.0,
        pagado: false
      };
    });

    if (lotes.length > 0) {
      try {
        const res = await fetch(`${API_BASE_URL}/api/asistencias/batch`, { 
          method: 'POST', 
          headers: { 'Content-Type': 'application/json' }, 
          body: JSON.stringify(lotes) 
        });
        if (!res.ok) throw new Error(await res.text() || res.statusText);
        alert("¡Cuadrante guardado en la base de datos con éxito!"); 
        cargarAsistencias();
      } catch (error) { 
        console.error("Error al guardar cuadrante:", error);
        alert("Error al guardar los datos del cuadrante."); 
      }
    } else {
      alert("No hay cambios que guardar.");
    }
  };

  // ================= LÓGICA DEL CONTROL DIARIO RÁPIDO =================
  const cargarAsistenciaDiariaDelDia = () => {
    if (!fechaControlDiario || trabajadores.length === 0) return;
    const asistenciasDia = asistencias.filter(a => a.fecha === fechaControlDiario);

    const nuevasFilas = trabajadores.map(t => {
      const asistenciasT = asistenciasDia.filter(a => Number(a.idTrabajador) === Number(t.id));
      const horasJornadaVal = t.horasJornada !== undefined && t.horasJornada !== null ? t.horasJornada : 8.0;
      const pagoDiarioVal = t.pagoDiario !== undefined && t.pagoDiario !== null ? t.pagoDiario : 0.0;
      const rolVal = t.rol || 'Obra';
      const esExtraVal = asistenciasT.length > 0 && asistenciasT[0].esExtra !== undefined && asistenciasT[0].esExtra !== null
        ? Boolean(asistenciasT[0].esExtra)
        : Boolean(t.esExtra);

      const emptyObra = { idAsistencia: null, idObra: '', partida: '', fase: '', descripcion: '', tipoPago: 'Normal', pagoDia: pagoDiarioVal, horasTrabajadas: '', horario: '', mostrarTransporte: false, transporteDesc: '', transporteTarifa: '' };

      if (asistenciasT.length === 0) {
        return { idTrabajador: t.id, nombre: t.nombre, rol: rolVal, esExtra: esExtraVal, horasJornada: horasJornadaVal, pagoDiarioDefault: pagoDiarioVal, estadoAsistencia: 'Ausente', idAsistenciaRaiz: null, obras: [emptyObra] };
      } else {
        const registroRaiz = asistenciasT.find(a => a.idObra === null || !a.haAsistido);
        if (registroRaiz) {
          const esExtraRaiz = registroRaiz.esExtra !== undefined && registroRaiz.esExtra !== null ? Boolean(registroRaiz.esExtra) : esExtraVal;
          return { idTrabajador: t.id, nombre: t.nombre, rol: rolVal, esExtra: esExtraRaiz, horasJornada: horasJornadaVal, pagoDiarioDefault: pagoDiarioVal, estadoAsistencia: registroRaiz.estadoAsistencia || 'Ausente', idAsistenciaRaiz: registroRaiz.id, obras: [emptyObra] };
        } else {
          return {
            idTrabajador: t.id, nombre: t.nombre, rol: rolVal, esExtra: esExtraVal, horasJornada: horasJornadaVal, pagoDiarioDefault: pagoDiarioVal, estadoAsistencia: 'Presente', idAsistenciaRaiz: null,
            obras: asistenciasT.map(a => ({
              idAsistencia: a.id, idObra: a.idObra || '', partida: a.partida || '', fase: a.fase || '', descripcion: a.descripcion || '', tipoPago: a.tipoPago || 'Normal',
              pagoDia: a.pagoDia !== undefined && a.pagoDia !== null ? a.pagoDia : pagoDiarioVal, horasTrabajadas: a.horasTrabajadas !== undefined ? a.horasTrabajadas : '',
              horario: a.horario || '', mostrarTransporte: false, transporteDesc: '', transporteTarifa: ''
            }))
          };
        }
      }
    });
    setFilasDiario(nuevasFilas);
  };

  useEffect(() => {
    cargarAsistenciaDiariaDelDia();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fechaControlDiario, trabajadores, asistencias]);

  const handleToggleExtra = (trabajadorId) => {
    setFilasDiario(prev => prev.map(f => {
      if (f.idTrabajador === trabajadorId) {
        return { ...f, esExtra: !f.esExtra };
      }
      return f;
    }));
  };

  const handleCambiarEstadoAsistencia = (trabajadorId, nuevoEstado) => {
    setFilasDiario(prev => prev.map(f => {
      if (f.idTrabajador === trabajadorId) {
        return {
          ...f, estadoAsistencia: nuevoEstado,
          obras: nuevoEstado === 'Presente' && (f.obras.length === 0 || (f.obras.length === 1 && f.obras[0].idObra === '')) ? [
            { idAsistencia: null, idObra: '', partida: '', fase: '', descripcion: '', tipoPago: 'Normal', pagoDia: f.pagoDiarioDefault, horasTrabajadas: '', horario: '', mostrarTransporte: false, transporteDesc: '', transporteTarifa: '' }
          ] : f.obras
        };
      }
      return f;
    }));
  };

  const handleAddObraAsignacion = (trabajadorId) => {
    setFilasDiario(prev => prev.map(f => {
      if (f.idTrabajador === trabajadorId) {
        const lastObra = f.obras[f.obras.length - 1];
        return {
          ...f, obras: [...f.obras, { idAsistencia: null, idObra: '', partida: '', fase: '', descripcion: '', tipoPago: 'Normal', pagoDia: f.pagoDiarioDefault, horasTrabajadas: '', horario: lastObra ? lastObra.horario : '', mostrarTransporte: false, transporteDesc: '', transporteTarifa: '' }]
        };
      }
      return f;
    }));
  };

  const handleRemoveObraAsignacion = (trabajadorId, obraIndex, idAsistencia) => {
    if (idAsistencia) setIdsAEliminar(prev => [...prev, idAsistencia]);
    setFilasDiario(prev => prev.map(f => {
      if (f.idTrabajador === trabajadorId) {
        const nuevasObras = f.obras.filter((_, idx) => idx !== obraIndex);
        return {
          ...f, obras: nuevasObras.length === 0 ? [{ idAsistencia: null, idObra: '', partida: '', fase: '', descripcion: '', tipoPago: 'Normal', pagoDia: f.pagoDiarioDefault, horasTrabajadas: '', horario: '', mostrarTransporte: false, transporteDesc: '', transporteTarifa: '' }] : nuevasObras
        };
      }
      return f;
    }));
  };

  const handleModificarObraAsignacion = (trabajadorId, obraIndex, campo, valor) => {
    setFilasDiario(prev => prev.map(f => {
      if (f.idTrabajador === trabajadorId) {
        const nuevasObras = f.obras.map((o, idx) => {
          if (idx === obraIndex) {
            const obraModificada = { ...o, [campo]: valor };
            if (campo === 'tipoPago' && valor === 'Normal') obraModificada.pagoDia = f.pagoDiarioDefault;
            return obraModificada;
          }
          return o;
        });
        return { ...f, obras: nuevasObras };
      }
      return f;
    }));
  };

  const guardarTransporteDesdeDiario = async (idTrabajador, indexObra, idObra, descripcionTrans, tarifaTrans) => {
    if (!descripcionTrans || !tarifaTrans) {
      alert("Debes indicar una descripción y una tarifa para guardar el transporte.");
      return;
    }
    try {
      const payload = {
        idObra: parseInt(idObra),
        categoria: 'Transporte',
        fecha: fechaControlDiario,
        descripcion: descripcionTrans,
        provTrabajador: getNombreTrabajador(idTrabajador),
        udsHoras: 1,
        precioNeto: parseFloat(tarifaTrans) || 0,
        precioPvp: parseFloat(tarifaTrans) || 0
      };
      
      const res = await fetch(`${API_BASE_URL}/api/gastos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      if (res.ok) {
        alert("¡Transporte guardado correctamente en los gastos de la obra!");
        cargarGastos(); 
        handleModificarObraAsignacion(idTrabajador, indexObra, 'mostrarTransporte', false);
        handleModificarObraAsignacion(idTrabajador, indexObra, 'transporteDesc', '');
        handleModificarObraAsignacion(idTrabajador, indexObra, 'transporteTarifa', '');
      } else {
        alert("Hubo un error al guardar el transporte.");
      }
    } catch (error) {
      console.error("Error guardando transporte:", error);
      alert("Error de conexión al guardar el transporte.");
    }
  };

  const guardarControlDiario = async () => {
    for (const fila of filasDiario) {
      if (fila.estadoAsistencia === 'Presente') {
        if (!fila.obras || fila.obras.length === 0) { alert(`Falta asignar obra para ${fila.nombre}.`); return; }
        for (let i = 0; i < fila.obras.length; i++) {
          const o = fila.obras[i];
          if (!o.idObra || o.idObra === '') { alert(`Falta Obra en ${fila.nombre}.`); return; }
          if (!o.partida || o.partida === '') { alert(`Falta Partida en ${fila.nombre}.`); return; }
          if (o.horasTrabajadas === '' || isNaN(parseFloat(o.horasTrabajadas))) { alert(`Falta Horas en ${fila.nombre}.`); return; }
        }
      }
    }

    setGuardando(true);
    const registrosAGuardar = [];

    filasDiario.forEach(fila => {
      if (fila.estadoAsistencia !== 'Presente') {
        registrosAGuardar.push({
          id: fila.idAsistenciaRaiz || null,
          fecha: fechaControlDiario,
          idTrabajador: fila.idTrabajador,
          idObra: null,
          haAsistido: false,
          estadoAsistencia: fila.estadoAsistencia,
          tipoPago: 'Normal',
          pagoDia: 0.0,
          horasTrabajadas: 0,
          horasExtra: 0.0,
          esExtra: Boolean(fila.esExtra),
          horario: '',
          partida: '',
            fase: '',
            descripcion: '',
          pagado: false
        });
      } else {
        fila.obras.forEach(o => {
          registrosAGuardar.push({
            id: o.idAsistencia || null,
            fecha: fechaControlDiario,
            idTrabajador: fila.idTrabajador,
            idObra: parseInt(o.idObra),
            haAsistido: true,
            estadoAsistencia: 'Presente',
            tipoPago: 'Normal',
            pagoDia: parseFloat(o.pagoDia) || 0.0,
            horasTrabajadas: parseFloat(o.horasTrabajadas) || 0.0,
            horasExtra: 0.0,
            esExtra: Boolean(fila.esExtra),
            horario: o.horario || '',
            partida: o.partida || '',
            fase: o.fase || '',
            descripcion: o.descripcion || '',
            pagado: false
          });
        });
      }
    });

    const asistenciasDiaOriginal = asistencias.filter(a => a.fecha === fechaControlDiario);
    const idsExistentesBD = asistenciasDiaOriginal.map(a => a.id).filter(id => id !== null && id !== undefined);
    const idsAMantener = registrosAGuardar.map(r => r.id).filter(id => id !== null && id !== undefined);
    const idsAEliminarCalculados = idsExistentesBD.filter(id => !idsAMantener.includes(id));
    const todosIdsAEliminar = [...new Set([...idsAEliminar, ...idsAEliminarCalculados])];

    try {
      for (const idBorrar of todosIdsAEliminar) {
        await fetch(`${API_BASE_URL}/api/asistencias/${idBorrar}`, { method: 'DELETE' });
      }
      setIdsAEliminar([]);

      if (registrosAGuardar.length > 0) {
        const res = await fetch(`${API_BASE_URL}/api/asistencias/batch`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(registrosAGuardar)
        });
        if (!res.ok) throw new Error(await res.text());
      }
      alert("¡Asistencia diaria guardada con éxito!");
      cargarAsistencias();
    } catch (error) { alert("Error al guardar los datos de asistencia."); } finally { setGuardando(false); }
  };

  const toggleExtraTrabajadorDirecto = async (t) => {
    const nuevoEsExtra = !(t.esExtra || t.rol === 'EXTRA');
    const rolActual = t.rol === 'EXTRA' ? 'Obra' : (t.rol || 'Obra');
    const payload = {
      ...t,
      rol: rolActual,
      esExtra: nuevoEsExtra
    };
    try {
      const res = await fetch(`${API_BASE_URL}/api/trabajadores`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        cargarTrabajadores();
      } else {
        alert("Error al actualizar el estado EXTRA del trabajador.");
      }
    } catch (error) {
      console.error("Error al cambiar rol EXTRA:", error);
      alert("Error de conexión al actualizar el trabajador.");
    }
  };

  const iniciarEdicionTrabajador = (t) => {
    setIdTrabajadorEdit(t.id); 
    setNombreTrabajador(t.nombre); 
    setRolTrabajador(t.rol || (t.esExtra ? 'EXTRA' : 'Obra'));
    setEsExtraTrabajador(Boolean(t.esExtra || t.rol === 'EXTRA'));
    setHorasJornadaTrabajador(t.horasJornada !== undefined && t.horasJornada !== null ? String(t.horasJornada) : '8.0');
    setPagoDiarioTrabajador(t.pagoDiario !== undefined && t.pagoDiario !== null ? String(t.pagoDiario) : '0.0');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelarEdicionTrabajador = () => {
    setIdTrabajadorEdit(null); 
    setNombreTrabajador(''); 
    setRolTrabajador('Obra');
    setEsExtraTrabajador(false);
    setHorasJornadaTrabajador('8.0'); 
    setPagoDiarioTrabajador('0.0');
  };

  const iniciarEdicionObra = (o) => {
    setIdObraEdit(o.id);
    setCliente(o.cliente || '');
    setNombreObra(o.nombreObra || '');
    setFechaInicio(o.fechaInicio || '');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelarEdicionObra = () => {
    setIdObraEdit(null);
    setCliente('');
    setNombreObra('');
    setFechaInicio('');
  };

  const obtenerAusentes = () => filasDiario.filter(f => f.estadoAsistencia !== 'Presente');
  const obtenerAvisosJornadaIncompleta = () => {
    const avisos = [];
    filasDiario.forEach(f => {
      if (f.estadoAsistencia === 'Presente') {
        const totalHorasDia = f.obras.reduce((acc, o) => acc + (isNaN(parseFloat(o.horasTrabajadas)) ? 0 : parseFloat(o.horasTrabajadas)), 0);
        if (totalHorasDia < f.horasJornada) avisos.push({ nombre: f.nombre, horasJornada: f.horasJornada, totalHorasDia, faltan: (f.horasJornada - totalHorasDia).toFixed(1) });
      }
    });
    return avisos;
  };

  // ================= FUNCIONES GUARDAR ESTÁNDAR =================
  const guardarObra = (e) => { 
    e.preventDefault(); 
    if (idObraEdit) {
      fetch(`${API_BASE_URL}/api/obras/${idObraEdit}`, { 
        method: 'PUT', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ cliente, nombreObra, fechaInicio }) 
      })
      .then(res => {
        if (res.ok) {
          setIdObraEdit(null);
          setCliente(''); 
          setNombreObra(''); 
          setFechaInicio(''); 
          cargarObras(); 
          alert("¡Obra actualizada correctamente!");
        } else {
          alert("Error al actualizar la obra.");
        }
      })
      .catch(err => console.error("Error al actualizar obra:", err));
    } else {
      fetch(`${API_BASE_URL}/api/obras`, { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ cliente, nombreObra, fechaInicio }) 
      })
      .then(() => { 
        setCliente(''); 
        setNombreObra(''); 
        setFechaInicio(''); 
        cargarObras(); 
        cargarPartidas();
    cargarFases(); 
      });
    }
  };

  // FUNCION MODIFICADA: VERIFICA ESTADO ANTES DE BORRAR
  const eliminarObra = async (id, finalizada) => {
    if (!finalizada) {
      alert("⚠️ No puedes eliminar esta obra. Primero debes marcar el interruptor de estado como 'Acabada'.");
      return;
    }
    if (window.confirm("⚠️ ¿Estás seguro de que quieres eliminar definitivamente esta obra finalizada?")) {
      try {
        const response = await fetch(`${API_BASE_URL}/api/obras/${id}`, { method: 'DELETE' });
        if (response.ok) {
          cargarObras();
          cargarAsistencias();
          cargarGastos();
          cargarPartidas();
    cargarFases();
        } else {
          alert("❌ Error al eliminar esta obra.");
        }
      } catch (error) { console.error("Error al intentar eliminar la obra:", error); }
    }
  };

  const aplicarPlantillaPartidas = () => {
    setPartidasObra(prev => prev.map((item, idx) => {
      const nuevoNombre = idx < plantillaPartidasPredefinidas.length 
        ? plantillaPartidasPredefinidas[idx] 
        : `Partida ${item.numero || (idx + 1)}`;
      return { ...item, nombre: nuevoNombre };
    }));
  };

  const handleSavePartida = async (partidaId, nuevoNombre) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/partidas/${partidaId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ nombre: nuevoNombre }) });
      if (res.ok) { cargarPartidas(); cargarAsistencias(); }
    } catch (e) { console.error("Error al guardar partida:", e); }
  };

  const handleSaveAllPartidas = async () => {
    try {
      for (const p of partidasObra) await fetch(`${API_BASE_URL}/api/partidas/${p.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ nombre: p.nombre }) });
      alert("¡Todas las partidas se han guardado con éxito!"); cargarPartidas(); cargarAsistencias();
    } catch (e) { alert("Error al guardar algunas partidas."); }
  };
  
  const toggleEstadoObra = async (id, estadoActual) => {
    try {
      await fetch(`${API_BASE_URL}/api/obras/${id}/estado`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(!estadoActual) });
      cargarObras(); 
    } catch (error) { console.error("Error al cambiar el estado de la obra:", error); }
  };

  const guardarTrabajador = (e) => { 
    e.preventDefault(); 
    const esExtraVal = rolTrabajador === 'EXTRA' || Boolean(esExtraTrabajador);
    const payload = { 
      id: idTrabajadorEdit, 
      nombre: nombreTrabajador, 
      rol: rolTrabajador || 'Obra',
      esExtra: esExtraVal,
      estado: 'Activo', 
      horasJornada: parseFloat(horasJornadaTrabajador) || 8.0, 
      pagoDiario: parseFloat(pagoDiarioTrabajador) || 0.0 
    };
    fetch(`${API_BASE_URL}/api/trabajadores`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
    .then(() => { 
      setNombreTrabajador(''); 
      setRolTrabajador('Obra');
      setEsExtraTrabajador(false);
      setHorasJornadaTrabajador('8.0'); 
      setPagoDiarioTrabajador('0.0'); 
      setIdTrabajadorEdit(null); 
      cargarTrabajadores(); 
    }); 
  };

  const eliminarTrabajador = async (id) => {
    if (window.confirm("⚠️ ¿Estás seguro de que quieres eliminar a este trabajador?")) {
      try {
        const response = await fetch(`${API_BASE_URL}/api/trabajadores/${id}`, { method: 'DELETE' });
        if (response.ok) cargarTrabajadores(); else alert("❌ No se puede eliminar a este trabajador porque ya tiene partes de horas registrados.");
      } catch (error) { console.error("Error al intentar eliminar el trabajador:", error); }
    }
  };
  
  const guardarUsuario = (e) => {
    e.preventDefault();
    fetch(`${API_BASE_URL}/api/usuarios`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username: usernameNuevo, password: passwordNuevo, rol: rolNuevo, nombre: nombreNuevo }) })
    .then(async res => {
      if (res.ok) { setUsernameNuevo(''); setPasswordNuevo(''); setRolNuevo('USER'); setNombreNuevo(''); cargarUsuarios(); } 
      else { alert(await res.text() || "Error al registrar el usuario"); }
    }).catch(err => console.error("Error al guardar usuario:", err));
  };

  const eliminarUsuario = (id) => {
    if (window.confirm("⚠️ ¿Estás seguro de que quieres eliminar a este usuario?")) {
      fetch(`${API_BASE_URL}/api/usuarios/${id}`, { method: 'DELETE' }).then(res => { if (res.ok) cargarUsuarios(); else alert("Error al intentar eliminar el usuario"); }).catch(err => console.error("Error:", err));
    }
  };

  const guardarGasto = (e) => { 
    e.preventDefault(); 
    fetch(`${API_BASE_URL}/api/gastos`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ idObra: parseInt(idObraSelGasto), categoria, partida: partidaGasto, fase: faseGasto, fecha: fechaGasto, descripcion, provTrabajador, udsHoras: parseFloat(udsHoras) || 0, precioNeto: parseFloat(precioNeto) || 0, precioPvp: parseFloat(precioPvp) || 0 }) })
    .then(() => { setIdObraSelGasto(''); setPartidaGasto(''); setFaseGasto(''); setCategoria(''); setFechaGasto(''); setDescripcion(''); setProvTrabajador(''); setUdsHoras(''); setPrecioNeto(''); setPrecioPvp(''); cargarGastos(); }); 
  };

  // ================= LA MAGIA DE EXPORTAR A EXCEL (ESTRUCTURA EXACTA DE PARTIDAS Y FASES) =================
  const exportarObraExcel = (idObra) => {
    const targetId = Number(idObra);
    const obraTarget = obras.find(o => Number(o.id) === targetId);
    if (!obraTarget) return alert("No se pudo encontrar la información de esta obra.");

    // Filtrar asistencias válidas con horas o descripción registradas
    const horasObra = asistencias.filter(a => 
      a.idObra && 
      Number(a.idObra) === targetId && 
      a.haAsistido !== false && 
      a.estadoAsistencia !== 'Ausente' && 
      a.estadoAsistencia !== 'Vacaciones' && 
      a.estadoAsistencia !== 'Baja' &&
      ((parseFloat(a.horasTrabajadas) > 0) || (a.descripcion && a.descripcion.trim() !== ''))
    );
    const gastosObra = gastos.filter(g => g.idObra && Number(g.idObra) === targetId);

    if (horasObra.length === 0 && gastosObra.length === 0) {
      if (!window.confirm("⚠️ Esta obra no tiene horas ni gastos registrados. ¿Quieres descargar el archivo de todas formas?")) return;
    }

    const datosExcel = [];
    
    // 1. Cabecera superior idéntica a las fotos
    datosExcel.push(["CLIENTE:", obraTarget.cliente || obraTarget.nombreObra || "", "", "", "", "", "", ""]);
    datosExcel.push(["FECHA:", new Date().toLocaleDateString('es-ES'), "", "", "", "", "", ""]);
    datosExcel.push([]);
    
    // 2. Banner de título GASTOS
    datosExcel.push(["GASTOS", "", "", "", "", "", "", ""]);
    datosExcel.push([]);

    // 3. Encabezados de columnas exactos de la foto
    datosExcel.push(["FECHA", "DESCRIPCIÓN", "PROV/TRABAJ", "UDS./H", "NETO", "SUBTOTAL", "PVP", "SUBTOTAL"]);
    datosExcel.push([]);

    // 4. Recopilar todas las partidas ordenadas
    const partidasObra = partidas.filter(p => Number(p.idObra) === targetId).sort((a,b) => (a.numero || 0) - (b.numero || 0));
    const listaPartidas = [];

    partidasObra.forEach(p => {
      if (p.nombre && !listaPartidas.some(x => x.toLowerCase() === p.nombre.trim().toLowerCase())) {
        listaPartidas.push(p.nombre.trim());
      }
    });

    horasObra.forEach(h => {
      const p = (h.partida || '').trim();
      if (p && !listaPartidas.some(x => x.toLowerCase() === p.toLowerCase())) {
        listaPartidas.push(p);
      }
    });

    gastosObra.forEach(g => {
      const cat = (g.categoria || '').trim();
      if (cat && !listaPartidas.some(x => x.toLowerCase() === cat.toLowerCase())) {
        listaPartidas.push(cat);
      }
    });

    let granTotalHoras = 0;
    let granTotalNeto = 0;
    let granTotalPvp = 0;

    const horasYaProcesadas = new Set();
    const gastosYaProcesados = new Set();

    // ESTILOS EXCEL
    const styleHeaderPartida = { fill: { fgColor: { rgb: "D9D9D9" } }, font: { bold: true } };
    const styleHeaderGasto = { font: { bold: true } };
    const styleFaseNegrita = { font: { bold: true } };

    // 5. Generar bloques por cada PARTIDA
    listaPartidas.forEach(partidaNombre => {
      const pNorm = partidaNombre.toLowerCase();
      const horasPartida = horasObra.filter(h => (h.partida || '').trim().toLowerCase() === pNorm);
      const gastosPartida = gastosObra.filter(g => {
        const cat = (g.categoria || '').trim().toLowerCase();
        return cat === pNorm;
      });

      if (horasPartida.length === 0 && gastosPartida.length === 0) return;

      // TÍTULO DE PARTIDA (Fila destacada con el nombre de la partida y fondo gris)
      datosExcel.push([
        {v: "", s: styleHeaderPartida},
        {v: partidaNombre.toUpperCase(), s: styleHeaderPartida},
        {v: "", s: styleHeaderPartida}, {v: "", s: styleHeaderPartida}, {v: "", s: styleHeaderPartida}, {v: "", s: styleHeaderPartida}, {v: "", s: styleHeaderPartida}, {v: "", s: styleHeaderPartida}
      ]);

      // A) FASES DE TRABAJO Y OPERARIOS (Mano de Obra)
      if (horasPartida.length > 0) {
        horasPartida.sort((a, b) => {
           let cmp = (a.fecha || '').localeCompare(b.fecha || '');
           if (cmp === 0) cmp = (a.fase || '').localeCompare(b.fase || '');
           return cmp;
        });
        
        let subtotalHorasPartida = 0;
        let lastFase = null;
        let lastFecha = null;

        horasPartida.forEach(h => {
          const trabajadorName = getNombreTrabajador(h.idTrabajador);
          const horas = h.horasTrabajadas || 0;
          subtotalHorasPartida += horas;
          granTotalHoras += horas;

          const faseName = h.fase && h.fase.trim() !== '' ? h.fase.trim() : "Trabajos generales";
          
          let displayFecha = h.fecha || '';
          let displayFase = faseName;
          
          if (displayFecha === lastFecha && displayFase === lastFase) {
             displayFecha = "";
             displayFase = "";
          } else {
             lastFecha = displayFecha;
             lastFase = displayFase;
          }

          datosExcel.push([
            displayFecha,
            { v: displayFase, s: displayFase ? styleFaseNegrita : {} },
            trabajadorName,
            horas.toFixed(2).replace('.', ','),
            "", "", "", ""
          ]);
        });
        
        datosExcel.push(["", {v: "TOTAL H", s: styleHeaderGasto}, "", subtotalHorasPartida, "", "", "", "- €"]);
        datosExcel.push([]);
      }

      // B) MATERIALES ASOCIADOS A ESTA PARTIDA (Gastos)
      if (gastosPartida.length > 0) {
        let subtotalNetoPartida = 0;
        let subtotalPvpPartida = 0;

        // Extraer categorías/fases únicas para gastos
        
        // Wait, for Gastos, typically the user wrote descriptions directly. Let's just group by "MATERIAL:" default if needed.
        // Actually, looking at screenshot 3, it says "MATERIAL:", "MOBILIARIO DE COCINA:".
        // Let's just use the current categories logic or assume they want a header per category.
        
        const catMap = {};
        gastosPartida.forEach(g => {
            const c = g.descripcion || "MATERIAL";
            if (!catMap[c]) catMap[c] = [];
            catMap[c].push(g);
        });

        // Simplified for Gastos based on their Excel layout
        datosExcel.push(["", {v: "MATERIAL:", s: styleHeaderGasto}, "", "", "", "", "", ""]);
        
        gastosPartida.forEach(g => {
          const subNeto = (g.precioNeto || 0) * (g.udsHoras || 1);
          const subPvp = (g.precioPvp || 0) * (g.udsHoras || 1);
          subtotalNetoPartida += subNeto;
          subtotalPvpPartida += subPvp;
          granTotalNeto += subNeto;
          granTotalPvp += subPvp;

          datosExcel.push([
            g.fecha || '',
            g.descripcion,
            g.provTrabajador,
            g.udsHoras,
            g.precioNeto > 0 ? g.precioNeto : "",
            subNeto > 0 ? subNeto : "",
            g.precioPvp > 0 ? g.precioPvp : "",
            subPvp > 0 ? subPvp : ""
          ]);
        });

        datosExcel.push(["", "", {v: "TOTAL €", s: styleHeaderGasto}, "", "", subtotalNetoPartida > 0 ? subtotalNetoPartida : "", "", subtotalPvpPartida > 0 ? subtotalPvpPartida : ""]);
        datosExcel.push([]);
      }
    });

    // 6. Horas sin partida asignada si las hubiese
    const horasSueltas = horasObra.filter(h => !horasYaProcesadas.has(h.id));
    if (horasSueltas.length > 0) {
      datosExcel.push(["", "TRABAJOS GENERALES", "", "", "", "", "", ""]);
      let subHorasSueltas = 0;
      horasSueltas.forEach(h => {
        const horas = parseFloat(h.horasTrabajadas) || 0;
        subHorasSueltas += horas;
        granTotalHoras += horas;
        const idT = h.idTrabajador !== undefined ? h.idTrabajador : (h.trabajador && h.trabajador.id);
        const trabajadorObj = trabajadores.find(t => Number(t.id) === Number(idT));
        const nombreOperario = trabajadorObj ? trabajadorObj.nombre : (h.nombreTrabajador || "Operario");

        datosExcel.push([
          h.fecha || "",
          h.descripcion || "Mano de obra general",
          nombreOperario,
          horas,
          "",
          "",
          "",
          "- €"
        ]);
      });
      datosExcel.push(["", "", "TOTAL H", subHorasSueltas, "", "", "", "- €"]);
      datosExcel.push([]);
    }

    // 7. Materiales / Gastos restantes por categoría (Herrajes, Vidrios, etc.)
    const gastosSueltos = gastosObra.filter(g => !gastosYaProcesados.has(g.id));
    if (gastosSueltos.length > 0) {
      const categoriasRestantes = [...new Set(gastosSueltos.map(g => (g.categoria || 'VARIOS').toUpperCase()))];
      categoriasRestantes.forEach(cat => {
        datosExcel.push(["", {v: cat + ":", s: styleHeaderGasto}, "", "", "", "", "", ""]);
        let subtotalCatNeto = 0;
        let subtotalCatPvp = 0;

        gastosSueltos.filter(g => (g.categoria || 'VARIOS').toUpperCase() === cat).forEach(g => {
          const netoUnit = parseFloat(g.precioNeto) || 0;
          const pvpUnit = parseFloat(g.precioPvp) || 0;
          const uds = parseFloat(g.udsHoras) || 1;
          const subNeto = netoUnit * uds;
          const subPvp = pvpUnit * uds;
          subtotalCatNeto += subNeto;
          subtotalCatPvp += subPvp;
          granTotalNeto += subNeto;
          granTotalPvp += subPvp;

          datosExcel.push([
            g.fecha || "",
            g.descripcion || "",
            g.provTrabajador || "",
            uds,
            netoUnit > 0 ? netoUnit : "",
            subNeto > 0 ? subNeto : "",
            pvpUnit > 0 ? pvpUnit : "",
            subPvp > 0 ? subPvp : ""
          ]);
        });
        datosExcel.push(["", "", {v: "TOTAL €", s: styleHeaderGasto}, "", "", subtotalCatNeto > 0 ? subtotalCatNeto : "", "", subtotalCatPvp > 0 ? subtotalCatPvp : ""]);
        datosExcel.push([]);
      });
    }

    // 8. Resumen global y entregas a cuenta tal como al final de la foto
    datosExcel.push(["", "", {v: "TOTAL GENERAL HORAS", s: styleHeaderGasto}, granTotalHoras, "", "", "", "- €"]);
    datosExcel.push(["", "", {v: "TOTAL GENERAL NETO", s: styleHeaderGasto}, "", "", granTotalNeto > 0 ? granTotalNeto : "", "", ""]);
    datosExcel.push(["", "", {v: "TOTAL GENERAL PVP", s: styleHeaderGasto}, "", "", "", "", granTotalPvp > 0 ? granTotalPvp : ""]);
    datosExcel.push([]);

    const entrega1 = parseFloat(obraTarget.presupuestoPvp) || 0;
    datosExcel.push([{v: "ENTREGA A CUENTA 1 ()", s: styleHeaderGasto}, "", "", "", "", entrega1 > 0 ? entrega1 : "", "", ""]);
    datosExcel.push([{v: "ENTREGA A CUENTA 2 ()", s: styleHeaderGasto}, "", "", "", "", "", "", ""]);
    datosExcel.push([{v: "TOTAL ENTREGAS", s: styleHeaderGasto}, "", "", "", "", entrega1 > 0 ? entrega1 : "", "", ""]);

    const hoja = XLSX.utils.aoa_to_sheet(datosExcel);

    // Ajustar los anchos de columna para que quede idéntico al documento original
    hoja['!cols'] = [
      { wch: 12 }, // FECHA
      { wch: 42 }, // DESCRIPCIÓN (Fase de obra / Material)
      { wch: 22 }, // PROV/TRABAJ
      { wch: 10 }, // UDS./H
      { wch: 12 }, // NETO
      { wch: 14 }, // SUBTOTAL NETO
      { wch: 12 }, // PVP
      { wch: 14 }  // SUBTOTAL PVP
    ];

    const libro = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(libro, hoja, "GASTOS");
    XLSX.writeFile(libro, `Gastos_${(obraTarget.nombreObra || 'Obra').replace(/[^a-zA-Z0-9]/g, "_")}_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const filasDiarioFiltradas = filasDiario
    .filter(f => {
      if (filtroRolDiario === 'Todos') return true;
      if (filtroRolDiario === 'Obra') return (f.rol || 'Obra') === 'Obra' || f.rol === 'EXTRA';
      return (f.rol || 'Obra') === filtroRolDiario;
    })
    .sort((a, b) => {
      if (ordenDiario === 'rol') {
        const ordenRoles = { 'Oficina': 1, 'Obra': 2, 'Hotel': 3, 'EXTRA': 4 };
        const rolA = ordenRoles[a.rol] || 99;
        const rolB = ordenRoles[b.rol] || 99;
        if (rolA !== rolB) return rolA - rolB;
        return (a.nombre || '').localeCompare(b.nombre || '');
      } else {
        return (a.nombre || '').localeCompare(b.nombre || '');
      }
    });

  // Totales calculados para el cuadrante de Partes
  const totalHorasNormales = cuadrante.reduce((acc, d) => acc + (parseFloat(d.horas) || 0), 0);
  const totalHorasExtra = cuadrante.reduce((acc, d) => acc + (parseFloat(d.horasExtra) || 0), 0);
  const granTotalHoras = totalHorasNormales + totalHorasExtra;
  const totalDiasAsistidos = cuadrante.filter(d => d.asistencia === 'Sí').length;

  if (!isAuthenticated) {
    return (
      <Login
        onLoginSuccess={(user) => {
          setUsuarioActual(user);
          setIsAuthenticated(true);
          setSessionMessage('');
          const now = Date.now();
          localStorage.setItem('pg_last_activity', now.toString());
          if (lastActivityRef.current) lastActivityRef.current = now;
        }}
        sessionMessage={sessionMessage}
      />
    );
  }

  // ================= INTERFAZ =================
  return (
    <div className="app-container">
      {/* MODAL DE ADVERTENCIA DE INACTIVIDAD (60 segundos restantes) */}
      {showInactivityWarning && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          backgroundColor: 'rgba(0, 0, 0, 0.78)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 999999
        }}>
          <div style={{
            backgroundColor: '#1e1e1e',
            border: '2px solid rgba(230, 0, 0, 0.5)',
            borderRadius: '16px',
            padding: '30px',
            maxWidth: '430px',
            width: '90%',
            color: '#ffffff',
            textAlign: 'center',
            boxShadow: '0 20px 50px rgba(0, 0, 0, 0.8)'
          }}>
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              backgroundColor: 'rgba(230, 0, 0, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px auto',
              fontSize: '26px'
            }}>
              ⏱️
            </div>
            <h3 style={{ margin: '0 0 10px 0', fontSize: '20px', fontWeight: 'bold', color: '#fff' }}>
              Aviso de Inactividad por Seguridad
            </h3>
            <p style={{ margin: '0 0 18px 0', color: '#bbb', fontSize: '14px', lineHeight: '1.5' }}>
              No se ha detectado interacción en los últimos 14 minutos. Por seguridad de los datos de la empresa, la sesión se cerrará automáticamente en:
            </p>
            <div style={{
              fontSize: '36px',
              fontWeight: '900',
              color: '#ff3333',
              marginBottom: '24px',
              fontVariantNumeric: 'tabular-nums'
            }}>
              {countdownSeconds}s
            </div>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button
                type="button"
                onClick={() => {
                  const now = Date.now();
                  localStorage.setItem('pg_last_activity', now.toString());
                  lastActivityRef.current = now;
                  setShowInactivityWarning(false);
                }}
                style={{
                  flex: 1,
                  padding: '12px 18px',
                  backgroundColor: '#E60000',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                Mantener sesión abierta
              </button>
              <button
                type="button"
                onClick={() => handleLogout('manual')}
                style={{
                  padding: '12px 18px',
                  backgroundColor: 'transparent',
                  color: '#aaa',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '8px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                Cerrar ahora
              </button>
            </div>
          </div>
        </div>
      )}
      {/* CABECERA */}
      <header className="header-container no-print">
        <div className="logo-container"><LogoPG /></div>
        <div className="nav-buttons">
          <button onClick={() => setSeccionActiva('diario')} className={`btn-nav ${seccionActiva === 'diario' ? 'active' : ''}`}>📋 Diario</button>
          <button onClick={() => setSeccionActiva('obras')} className={`btn-nav ${seccionActiva === 'obras' ? 'active' : ''}`}>🏗️ Obras</button>
          <button onClick={() => setSeccionActiva('trabajadores')} className={`btn-nav ${seccionActiva === 'trabajadores' ? 'active' : ''}`}>👥 Personal</button>
          <button onClick={() => setSeccionActiva('gastos')} className={`btn-nav ${seccionActiva === 'gastos' ? 'active' : ''}`}>💰 Gastos</button>
          <button onClick={() => setSeccionActiva('informes')} className={`btn-nav ${seccionActiva === 'informes' ? 'active' : ''}`}>📑 Partes</button>
          {usuarioActual?.rol === 'ADMIN' && <button onClick={() => setSeccionActiva('usuarios')} className={`btn-nav ${seccionActiva === 'usuarios' ? 'active' : ''}`}>⚙️ Ajustes</button>}
          <button onClick={handleLogout} className="btn-nav btn-logout-header">Salir</button>
        </div>
      </header>

      {/* CONTENIDO PRINCIPAL */}
      <div className="card-box">

        {/* ================= 0. CONTROL DIARIO RÁPIDO ================= */}
        {seccionActiva === 'diario' && (
          <section className="no-print">
            <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '15px', alignItems: 'center', borderBottom: '2px solid #eee', paddingBottom: '15px', marginBottom: '15px' }}>
              <div>
                <h2 style={{ color: '#2c3e50', margin: 0 }}>📋 Pasar Lista / Control Diario</h2>
                <span style={{ fontSize: '13px', color: '#7f8c8d' }}>Pasa lista rápida y asigna personal por rol: Oficina, Obra y Hotel</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <label style={{ fontWeight: 'bold', color: '#34495e', fontSize: '14px' }}>Fecha:</label>
                <input type="date" className="input-standard" value={fechaControlDiario} onChange={e => setFechaControlDiario(e.target.value)} style={{ padding: '8px', fontWeight: 'bold' }} />
              </div>
            </div>

            {/* BARRA DE FILTRADO Y ORDENACIÓN POR ROLES */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', background: '#f8fafc', padding: '12px 16px', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '15px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#475569' }}>Filtrar por Rol:</span>
                <button 
                  type="button" 
                  onClick={() => setFiltroRolDiario('Todos')}
                  style={{ 
                    padding: '6px 12px', 
                    borderRadius: '20px', 
                    border: '1px solid', 
                    borderColor: filtroRolDiario === 'Todos' ? '#334155' : '#cbd5e1', 
                    background: filtroRolDiario === 'Todos' ? '#334155' : 'white', 
                    color: filtroRolDiario === 'Todos' ? 'white' : '#475569', 
                    fontWeight: 'bold', 
                    cursor: 'pointer', 
                    fontSize: '12px' 
                  }}
                >
                  👥 Todos ({filasDiario.length})
                </button>
                <button 
                  type="button" 
                  onClick={() => setFiltroRolDiario('Oficina')}
                  style={{ 
                    padding: '6px 12px', 
                    borderRadius: '20px', 
                    border: '1px solid', 
                    borderColor: filtroRolDiario === 'Oficina' ? '#2980b9' : '#cbd5e1', 
                    background: filtroRolDiario === 'Oficina' ? '#2980b9' : 'white', 
                    color: filtroRolDiario === 'Oficina' ? 'white' : '#2980b9', 
                    fontWeight: 'bold', 
                    cursor: 'pointer', 
                    fontSize: '12px' 
                  }}
                >
                  🏢 Oficina ({filasDiario.filter(f => f.rol === 'Oficina').length})
                </button>
                <button 
                  type="button" 
                  onClick={() => setFiltroRolDiario('Obra')}
                  style={{ 
                    padding: '6px 12px', 
                    borderRadius: '20px', 
                    border: '1px solid', 
                    borderColor: filtroRolDiario === 'Obra' ? '#e67e22' : '#cbd5e1', 
                    background: filtroRolDiario === 'Obra' ? '#e67e22' : 'white', 
                    color: filtroRolDiario === 'Obra' ? 'white' : '#e67e22', 
                    fontWeight: 'bold', 
                    cursor: 'pointer', 
                    fontSize: '12px' 
                  }}
                >
                  🏗️ Obra ({filasDiario.filter(f => (f.rol || 'Obra') === 'Obra').length})
                </button>
                <button 
                  type="button" 
                  onClick={() => setFiltroRolDiario('Hotel')}
                  style={{ 
                    padding: '6px 12px', 
                    borderRadius: '20px', 
                    border: '1px solid', 
                    borderColor: filtroRolDiario === 'Hotel' ? '#16a085' : '#cbd5e1', 
                    background: filtroRolDiario === 'Hotel' ? '#16a085' : 'white', 
                    color: filtroRolDiario === 'Hotel' ? 'white' : '#16a085', 
                    fontWeight: 'bold', 
                    cursor: 'pointer', 
                    fontSize: '12px' 
                  }}
                >
                  🏨 Hotel ({filasDiario.filter(f => f.rol === 'Hotel').length})
                </button>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#475569' }}>Ordenar por:</span>
                <select 
                  className="input-standard" 
                  value={ordenDiario} 
                  onChange={e => setOrdenDiario(e.target.value)}
                  style={{ padding: '6px 10px', fontSize: '12px', fontWeight: 'bold' }}
                >
                  <option value="rol">↕️ Por Rol (Oficina ➔ Obra ➔ Hotel)</option>
                  <option value="nombre">🔤 Alfabético (A - Z)</option>
                </select>
              </div>
            </div>

            {/* PANELES DE ESTADO */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '15px', marginBottom: '20px' }}>
              <div style={{ backgroundColor: '#fcf3cf', border: '1px solid #f9e79f', borderRadius: '8px', padding: '15px' }}>
                <h3 style={{ margin: '0 0 10px 0', color: '#b7950b', fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>⚠️ Avisos de Jornada Incompleta</h3>
                {obtenerAvisosJornadaIncompleta().length === 0 ? <p style={{ margin: 0, fontSize: '14px', color: '#7f8c8d', fontStyle: 'italic' }}>Todos los trabajadores presentes cumplen su jornada laboral.</p> : (
                  <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '13px', color: '#7d6608' }}>
                    {obtenerAvisosJornadaIncompleta().map((aviso, idx) => <li key={idx} style={{ marginBottom: '4px' }}>A <strong>{aviso.nombre}</strong> le faltan <strong>{aviso.faltan} h</strong> para acabar su jornada laboral ({aviso.totalHorasDia}h registradas de {aviso.horasJornada}h).</li>)}
                  </ul>
                )}
              </div>

              <div style={{ backgroundColor: '#f8f9fa', border: '1px solid #eaeded', borderRadius: '8px', padding: '15px' }}>
                <h3 style={{ margin: '0 0 10px 0', color: '#2c3e50', fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>👤 No Presentes ({obtenerAusentes().length})</h3>
                {obtenerAusentes().length === 0 ? <p style={{ margin: 0, fontSize: '14px', color: '#7f8c8d', fontStyle: 'italic' }}>Toda la plantilla está marcada como presente hoy.</p> : (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {obtenerAusentes().map(f => {
                      let bgColor = f.estadoAsistencia === 'Vacaciones' ? '#3498db' : f.estadoAsistencia === 'Baja' ? '#f39c12' : '#e74c3c';
                      return <span key={f.idTrabajador} style={{ backgroundColor: bgColor, color: 'white', padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold' }}>{f.nombre} ({f.estadoAsistencia})</span>;
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* TABLA PRINCIPAL DE EMPLEADOS */}
            <div style={{ overflowX: 'auto', backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e0e0e0', marginBottom: '20px' }}>
              <table className="tabla-general" style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#e67e22', color: 'white' }}>
                    <th style={{ width: '25%', padding: '12px' }}>Empleado</th>
                    <th style={{ width: '15%', padding: '12px' }}>Asistencia</th>
                    <th style={{ width: '60%', padding: '12px' }}>Asignación de Horario, Obra, Partida y Detalles</th>
                  </tr>
                </thead>
                <tbody>
                  {filasDiarioFiltradas.length === 0 ? (
                    <tr>
                      <td colSpan="3" style={{ textAlign: 'center', padding: '30px', color: '#94a3b8' }}>
                        No hay trabajadores en la categoría seleccionada ({filtroRolDiario}).
                      </td>
                    </tr>
                  ) : (
                    filasDiarioFiltradas.map((fila) => (
                      <tr key={fila.idTrabajador} style={{ borderBottom: '1px solid #e0e0e0', backgroundColor: fila.estadoAsistencia !== 'Presente' ? '#f9f9f9' : 'white' }}>
                        <td style={{ padding: '15px', verticalAlign: 'top' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                            <span style={{ 
                              fontWeight: 'bold', 
                              fontSize: '15px', 
                              color: (fila.esExtra || fila.rol === 'EXTRA') ? '#d35400' : '#2c3e50',
                              textDecoration: (fila.esExtra || fila.rol === 'EXTRA') ? 'underline 2.5px #e67e22' : 'none',
                              textUnderlineOffset: '4px'
                            }}>
                              {fila.nombre}
                            </span>
                            {getRolBadge(fila.rol)}
                            {(fila.esExtra || fila.rol === 'EXTRA') && fila.rol !== 'EXTRA' && getExtraBadge()}
                          </div>
                          <div style={{ display: 'flex', gap: '6px', marginTop: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
                            <span style={{ fontSize: '11px', background: '#ebf5fb', color: '#2980b9', padding: '2px 6px', borderRadius: '4px', fontWeight: '600' }}>Jornada: {fila.horasJornada}h</span>
                            <button
                              type="button"
                              onClick={() => handleToggleExtra(fila.idTrabajador)}
                              style={{
                                fontSize: '11px',
                                padding: '2px 8px',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                border: fila.esExtra ? '1px solid #d35400' : '1px solid #cbd5e1',
                                backgroundColor: fila.esExtra ? '#fff7ed' : '#f8fafc',
                                color: fila.esExtra ? '#c2410c' : '#64748b',
                                fontWeight: '600',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                transition: 'all 0.2s'
                              }}
                              title="Marcar / desmarcar si vino de forma excepcional (EXTRA) hoy"
                            >
                              {fila.esExtra ? '⭐ Quitar EXTRA' : '+ Rol EXTRA'}
                            </button>
                          </div>
                        </td>

                        <td style={{ padding: '15px', verticalAlign: 'top' }}>
                          <select 
                            className="input-standard" 
                            style={{ fontWeight: 'bold', color: 'white', borderRadius: '6px', padding: '8px', backgroundColor: fila.estadoAsistencia === 'Presente' ? '#2ecc71' : fila.estadoAsistencia === 'Vacaciones' ? '#3498db' : fila.estadoAsistencia === 'Baja' ? '#f39c12' : '#e74c3c' }}
                            value={fila.estadoAsistencia}
                            onChange={(e) => handleCambiarEstadoAsistencia(fila.idTrabajador, e.target.value)}
                          >
                            <option value="Presente" style={{backgroundColor: '#2ecc71', color: 'white'}}>Presente</option>
                            <option value="Vacaciones" style={{backgroundColor: '#3498db', color: 'white'}}>Vacaciones</option>
                            <option value="Ausente" style={{backgroundColor: '#e74c3c', color: 'white'}}>Ausente</option>
                            <option value="Baja" style={{backgroundColor: '#f39c12', color: 'white'}}>Baja</option>
                          </select>
                        </td>

                        <td style={{ padding: '15px', verticalAlign: 'top' }}>
                          {fila.estadoAsistencia !== 'Presente' ? (
                            <div style={{ padding: '10px', color: '#95a5a6', fontStyle: 'italic', fontSize: '14px' }}>Sin asignaciones de obra por {fila.estadoAsistencia.toLowerCase()}.</div>
                          ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                              {fila.obras.map((obraAsig, idx) => (
                                <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center', background: '#f8f9fa', padding: '10px', borderRadius: '6px', border: '1px solid #eaeded' }}>
                                    
                                    {/* Selectores de Horario Predefinido */}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                      <select 
                                        className="input-standard" 
                                        style={{ padding: '6px', fontSize: '13px', width: '135px' }} 
                                        value={obraAsig.horario || ''} 
                                        onChange={(e) => {
                                          const val = e.target.value;
                                          handleModificarObraAsignacion(fila.idTrabajador, idx, 'horario', val);
                                          const schedule = horariosPredefinidos.find(h => h.label === val);
                                          if (schedule) {
                                            handleModificarObraAsignacion(fila.idTrabajador, idx, 'horasTrabajadas', schedule.horas);
                                          }
                                        }}
                                      >
                                        <option value="">-- Horario --</option>
                                        {horariosPredefinidos.map(h => <option key={h.label} value={h.label}>{h.label}</option>)}
                                      </select>
                                    </div>

                                    {/* Obra */}
                                    <select className="input-standard" style={{ padding: '6px', fontSize: '13px', flex: '1.2', minWidth: '130px' }} value={obraAsig.idObra} onChange={(e) => handleModificarObraAsignacion(fila.idTrabajador, idx, 'idObra', e.target.value)}>
                                      <option value="">-- Obra --</option>{obras.map(o => <option key={o.id} value={o.id}>{o.nombreObra} ({o.cliente})</option>)}
                                    </select>

                                    {/* Boton Camion Transporte */}
                                    {obraAsig.idObra && (
                                      <button 
                                        type="button" 
                                        onClick={() => handleModificarObraAsignacion(fila.idTrabajador, idx, 'mostrarTransporte', !obraAsig.mostrarTransporte)}
                                        style={{ background: '#34495e', color: 'white', border: 'none', borderRadius: '4px', height: '28px', width: '32px', cursor: 'pointer', fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                        title="Añadir coste de transporte a esta obra"
                                      >
                                        🚚
                                      </button>
                                    )}

                                    {/* Botón Más obras */}
                                    <button type="button" onClick={() => handleAddObraAsignacion(fila.idTrabajador)} style={{ background: '#e67e22', color: 'white', border: 'none', borderRadius: '4px', width: '28px', height: '28px', cursor: 'pointer', fontWeight: 'bold', fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="Añadir otra obra">
                                      +
                                    </button>

                                    {/* Desplegable 1: Partida */}
                                    <select 
                                      className="input-standard" 
                                      style={{ padding: '6px', fontSize: '13px', flex: '1.2', minWidth: '125px', borderColor: '#3498db' }} 
                                      value={obraAsig.partida || ''} 
                                      onChange={(e) => handleModificarObraAsignacion(fila.idTrabajador, idx, 'partida', e.target.value)}
                                    >
                                      <option value="">-- 1. Partida --</option>
                                      {(() => {
                                        const partidasDeEstaObra = partidas.filter(p => Number(p.idObra) === Number(obraAsig.idObra));
                                        if (partidasDeEstaObra.length > 0) {
                                          return partidasDeEstaObra.map(p => <option key={p.id} value={p.nombre}>{p.nombre}</option>);
                                        }
                                        return plantillaPartidasPredefinidas.map(nom => <option key={nom} value={nom}>{nom}</option>);
                                      })()}
                                    </select>

                                    {/* Desplegable 2: Fase */}
                                    <select 
                                      className="input-standard" 
                                      style={{ padding: '6px', fontSize: '13px', flex: '1.2', minWidth: '125px', borderColor: '#e67e22' }} 
                                      value={obraAsig.fase || ''} 
                                      onChange={(e) => handleModificarObraAsignacion(fila.idTrabajador, idx, 'fase', e.target.value)}
                                    >
                                      <option value="">-- 2. Fase --</option>
                                      {(() => {
                                        const fasesDeEstaObra = fases.filter(f => Number(f.idObra) === Number(obraAsig.idObra));
                                        if (fasesDeEstaObra.length > 0) {
                                          return fasesDeEstaObra.map(f => <option key={f.id} value={f.nombre}>{f.nombre}</option>);
                                        }
                                        return plantillaFasesPredefinidas.map(nom => <option key={nom} value={nom}>{nom}</option>);
                                      })()}
                                    </select>
                                    
                                    {/* Input 3: Descripción Libre */}
                                    <input 
                                      className="input-standard" 
                                      placeholder="-- 3. Detalles --" 
                                      style={{ padding: '6px', fontSize: '13px', flex: '1.2', minWidth: '130px', borderColor: '#bdc3c7' }} 
                                      value={obraAsig.descripcion || ''} 
                                      onChange={(e) => handleModificarObraAsignacion(fila.idTrabajador, idx, 'descripcion', e.target.value)} 
                                    />

                                    {/* Horas */}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                      <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#7f8c8d' }}>H:</span>
                                      <input type="number" step="0.5" className="input-standard" placeholder="H" style={{ padding: '6px', fontSize: '13px', width: '55px', textAlign: 'center', fontWeight: 'bold' }} value={obraAsig.horasTrabajadas} onChange={(e) => handleModificarObraAsignacion(fila.idTrabajador, idx, 'horasTrabajadas', e.target.value)} />
                                    </div>

                                    {/* Quitar Obra */}
                                    <button type="button" disabled={fila.obras.length === 1} onClick={() => handleRemoveObraAsignacion(fila.idTrabajador, idx, obraAsig.idAsistencia)} style={{ background: '#e74c3c', color: 'white', border: 'none', borderRadius: '4px', width: '28px', height: '28px', cursor: fila.obras.length === 1 ? 'not-allowed' : 'pointer', opacity: fila.obras.length === 1 ? 0.3 : 1, fontWeight: 'bold', fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="Eliminar asignación">✕</button>
                                  </div>

                                  {/* Panel desplegable de Transporte 🚚 */}
                                  {obraAsig.mostrarTransporte && (
                                    <div style={{ background: '#ebedef', padding: '12px', borderRadius: '6px', borderLeft: '5px solid #34495e', marginLeft: '10px', marginRight: '10px', display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                                      <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#2c3e50' }}>🚚 Transporte:</span>
                                      <input className="input-standard" placeholder="Descripción del transporte (Ej. Furgoneta 1, Peajes...)" style={{ padding: '6px', fontSize: '13px', flex: 2, minWidth: '150px' }} value={obraAsig.transporteDesc || ''} onChange={(e) => handleModificarObraAsignacion(fila.idTrabajador, idx, 'transporteDesc', e.target.value)} />
                                      <input type="number" step="0.01" className="input-standard" placeholder="Tarifa (€)" style={{ padding: '6px', fontSize: '13px', flex: 1, minWidth: '80px', textAlign: 'right' }} value={obraAsig.transporteTarifa || ''} onChange={(e) => handleModificarObraAsignacion(fila.idTrabajador, idx, 'transporteTarifa', e.target.value)} />
                                      <button type="button" onClick={() => guardarTransporteDesdeDiario(fila.idTrabajador, idx, obraAsig.idObra, obraAsig.transporteDesc, obraAsig.transporteTarifa)} style={{ background: '#2ecc71', color: 'white', border: 'none', padding: '6px 15px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
                                        💾 Enviar a Gastos
                                      </button>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* BOTÓN GUARDAR */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
              <button type="button" onClick={guardarControlDiario} className="btn-action" style={{ backgroundColor: '#e67e22', padding: '12px 30px', fontSize: '16px', minWidth: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }} disabled={guardando}>
                {guardando ? <><span className="spinner" style={{ width: '16px', height: '16px', border: '2px solid white', borderTopColor: 'transparent', borderRadius: '50%', display: 'inline-block', animation: 'spin 1s linear infinite' }}></span>Guardando...</> : '💾 Guardar Asistencias'}
              </button>
            </div>
            
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </section>
        )}

        {/* ================= 1. OBRAS ================= */}
        {seccionActiva === 'obras' && (
          <section className="no-print">
            <h2 style={{ color: '#2c3e50', borderBottom: '2px solid #eee', paddingBottom: '10px', marginBottom: '20px' }}>
              {idObraEdit ? `✏️ Editar Obra: ${nombreObra}` : '🏗️ Gestión de Obras'}
            </h2>
            <form onSubmit={guardarObra} className="form-grid">
              <input className="input-standard" placeholder="Cliente" value={cliente} onChange={e=>setCliente(e.target.value)} required />
              <input className="input-standard" placeholder="Nombre Obra" value={nombreObra} onChange={e=>setNombreObra(e.target.value)} required />
              <input className="input-standard" type="date" value={fechaInicio} onChange={e=>setFechaInicio(e.target.value)} required />
              <div style={{ display: 'flex', gap: '10px', width: '100%' }}>
                <button type="submit" className="btn-action full-width-mobile" style={{backgroundColor: idObraEdit ? '#27ae60' : '#3498db', flex: 2}}>
                  {idObraEdit ? '💾 Guardar Cambios' : '➕ Añadir Obra'}
                </button>
                {idObraEdit && (
                  <button type="button" onClick={cancelarEdicionObra} className="btn-action" style={{backgroundColor: '#95a5a6', flex: 1}}>
                    ❌ Cancelar
                  </button>
                )}
              </div>
            </form>
            <div style={{ overflowX: 'auto' }}>
              <table className="tabla-general">
                <thead><tr style={{background: '#3498db'}}><th>ID</th><th>Cliente</th><th>Obra</th><th>Inicio</th><th>Estado</th><th>Partidas</th><th>Acciones</th></tr></thead>
                <tbody>
                  {obras.map(o => (
                    <tr key={o.id} style={{ opacity: o.finalizada ? 0.6 : 1, backgroundColor: o.finalizada ? '#fdfdfd' : 'white', transition: '0.3s' }}>
                      <td>{o.id}</td><td>{o.cliente}</td><td style={{ textDecoration: o.finalizada ? 'line-through' : 'none' }}><strong>{o.nombreObra}</strong></td><td>{o.fechaInicio}</td>
                      <td>
                        <label className="switch-container">
                          <input type="checkbox" className="switch-input" checked={o.finalizada || false} onChange={() => toggleEstadoObra(o.id, o.finalizada)} />
                          <span style={{ fontSize: '13px', fontWeight: 'bold', color: o.finalizada ? '#2ecc71' : '#e74c3c' }}>{o.finalizada ? 'Acabada' : 'En Curso'}</span>
                        </label>
                      </td>
                      <td>
  <button onClick={() => { setObraSeleccionadaPartidas(o); fetch(`${API_BASE_URL}/api/partidas/obra/${o.id}`).then(res => res.json()).then(data => { if (data.length === 0) { setPartidasObra(Array.from({length: 30}, (_, i) => ({ id: null, idObra: o.id, numero: i+1, nombre: "Partida " + (i+1) }))); } else { setPartidasObra(data); } }).catch(err => console.error("Error al cargar partidas:", err)); }} className="btn-excel" style={{ backgroundColor: '#e67e22', padding: '6px 12px', marginRight: '4px' }}>⚙️ Partidas</button>
  <button onClick={() => { setObraSeleccionadaFases(o); fetch(`${API_BASE_URL}/api/fases/obra/${o.id}`).then(res => res.json()).then(data => { if (data.length === 0) { setFasesObra(Array.from({length: 30}, (_, i) => ({ id: null, idObra: o.id, numero: i+1, nombre: "Fase " + (i+1) }))); } else { setFasesObra(data); } }).catch(err => console.error("Error al cargar fases:", err)); }} className="btn-excel" style={{ backgroundColor: '#f39c12', padding: '6px 12px' }}>⚙️ Fases</button>
</td>
                      
                      {/* BOTONES ACCIÓN OBRA ACTUALIZADOS */}
                      <td style={{ display: 'flex', gap: '8px' }}>
                        <button onClick={() => iniciarEdicionObra(o)} className="btn-excel" style={{ backgroundColor: '#3498db' }} title="Editar cliente y nombre de la obra">✏️ Editar</button>
                        <button onClick={() => exportarObraExcel(o.id)} className="btn-excel" title="Descargar datos en Excel">📑 Excel</button>
                        <button 
                          onClick={() => eliminarObra(o.id, o.finalizada)} 
                          className="btn-delete" 
                          title={o.finalizada ? "Eliminar Obra Definitivamente" : "Primero debes marcar la obra como Acabada"} 
                          style={{ padding: '6px 10px', opacity: o.finalizada ? 1 : 0.4, cursor: o.finalizada ? 'pointer' : 'not-allowed' }}
                        >
                          🗑️
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            
            {/* MODAL CONFIGURADOR DE FASES */}
            {obraSeleccionadaFases && (
              <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
                <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', width: '80%', maxWidth: '500px', maxHeight: '80vh', display: 'flex', flexDirection: 'column' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <h3 style={{ margin: 0, color: '#f39c12' }}>⚙️ Configurar las 30 Fases - {obraSeleccionadaFases.nombreObra}</h3>
                    <button onClick={() => setObraSeleccionadaFases(null)} style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', fontWeight: 'bold' }}>✕ Cerrar</button>
                  </div>
                  <div style={{ overflowY: 'auto', paddingRight: '10px', flex: 1 }}>
                    {fasesObra.map((f) => (
                      <div key={f.id} style={{ display: 'flex', alignItems: 'center', marginBottom: '8px', gap: '10px' }}>
                        <span style={{ minWidth: '70px', fontWeight: 'bold', color: '#7f8c8d' }}>Fase {f.numero}:</span>
                        <input
                          type="text"
                          className="input-standard"
                          style={{ flex: 1, padding: '8px' }}
                          value={f.nombre}
                          onChange={(e) => {
                            const nuevoNombre = e.target.value;
                            setFasesObra(prev => prev.map(item => item.id === f.id ? { ...item, nombre: nuevoNombre } : item));
                          }}
                        />
                        <button onClick={async () => {
                          try {
                            const res = await fetch(`${API_BASE_URL}/api/fases/${f.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ nombre: f.nombre }) });
                            if (res.ok) { cargarFases(); cargarAsistencias(); alert("Fase guardada"); }
                          } catch (e) { console.error("Error", e); }
                        }} style={{ background: '#2ecc71', color: 'white', border: 'none', borderRadius: '4px', padding: '4px 8px', cursor: 'pointer', fontSize: '12px' }}>💾</button>
                      </div>
                    ))}
                  </div>
                  <div style={{ marginTop: '20px', display: 'flex', gap: '10px', justifyContent: 'center' }}>
                    <button type="button" onClick={() => {
                      const nuevasFases = Array.from({length: 30}, (_, i) => ({ 
                         id: (fasesObra[i] && fasesObra[i].id) ? fasesObra[i].id : null, 
                         idObra: obraSeleccionadaFases.id, 
                         numero: i+1, 
                         nombre: `Fase ${i+1}` 
                      }));
                      setFasesObra(nuevasFases);
                    }} className="btn-action" style={{ backgroundColor: '#8e44ad', padding: '10px 18px', fontSize: '14px', cursor: 'pointer' }}>
                      📋 Restaurar Nombres Genéricos
                    </button>
                    <button type="button" onClick={async () => {
                      try {
                        for (const f of fasesObra) await fetch(`${API_BASE_URL}/api/fases/${f.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ nombre: f.nombre }) });
                        alert("¡Todas las fases se han guardado con éxito!"); cargarFases(); cargarAsistencias();
                      } catch (e) { alert("Error al guardar algunas fases."); }
                    }} className="btn-action" style={{ backgroundColor: '#2ecc71', padding: '10px 20px', fontSize: '14px', cursor: 'pointer' }}>
                      💾 Guardar Todas las Fases
                    </button>
                  </div>
                </div>
              </div>
            )}

      {/* MODAL CONFIGURADOR DE PARTIDAS */}
            {obraSeleccionadaPartidas && (
              <div style={{ marginTop: '30px', padding: '20px', backgroundColor: '#fff', border: '2px solid #e67e22', borderRadius: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                  <h3 style={{ margin: 0, color: '#e67e22' }}>⚙️ Configurar las 30 Partidas - {obraSeleccionadaPartidas.nombreObra}</h3>
                  <button onClick={() => setObraSeleccionadaPartidas(null)} style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', fontWeight: 'bold' }}>✕ Cerrar</button>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '10px' }}>
                  {partidasObra.map((p) => (
                    <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: '5px', backgroundColor: '#f9f9f9', padding: '6px 10px', borderRadius: '4px', border: '1px solid #eee' }}>
                      <span style={{ fontWeight: 'bold', width: '30px', color: '#7f8c8d' }}>#{p.numero}</span>
                      <input 
                        className="input-standard" 
                        style={{ padding: '4px 8px', fontSize: '13px', flex: 1 }} 
                        value={p.nombre} 
                        onChange={(e) => {
                          const nuevoNombre = e.target.value;
                          setPartidasObra(prev => prev.map(item => item.id === p.id ? { ...item, nombre: nuevoNombre } : item));
                        }} 
                      />
                      <button onClick={() => handleSavePartida(p.id, p.nombre)} style={{ background: '#2ecc71', color: 'white', border: 'none', borderRadius: '4px', padding: '4px 8px', cursor: 'pointer', fontSize: '12px' }}>💾</button>
                    </div>
                  ))}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginTop: '20px' }}>
                  <button type="button" onClick={aplicarPlantillaPartidas} className="btn-action" style={{ backgroundColor: '#8e44ad', padding: '10px 18px', fontSize: '14px', cursor: 'pointer' }}>
                    📋 Restaurar Nombres Genéricos
                  </button>
                  <button type="button" onClick={handleSaveAllPartidas} className="btn-action" style={{ backgroundColor: '#2ecc71', padding: '10px 20px', fontSize: '14px', cursor: 'pointer' }}>
                    💾 Guardar Todas las Partidas
                  </button>
                </div>
              </div>
            )}
          </section>
        )}

        {/* ================= 2. TRABAJADORES ================= */}
        {seccionActiva === 'trabajadores' && (
          <section className="no-print">
            <h2 style={{ color: '#2c3e50', borderBottom: '2px solid #eee', paddingBottom: '10px', marginBottom: '20px' }}>
              {idTrabajadorEdit ? `✏️ Editar Trabajador: ${nombreTrabajador}` : '👥 Plantilla de Personal'}
            </h2>
            <div style={{ backgroundColor: '#e8f8f5', padding: '15px', borderRadius: '8px', borderLeft: '5px solid #1abc9c', marginBottom: '20px' }}>
              <h4 style={{ margin: '0 0 10px 0', color: '#16a085' }}>💡 Guía para añadir trabajadores</h4>
              <ul style={{ margin: 0, paddingLeft: '20px', color: '#2c3e50', fontSize: '14px', lineHeight: '1.5' }}>
                <li><strong>Rol:</strong> Puedes clasificar a cada persona en <strong>Obra</strong>, <strong>Oficina</strong>, <strong>Hotel</strong> o <strong>⭐ EXTRA</strong>.</li>
                <li><strong>Jornada (h):</strong> Horas totales que debe trabajar al día. El sistema te avisará en el Diario si no llega a este número.</li>
                <li><strong>Pago Diario (€):</strong> Lo que cobra por defecto un día normal de trabajo.</li>
              </ul>
            </div>
            <form onSubmit={guardarTrabajador} className="form-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
              <input className="input-standard" placeholder="Nombre Completo" value={nombreTrabajador} onChange={e=>setNombreTrabajador(e.target.value)} required />
              <select className="input-standard" value={rolTrabajador} onChange={e=>setRolTrabajador(e.target.value)} required>
                <option value="Obra">🏗️ Obra</option>
                <option value="Oficina">🏢 Oficina</option>
                <option value="Hotel">🏨 Hotel</option>
                <option value="EXTRA">⭐ EXTRA</option>
              </select>
              <input type="number" step="0.5" className="input-standard" placeholder="Horas Jornada (Ej: 8.0)" value={horasJornadaTrabajador} onChange={e=>setHorasJornadaTrabajador(e.target.value)} required />
              <input type="number" step="1" className="input-standard" placeholder="Pago Diario (€) (Ej: 120)" value={pagoDiarioTrabajador} onChange={e=>setPagoDiarioTrabajador(e.target.value)} required />
              <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button type="submit" className="btn-action" style={{ backgroundColor: idTrabajadorEdit ? '#3498db' : '#2ecc71', flex: 2 }}>{idTrabajadorEdit ? '💾 Guardar Cambios' : '➕ Añadir Trabajador'}</button>
                {idTrabajadorEdit && <button type="button" onClick={cancelarEdicionTrabajador} className="btn-action" style={{ backgroundColor: '#95a5a6', flex: 1 }}>❌ Cancelar Edición</button>}
              </div>
            </form>
            <div style={{ overflowX: 'auto' }}>
              <table className="tabla-general">
                <thead><tr style={{background: '#2ecc71'}}><th>ID</th><th>Nombre</th><th>Rol</th><th>Jornada (h)</th><th>Pago Diario</th><th>Estado</th><th>Acciones</th></tr></thead>
                <tbody>
                  {trabajadores.map(t => (
                    <tr key={t.id}>
                      <td>{t.id}</td>
                      <td>
                        <strong style={{ 
                          textDecoration: (t.esExtra || t.rol === 'EXTRA') ? 'underline 2.5px #e67e22' : 'none', 
                          textUnderlineOffset: '4px',
                          color: (t.esExtra || t.rol === 'EXTRA') ? '#d35400' : 'inherit'
                        }}>
                          {t.nombre}
                        </strong>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                          {getRolBadge(t.rol)}
                          {(t.esExtra || t.rol === 'EXTRA') && t.rol !== 'EXTRA' && getExtraBadge()}
                          <button
                            type="button"
                            onClick={() => toggleExtraTrabajadorDirecto(t)}
                            style={{
                              fontSize: '11px',
                              padding: '2px 8px',
                              borderRadius: '12px',
                              border: (t.esExtra || t.rol === 'EXTRA') ? '1px solid #d35400' : '1px solid #cbd5e1',
                              backgroundColor: (t.esExtra || t.rol === 'EXTRA') ? '#fff7ed' : '#f8fafc',
                              color: (t.esExtra || t.rol === 'EXTRA') ? '#c2410c' : '#64748b',
                              fontWeight: 'bold',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '3px',
                              transition: 'all 0.2s'
                            }}
                            title="Poner o quitar rol EXTRA para este trabajador"
                          >
                            {(t.esExtra || t.rol === 'EXTRA') ? '⭐ Quitar EXTRA' : '+ Poner EXTRA'}
                          </button>
                        </div>
                      </td>
                      <td style={{ fontWeight: 'bold' }}>{t.horasJornada !== undefined && t.horasJornada !== null ? t.horasJornada : 8.0} h</td>
                      <td style={{ fontWeight: 'bold', color: '#27ae60' }}>{t.pagoDiario !== undefined && t.pagoDiario !== null ? t.pagoDiario : 0} €</td>
                      <td>{t.estado}</td>
                      <td style={{ display: 'flex', gap: '8px' }}>
                        <button onClick={() => iniciarEdicionTrabajador(t)} className="btn-excel" style={{ backgroundColor: '#3498db' }}>✏️ Editar</button>
                        <button onClick={() => eliminarTrabajador(t.id)} className="btn-delete">🗑️ Borrar</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* ================= 4. GASTOS Y PRESUPUESTOS ================= */}
        {seccionActiva === 'gastos' && (
          <section className="no-print">
            <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '15px', alignItems: 'flex-end', borderBottom: '2px solid #eee', paddingBottom: '10px', marginBottom: '20px' }}>
              <h2 style={{ color: '#2c3e50', margin: 0 }}>📊 Presupuestos</h2>
              <div className="filtro-container">
                <label style={{ fontWeight: 'bold', color: '#7f8c8d', fontSize: '14px' }}>Filtrar Resultados:</label>
                <select className="input-standard" style={{ width: '300px', backgroundColor: '#e1f5fe', borderColor: '#81d4fa', fontWeight: 'bold' }} value={filtroObraGastos} onChange={e => setFiltroObraGastos(e.target.value)}>
                  <option value="">-- Todas las Obras (Global) --</option>{obras.map(o => <option key={o.id} value={o.id}>{o.nombreObra} - {o.cliente}</option>)}
                </select>
              </div>
            </div>

            <div className="dashboard-grid">
              <div className="dashboard-card card-blue">
                <div className="card-title">TOTAL GASTOS NETO</div>
                <div className="card-value">{totalGastosNeto.toLocaleString('es-ES', { minimumFractionDigits: 2 })} €</div>
              </div>
              <div className="dashboard-card card-purple">
                <div className="card-title">TOTAL FACTURADO PVP</div>
                <div className="card-value">{totalFacturadoPvp.toLocaleString('es-ES', { minimumFractionDigits: 2 })} €</div>
              </div>
              <div className={`dashboard-card ${beneficioTotal >= 0 ? 'card-green' : 'card-red'}`}>
                <div className="card-title">BENEFICIO BRUTO ESTIMADO</div>
                <div className="card-value">{beneficioTotal.toLocaleString('es-ES', { minimumFractionDigits: 2 })} €</div>
              </div>
            </div>

            <h3 style={{ color: '#34495e', marginTop: '30px' }}>Añadir Gasto o Material a Obra</h3>
            <form onSubmit={guardarGasto} className="form-grid">
              <select className="input-standard" value={idObraSelGasto} onChange={e=>setIdObraSelGasto(e.target.value)} required>
                <option value="">-- Seleccionar Obra --</option>{obras.map(o => <option key={o.id} value={o.id}>{o.nombreObra} ({o.cliente})</option>)}
              </select>
              <select className="input-standard" value={categoria} onChange={e=>setCategoria(e.target.value)} required>
                <option value="">-- Categoría --</option>
                <option value="Materiales">Materiales</option>
                <option value="Mano de Obra">Mano de Obra</option>
                <option value="Transporte">Transporte</option>
                <option value="Varios">Varios</option>
              </select>
              <input className="input-standard" type="date" value={fechaGasto} onChange={e=>setFechaGasto(e.target.value)} required />
              <input className="input-standard" placeholder="Proveedor / Tienda" value={provTrabajador} onChange={e=>setProvTrabajador(e.target.value)} />
              
              <input className="input-standard" placeholder="Descripción del ticket o factura" value={descripcion} onChange={e=>setDescripcion(e.target.value)} style={{ gridColumn: '1 / -1' }} />
              
              <div style={{display: 'flex', gap: '15px', gridColumn: '1 / -1'}}>
                <input className="input-standard" type="number" step="0.01" placeholder="Neto €" value={precioNeto} onChange={e=>setPrecioNeto(e.target.value)} style={{borderColor: '#e74c3c', flex: 1}} />
                <input className="input-standard" type="number" step="0.01" placeholder="PVP €" value={precioPvp} onChange={e=>setPrecioPvp(e.target.value)} style={{borderColor: '#3498db', flex: 1}} />
              </div>
              <button type="submit" className="btn-action full-width-mobile" style={{backgroundColor: '#e74c3c', gridColumn: '1 / -1'}}>Registrar Gasto</button>
            </form>

            <div style={{ overflowX: 'auto' }}>
              <table className="tabla-general">
                <thead><tr style={{background: '#e74c3c'}}><th>Fecha</th><th>Obra</th><th>Descripción</th><th>Neto</th><th>PVP</th></tr></thead>
                <tbody>
                  {gastosFiltrados.length === 0 ? (
                    <tr><td colSpan="5" style={{textAlign:'center', color:'#95a5a6'}}>No hay gastos registrados para esta selección.</td></tr>
                  ) : (
                    gastosFiltrados.map(g => (
                      <tr key={g.id}>
                        <td>{g.fecha}</td>
                        <td><strong>{getNombreObra(g.idObra)}</strong> <br/><span style={{fontSize:'12px', color:'#7f8c8d'}}>{g.categoria}</span></td>
                        <td>{g.descripcion} <br/><span style={{fontSize:'12px', color:'#7f8c8d'}}>{g.provTrabajador}</span></td>
                        <td style={{color: '#e74c3c', fontWeight:'bold'}}>{g.precioNeto}€</td>
                        <td style={{color: '#2980b9', fontWeight:'bold'}}>{g.precioPvp}€</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* ================= 5. INFORMES / PARTES ================= */}
        {seccionActiva === 'informes' && (
          <section>
            <div className="no-print" style={{ marginBottom: '20px', paddingBottom: '20px', borderBottom: '2px solid #eee', display: 'flex', gap: '15px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
              <div className="filtro-container">
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '5px', color: '#7f8c8d' }}>Trabajador:</label>
                <select className="input-standard" value={trabajadorFiltro} onChange={e => setTrabajadorFiltro(e.target.value)}>
                  <option value="">-- Elige un trabajador --</option>{trabajadores.map(t => <option key={t.id} value={t.id}>{t.nombre} ({t.rol || 'Obra'})</option>)}
                </select>
              </div>
              <div className="filtro-container">
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '5px', color: '#7f8c8d' }}>Mes del Cuadrante:</label>
                <input className="input-standard" type="month" value={mesFiltro} onChange={e => setMesFiltro(e.target.value)} />
              </div>
              {trabajadorFiltro && (
                <div style={{ display: 'flex', gap: '10px', width: '100%', marginTop: '10px' }}>
                  <button onClick={guardarCambiosCuadrante} className="btn-action" style={{ backgroundColor: '#3498db', flex: 1, padding: '10px 5px', fontSize: '12px' }}>💾 GUARDAR</button>
                  <button onClick={() => window.print()} className="btn-action" style={{ backgroundColor: '#8e44ad', flex: 1, padding: '10px 5px', fontSize: '12px' }}>🖨️ IMPRIMIR</button>
                </div>
              )}
            </div>

            {trabajadorFiltro ? (
              <div style={{ marginTop: '10px' }}>
                <h3 style={{ textAlign: 'center', fontSize: '18px', margin: '0 0 15px 0', textTransform: 'uppercase' }}>
                  PARTE DE TRABAJO - {getNombreTrabajador(parseInt(trabajadorFiltro))} ({mesFiltro})
                </h3>
                
                <table className="tabla-papel" style={{ width: '100%', borderCollapse: 'collapse', border: '1.5px solid black', textAlign: 'center' }}>
                  <thead>
                    <tr style={{ background: '#f0f0f0' }}>
                      <th style={{ border: '1px solid black', padding: '5px 2px', width: '4%' }}>Día</th>
                      <th style={{ border: '1px solid black', padding: '5px 2px', width: '6%' }}>Mes</th>
                      <th style={{ border: '1px solid black', padding: '5px 2px', width: '8%' }}>Día Sem.</th>
                      <th style={{ border: '1px solid black', padding: '5px 2px', width: '7%' }}>Asist.</th>
                      <th style={{ border: '1px solid black', padding: '5px 2px', width: '14%' }}>Horario (Ent-Sal)</th>
                      <th style={{ border: '1px solid black', padding: '5px 2px', width: '17%' }}>Obra</th>
                      <th style={{ border: '1px solid black', padding: '5px 2px', width: '15%' }}>Partida</th>
                      <th style={{ border: '1px solid black', padding: '5px 2px', width: '6%' }}>Horas</th>
                      <th style={{ border: '1px solid black', padding: '5px 2px', width: '6%' }}>H. Extra</th>
                      <th style={{ border: '1px solid black', padding: '5px 2px', width: '13%' }}>Descripción</th>
                      <th className="no-print" style={{ border: '1px solid black', padding: '5px 2px', width: '4%' }}>Acc.</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cuadrante.map((diaInfo, index) => {
                      const claseFila = diaInfo.esFinde ? "fondo-amarillo" : "";
                      const partesHorario = (diaInfo.horario || ' a ').split(' a ');
                      const horaEntrada = partesHorario[0] || '';
                      const horaSalida = partesHorario[1] || '';

                      return (
                        <tr key={index} className={claseFila} style={{ backgroundColor: diaInfo.esFinde ? '#fff200' : 'transparent', borderBottom: '1px solid black' }}>
                          <td style={{ border: '1px solid black', fontWeight: 'bold' }}>{diaInfo.nDia}</td>
                          <td style={{ border: '1px solid black' }}>{diaInfo.nMes}</td>
                          <td style={{ border: '1px solid black' }}>{diaInfo.nSem}</td>
                          <td style={{ border: '1px solid black' }}>
                            <select className="input-paper" style={{ textAlign: 'center', fontWeight: 'bold' }} value={diaInfo.asistencia} onChange={e => handleEditCuadrante(index, 'asistencia', e.target.value)}>
                              <option value=""></option><option value="Sí">Sí</option><option value="No">No</option><option value="Vacaciones">Vacaciones</option>
                            </select>
                          </td>
                          <td style={{ border: '1px solid black', whiteSpace: 'nowrap' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '2px' }}>
                              <select className="input-paper" style={{textAlign: 'center', width: '45%'}} value={horaEntrada} onChange={e => handleEditCuadrante(index, 'horario', `${e.target.value} a ${horaSalida}`)}>
                                 <option value=""></option>{horasDisponibles.map(h => <option key={h} value={h}>{h}</option>)}
                              </select>
                              <span style={{margin: '0 1px', fontWeight: 'bold'}}>-</span>
                              <select className="input-paper" style={{textAlign: 'center', width: '45%'}} value={horaSalida} onChange={e => handleEditCuadrante(index, 'horario', `${horaEntrada} a ${e.target.value}`)}>
                                 <option value=""></option>{horasDisponibles.map(h => <option key={h} value={h}>{h}</option>)}
                              </select>
                            </div>
                          </td>
                          <td style={{ border: '1px solid black', textAlign: 'left' }}>
                            <select className="input-paper" style={{ textAlign: 'left' }} value={diaInfo.idObra} onChange={e => handleEditCuadrante(index, 'idObra', e.target.value)}>
                              <option value=""></option>{obras.map(o => <option key={o.id} value={o.id}>{o.nombreObra}</option>)}
                            </select>
                          </td>
                          <td style={{ border: '1px solid black', textAlign: 'left' }}>
                            <select className="input-paper" style={{ textAlign: 'left' }} value={diaInfo.partida} onChange={e => handleEditCuadrante(index, 'partida', e.target.value)}>
                              <option value="">-- Partida --</option>
                              {partidas.filter(p => Number(p.idObra) === Number(diaInfo.idObra)).map(p => <option key={p.id} value={p.nombre}>{p.nombre}</option>)}
                            </select>
                          </td>
                          <td style={{ border: '1px solid black' }}>
                            <input className="input-paper" style={{textAlign: 'center', fontWeight: 'bold'}} type="number" step="0.5" value={diaInfo.horas} onChange={e => handleEditCuadrante(index, 'horas', e.target.value)} />
                          </td>
                          <td style={{ border: '1px solid black' }}>
                            <input className="input-paper" style={{textAlign: 'center', color: '#e67e22', fontWeight: 'bold'}} type="number" step="0.5" placeholder="0" value={diaInfo.horasExtra} onChange={e => handleEditCuadrante(index, 'horasExtra', e.target.value)} />
                          </td>
                          <td style={{ border: '1px solid black' }}>
                            <input className="input-paper" style={{ textAlign: 'left' }} value={diaInfo.descripcionExtra} onChange={e => handleEditCuadrante(index, 'descripcionExtra', e.target.value)} />
                          </td>
                          <td className="no-print" style={{ border: '1px solid black' }}>
                            <div style={{ display: 'flex', gap: '4px', justifyContent: 'center', alignItems: 'center' }}>
                              <button type="button" onClick={() => handleAddRowCuadrante(index)} className="btn-partes-accion-add" title="Añadir obra a este día">+</button>
                              {(diaInfo.idAsis || diaInfo.isNewRow) && <button type="button" onClick={() => handleRemoveRowCuadrante(index)} className="btn-partes-accion-del" title="Eliminar registro">✕</button>}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr style={{ background: '#f0f0f0', fontWeight: 'bold', borderTop: '2px solid black' }}>
                      <td colSpan="7" style={{ border: '1px solid black', textAlign: 'right', padding: '6px 10px', fontSize: '11px' }}>
                        TOTALES:
                      </td>
                      <td style={{ border: '1px solid black', padding: '6px 2px', textAlign: 'center', color: '#2980b9', fontSize: '11px', fontWeight: '900' }}>
                        {totalHorasNormales} h
                      </td>
                      <td style={{ border: '1px solid black', padding: '6px 2px', textAlign: 'center', color: '#e67e22', fontSize: '11px', fontWeight: '900' }}>
                        {totalHorasExtra} h
                      </td>
                      <td colSpan="2" style={{ border: '1px solid black', padding: '6px 4px', textAlign: 'center', background: '#e8f8f5', color: '#27ae60', fontSize: '12px', fontWeight: '900' }}>
                        Total Horas: {granTotalHoras} h
                      </td>
                    </tr>
                  </tfoot>
                </table>

                {/* RESUMEN VISUAL DE TOTALES */}
                <div className="resumen-totales-print" style={{ marginTop: '15px', padding: '12px 20px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#f8fafc', display: 'flex', justifyContent: 'space-around', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 'bold', textTransform: 'uppercase' }}>Días Asistidos</div>
                    <div style={{ fontSize: '16px', fontWeight: '900', color: '#334155' }}>{totalDiasAsistidos} días</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 'bold', textTransform: 'uppercase' }}>Horas Normales</div>
                    <div style={{ fontSize: '16px', fontWeight: '900', color: '#2980b9' }}>{totalHorasNormales} h</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 'bold', textTransform: 'uppercase' }}>Horas Extra</div>
                    <div style={{ fontSize: '16px', fontWeight: '900', color: '#e67e22' }}>{totalHorasExtra} h</div>
                  </div>
                  <div style={{ textAlign: 'center', background: '#dcfce7', padding: '6px 16px', borderRadius: '8px', border: '1px solid #86efac' }}>
                    <div style={{ fontSize: '11px', color: '#166534', fontWeight: 'bold', textTransform: 'uppercase' }}>Total Horas</div>
                    <div style={{ fontSize: '20px', fontWeight: '900', color: '#15803d' }}>{granTotalHoras} h</div>
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '60px 20px', color: '#95a5a6', border: '2px dashed #ecf0f1', borderRadius: '10px' }}><h3>👈 Selecciona un trabajador y un mes para cargar la hoja de cálculo.</h3></div>
            )}
          </section>
        )}

        {/* ================= 6. GESTIÓN DE USUARIOS (ADMIN ONLY) ================= */}
        {seccionActiva === 'usuarios' && usuarioActual?.rol === 'ADMIN' && (
          <section className="no-print">
            <h2 style={{ color: '#2c3e50', borderBottom: '2px solid #eee', paddingBottom: '10px', marginBottom: '20px' }}>🛡️ Gestión de Usuarios</h2>
            <form onSubmit={guardarUsuario} className="form-grid">
              <input className="input-standard" placeholder="Nombre completo" value={nombreNuevo} onChange={e=>setNombreNuevo(e.target.value)} required />
              <input className="input-standard" placeholder="Usuario (Ej: juan123)" value={usernameNuevo} onChange={e=>setUsernameNuevo(e.target.value)} required />
              <input className="input-standard" type="password" placeholder="Contraseña" value={passwordNuevo} onChange={e=>setPasswordNuevo(e.target.value)} required />
              <select className="input-standard" value={rolNuevo} onChange={e=>setRolNuevo(e.target.value)} required><option value="USER">Usuario (USER)</option><option value="ADMIN">Administrador (ADMIN)</option></select>
              <button type="submit" className="btn-action full-width-mobile" style={{backgroundColor: '#9b59b6', gridColumn: '1 / -1'}}>Crear Nuevo Usuario</button>
            </form>
            <div style={{ overflowX: 'auto' }}>
              <table className="tabla-general">
                <thead><tr style={{background: '#9b59b6'}}><th>ID</th><th>Nombre</th><th>Usuario</th><th>Rol</th><th>Contraseña</th><th>Acciones</th></tr></thead>
                <tbody>
                  {usuarios.map(u => (
                    <tr key={u.id}>
                      <td>{u.id}</td><td><strong>{u.nombre}</strong></td><td><code>{u.username}</code></td>
                      <td><span style={{ padding: '4px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 'bold', color: 'white', backgroundColor: u.rol === 'ADMIN' ? '#e74c3c' : '#3498db' }}>{u.rol}</span></td>
                      <td><span style={{fontFamily:'monospace', color:'#888'}}>••••••••</span></td>
                      <td>{u.username === usuarioActual.username ? <span style={{fontSize:'12px', color:'#7f8c8d', fontStyle:'italic'}}>Sesión Activa</span> : <button onClick={() => eliminarUsuario(u.id)} className="btn-delete">🗑️ Borrar</button>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

export default App;
