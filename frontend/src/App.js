import React, { useState, useEffect, useCallback } from 'react';
import './App.css';

const API_URL = process.env.REACT_APP_BACKEND_URL || '';

// Styles
const styles = {
  black: '#000000',
  white: '#FFFFFF',
  gray100: '#F6F6F6',
  gray200: '#EEEEEE',
  gray300: '#E2E2E2',
  gray400: '#CACACA',
  gray500: '#A0A0A0',
  gray600: '#6B6B6B',
  gray700: '#545454',
  gray800: '#333333',
  gray900: '#1A1A1A',
  green: '#09AA5B',
  red: '#E11900',
  blue: '#0066CC',
  blueLight: '#E6F2FF',
};

// Table styles - reduced height
const rowStyle = { padding: '6px 10px', fontSize: '0.8rem' };
const headerStyle = {
  background: styles.black,
  color: styles.white,
  padding: '8px 10px',
  textAlign: 'left',
  fontWeight: 600,
  fontSize: '0.7rem',
  textTransform: 'uppercase'
};

// Login Component
function Login({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username || !password) {
      setError('Complete todos los campos');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      const res = await fetch(`${API_URL}/api/sms/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      
      const data = await res.json();
      
      if (res.ok && data.token) {
        localStorage.setItem('sms_token', data.token);
        localStorage.setItem('sms_user', JSON.stringify(data.user));
        onLogin(data.user, data.token);
      } else {
        setError(data.detail || data.error || 'Credenciales incorrectas');
      }
    } catch (err) {
      console.error(err);
      setError('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: styles.black,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 20
    }}>
      <div style={{
        background: styles.white,
        borderRadius: 16,
        padding: '48px 40px',
        maxWidth: 420,
        width: '100%',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
      }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{
            width: 64,
            height: 64,
            background: styles.black,
            borderRadius: 16,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px'
          }}>
            <span style={{ fontSize: 28, color: styles.white }}>📊</span>
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: styles.black }}>SMS</div>
          <div style={{ fontSize: '0.85rem', color: styles.gray600, marginTop: 8 }}>Sistema de Monitoreo Sectorial</div>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: styles.gray600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>Usuario</label>
            <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Ingrese su usuario"
              style={{ width: '100%', padding: 14, fontSize: '1rem', border: `2px solid ${styles.gray300}`, borderRadius: 8, outline: 'none', boxSizing: 'border-box' }} />
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: styles.gray600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>Contraseña</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Ingrese su contraseña"
              style={{ width: '100%', padding: 14, fontSize: '1rem', border: `2px solid ${styles.gray300}`, borderRadius: 8, outline: 'none', boxSizing: 'border-box' }} />
          </div>

          <button type="submit" disabled={loading}
            style={{ width: '100%', padding: 14, fontSize: '1rem', fontWeight: 600, background: styles.black, color: styles.white, border: 'none', borderRadius: 8, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.6 : 1, marginTop: 8 }}>
            {loading ? 'Ingresando...' : 'Iniciar Sesión'}
          </button>

          {error && (
            <div style={{ background: '#FEE2E2', color: styles.red, padding: '12px 16px', borderRadius: 8, marginTop: 20, display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.9rem' }}>
              <span>⚠️</span> {error}
            </div>
          )}
        </form>

        <div style={{ textAlign: 'center', marginTop: 32, fontSize: '0.8rem', color: styles.gray500 }}>
          MMAYA © 2025 - Todos los derechos reservados
        </div>
      </div>
    </div>
  );
}

// Sidebar Component with Accordion - Filtered by role options
function Sidebar({ user, menuItems, activeView, setActiveView, collapsed }) {
  const [expandedGroups, setExpandedGroups] = useState({});

  const getIcon = (name) => {
    const icons = {
      'CONFIGURACION': '⚙️', 'PARAMETRICAS': '📋', 'OPERACIONES': '📈',
      'Usuarios': '👥', 'Roles': '🔐', 'Rol': '🔐', 'Menu': '☰',
      'Sector': '🏭', 'Entidad': '🏛️', 'Pilar': '🏛️', 'Eje': '↔️',
      'Meta': '🎯', 'Resultado': '📊', 'Acción': '⚡',
      'Banco de Indicadores': '💾', 'Rendición de Cuentas': '📑', 'Seguimiento': '📑'
    };
    return icons[name] || '📄';
  };

  const toggleGroup = (groupId) => {
    setExpandedGroups(prev => ({ ...prev, [groupId]: !prev[groupId] }));
  };

  // Filter only ACTIVE options from menuItems
  const activeMenuItems = menuItems.filter(item => item.estado === 'ACTIVO');
  
  // Group items by parent
  const groups = {};
  const separators = [];
  
  activeMenuItems.forEach(item => {
    if (item.tipo_opcion === 'separador') {
      separators.push(item);
      groups[item.id_menu] = [];
    }
  });
  
  activeMenuItems.forEach(item => {
    if (item.tipo_opcion === 'opcion' && item.id_padre && groups[item.id_padre] !== undefined) {
      groups[item.id_padre].push(item);
    }
  });

  // Filter separators that have at least one active option
  const visibleSeparators = separators.filter(sep => groups[sep.id_menu]?.length > 0);

  return (
    <div style={{
      width: collapsed ? 60 : 260,
      minHeight: '100vh',
      background: styles.black,
      position: 'fixed',
      left: 0,
      top: 0,
      transition: 'width 0.3s ease',
      zIndex: 1000,
      overflowY: 'auto',
      overflowX: 'hidden'
    }}>
      {/* Logo */}
      <div style={{ padding: '16px 14px', borderBottom: `1px solid ${styles.gray800}`, display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 32, height: 32, background: styles.white, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <span style={{ fontSize: 16 }}>📊</span>
        </div>
        {!collapsed && (
          <div>
            <div style={{ color: styles.white, fontWeight: 600, fontSize: '0.8rem' }}>SMS</div>
            <div style={{ color: styles.gray500, fontSize: '0.6rem' }}>Monitoreo Sectorial</div>
          </div>
        )}
      </div>

      {/* Home Button */}
      <div onClick={() => setActiveView('home')}
        style={{ padding: '8px 14px', color: activeView === 'home' ? styles.white : styles.gray400, background: activeView === 'home' ? styles.gray800 : 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.8rem' }}>
        <span>🏠</span>
        {!collapsed && <span>Inicio</span>}
      </div>

      {/* Menu Groups - Accordion Style - Only show groups with active options */}
      {visibleSeparators.map(sep => (
        <div key={sep.id_menu}>
          <div onClick={() => toggleGroup(sep.id_menu)}
            style={{ padding: '8px 14px', background: styles.gray900, color: styles.white, fontWeight: 600, fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.5px', marginTop: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', userSelect: 'none' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span>{getIcon(sep.opcion)}</span>
              {!collapsed && <span>{sep.opcion}</span>}
            </div>
            {!collapsed && (
              <span style={{ fontSize: '0.55rem', transition: 'transform 0.2s', transform: expandedGroups[sep.id_menu] ? 'rotate(180deg)' : 'rotate(0deg)' }}>▼</span>
            )}
          </div>
          
          {!collapsed && expandedGroups[sep.id_menu] && groups[sep.id_menu]?.map(item => (
            <div key={item.id_menu} onClick={() => item.enlace && setActiveView(item.enlace)}
              style={{ padding: '6px 14px 6px 40px', color: activeView === item.enlace ? styles.white : styles.gray400, background: activeView === item.enlace ? styles.gray800 : 'transparent', cursor: 'pointer', fontSize: '0.75rem', transition: 'all 0.15s ease' }}>
              {item.opcion}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

// Generic CRUD Table Component
function CrudTable({ title, endpoint, columns, formFields, idField = 'id' }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [formData, setFormData] = useState({});

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/api/sms/${endpoint}`);
      const json = await res.json();
      setData(json);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, [endpoint]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const openModal = (item = null) => {
    if (item) { setEditItem(item); setFormData({ ...item }); }
    else { setEditItem(null); setFormData({ estado: 'ACTIVO' }); }
    setShowModal(true);
  };

  const saveItem = async () => {
    try {
      const method = editItem ? 'PUT' : 'POST';
      const url = editItem ? `${API_URL}/api/sms/${endpoint}/${editItem[idField]}` : `${API_URL}/api/sms/${endpoint}`;
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formData) });
      if (res.ok) { setShowModal(false); fetchData(); }
      else { const err = await res.json(); alert(err.detail || 'Error al guardar'); }
    } catch (err) { console.error(err); alert('Error de conexión'); }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <h2 style={{ fontWeight: 700, fontSize: '1.2rem' }}>{title}</h2>
        <button onClick={() => openModal()} style={{ padding: '8px 16px', background: styles.black, color: styles.white, border: 'none', borderRadius: 5, fontWeight: 600, cursor: 'pointer', fontSize: '0.8rem' }}>+ Adicionar</button>
      </div>

      {loading ? <div style={{ textAlign: 'center', padding: 24 }}>Cargando...</div> : (
        <div style={{ background: styles.white, borderRadius: 6, overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {columns.map(col => <th key={col.key} style={headerStyle}>{col.label}</th>)}
                <th style={{ ...headerStyle, textAlign: 'center' }}>Operación</th>
              </tr>
            </thead>
            <tbody>
              {data.map((item, idx) => (
                <tr key={item[idField] || idx} style={{ borderBottom: `1px solid ${styles.gray200}` }}>
                  {columns.map(col => (
                    <td key={col.key} style={rowStyle}>
                      {col.key === 'estado' ? (
                        <span style={{ padding: '2px 8px', borderRadius: 10, fontSize: '0.65rem', fontWeight: 600, background: item[col.key] === 'ACTIVO' ? '#D1FAE5' : '#FEE2E2', color: item[col.key] === 'ACTIVO' ? styles.green : styles.red }}>{item[col.key]}</span>
                      ) : item[col.key]}
                    </td>
                  ))}
                  <td style={{ ...rowStyle, textAlign: 'center' }}>
                    <button onClick={() => openModal(item)} style={{ padding: '3px 10px', background: styles.gray100, border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: '0.75rem' }}>✏️</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}>
          <div style={{ background: styles.white, borderRadius: 10, padding: 18, maxWidth: 420, width: '90%' }}>
            <h3 style={{ marginBottom: 14, fontWeight: 700, fontSize: '1rem' }}>{editItem ? 'Editar' : 'Nuevo'} {title}</h3>
            {formFields.map(field => (
              <div key={field.key} style={{ marginBottom: 10 }}>
                <label style={{ display: 'block', marginBottom: 4, fontWeight: 600, fontSize: '0.75rem', color: styles.gray700 }}>{field.label}</label>
                {field.type === 'select' ? (
                  <select value={formData[field.key] || ''} onChange={(e) => setFormData({ ...formData, [field.key]: e.target.value })}
                    style={{ width: '100%', padding: 8, border: `2px solid ${styles.gray300}`, borderRadius: 5, fontSize: '0.8rem' }}>
                    {field.options.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                  </select>
                ) : field.type === 'textarea' ? (
                  <textarea value={formData[field.key] || ''} onChange={(e) => setFormData({ ...formData, [field.key]: e.target.value })} rows={2}
                    style={{ width: '100%', padding: 8, border: `2px solid ${styles.gray300}`, borderRadius: 5, fontSize: '0.8rem', resize: 'vertical' }} />
                ) : (
                  <input type={field.type || 'text'} value={formData[field.key] || ''} onChange={(e) => setFormData({ ...formData, [field.key]: e.target.value })}
                    style={{ width: '100%', padding: 8, border: `2px solid ${styles.gray300}`, borderRadius: 5, fontSize: '0.8rem', boxSizing: 'border-box' }} />
                )}
              </div>
            ))}
            <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
              <button onClick={() => setShowModal(false)} style={{ flex: 1, padding: 8, border: `2px solid ${styles.black}`, background: 'transparent', borderRadius: 5, fontWeight: 600, cursor: 'pointer', fontSize: '0.8rem' }}>Cancelar</button>
              <button onClick={saveItem} style={{ flex: 1, padding: 8, background: styles.black, color: styles.white, border: 'none', borderRadius: 5, fontWeight: 600, cursor: 'pointer', fontSize: '0.8rem' }}>Guardar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Seguimiento View - Complete Implementation
function SeguimientoView({ user }) {
  const [indicadores, setIndicadores] = useState([]);
  const [selectedIndicador, setSelectedIndicador] = useState(null);
  const [gestion, setGestion] = useState(new Date().getFullYear());
  const [mes, setMes] = useState('ENERO');
  const [rendicion, setRendicion] = useState({});
  const [loading, setLoading] = useState(true);
  const [contexto, setContexto] = useState({});
  const [archivos, setArchivos] = useState([]);

  const meses = ['ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO', 'JULIO', 'AGOSTO', 'SEPTIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE'];
  const mesesCortos = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'];

  useEffect(() => {
    const loadData = async () => {
      try {
        // Load context (area, entidad, sector)
        if (user?.id_area) {
          const ctxRes = await fetch(`${API_URL}/api/sms/contexto_usuario/${user.id_area}`);
          if (ctxRes.ok) setContexto(await ctxRes.json());
        }
        
        // Load indicators for user's area
        const endpoint = user?.id_area 
          ? `${API_URL}/api/sms/indicadores/area/${user.id_area}`
          : `${API_URL}/api/sms/matriz_parametros`;
        const indRes = await fetch(endpoint);
        const indData = await indRes.json();
        setIndicadores(indData);
        if (indData.length > 0) setSelectedIndicador(indData[0]);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    loadData();
  }, [user]);

  useEffect(() => {
    if (selectedIndicador) {
      fetch(`${API_URL}/api/sms/rendicion/${selectedIndicador.id_indicador}/${gestion}`)
        .then(r => r.json())
        .then(data => setRendicion(data || {}))
        .catch(console.error);
    }
  }, [selectedIndicador, gestion]);

  const handleRendicionChange = (field, value) => {
    setRendicion(prev => ({ ...prev, [field]: value }));
  };

  const saveRendicion = async () => {
    if (!selectedIndicador) return;
    try {
      const res = await fetch(`${API_URL}/api/sms/rendicion`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id_indicador: selectedIndicador.id_indicador,
          gestion,
          ...rendicion
        })
      });
      if (res.ok) {
        alert('Rendición guardada exitosamente');
      }
    } catch (e) {
      console.error(e);
      alert('Error al guardar');
    }
  };

  if (loading) return <div style={{ textAlign: 'center', padding: 40 }}>Cargando...</div>;

  const blueHeader = { background: '#0077B6', color: 'white', padding: '8px 12px', fontSize: '0.75rem', fontWeight: 600, textAlign: 'center' };
  const blueCell = { background: '#E6F4F1', padding: '6px 10px', fontSize: '0.8rem', borderBottom: '1px solid #ccc' };
  const inputStyle = { width: '100%', padding: '4px', fontSize: '0.75rem', border: '1px solid #ccc', borderRadius: 3, boxSizing: 'border-box' };

  return (
    <div>
      <h2 style={{ fontWeight: 700, fontSize: '1.2rem', marginBottom: 16 }}>SEGUIMIENTO</h2>
      
      {/* Header Row */}
      <div style={{ background: styles.white, borderRadius: 6, overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', marginBottom: 16 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={blueHeader}>ENTIDAD</th>
              <th style={blueHeader}>AREA</th>
              <th style={blueHeader}>SECTOR</th>
              <th style={blueHeader}>AÑO</th>
              <th style={blueHeader}>MES</th>
              <th style={blueHeader}>ESTADO</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={blueCell}>{contexto.entidad || user?.nombre_area || '-'}</td>
              <td style={blueCell}>{contexto.area || '-'}</td>
              <td style={blueCell}>{contexto.sector || '-'}</td>
              <td style={blueCell}>
                <select value={gestion} onChange={(e) => setGestion(parseInt(e.target.value))} style={{ ...inputStyle, textAlign: 'center' }}>
                  {[2023, 2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </td>
              <td style={blueCell}>
                <select value={mes} onChange={(e) => setMes(e.target.value)} style={inputStyle}>
                  {meses.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </td>
              <td style={blueCell}>
                <span style={{ padding: '3px 10px', borderRadius: 10, fontSize: '0.7rem', fontWeight: 600, background: '#D1FAE5', color: styles.green }}>ABIERTO</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Indicator Selection */}
      <div style={{ background: styles.white, borderRadius: 6, overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', marginBottom: 16 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ ...blueHeader, textAlign: 'left' }} colSpan={3}>DESCRIPCIÓN DEL INDICADOR</th>
              <th style={blueHeader}>AÑO BASE</th>
              <th style={blueHeader}>LINEA BASE</th>
              <th style={blueHeader}>LOGRO PROGRAMADO</th>
              <th style={blueHeader}>OPERACION</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={blueCell} colSpan={3}>
                <select 
                  value={selectedIndicador?.id_indicador || ''} 
                  onChange={(e) => {
                    const ind = indicadores.find(i => i.id_indicador === parseInt(e.target.value));
                    setSelectedIndicador(ind);
                  }}
                  style={{ ...inputStyle, width: '100%' }}
                >
                  {indicadores.map(ind => (
                    <option key={ind.id_indicador} value={ind.id_indicador}>
                      {ind.codi} - {ind.indicador_resultado?.substring(0, 80)}...
                    </option>
                  ))}
                </select>
              </td>
              <td style={{ ...blueCell, textAlign: 'center' }}>{selectedIndicador?.anio_base || '-'}</td>
              <td style={{ ...blueCell, textAlign: 'center' }}>{selectedIndicador?.linea_base || '-'}</td>
              <td style={{ ...blueCell, textAlign: 'center' }}>{selectedIndicador?.logro || '-'}</td>
              <td style={{ ...blueCell, textAlign: 'center' }}>
                <button style={{ padding: '4px 8px', background: styles.gray100, border: 'none', borderRadius: 4, cursor: 'pointer', marginRight: 4 }}>🔍</button>
                <button onClick={saveRendicion} style={{ padding: '4px 8px', background: styles.green, color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' }}>💾</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Monthly Tracking Table */}
      <div style={{ background: styles.white, borderRadius: 6, overflow: 'auto', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', marginBottom: 16 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 900 }}>
          <thead>
            <tr>
              <th style={blueHeader}>#</th>
              {mesesCortos.map(m => <th key={m} style={blueHeader}>{m}</th>)}
              <th style={{ ...blueHeader, background: styles.red }}>LOGRADO PERIODO</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{ ...blueCell, fontWeight: 600, background: '#0077B6', color: 'white' }}>EJECUCIÓN</td>
              {mesesCortos.map((m, idx) => (
                <td key={m} style={blueCell}>
                  <input 
                    type="number" 
                    value={rendicion[`ejecutado_${m.toLowerCase()}`] || ''} 
                    onChange={(e) => handleRendicionChange(`ejecutado_${m.toLowerCase()}`, e.target.value)}
                    style={{ ...inputStyle, textAlign: 'center' }} 
                  />
                </td>
              ))}
              <td style={{ ...blueCell, background: '#FFCDD2', textAlign: 'center', fontWeight: 600 }}>
                {rendicion.logrado_periodo || '-'}
              </td>
            </tr>
            <tr>
              <td style={{ ...blueCell, fontWeight: 600, background: '#0077B6', color: 'white' }}>% EJEC</td>
              {mesesCortos.map((m) => (
                <td key={m} style={blueCell}>
                  <input 
                    type="number" 
                    step="0.001"
                    value={rendicion[`proc_ejecutado_${m.toLowerCase()}`] || ''} 
                    onChange={(e) => handleRendicionChange(`proc_ejecutado_${m.toLowerCase()}`, e.target.value)}
                    style={{ ...inputStyle, textAlign: 'center' }} 
                  />
                </td>
              ))}
              <td style={{ ...blueCell, background: '#FFCDD2', textAlign: 'center' }}></td>
            </tr>
            <tr>
              <td style={{ ...blueCell, fontWeight: 600, background: '#0077B6', color: 'white' }}>ACUMULADO</td>
              {mesesCortos.map((m) => (
                <td key={m} style={blueCell}>
                  <input 
                    type="number" 
                    value={rendicion[`acumulado_${m.toLowerCase()}`] || ''} 
                    onChange={(e) => handleRendicionChange(`acumulado_${m.toLowerCase()}`, e.target.value)}
                    style={{ ...inputStyle, textAlign: 'center' }} 
                  />
                </td>
              ))}
              <td style={{ ...blueCell, background: '#FFCDD2', textAlign: 'center' }}></td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Qualitative Description and Modifications */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
        <div style={{ background: styles.white, borderRadius: 6, overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
          <div style={blueHeader}>DESCRIPCION CUALITATIVA DEL AVANCE</div>
          <div style={{ padding: 12 }}>
            <textarea 
              value={rendicion.descripcion_cualitativa || ''} 
              onChange={(e) => handleRendicionChange('descripcion_cualitativa', e.target.value)}
              rows={6}
              style={{ width: '100%', padding: 8, border: `1px solid ${styles.gray300}`, borderRadius: 4, fontSize: '0.8rem', resize: 'vertical', boxSizing: 'border-box' }}
              placeholder="Ingrese la descripción cualitativa del avance..."
            />
          </div>
        </div>
        <div style={{ background: styles.white, borderRadius: 6, overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
          <div style={blueHeader}>MODIFICACIONES</div>
          <div style={{ padding: 12 }}>
            <textarea 
              value={rendicion.modificaciones || ''} 
              onChange={(e) => handleRendicionChange('modificaciones', e.target.value)}
              rows={6}
              style={{ width: '100%', padding: 8, border: `1px solid ${styles.gray300}`, borderRadius: 4, fontSize: '0.8rem', resize: 'vertical', boxSizing: 'border-box' }}
              placeholder="Ingrese las modificaciones..."
            />
          </div>
        </div>
      </div>

      {/* File Attachment Section */}
      <div style={{ background: styles.white, borderRadius: 6, overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={blueHeader}>NOMBRE DEL RESPALDO</th>
              <th style={blueHeader}>DESCRIPCION DEL ARCHIVO</th>
              <th style={blueHeader}>PESO DEL ARCHIVO</th>
              <th style={blueHeader}>OPERAC</th>
            </tr>
          </thead>
          <tbody>
            {archivos.length === 0 ? (
              <tr>
                <td colSpan={4} style={{ ...blueCell, textAlign: 'center', color: styles.gray500 }}>
                  No hay archivos adjuntos
                </td>
              </tr>
            ) : (
              archivos.map((archivo, idx) => (
                <tr key={idx}>
                  <td style={blueCell}>{archivo.nombre}</td>
                  <td style={blueCell}>{archivo.descripcion}</td>
                  <td style={{ ...blueCell, textAlign: 'center' }}>{archivo.peso || '-'}</td>
                  <td style={{ ...blueCell, textAlign: 'center' }}>
                    <button style={{ padding: '4px 8px', background: styles.red, color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' }}>🗑️</button>
                  </td>
                </tr>
              ))
            )}
            <tr>
              <td style={blueCell}>
                <input type="text" placeholder="Nombre..." style={inputStyle} />
              </td>
              <td style={blueCell}>
                <input type="file" style={{ fontSize: '0.75rem' }} />
              </td>
              <td style={{ ...blueCell, textAlign: 'center' }}>-</td>
              <td style={{ ...blueCell, textAlign: 'center' }}>
                <button style={{ padding: '4px 8px', background: styles.blue, color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' }}>📎</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Roles View with Options
function RolesView() {
  const [roles, setRoles] = useState([]);
  const [selectedRoleId, setSelectedRoleId] = useState(null);
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editRole, setEditRole] = useState(null);
  const [formData, setFormData] = useState({ rol: '', estado: 'ACTIVO' });

  useEffect(() => { fetchRoles(); }, []);

  const fetchRoles = async () => {
    try {
      const res = await fetch(`${API_URL}/api/sms/roles`);
      setRoles(await res.json());
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const fetchOptions = async (roleId) => {
    setSelectedRoleId(roleId);
    try {
      const res = await fetch(`${API_URL}/api/sms/opciones/${roleId}`);
      setOptions(await res.json());
    } catch (e) { console.error(e); }
  };

  const updateOptionState = async (idOpcion, newState) => {
    try {
      await fetch(`${API_URL}/api/sms/opciones/${idOpcion}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado: newState })
      });
      setOptions(prev => prev.map(opt => opt.id_opcion === idOpcion ? { ...opt, estado: newState } : opt));
    } catch (e) { console.error(e); }
  };

  const openModal = (role = null) => {
    if (role) { setEditRole(role); setFormData({ rol: role.rol, estado: role.estado }); }
    else { setEditRole(null); setFormData({ rol: '', estado: 'ACTIVO' }); }
    setShowModal(true);
  };

  const saveRole = async () => {
    if (!formData.rol.trim()) { alert('El nombre del rol es obligatorio'); return; }
    try {
      const method = editRole ? 'PUT' : 'POST';
      const url = editRole ? `${API_URL}/api/sms/roles/${editRole.id_rol}` : `${API_URL}/api/sms/roles`;
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formData) });
      if (res.ok) { setShowModal(false); fetchRoles(); }
      else { const err = await res.json(); alert(err.detail || 'Error al guardar'); }
    } catch (e) { console.error(e); }
  };

  if (loading) return <div style={{ textAlign: 'center', padding: 24 }}>Cargando...</div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <h2 style={{ fontWeight: 700, fontSize: '1.2rem' }}>ROLES</h2>
        <button onClick={() => openModal()} style={{ padding: '8px 16px', background: styles.black, color: styles.white, border: 'none', borderRadius: 5, fontWeight: 600, cursor: 'pointer', fontSize: '0.8rem' }}>+ Adicionar</button>
      </div>

      <div style={{ background: styles.white, borderRadius: 6, overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', marginBottom: 16 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={headerStyle}>ID ROL</th>
              <th style={headerStyle}>ROL</th>
              <th style={headerStyle}>ESTADO</th>
              <th style={{ ...headerStyle, textAlign: 'center' }}>OPERACIÓN</th>
            </tr>
          </thead>
          <tbody>
            {roles.map(role => (
              <tr key={role.id_rol} onClick={() => fetchOptions(role.id_rol)}
                style={{ borderBottom: `1px solid ${styles.gray200}`, cursor: 'pointer', background: selectedRoleId === role.id_rol ? styles.gray100 : 'transparent' }}>
                <td style={{ ...rowStyle, textAlign: 'center' }}>{role.id_rol}</td>
                <td style={rowStyle}>{role.rol}</td>
                <td style={{ ...rowStyle, textAlign: 'center' }}>
                  <span style={{ padding: '2px 8px', borderRadius: 10, fontSize: '0.65rem', fontWeight: 600, background: role.estado === 'ACTIVO' ? '#D1FAE5' : '#FEE2E2', color: role.estado === 'ACTIVO' ? styles.green : styles.red }}>{role.estado}</span>
                </td>
                <td style={{ ...rowStyle, textAlign: 'center' }}>
                  <button onClick={(e) => { e.stopPropagation(); openModal(role); }} style={{ padding: '3px 10px', background: styles.gray100, border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: '0.75rem' }}>✏️</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h4 style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: 10, color: styles.gray700 }}>ACCESO</h4>
      <div style={{ background: styles.white, borderRadius: 6, overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={headerStyle}>ID OPCIÓN</th>
              <th style={headerStyle}>OPCIÓN</th>
              <th style={{ ...headerStyle, textAlign: 'center' }}>ESTADO</th>
            </tr>
          </thead>
          <tbody>
            {options.length === 0 ? (
              <tr><td colSpan={3} style={{ ...rowStyle, textAlign: 'center', color: styles.gray500 }}>Seleccione un Rol para ver sus accesos</td></tr>
            ) : (
              options.map(opt => (
                <tr key={opt.id_opcion} style={{ borderBottom: `1px solid ${styles.gray200}` }}>
                  <td style={{ ...rowStyle, textAlign: 'center' }}>{opt.id_opcion}</td>
                  <td style={rowStyle}>{opt.opcion}</td>
                  <td style={{ ...rowStyle, textAlign: 'center' }}>
                    <select value={opt.estado} onChange={(e) => updateOptionState(opt.id_opcion, e.target.value)}
                      style={{ padding: '3px 6px', border: 'none', borderRadius: 4, background: styles.gray100, fontSize: '0.75rem', cursor: 'pointer' }}>
                      <option value="ACTIVO">ACTIVO</option>
                      <option value="INACTIVO">INACTIVO</option>
                    </select>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}>
          <div style={{ background: styles.white, borderRadius: 10, padding: 18, maxWidth: 380, width: '90%' }}>
            <h3 style={{ marginBottom: 14, fontWeight: 700, fontSize: '1rem' }}>{editRole ? 'Editar Rol' : 'Nuevo Rol'}</h3>
            <div style={{ marginBottom: 10 }}>
              <label style={{ display: 'block', marginBottom: 4, fontWeight: 600, fontSize: '0.75rem' }}>Nombre del Rol</label>
              <input type="text" value={formData.rol} onChange={(e) => setFormData({ ...formData, rol: e.target.value })}
                style={{ width: '100%', padding: 8, border: `2px solid ${styles.gray300}`, borderRadius: 5, fontSize: '0.8rem', boxSizing: 'border-box' }} />
            </div>
            <div style={{ marginBottom: 10 }}>
              <label style={{ display: 'block', marginBottom: 4, fontWeight: 600, fontSize: '0.75rem' }}>Estado</label>
              <select value={formData.estado} onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
                style={{ width: '100%', padding: 8, border: `2px solid ${styles.gray300}`, borderRadius: 5, fontSize: '0.8rem' }}>
                <option value="ACTIVO">ACTIVO</option>
                <option value="INACTIVO">INACTIVO</option>
              </select>
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
              <button onClick={() => setShowModal(false)} style={{ flex: 1, padding: 8, border: `2px solid ${styles.black}`, background: 'transparent', borderRadius: 5, fontWeight: 600, cursor: 'pointer', fontSize: '0.8rem' }}>Cancelar</button>
              <button onClick={saveRole} style={{ flex: 1, padding: 8, background: styles.black, color: styles.white, border: 'none', borderRadius: 5, fontWeight: 600, cursor: 'pointer', fontSize: '0.8rem' }}>Guardar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Menu Admin View
function MenuAdminView() {
  const [menus, setMenus] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editMenu, setEditMenu] = useState(null);
  const [formData, setFormData] = useState({});
  const [separadores, setSeparadores] = useState([]);

  useEffect(() => { fetchMenus(); }, []);

  const fetchMenus = async () => {
    try {
      const res = await fetch(`${API_URL}/api/sms/menu_admin`);
      const data = await res.json();
      setMenus(data);
      setSeparadores(data.filter(m => m.tipo_opcion === 'separador'));
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const openModal = (menu = null) => {
    if (menu) { setEditMenu(menu); setFormData({ opcion: menu.opcion, tipo_opcion: menu.tipo_opcion, enlace: menu.enlace || '', id_padre: menu.id_padre || '', estado: menu.estado }); }
    else { setEditMenu(null); setFormData({ opcion: '', tipo_opcion: 'opcion', enlace: '', id_padre: '', estado: 'ACTIVO' }); }
    setShowModal(true);
  };

  const saveMenu = async () => {
    if (!formData.opcion.trim()) { alert('El nombre de la opción es obligatorio'); return; }
    try {
      const method = editMenu ? 'PUT' : 'POST';
      const url = editMenu ? `${API_URL}/api/sms/menu/${editMenu.id_menu}` : `${API_URL}/api/sms/menu`;
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...formData, id_padre: formData.id_padre || null }) });
      if (res.ok) { setShowModal(false); fetchMenus(); }
      else { const err = await res.json(); alert(err.detail || 'Error al guardar'); }
    } catch (e) { console.error(e); }
  };

  if (loading) return <div style={{ textAlign: 'center', padding: 24 }}>Cargando...</div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <h2 style={{ fontWeight: 700, fontSize: '1.2rem' }}>GESTIÓN DE MENÚ</h2>
        <button onClick={() => openModal()} style={{ padding: '8px 16px', background: styles.black, color: styles.white, border: 'none', borderRadius: 5, fontWeight: 600, cursor: 'pointer', fontSize: '0.8rem' }}>+ Adicionar</button>
      </div>

      <div style={{ background: styles.white, borderRadius: 6, overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={headerStyle}>ID OPCIÓN</th>
              <th style={headerStyle}>OPCIONES</th>
              <th style={headerStyle}>TIPO OPCIÓN</th>
              <th style={headerStyle}>ESTADO</th>
              <th style={{ ...headerStyle, textAlign: 'center' }}>OPERACIÓN</th>
            </tr>
          </thead>
          <tbody>
            {menus.map(menu => (
              <tr key={menu.id_menu} style={{ borderBottom: `1px solid ${styles.gray200}` }}>
                <td style={{ ...rowStyle, textAlign: 'center' }}>{menu.id_menu}</td>
                <td style={rowStyle}>{menu.opcion}</td>
                <td style={{ ...rowStyle, textAlign: 'center' }}>{menu.tipo_opcion}</td>
                <td style={{ ...rowStyle, textAlign: 'center' }}>
                  <span style={{ padding: '2px 8px', borderRadius: 10, fontSize: '0.65rem', fontWeight: 600, background: menu.estado === 'ACTIVO' ? '#D1FAE5' : '#FEE2E2', color: menu.estado === 'ACTIVO' ? styles.green : styles.red }}>{menu.estado}</span>
                </td>
                <td style={{ ...rowStyle, textAlign: 'center' }}>
                  <button onClick={() => openModal(menu)} style={{ padding: '3px 10px', background: styles.gray100, border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: '0.75rem' }}>✏️</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}>
          <div style={{ background: styles.white, borderRadius: 10, padding: 18, maxWidth: 420, width: '90%' }}>
            <h3 style={{ marginBottom: 14, fontWeight: 700, fontSize: '1rem' }}>{editMenu ? 'Editar Menú' : 'Nuevo Menú'}</h3>
            <div style={{ marginBottom: 10 }}>
              <label style={{ display: 'block', marginBottom: 4, fontWeight: 600, fontSize: '0.75rem' }}>Grupo Padre</label>
              <select value={formData.id_padre || ''} onChange={(e) => setFormData({ ...formData, id_padre: e.target.value })}
                style={{ width: '100%', padding: 8, border: `2px solid ${styles.gray300}`, borderRadius: 5, fontSize: '0.8rem' }}>
                <option value="">Ninguno (Raíz)</option>
                {separadores.filter(s => s.id_menu !== editMenu?.id_menu).map(sep => <option key={sep.id_menu} value={sep.id_menu}>{sep.opcion}</option>)}
              </select>
            </div>
            <div style={{ marginBottom: 10 }}>
              <label style={{ display: 'block', marginBottom: 4, fontWeight: 600, fontSize: '0.75rem' }}>Opción</label>
              <input type="text" value={formData.opcion} onChange={(e) => setFormData({ ...formData, opcion: e.target.value })}
                style={{ width: '100%', padding: 8, border: `2px solid ${styles.gray300}`, borderRadius: 5, fontSize: '0.8rem', boxSizing: 'border-box' }} />
            </div>
            <div style={{ marginBottom: 10 }}>
              <label style={{ display: 'block', marginBottom: 4, fontWeight: 600, fontSize: '0.75rem' }}>Tipo</label>
              <select value={formData.tipo_opcion} onChange={(e) => setFormData({ ...formData, tipo_opcion: e.target.value })}
                style={{ width: '100%', padding: 8, border: `2px solid ${styles.gray300}`, borderRadius: 5, fontSize: '0.8rem' }}>
                <option value="opcion">Opción</option>
                <option value="separador">Separador</option>
              </select>
            </div>
            <div style={{ marginBottom: 10 }}>
              <label style={{ display: 'block', marginBottom: 4, fontWeight: 600, fontSize: '0.75rem' }}>Enlace JS</label>
              <input type="text" value={formData.enlace} onChange={(e) => setFormData({ ...formData, enlace: e.target.value })}
                style={{ width: '100%', padding: 8, border: `2px solid ${styles.gray300}`, borderRadius: 5, fontSize: '0.8rem', boxSizing: 'border-box' }} />
            </div>
            <div style={{ marginBottom: 10 }}>
              <label style={{ display: 'block', marginBottom: 4, fontWeight: 600, fontSize: '0.75rem' }}>Estado</label>
              <select value={formData.estado} onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
                style={{ width: '100%', padding: 8, border: `2px solid ${styles.gray300}`, borderRadius: 5, fontSize: '0.8rem' }}>
                <option value="ACTIVO">ACTIVO</option>
                <option value="INACTIVO">INACTIVO</option>
              </select>
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
              <button onClick={() => setShowModal(false)} style={{ flex: 1, padding: 8, border: `2px solid ${styles.black}`, background: 'transparent', borderRadius: 5, fontWeight: 600, cursor: 'pointer', fontSize: '0.8rem' }}>Cancelar</button>
              <button onClick={saveMenu} style={{ flex: 1, padding: 8, background: styles.black, color: styles.white, border: 'none', borderRadius: 5, fontWeight: 600, cursor: 'pointer', fontSize: '0.8rem' }}>Guardar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Usuarios View
function UsuariosView() {
  const [data, setData] = useState([]);
  const [areas, setAreas] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [formData, setFormData] = useState({});

  useEffect(() => {
    Promise.all([
      fetch(`${API_URL}/api/sms/usuarios`).then(r => r.json()),
      fetch(`${API_URL}/api/sms/areas`).then(r => r.json()),
      fetch(`${API_URL}/api/sms/roles`).then(r => r.json())
    ]).then(([usuarios, areasData, rolesData]) => { setData(usuarios); setAreas(areasData); setRoles(rolesData); })
      .catch(console.error).finally(() => setLoading(false));
  }, []);

  const openModal = (item = null) => {
    if (item) { setEditItem(item); setFormData({ ...item, clave: '' }); }
    else { setEditItem(null); setFormData({ estado: 'ACTIVO' }); }
    setShowModal(true);
  };

  const saveItem = async () => {
    if (!formData.username || !formData.nombre) { alert('Nombre y Usuario son obligatorios'); return; }
    if (!editItem && !formData.clave) { alert('Contraseña es obligatoria para nuevo usuario'); return; }
    try {
      const method = editItem ? 'PUT' : 'POST';
      const url = editItem ? `${API_URL}/api/sms/usuarios/${editItem.id_usuario}` : `${API_URL}/api/sms/usuarios`;
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formData) });
      if (res.ok) { setShowModal(false); const updated = await fetch(`${API_URL}/api/sms/usuarios`).then(r => r.json()); setData(updated); }
      else { const err = await res.json(); alert(err.detail || 'Error al guardar'); }
    } catch (err) { console.error(err); alert('Error de conexión'); }
  };

  if (loading) return <div style={{ textAlign: 'center', padding: 24 }}>Cargando...</div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <h2 style={{ fontWeight: 700, fontSize: '1.2rem' }}>Usuarios</h2>
        <button onClick={() => openModal()} style={{ padding: '8px 16px', background: styles.black, color: styles.white, border: 'none', borderRadius: 5, fontWeight: 600, cursor: 'pointer', fontSize: '0.8rem' }}>+ Adicionar</button>
      </div>

      <div style={{ background: styles.white, borderRadius: 6, overflow: 'auto', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              {['ID', 'Doc', 'Nombre', 'Usuario', 'Fecha', 'Área', 'Rol', 'Estado', 'Op'].map(h => <th key={h} style={headerStyle}>{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {data.map(item => (
              <tr key={item.id_usuario} style={{ borderBottom: `1px solid ${styles.gray200}` }}>
                <td style={{ ...rowStyle, textAlign: 'center' }}>{item.id_usuario}</td>
                <td style={rowStyle}>{item.nro_documento || '-'}</td>
                <td style={rowStyle}>{item.nombre}</td>
                <td style={rowStyle}>{item.username}</td>
                <td style={rowStyle}>{item.fecha_creacion?.split('T')[0] || '-'}</td>
                <td style={rowStyle}>{item.area || '-'}</td>
                <td style={rowStyle}>{item.rol || '-'}</td>
                <td style={{ ...rowStyle, textAlign: 'center' }}>
                  <span style={{ padding: '2px 8px', borderRadius: 10, fontSize: '0.65rem', fontWeight: 600, background: item.estado === 'ACTIVO' ? '#D1FAE5' : '#FEE2E2', color: item.estado === 'ACTIVO' ? styles.green : styles.red }}>{item.estado}</span>
                </td>
                <td style={{ ...rowStyle, textAlign: 'center' }}>
                  <button onClick={() => openModal(item)} style={{ padding: '3px 10px', background: styles.gray100, border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: '0.75rem' }}>✏️</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}>
          <div style={{ background: styles.white, borderRadius: 10, padding: 18, maxWidth: 520, width: '95%' }}>
            <h3 style={{ marginBottom: 14, fontWeight: 700, fontSize: '1rem' }}>{editItem ? 'Editar' : 'Nuevo'} Usuario</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div>
                <label style={{ display: 'block', marginBottom: 4, fontWeight: 600, fontSize: '0.75rem' }}>Nro. Documento</label>
                <input type="text" value={formData.nro_documento || ''} onChange={(e) => setFormData({ ...formData, nro_documento: e.target.value })}
                  style={{ width: '100%', padding: 8, border: `2px solid ${styles.gray300}`, borderRadius: 5, fontSize: '0.8rem', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 4, fontWeight: 600, fontSize: '0.75rem' }}>Nombre *</label>
                <input type="text" value={formData.nombre || ''} onChange={(e) => setFormData({ ...formData, nombre: e.target.value })} required
                  style={{ width: '100%', padding: 8, border: `2px solid ${styles.gray300}`, borderRadius: 5, fontSize: '0.8rem', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 4, fontWeight: 600, fontSize: '0.75rem' }}>Usuario *</label>
                <input type="text" value={formData.username || ''} onChange={(e) => setFormData({ ...formData, username: e.target.value })} required
                  style={{ width: '100%', padding: 8, border: `2px solid ${styles.gray300}`, borderRadius: 5, fontSize: '0.8rem', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 4, fontWeight: 600, fontSize: '0.75rem' }}>Contraseña {editItem ? '(vacío = mantener)' : '*'}</label>
                <input type="password" value={formData.clave || ''} onChange={(e) => setFormData({ ...formData, clave: e.target.value })}
                  style={{ width: '100%', padding: 8, border: `2px solid ${styles.gray300}`, borderRadius: 5, fontSize: '0.8rem', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 4, fontWeight: 600, fontSize: '0.75rem' }}>Área</label>
                <select value={formData.id_area || ''} onChange={(e) => setFormData({ ...formData, id_area: e.target.value ? parseInt(e.target.value) : null })}
                  style={{ width: '100%', padding: 8, border: `2px solid ${styles.gray300}`, borderRadius: 5, fontSize: '0.8rem' }}>
                  <option value="">-- Seleccionar --</option>
                  {areas.map(a => <option key={a.id} value={a.id}>{a.nombre}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 4, fontWeight: 600, fontSize: '0.75rem' }}>Rol</label>
                <select value={formData.id_rol || ''} onChange={(e) => setFormData({ ...formData, id_rol: e.target.value ? parseInt(e.target.value) : null })}
                  style={{ width: '100%', padding: 8, border: `2px solid ${styles.gray300}`, borderRadius: 5, fontSize: '0.8rem' }}>
                  <option value="">-- Seleccionar --</option>
                  {roles.map(r => <option key={r.id_rol} value={r.id_rol}>{r.rol}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 4, fontWeight: 600, fontSize: '0.75rem' }}>Estado</label>
                <select value={formData.estado || 'ACTIVO'} onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
                  style={{ width: '100%', padding: 8, border: `2px solid ${styles.gray300}`, borderRadius: 5, fontSize: '0.8rem' }}>
                  <option value="ACTIVO">ACTIVO</option>
                  <option value="INACTIVO">INACTIVO</option>
                </select>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
              <button onClick={() => setShowModal(false)} style={{ flex: 1, padding: 8, border: `2px solid ${styles.black}`, background: 'transparent', borderRadius: 5, fontWeight: 600, cursor: 'pointer', fontSize: '0.8rem' }}>Cancelar</button>
              <button onClick={saveItem} style={{ flex: 1, padding: 8, background: styles.black, color: styles.white, border: 'none', borderRadius: 5, fontWeight: 600, cursor: 'pointer', fontSize: '0.8rem' }}>Guardar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Home View
function HomeView({ user }) {
  return (
    <div style={{ textAlign: 'center', paddingTop: 50 }}>
      <div style={{ width: 60, height: 60, background: styles.black, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
        <span style={{ fontSize: 26 }}>📊</span>
      </div>
      <h2 style={{ fontWeight: 700, marginBottom: 6, fontSize: '1.2rem' }}>Sistema de Monitoreo Sectorial</h2>
      <p style={{ color: styles.gray600, marginBottom: 20, fontSize: '0.85rem' }}>MMAYA - Ministerio de Medio Ambiente y Agua</p>
      <p style={{ color: styles.gray500, fontSize: '0.8rem' }}>Bienvenido, {user?.nombre || user?.username}</p>
    </div>
  );
}

// Indicadores View
function IndicadoresView() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_URL}/api/sms/matriz_parametros`).then(res => res.json()).then(setData).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ textAlign: 'center', padding: 24 }}>Cargando...</div>;

  return (
    <div>
      <h2 style={{ fontWeight: 700, fontSize: '1.2rem', marginBottom: 12 }}>Banco de Indicadores</h2>
      <div style={{ background: styles.white, borderRadius: 6, overflow: 'auto', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 1000 }}>
          <thead>
            <tr>
              {['ID', 'Código', 'Indicador', 'Meta', 'Resultado', 'Acción', 'Año Base', 'L. Base', 'Logro', 'Estado'].map(h => <th key={h} style={headerStyle}>{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {data.map(item => (
              <tr key={item.id_indicador} style={{ borderBottom: `1px solid ${styles.gray200}` }}>
                <td style={{ ...rowStyle, textAlign: 'center' }}>{item.id_indicador}</td>
                <td style={rowStyle}>{item.codi}</td>
                <td style={{ ...rowStyle, maxWidth: 260 }}>{item.indicador_resultado}</td>
                <td style={rowStyle}>{item.codi_meta}</td>
                <td style={rowStyle}>{item.codi_resultado}</td>
                <td style={rowStyle}>{item.codi_accion}</td>
                <td style={{ ...rowStyle, textAlign: 'center' }}>{item.anio_base}</td>
                <td style={rowStyle}>{item.linea_base}</td>
                <td style={rowStyle}>{item.logro}</td>
                <td style={{ ...rowStyle, textAlign: 'center' }}>
                  <span style={{ padding: '2px 8px', borderRadius: 10, fontSize: '0.65rem', fontWeight: 600, background: item.estado === 'ACTIVO' ? '#D1FAE5' : '#FEE2E2', color: item.estado === 'ACTIVO' ? styles.green : styles.red }}>{item.estado}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Main App Component
function App() {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [menuItems, setMenuItems] = useState([]);
  const [activeView, setActiveView] = useState('home');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    const storedToken = localStorage.getItem('sms_token');
    const storedUser = localStorage.getItem('sms_user');
    if (storedToken && storedUser) { setToken(storedToken); setUser(JSON.parse(storedUser)); }
  }, []);

  useEffect(() => {
    if (user?.id_rol) {
      // Load menu options filtered by user's role and ACTIVE status
      fetch(`${API_URL}/api/sms/opciones/${user.id_rol}`)
        .then(res => res.json())
        .then(opciones => {
          // opciones contains: id_opcion, id_rol, id_menu, opcion, estado
          // We need to get the full menu info for each option
          fetch(`${API_URL}/api/sms/menu_admin`)
            .then(res => res.json())
            .then(allMenus => {
              // Map opciones to full menu items, keeping the option estado
              const menuWithAccess = opciones.map(opt => {
                const menuItem = allMenus.find(m => m.id_menu === opt.id_menu);
                return menuItem ? { ...menuItem, estado: opt.estado } : null;
              }).filter(Boolean);
              setMenuItems(menuWithAccess);
            });
        })
        .catch(console.error);
    }
  }, [user]);

  const handleLogin = (userData, tokenData) => { setUser(userData); setToken(tokenData); };
  const handleLogout = () => { localStorage.removeItem('sms_token'); localStorage.removeItem('sms_user'); setUser(null); setToken(null); setActiveView('home'); };

  if (!user || !token) return <Login onLogin={handleLogin} />;

  const renderView = () => {
    switch (activeView) {
      case 'home': return <HomeView user={user} />;
      case 'loadSectorView': return <CrudTable title="Sectores" endpoint="sectores" columns={[{ key: 'id', label: 'ID' }, { key: 'nombre', label: 'Sector' }, { key: 'estado', label: 'Estado' }]} formFields={[{ key: 'nombre', label: 'Nombre del Sector', type: 'text' }, { key: 'estado', label: 'Estado', type: 'select', options: [{ value: 'ACTIVO', label: 'ACTIVO' }, { value: 'INACTIVO', label: 'INACTIVO' }] }]} />;
      case 'loadEntidadView': return <CrudTable title="Entidades" endpoint="entidades" columns={[{ key: 'id', label: 'ID' }, { key: 'nombre', label: 'Entidad' }, { key: 'estado', label: 'Estado' }]} formFields={[{ key: 'nombre', label: 'Nombre de la Entidad', type: 'text' }, { key: 'estado', label: 'Estado', type: 'select', options: [{ value: 'ACTIVO', label: 'ACTIVO' }, { value: 'INACTIVO', label: 'INACTIVO' }] }]} />;
      case 'loadPilarView': return <CrudTable title="Pilares" endpoint="pilares" columns={[{ key: 'id', label: 'ID' }, { key: 'nombre', label: 'Pilar' }, { key: 'estado', label: 'Estado' }]} formFields={[{ key: 'nombre', label: 'Nombre del Pilar', type: 'text' }, { key: 'estado', label: 'Estado', type: 'select', options: [{ value: 'ACTIVO', label: 'ACTIVO' }, { value: 'INACTIVO', label: 'INACTIVO' }] }]} />;
      case 'loadEjeView': return <CrudTable title="Ejes" endpoint="ejes" columns={[{ key: 'id', label: 'ID' }, { key: 'nombre', label: 'Eje' }, { key: 'estado', label: 'Estado' }]} formFields={[{ key: 'nombre', label: 'Nombre del Eje', type: 'text' }, { key: 'estado', label: 'Estado', type: 'select', options: [{ value: 'ACTIVO', label: 'ACTIVO' }, { value: 'INACTIVO', label: 'INACTIVO' }] }]} />;
      case 'loadMetaView': return <CrudTable title="Metas" endpoint="metas" columns={[{ key: 'id', label: 'ID' }, { key: 'codigo', label: 'Código' }, { key: 'nombre', label: 'Meta' }, { key: 'estado', label: 'Estado' }]} formFields={[{ key: 'codigo', label: 'Código', type: 'text' }, { key: 'nombre', label: 'Descripción', type: 'textarea' }, { key: 'estado', label: 'Estado', type: 'select', options: [{ value: 'ACTIVO', label: 'ACTIVO' }, { value: 'INACTIVO', label: 'INACTIVO' }] }]} />;
      case 'loadResultadoView': return <CrudTable title="Resultados" endpoint="resultados" columns={[{ key: 'id', label: 'ID' }, { key: 'codigo', label: 'Código' }, { key: 'nombre', label: 'Resultado' }, { key: 'estado', label: 'Estado' }]} formFields={[{ key: 'codigo', label: 'Código', type: 'text' }, { key: 'nombre', label: 'Descripción', type: 'textarea' }, { key: 'estado', label: 'Estado', type: 'select', options: [{ value: 'ACTIVO', label: 'ACTIVO' }, { value: 'INACTIVO', label: 'INACTIVO' }] }]} />;
      case 'loadAccionView': return <CrudTable title="Acciones" endpoint="acciones" columns={[{ key: 'id', label: 'ID' }, { key: 'codigo', label: 'Código' }, { key: 'nombre', label: 'Acción' }, { key: 'estado', label: 'Estado' }]} formFields={[{ key: 'codigo', label: 'Código', type: 'text' }, { key: 'nombre', label: 'Descripción', type: 'textarea' }, { key: 'estado', label: 'Estado', type: 'select', options: [{ value: 'ACTIVO', label: 'ACTIVO' }, { value: 'INACTIVO', label: 'INACTIVO' }] }]} />;
      case 'loadIndicadorView': return <IndicadoresView />;
      case 'loadRendicionView':
      case 'loadSeguimientoView': return <SeguimientoView user={user} />;
      case 'loadUsuariosView': return <UsuariosView />;
      case 'loadRolesView':
      case 'loadRolView': return <RolesView />;
      case 'loadMenuView': return <MenuAdminView />;
      default: return <HomeView user={user} />;
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: styles.gray100 }}>
      <Sidebar user={user} menuItems={menuItems} activeView={activeView} setActiveView={setActiveView} collapsed={sidebarCollapsed} />
      
      <div style={{ flex: 1, marginLeft: sidebarCollapsed ? 60 : 260, transition: 'margin-left 0.3s ease' }}>
        <nav style={{ background: styles.white, padding: '10px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `1px solid ${styles.gray200}`, position: 'sticky', top: 0, zIndex: 100 }}>
          <button onClick={() => setSidebarCollapsed(!sidebarCollapsed)} style={{ background: 'none', border: 'none', fontSize: '1rem', cursor: 'pointer', padding: 4 }}>☰</button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontWeight: 600, fontSize: '0.8rem' }}>{user?.nombre || user?.username}</div>
              <div style={{ fontSize: '0.65rem', color: styles.gray500 }}>{user?.rol || 'Usuario'}</div>
            </div>
            <button onClick={handleLogout} style={{ padding: '5px 12px', background: styles.red, color: styles.white, border: 'none', borderRadius: 4, cursor: 'pointer', fontWeight: 500, fontSize: '0.75rem' }}>Salir</button>
          </div>
        </nav>
        <div style={{ padding: 20 }}>{renderView()}</div>
      </div>
    </div>
  );
}

export default App;
