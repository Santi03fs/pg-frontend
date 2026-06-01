import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import './App.css';
import Login from './Login';


// ================= LOGOTIPO GRUPO PG =================
const LogoPG = () => (
  <svg height="50" viewBox="0 0 300 120" xmlns="http://www.w3.org/2000/svg" style={{ display: 'block', maxWidth: '100%' }}>
    <text transform="translate(35, 88) rotate(-90)" fill="#000" fontFamily="Arial Black, Impact, sans-serif" fontSize="26" fontWeight="900" letterSpacing="1">GRUPO</text>
    <text x="45" y="88" fill="#000" fontFamily="Arial Black, Impact, sans-serif" fontSize="110" fontWeight="900" letterSpacing="-8">PG</text>
    <rect x="45" y="94" width="225" height="22" fill="#E60000" />
    <text x="157" y="111" fill="#FFF" fontFamily="Arial Black, sans-serif" fontSize="15" fontWeight="900" textAnchor="middle" letterSpacing="0.5">WWW.GRUPO-PG.ES</text>
  </svg>
);

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [usuarioActual, setUsuarioActual] = useState(null);
  const [seccionActiva, setSeccionActiva] = useState('obras'); 

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

  // ================= ESTADOS FORMULARIOS =================
  const [cliente, setCliente] = useState('');
  const [nombreObra, setNombreObra] = useState('');
  const [fechaInicio, setFechaInicio] = useState('');
  
  const [nombreTrabajador, setNombreTrabajador] = useState('');
  const [dni, setDni] = useState('');
  const [telefono, setTelefono] = useState('');
  
  const [fechaAsistencia, setFechaAsistencia] = useState('');
  const [idTrabajadorSel, setIdTrabajadorSel] = useState('');
  const [idObraSelAsis, setIdObraSelAsis] = useState('');
  const [horas, setHoras] = useState('');
  
  const [idObraSelGasto, setIdObraSelGasto] = useState('');
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
  const [filtroTrabajadorAsis, setFiltroTrabajadorAsis] = useState('');

// ================= CARGA DE DATOS =================
  useEffect(() => {
    const session = localStorage.getItem('pg_session') || sessionStorage.getItem('pg_session');
    if (session === 'authenticated') {
      setIsAuthenticated(true);
      const userStored = localStorage.getItem('pg_user') || sessionStorage.getItem('pg_user');
      if (userStored) {
        setUsuarioActual(JSON.parse(userStored));
      }
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      cargarTodo();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  const handleLogout = () => {
    localStorage.removeItem('pg_session');
    localStorage.removeItem('pg_user');
    sessionStorage.removeItem('pg_session');
    sessionStorage.removeItem('pg_user');
    setUsuarioActual(null);
    setIsAuthenticated(false);
  };

  const cargarTodo = () => {
    cargarObras(); 
    cargarTrabajadores(); 
    cargarAsistencias(); 
    cargarGastos();
    
    // Cargar usuarios si es admin
    const userStored = localStorage.getItem('pg_user') || sessionStorage.getItem('pg_user');
    if (userStored) {
      const u = JSON.parse(userStored);
      if (u.rol === 'ADMIN') {
        fetch('https://pg-backend-v364.onrender.com/api/usuarios')
          .then(res => res.json())
          .then(setUsuarios)
          .catch(err => console.error("Error al cargar usuarios inicial:", err));
      }
    }
  };

  const cargarUsuarios = () => {
    fetch('https://pg-backend-v364.onrender.com/api/usuarios')
      .then(res => res.json())
      .then(setUsuarios)
      .catch(err => console.error("Error al cargar usuarios:", err));
  };

  const guardarUsuario = (e) => {
    e.preventDefault();
    const payload = {
      username: usernameNuevo,
      password: passwordNuevo,
      rol: rolNuevo,
      nombre: nombreNuevo
    };

    fetch('https://pg-backend-v364.onrender.com/api/usuarios', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
    .then(async res => {
      if (res.ok) {
        setUsernameNuevo('');
        setPasswordNuevo('');
        setRolNuevo('USER');
        setNombreNuevo('');
        cargarUsuarios();
      } else {
        const errorMsg = await res.text();
        alert(errorMsg || "Error al registrar el usuario");
      }
    })
    .catch(err => console.error("Error al guardar usuario:", err));
  };

  const eliminarUsuario = (id) => {
    if (window.confirm("⚠️ ¿Estás seguro de que quieres eliminar a este usuario?")) {
      fetch(`https://pg-backend-v364.onrender.com/api/usuarios/${id}`, {
        method: 'DELETE'
      })
      .then(res => {
        if (res.ok) {
          cargarUsuarios();
        } else {
          alert("Error al intentar eliminar el usuario");
        }
      })
      .catch(err => console.error("Error al eliminar usuario:", err));
    }
  };

  const cargarObras = () => fetch('https://pg-backend-v364.onrender.com/api/obras').then(res => res.json()).then(setObras);
  const cargarTrabajadores = () => fetch('https://pg-backend-v364.onrender.com/api/trabajadores').then(res => res.json()).then(setTrabajadores);
  const cargarAsistencias = () => fetch('https://pg-backend-v364.onrender.com/api/asistencias').then(res => res.json()).then(setAsistencias);
  const cargarGastos = () => fetch('https://pg-backend-v364.onrender.com/api/gastos').then(res => res.json()).then(setGastos);

  // ================= HELPERS Y CÁLCULOS FILTRADOS =================
  const getNombreObra = (id) => obras.find(o => Number(o.id) === Number(id))?.nombreObra || '';
  const getNombreTrabajador = (id) => trabajadores.find(t => Number(t.id) === Number(id))?.nombre || 'Desconocido';
  
  const gastosFiltrados = filtroObraGastos 
    ? gastos.filter(g => Number(g.idObra) === parseInt(filtroObraGastos)) 
    : gastos;

  const totalGastosNeto = gastosFiltrados.reduce((s, g) => s + (g.precioNeto || 0), 0);
  const totalFacturadoPvp = gastosFiltrados.reduce((s, g) => s + (g.precioPvp || 0), 0);
  const beneficioTotal = totalFacturadoPvp - totalGastosNeto;

  const asistenciasFiltradas = filtroTrabajadorAsis 
    ? asistencias.filter(a => Number(a.idTrabajador) === parseInt(filtroTrabajadorAsis)) 
    : asistencias;
    
  const totalHorasFiltradas = asistenciasFiltradas.reduce((suma, a) => suma + (a.horasTrabajadas || 0), 0);

  // ================= LÓGICA DEL CUADRANTE EDITABLE =================
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
        
        const parteDb = asistencias.find(a => Number(a.idTrabajador) === parseInt(trabajadorFiltro) && a.fecha === fechaStr);
        
        nuevoCuadrante.push({
          nDia: i, 
          nMes: nombresMeses[fechaActual.getMonth()], 
          nSem: nombresDias[diaSemana],
          esFinde: diaSemana === 0 || diaSemana === 6,
          fechaStr,
          idAsis: parteDb ? parteDb.id : null,
          asistencia: parteDb ? 'Sí' : '',
          horario: parteDb && parteDb.horario ? parteDb.horario : '',
          idObra: parteDb ? parteDb.idObra : '',
          horas: parteDb ? parteDb.horasTrabajadas : '',
          partida: parteDb && parteDb.partida ? parteDb.partida : '', 
          descripcionExtra: parteDb && parteDb.descripcion ? parteDb.descripcion : '' 
        });
      }
      setCuadrante(nuevoCuadrante);
    }
  }, [mesFiltro, trabajadorFiltro, asistencias, obras]);

  const handleEditCuadrante = (index, campo, valor) => {
    const copia = [...cuadrante];
    copia[index][campo] = valor;
    
    if ((campo === 'idObra' || campo === 'horas' || campo === 'horario' || campo === 'partida' || campo === 'descripcionExtra') && valor !== '') {
      copia[index].asistencia = 'Sí';
    }
    setCuadrante(copia);
  };

  const guardarCambiosCuadrante = async () => {
    const editados = cuadrante.filter(d => d.asistencia === 'Sí' || d.horas !== '' || d.idObra !== '' || d.horario !== '' || d.partida !== '' || d.descripcionExtra !== '');
    
    for (const dia of editados) {
      const payload = {
        id: dia.idAsis, 
        fecha: dia.fechaStr, 
        idTrabajador: parseInt(trabajadorFiltro),
        idObra: parseInt(dia.idObra) || null, 
        haAsistido: true, 
        horasTrabajadas: parseFloat(dia.horas) || 0,
        horario: dia.horario,
        partida: dia.partida,
        descripcion: dia.descripcionExtra
      };
      
      await fetch('https://pg-backend-v364.onrender.com/api/asistencias', { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify(payload) 
      });
    }
    alert("¡Cuadrante guardado en la base de datos con éxito!"); 
    cargarAsistencias();
  };

  // ================= FUNCIONES GUARDAR ESTÁNDAR =================
  const guardarObra = (e) => { 
    e.preventDefault(); 
    fetch('https://pg-backend-v364.onrender.com/api/obras', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ cliente, nombreObra, fechaInicio }) })
    .then(() => { setCliente(''); setNombreObra(''); setFechaInicio(''); cargarObras(); }); 
  };
  
  const toggleEstadoObra = async (id, estadoActual) => {
    try {
      await fetch(`https://pg-backend-v364.onrender.com/api/obras/${id}/estado`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(!estadoActual)
      });
      cargarObras(); 
    } catch (error) {
      console.error("Error al cambiar el estado de la obra:", error);
    }
  };

  const guardarTrabajador = (e) => { 
    e.preventDefault(); 
    fetch('https://pg-backend-v364.onrender.com/api/trabajadores', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ nombre: nombreTrabajador, dni, telefono, estado: 'Activo' }) })
    .then(() => { setNombreTrabajador(''); setDni(''); setTelefono(''); cargarTrabajadores(); }); 
  };

  const eliminarTrabajador = async (id) => {
    if (window.confirm("⚠️ ¿Estás seguro de que quieres eliminar a este trabajador?")) {
      try {
        const response = await fetch(`https://pg-backend-v364.onrender.com/api/trabajadores/${id}`, {
          method: 'DELETE'
        });
        
        if (response.ok) {
          cargarTrabajadores();
        } else {
          alert("❌ No se puede eliminar a este trabajador porque ya tiene partes de horas registrados en alguna obra.");
        }
      } catch (error) {
        console.error("Error al intentar eliminar el trabajador:", error);
      }
    }
  };
  
  const guardarAsistencia = (e) => { 
    e.preventDefault(); 
    fetch('https://pg-backend-v364.onrender.com/api/asistencias', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ fecha: fechaAsistencia, idTrabajador: parseInt(idTrabajadorSel), idObra: parseInt(idObraSelAsis), haAsistido: true, horasTrabajadas: parseFloat(horas) }) })
    .then(() => { setFechaAsistencia(''); setIdTrabajadorSel(''); setIdObraSelAsis(''); setHoras(''); cargarAsistencias(); }); 
  };
  
  const guardarGasto = (e) => { 
    e.preventDefault(); 
    fetch('https://pg-backend-v364.onrender.com/api/gastos', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ idObra: parseInt(idObraSelGasto), categoria, fecha: fechaGasto, descripcion, provTrabajador, udsHoras: parseFloat(udsHoras) || 0, precioNeto: parseFloat(precioNeto) || 0, precioPvp: parseFloat(precioPvp) || 0 }) })
    .then(() => { setIdObraSelGasto(''); setCategoria(''); setFechaGasto(''); setDescripcion(''); setProvTrabajador(''); setUdsHoras(''); setPrecioNeto(''); setPrecioPvp(''); cargarGastos(); }); 
  };

  // ================= LA MAGIA DE EXPORTAR A EXCEL (BLINDADA) =================
  const exportarObraExcel = (idObra) => {
    // 1. Forzamos la comparación numérica para evitar fallos
    const targetId = Number(idObra);
    const obraTarget = obras.find(o => Number(o.id) === targetId);
    
    if (!obraTarget) {
      alert("No se pudo encontrar la información de esta obra.");
      return;
    }

    // Filtramos horas y gastos de forma segura (por si vienen anidados del backend)
    const horasObra = asistencias.filter(a => 
      Number(a.idObra) === targetId || (a.obra && Number(a.obra.id) === targetId)
    );
    
    const gastosObra = gastos.filter(g => 
      Number(g.idObra) === targetId || (g.obra && Number(g.obra.id) === targetId)
    );

    // Si la obra está totalmente vacía, avisamos
    if (horasObra.length === 0 && gastosObra.length === 0) {
      const confirmar = window.confirm("⚠️ Esta obra no tiene horas ni gastos registrados. ¿Quieres descargar el Excel vacío de todas formas?");
      if (!confirmar) return;
    }

    const datosExcel = [];

    // Cabecera calcada a la plantilla
    datosExcel.push(["CLIENTE:", obraTarget.cliente || "", "", "", "", "", "", ""]);
    datosExcel.push(["FECHA:", new Date().toLocaleDateString('es-ES'), "", "", "", "", "", ""]);
    datosExcel.push(["OBRA:", obraTarget.nombreObra || "", "", "", "", "", "", ""]);
    datosExcel.push([]);
    datosExcel.push(["GASTOS", "", "", "", "", "", "", ""]);
    datosExcel.push([]);
    datosExcel.push(["FECHA", "DESCRIPCIÓN", "PROV/TRABAJ.", "UDS./H", "NETO", "SUBTOTAL", "PVP", "SUBTOTAL"]);
    datosExcel.push([]);

    // HORAS
    if (horasObra.length > 0) {
      datosExcel.push(["", "ESTRUCTURA / MANO DE OBRA", "", "", "", "", "", ""]);
      let totalHoras = 0;
      horasObra.forEach(h => {
        const horasTrabajadas = parseFloat(h.horasTrabajadas) || 0;
        totalHoras += horasTrabajadas;
        
        // Buscar al trabajador de forma blindada
        const idT = h.idTrabajador !== undefined ? h.idTrabajador : (h.trabajador && h.trabajador.id);
        const trabajadorObj = trabajadores.find(t => Number(t.id) === Number(idT));
        const nombreT = trabajadorObj ? trabajadorObj.nombre : "Desconocido";

        datosExcel.push([
          h.fecha || "",
          h.descripcion || h.partida || "Mano de obra",
          nombreT,
          horasTrabajadas,
          "", "", "", ""
        ]);
      });
      datosExcel.push(["", "", "TOTAL H", totalHoras, "", "", "", ""]);
      datosExcel.push([]);
    }

    // GASTOS
    let totalGlobalNeto = 0;
    let totalGlobalPvp = 0;

    if (gastosObra.length > 0) {
      // Extraemos las categorías, poniendo "VARIOS" si alguna viene en blanco
      const categorias = [...new Set(gastosObra.map(g => g.categoria || 'VARIOS'))];
      
      categorias.forEach(cat => {
        // Formateo seguro para evitar que rompa el Excel
        datosExcel.push(["", String(cat).toUpperCase() + ":", "", "", "", "", "", ""]);
        const gastosCat = gastosObra.filter(g => (g.categoria || 'VARIOS') === cat);
        
        gastosCat.forEach(g => {
          const neto = parseFloat(g.precioNeto) || 0;
          const pvp = parseFloat(g.precioPvp) || 0;
          
          totalGlobalNeto += neto;
          totalGlobalPvp += pvp;

          datosExcel.push([
            g.fecha || "",
            g.descripcion || "",
            g.provTrabajador || "",
            g.udsHoras || "",
            neto,
            neto, 
            pvp,
            pvp   
          ]);
        });
      });
    }

    // Sumatorio de euros al final del todo SIEMPRE se imprime
    datosExcel.push([]);
    datosExcel.push(["", "", "", "TOTAL €", "", totalGlobalNeto, "", totalGlobalPvp]);

    // Creamos el libro y la hoja
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(datosExcel);

    // Ajuste del ancho de las columnas para que se vea limpio
    ws['!cols'] = [
      { wch: 12 }, { wch: 45 }, { wch: 20 }, { wch: 10 }, 
      { wch: 10 }, { wch: 12 }, { wch: 10 }, { wch: 12 }
    ];

    XLSX.utils.book_append_sheet(wb, ws, "GASTOS");

    const nombreLimpio = (obraTarget.nombreObra || 'OBRA').toUpperCase().replace(/\s+/g, '_');
    const nombreArchivo = `BALANCE_${nombreLimpio}.xlsx`;
    XLSX.writeFile(wb, nombreArchivo);
  };

  // ================= INTERFAZ =================
  if (!isAuthenticated) {
    return <Login onLoginSuccess={(user) => {
      setIsAuthenticated(true);
      setUsuarioActual(user);
    }} />;
  }

  return (
    <div className="app-container" style={{ backgroundColor: '#f4f7fa', minHeight: '100vh', fontFamily: '"Segoe UI", sans-serif' }}>
      
      <style>{`
        .app-container { padding: 30px; }
        
        @media print { 
          .no-print { display: none !important; } 
          body { background-color: white !important; padding: 0 !important; }
          .app-container { padding: 0 !important; }
          .print-container { width: 100% !important; box-shadow: none !important; padding: 0 !important; } 
          .tabla-papel { width: 100% !important; border: 1px solid black !important; border-collapse: collapse !important; } 
          .tabla-papel th, .tabla-papel td { border: 1px solid black !important; font-size: 11px !important; padding: 4px !important; color: black !important; } 
          .fondo-amarillo { background-color: #fff200 !important; -webkit-print-color-adjust: exact; } 
          .input-paper { border: none !important; background: transparent !important; color: black !important; width: 100%; font-size: 11px; padding: 0; margin: 0; -webkit-appearance: none; appearance: none; } 
        }
        
        .input-paper { width: 100%; border: 1px solid #ddd; padding: 5px; font-size: 12px; outline: none; border-radius: 4px; box-sizing: border-box; background: rgba(255,255,255,0.8); }
        .input-paper:focus { border-color: #3498db; background: white; }
        .btn-nav { padding: 10px 15px; cursor: pointer; border: none; border-radius: 6px; font-weight: bold; transition: 0.2s; font-size: 13px; text-align: center; }
        .card { background: white; padding: 25px; border-radius: 12px; box-shadow: 0 4px 10px rgba(0,0,0,0.05); }
        .form-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 25px; border: 1px solid #eee; }
        .btn-action { padding: 12px; cursor: pointer; border: none; border-radius: 6px; color: white; font-weight: bold; font-size: 14px; }
        .tabla-general { width: 100%; border-collapse: collapse; text-align: left; white-space: nowrap; }
        .tabla-general th { padding: 12px; color: white; }
        .tabla-general td { padding: 12px; border-bottom: 1px solid #f0f0f0; }
        .input-standard { padding: 10px; border: 1px solid #ccc; border-radius: 6px; font-size: 14px; outline: none; width: 100%; box-sizing: border-box; }
        
        .switch-container { display: flex; align-items: center; gap: 8px; cursor: pointer; }
        .switch-input { width: 40px; height: 20px; appearance: none; background: #e74c3c; border-radius: 20px; position: relative; cursor: pointer; outline: none; transition: 0.3s; margin: 0;}
        .switch-input:checked { background: #2ecc71; }
        .switch-input::before { content: ''; position: absolute; width: 16px; height: 16px; border-radius: 50%; background: white; top: 2px; left: 2px; transition: 0.3s; box-shadow: 0 2px 4px rgba(0,0,0,0.2); }
        .switch-input:checked::before { transform: translateX(20px); }
        
        .btn-delete { background-color: #ff4757; color: white; border: none; padding: 6px 12px; border-radius: 4px; font-weight: bold; cursor: pointer; transition: 0.2s; }
        .btn-delete:hover { background-color: #ff6b81; }

        .btn-excel { background-color: #10ac84; color: white; border: none; padding: 6px 12px; border-radius: 4px; font-weight: bold; cursor: pointer; transition: 0.2s; font-size: 13px; }
        .btn-excel:hover { background-color: #1dd1a1; box-shadow: 0 2px 5px rgba(29, 209, 161, 0.4); }

        .btn-logout-header { transition: 0.2s; }
        .btn-logout-header:hover { background-color: #c0392b !important; color: white !important; border-color: #c0392b !important; box-shadow: 0 2px 5px rgba(192, 57, 43, 0.4); }

        .tarjetas-resultados { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; marginBottom: 25px; }
        .header-container { display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px; background-color: white; padding: 15px 25px; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.05); }
        .nav-buttons { display: flex; gap: 8px; }
        .filtro-container { display: flex; align-items: center; gap: 10px; }
        
        @media (max-width: 1024px) {
          .form-grid { grid-template-columns: repeat(2, 1fr); } 
          .btn-action.full-width-mobile { grid-column: span 2; }
        }

        @media (max-width: 768px) {
          .app-container { padding: 10px; }
          .card { padding: 15px; }
          .header-container { flex-direction: column; gap: 15px; text-align: center; }
          .nav-buttons { flex-wrap: wrap; justify-content: center; width: 100%; }
          .btn-nav { flex: 1 1 calc(33% - 10px); font-size: 12px; } 
          
          .form-grid { grid-template-columns: 1fr; } 
          .btn-action.full-width-mobile { grid-column: span 1; }
          
          .tarjetas-resultados { grid-template-columns: 1fr; gap: 10px; } 
          
          .filtro-container { flex-direction: column; align-items: flex-start; width: 100%; }
          .filtro-container select { width: 100% !important; }
          .separador-header { display: none; }
        }
      `}</style>

      {/* CABECERA */}
      <div className="no-print header-container">
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px', flexWrap: 'wrap', justifyContent: 'center' }}>
          <LogoPG /> 
          <div className="separador-header" style={{width: '1px', height: '40px', background: '#ddd', margin: '0 10px'}}></div> 
          <div>
            <h2 style={{margin:0, fontSize:'20px', color: '#2c3e50'}}>GESTIÓN CONSTRUCTORA</h2>
            {usuarioActual && <span style={{fontSize:'12px', color:'#7f8c8d', fontWeight:'600'}}>👤 Sesión: {usuarioActual.nombre} ({usuarioActual.rol})</span>}
          </div>
        </div>
        <div className="nav-buttons">
          <button onClick={() => setSeccionActiva('obras')} className="btn-nav" style={{ backgroundColor: seccionActiva === 'obras' ? '#3498db' : '#ecf0f1', color: seccionActiva === 'obras' ? 'white' : '#7f8c8d' }}>Obras</button>
          <button onClick={() => setSeccionActiva('trabajadores')} className="btn-nav" style={{ backgroundColor: seccionActiva === 'trabajadores' ? '#2ecc71' : '#ecf0f1', color: seccionActiva === 'trabajadores' ? 'white' : '#7f8c8d' }}>Personal</button>
          <button onClick={() => setSeccionActiva('asistencias')} className="btn-nav" style={{ backgroundColor: seccionActiva === 'asistencias' ? '#f39c12' : '#ecf0f1', color: seccionActiva === 'asistencias' ? 'white' : '#7f8c8d' }}>Horas</button>
          <button onClick={() => setSeccionActiva('gastos')} className="btn-nav" style={{ backgroundColor: seccionActiva === 'gastos' ? '#e74c3c' : '#ecf0f1', color: seccionActiva === 'gastos' ? 'white' : '#7f8c8d' }}>Gastos</button>
          <button onClick={() => setSeccionActiva('informes')} className="btn-nav" style={{ backgroundColor: seccionActiva === 'informes' ? '#8e44ad' : '#ecf0f1', color: seccionActiva === 'informes' ? 'white' : '#7f8c8d' }}>🖨️ Partes</button>
          {usuarioActual?.rol === 'ADMIN' && (
            <button onClick={() => setSeccionActiva('usuarios')} className="btn-nav" style={{ backgroundColor: seccionActiva === 'usuarios' ? '#9b59b6' : '#ecf0f1', color: seccionActiva === 'usuarios' ? 'white' : '#7f8c8d' }}>⚙️ Usuarios</button>
          )}
          <button onClick={handleLogout} className="btn-nav btn-logout-header" style={{ backgroundColor: '#ffebeb', color: '#c0392b', border: '1px solid #ffcccc' }}>🔒 Salir</button>
        </div>
      </div>

      <div className="card print-container">
        
        {/* ================= 1. OBRAS ================= */}
        {seccionActiva === 'obras' && (
          <section className="no-print">
            <h2 style={{ color: '#2c3e50', borderBottom: '2px solid #eee', paddingBottom: '10px', marginBottom: '20px' }}>📋 Gestión de Obras</h2>
            <form onSubmit={guardarObra} className="form-grid">
              <input className="input-standard" placeholder="Cliente" value={cliente} onChange={e=>setCliente(e.target.value)} required />
              <input className="input-standard" placeholder="Nombre Obra" value={nombreObra} onChange={e=>setNombreObra(e.target.value)} required />
              <input className="input-standard" type="date" value={fechaInicio} onChange={e=>setFechaInicio(e.target.value)} required />
              <button type="submit" className="btn-action full-width-mobile" style={{backgroundColor: '#3498db'}}>Añadir Obra</button>
            </form>
            <div style={{ overflowX: 'auto' }}>
              <table className="tabla-general">
                <thead><tr style={{background: '#3498db'}}><th>ID</th><th>Cliente</th><th>Obra</th><th>Inicio</th><th>Estado</th><th>Informes</th></tr></thead>
                <tbody>
                  {obras.map(o => (
                    <tr key={o.id} style={{ opacity: o.finalizada ? 0.6 : 1, backgroundColor: o.finalizada ? '#fdfdfd' : 'white', transition: '0.3s' }}>
                      <td>{o.id}</td>
                      <td>{o.cliente}</td>
                      <td style={{ textDecoration: o.finalizada ? 'line-through' : 'none' }}><strong>{o.nombreObra}</strong></td>
                      <td>{o.fechaInicio}</td>
                      <td>
                        <label className="switch-container">
                          <input 
                            type="checkbox" 
                            className="switch-input"
                            checked={o.finalizada || false} 
                            onChange={() => toggleEstadoObra(o.id, o.finalizada)} 
                          />
                          <span style={{ fontSize: '13px', fontWeight: 'bold', color: o.finalizada ? '#2ecc71' : '#e74c3c' }}>
                            {o.finalizada ? 'Acabada' : 'En Curso'}
                          </span>
                        </label>
                      </td>
                      <td>
                        <button onClick={() => exportarObraExcel(o.id)} className="btn-excel" title="Descargar datos de la obra en Excel">
                          📥 Exportar a Excel
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* ================= 2. TRABAJADORES ================= */}
        {seccionActiva === 'trabajadores' && (
          <section className="no-print">
            <h2 style={{ color: '#2c3e50', borderBottom: '2px solid #eee', paddingBottom: '10px', marginBottom: '20px' }}>👷 Plantilla de Personal</h2>
            <form onSubmit={guardarTrabajador} className="form-grid">
              <input className="input-standard" placeholder="Nombre Completo" value={nombreTrabajador} onChange={e=>setNombreTrabajador(e.target.value)} required />
              <input className="input-standard" placeholder="DNI" value={dni} onChange={e=>setDni(e.target.value)} />
              <input className="input-standard" placeholder="Teléfono" value={telefono} onChange={e=>setTelefono(e.target.value)} />
              <button type="submit" className="btn-action full-width-mobile" style={{backgroundColor: '#2ecc71'}}>Añadir Trabajador</button>
            </form>
            <div style={{ overflowX: 'auto' }}>
              <table className="tabla-general">
                <thead>
                  <tr style={{background: '#2ecc71'}}>
                    <th>ID</th><th>Nombre</th><th>DNI</th><th>Teléfono</th><th>Estado</th><th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {trabajadores.map(t => (
                    <tr key={t.id}>
                      <td>{t.id}</td>
                      <td><strong>{t.nombre}</strong></td>
                      <td>{t.dni}</td>
                      <td>{t.telefono}</td>
                      <td>{t.estado}</td>
                      <td>
                        <button onClick={() => eliminarTrabajador(t.id)} className="btn-delete">
                          🗑️ Borrar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* ================= 3. ASISTENCIAS ================= */}
        {seccionActiva === 'asistencias' && (
          <section className="no-print">
            
            <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '15px', alignItems: 'flex-end', borderBottom: '2px solid #eee', paddingBottom: '10px', marginBottom: '20px' }}>
              <h2 style={{ color: '#2c3e50', margin: 0 }}>🕒 Registro de Horas</h2>
              
              <div className="filtro-container">
                <label style={{ fontWeight: 'bold', color: '#7f8c8d', fontSize: '14px' }}>Filtrar por Trabajador:</label>
                <select 
                  className="input-standard" 
                  style={{ width: '300px', backgroundColor: '#fff9c4', borderColor: '#fbc02d', fontWeight: 'bold' }}
                  value={filtroTrabajadorAsis} 
                  onChange={e => setFiltroTrabajadorAsis(e.target.value)}
                >
                  <option value="">-- Todos los Trabajadores --</option>
                  {trabajadores.map(t => <option key={t.id} value={t.id}>{t.nombre}</option>)}
                </select>
              </div>
            </div>

            {filtroTrabajadorAsis && (
              <div style={{ backgroundColor: '#fff3cd', color: '#856404', padding: '15px', borderRadius: '8px', marginBottom: '20px', fontWeight: 'bold', border: '1px solid #ffeeba', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Total horas de {getNombreTrabajador(parseInt(filtroTrabajadorAsis))}:</span>
                <span style={{ fontSize: '20px' }}>{totalHorasFiltradas} h</span>
              </div>
            )}

            <form onSubmit={guardarAsistencia} className="form-grid">
              <input className="input-standard" type="date" value={fechaAsistencia} onChange={e=>setFechaAsistencia(e.target.value)} required />
              <select className="input-standard" value={idTrabajadorSel} onChange={e=>setIdTrabajadorSel(e.target.value)} required><option value="">-- Trabajador --</option>{trabajadores.map(t=><option key={t.id} value={t.id}>{t.nombre}</option>)}</select>
              <select className="input-standard" value={idObraSelAsis} onChange={e=>setIdObraSelAsis(e.target.value)} required><option value="">-- Obra --</option>{obras.map(o=><option key={o.id} value={o.id}>{o.nombreObra}</option>)}</select>
              <div style={{display:'flex', gap:'10px', width: '100%'}}>
                <input className="input-standard" style={{flex: 1}} type="number" step="0.5" placeholder="Horas" value={horas} onChange={e=>setHoras(e.target.value)} required />
                <button type="submit" className="btn-action" style={{backgroundColor: '#f39c12', flex: 1}}>Registrar</button>
              </div>
            </form>
            <div style={{ overflowX: 'auto' }}>
              <table className="tabla-general">
                <thead><tr style={{background: '#f39c12'}}><th>Fecha</th><th>Trabajador</th><th>Obra</th><th>Horas</th></tr></thead>
                <tbody>
                  {asistenciasFiltradas.length === 0 ? (
                    <tr><td colSpan="4" style={{textAlign:'center', color:'#95a5a6'}}>No hay horas registradas para esta selección.</td></tr>
                  ) : (
                    asistenciasFiltradas.map(a => (
                      <tr key={a.id}>
                        <td>{a.fecha}</td>
                        <td><strong>{getNombreTrabajador(a.idTrabajador)}</strong></td>
                        <td>{getNombreObra(a.idObra)}</td>
                        <td style={{ fontWeight: 'bold' }}>{a.horasTrabajadas} h</td>
                      </tr>
                    ))
                  )}
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
                <select 
                  className="input-standard" 
                  style={{ width: '300px', backgroundColor: '#e1f5fe', borderColor: '#81d4fa', fontWeight: 'bold' }}
                  value={filtroObraGastos} 
                  onChange={e => setFiltroObraGastos(e.target.value)}
                >
                  <option value="">-- Todas las Obras (Global) --</option>
                  {obras.map(o => <option key={o.id} value={o.id}>{o.nombreObra} - {o.cliente}</option>)}
                </select>
              </div>
            </div>
            
            <div className="tarjetas-resultados" style={{marginBottom: '25px'}}>
              <div style={{ background: 'white', padding: '20px', borderRadius: '10px', border: '1px solid #eee', borderLeft: '5px solid #e74c3c' }}><p style={{margin:0, color:'#7f8c8d', fontSize:'12px', fontWeight:'bold'}}>GASTOS (NETO)</p><h3 style={{margin:'5px 0 0 0', fontSize:'24px', color:'#e74c3c'}}>{totalGastosNeto.toFixed(2)} €</h3></div>
              <div style={{ background: 'white', padding: '20px', borderRadius: '10px', border: '1px solid #eee', borderLeft: '5px solid #3498db' }}><p style={{margin:0, color:'#7f8c8d', fontSize:'12px', fontWeight:'bold'}}>INGRESOS (PVP)</p><h3 style={{margin:'5px 0 0 0', fontSize:'24px', color:'#3498db'}}>{totalFacturadoPvp.toFixed(2)} €</h3></div>
              <div style={{ background: 'white', padding: '20px', borderRadius: '10px', border: '1px solid #eee', borderLeft: '5px solid #2ecc71', backgroundColor: beneficioTotal >= 0 ? '#f0fff4' : '#fff5f5' }}><p style={{margin:0, color:'#7f8c8d', fontSize:'12px', fontWeight:'bold'}}>BENEFICIO BRUTO</p><h3 style={{margin:'5px 0 0 0', fontSize:'24px', color: beneficioTotal >= 0 ? '#2ecc71' : '#e74c3c'}}>{beneficioTotal.toFixed(2)} €</h3></div>
            </div>

            <form onSubmit={guardarGasto} className="form-grid">
              <select className="input-standard" value={idObraSelGasto} onChange={e=>setIdObraSelGasto(e.target.value)} required><option value="">-- Obra a facturar --</option>{obras.map(o=><option key={o.id} value={o.id}>{o.nombreObra}</option>)}</select>
              <select className="input-standard" value={categoria} onChange={e=>setCategoria(e.target.value)} required><option value="">-- Categoría --</option><option value="Materiales">Materiales</option><option value="Mano de Obra">Mano de Obra</option><option value="Varios">Varios</option></select>
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

        {/* ================= 5. INFORMES ================= */}
        {seccionActiva === 'informes' && (
          <section>
            <div className="no-print" style={{ marginBottom: '20px', paddingBottom: '20px', borderBottom: '2px solid #eee', display: 'flex', gap: '15px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
              <div className="filtro-container">
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '5px', color: '#7f8c8d' }}>Trabajador:</label>
                <select className="input-standard" value={trabajadorFiltro} onChange={e => setTrabajadorFiltro(e.target.value)}>
                  <option value="">-- Elige un trabajador --</option>
                  {trabajadores.map(t => <option key={t.id} value={t.id}>{t.nombre}</option>)}
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
              <div style={{ marginTop: '10px', overflowX: 'auto' }}>
                <h3 style={{ textAlign: 'center', fontSize: '18px', margin: '0 0 15px 0', textTransform: 'uppercase' }}>
                  PARTE DE TRABAJO - {getNombreTrabajador(parseInt(trabajadorFiltro))} ({mesFiltro})
                </h3>
                
                <table className="tabla-papel" style={{ width: '100%', borderCollapse: 'collapse', border: '2px solid black', textAlign: 'center', minWidth: '700px' }}>
                  <thead>
                    <tr style={{ background: '#f0f0f0' }}>
                      <th style={{ border: '1px solid black', padding: '6px', width: '3%' }}>Día</th>
                      <th style={{ border: '1px solid black', padding: '6px', width: '6%' }}>Mes</th>
                      <th style={{ border: '1px solid black', padding: '6px', width: '9%' }}>Día Sem.</th>
                      <th style={{ border: '1px solid black', padding: '6px', width: '5%' }}>Asist.</th>
                      <th style={{ border: '1px solid black', padding: '6px', width: '10%' }}>Horario</th>
                      <th style={{ border: '1px solid black', padding: '6px', width: '25%' }}>Obra</th>
                      <th style={{ border: '1px solid black', padding: '6px', width: '5%' }}>Horas</th>
                      <th style={{ border: '1px solid black', padding: '6px', width: '12%' }}>Partida</th>
                      <th style={{ border: '1px solid black', padding: '6px', width: '25%' }}>Descripción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cuadrante.map((diaInfo, index) => {
                      const claseFila = diaInfo.esFinde ? "fondo-amarillo" : "";

                      return (
                        <tr key={index} className={claseFila} style={{ backgroundColor: diaInfo.esFinde ? '#fff200' : 'transparent', borderBottom: '1px solid black' }}>
                          <td style={{ border: '1px solid black' }}>{diaInfo.nDia}</td>
                          <td style={{ border: '1px solid black' }}>{diaInfo.nMes}</td>
                          <td style={{ border: '1px solid black' }}>{diaInfo.nSem}</td>
                          
                          <td style={{ border: '1px solid black' }}>
                            <input className="input-paper" style={{textAlign: 'center'}} value={diaInfo.asistencia} onChange={e => handleEditCuadrante(index, 'asistencia', e.target.value)} />
                          </td>
                          <td style={{ border: '1px solid black' }}>
                            <input className="input-paper" style={{textAlign: 'center'}} placeholder="ej: 7 a 19:00" value={diaInfo.horario} onChange={e => handleEditCuadrante(index, 'horario', e.target.value)} />
                          </td>
                          <td style={{ border: '1px solid black', textAlign: 'left' }}>
                            <select className="input-paper" value={diaInfo.idObra} onChange={e => handleEditCuadrante(index, 'idObra', e.target.value)}>
                              <option value=""></option>
                              {obras.map(o => <option key={o.id} value={o.id}>{o.nombreObra}</option>)}
                            </select>
                          </td>
                          <td style={{ border: '1px solid black' }}>
                            <input className="input-paper" style={{textAlign: 'center'}} type="number" step="0.5" value={diaInfo.horas} onChange={e => handleEditCuadrante(index, 'horas', e.target.value)} />
                          </td>
                          <td style={{ border: '1px solid black' }}>
                            <input className="input-paper" value={diaInfo.partida} onChange={e => handleEditCuadrante(index, 'partida', e.target.value)} />
                          </td>
                          <td style={{ border: '1px solid black' }}>
                            <input className="input-paper" value={diaInfo.descripcionExtra} onChange={e => handleEditCuadrante(index, 'descripcionExtra', e.target.value)} />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '60px 20px', color: '#95a5a6', border: '2px dashed #ecf0f1', borderRadius: '10px' }}>
                <h3>👆 Selecciona un trabajador y un mes para cargar la hoja de cálculo.</h3>
              </div>
            )}
          </section>
        )}

        {/* ================= 6. GESTIÓN DE USUARIOS (ADMIN ONLY) ================= */}
        {seccionActiva === 'usuarios' && usuarioActual?.rol === 'ADMIN' && (
          <section className="no-print">
            <h2 style={{ color: '#2c3e50', borderBottom: '2px solid #eee', paddingBottom: '10px', marginBottom: '20px' }}>⚙️ Gestión de Usuarios (Administrador)</h2>
            <form onSubmit={guardarUsuario} className="form-grid">
              <input className="input-standard" placeholder="Nombre completo" value={nombreNuevo} onChange={e=>setNombreNuevo(e.target.value)} required />
              <input className="input-standard" placeholder="Usuario (Ej: juan123)" value={usernameNuevo} onChange={e=>setUsernameNuevo(e.target.value)} required />
              <input className="input-standard" type="password" placeholder="Contraseña" value={passwordNuevo} onChange={e=>setPasswordNuevo(e.target.value)} required />
              <select className="input-standard" value={rolNuevo} onChange={e=>setRolNuevo(e.target.value)} required>
                <option value="USER">Usuario Estándar (USER)</option>
                <option value="ADMIN">Administrador (ADMIN)</option>
              </select>
              <button type="submit" className="btn-action full-width-mobile" style={{backgroundColor: '#9b59b6', gridColumn: '1 / -1'}}>Crear Nuevo Usuario</button>
            </form>
            <div style={{ overflowX: 'auto' }}>
              <table className="tabla-general">
                <thead>
                  <tr style={{background: '#9b59b6'}}>
                    <th>ID</th><th>Nombre</th><th>Usuario</th><th>Rol</th><th>Contraseña</th><th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {usuarios.map(u => (
                    <tr key={u.id}>
                      <td>{u.id}</td>
                      <td><strong>{u.nombre}</strong></td>
                      <td><code>{u.username}</code></td>
                      <td>
                        <span style={{ 
                          padding: '4px 8px', 
                          borderRadius: '12px', 
                          fontSize: '11px', 
                          fontWeight: 'bold', 
                          color: 'white',
                          backgroundColor: u.rol === 'ADMIN' ? '#e74c3c' : '#3498db'
                        }}>
                          {u.rol}
                        </span>
                      </td>
                      <td><span style={{fontFamily:'monospace', color:'#888'}}>••••••••</span></td>
                      <td>
                        {u.username === usuarioActual.username ? (
                          <span style={{fontSize:'12px', color:'#7f8c8d', fontStyle:'italic'}}>Sesión Activa</span>
                        ) : (
                          <button onClick={() => eliminarUsuario(u.id)} className="btn-delete">
                            🗑️ Borrar
                          </button>
                        )}
                      </td>
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