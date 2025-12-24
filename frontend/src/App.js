import React, { useState, useEffect, useCallback } from 'react';
import './App.css';

const API_URL = process.env.REACT_APP_BACKEND_URL || '';

// UBER Style Colors
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
};

// Table styles - compact
const rowStyle = { padding: '6px 10px', fontSize: '0.8rem', verticalAlign: 'middle' };
const headerStyle = { background: styles.black, color: styles.white, padding: '8px 10px', textAlign: 'left', fontWeight: 600, fontSize: '0.7rem', textTransform: 'uppercase' };

// Login Component
function Login({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username || !password) { setError('Complete todos los campos'); return; }
    setLoading(true); setError('');
    try {
      const res = await fetch(`${API_URL}/api/sms/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username, password }) });
      const data = await res.json();
      if (res.ok && data.token) { localStorage.setItem('sms_token', data.token); localStorage.setItem('sms_user', JSON.stringify(data.user)); onLogin(data.user, data.token); }
      else { setError(data.detail || data.error || 'Credenciales incorrectas'); }
    } catch (err) { console.error(err); setError('Error de conexión'); }
    finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight: '100vh', background: styles.black, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ background: styles.white, borderRadius: 16, padding: '48px 40px', maxWidth: 420, width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{ width: 64, height: 64, background: styles.black, borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
            <span style={{ fontSize: 28, color: styles.white }}>📊</span>
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: styles.black }}>SMS</div>
          <div style={{ fontSize: '0.85rem', color: styles.gray600, marginTop: 8 }}>Sistema de Monitoreo Sectorial</div>
        </div>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: styles.gray600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>Usuario</label>
            <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Ingrese su usuario" style={{ width: '100%', padding: 14, fontSize: '1rem', border: `2px solid ${styles.gray300}`, borderRadius: 8, outline: 'none', boxSizing: 'border-box' }} />
          </div>
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: styles.gray600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>Contraseña</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Ingrese su contraseña" style={{ width: '100%', padding: 14, fontSize: '1rem', border: `2px solid ${styles.gray300}`, borderRadius: 8, outline: 'none', boxSizing: 'border-box' }} />
          </div>
          <button type="submit" disabled={loading} style={{ width: '100%', padding: 14, fontSize: '1rem', fontWeight: 600, background: styles.black, color: styles.white, border: 'none', borderRadius: 8, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.6 : 1, marginTop: 8 }}>{loading ? 'Ingresando...' : 'Iniciar Sesión'}</button>
          {error && <div style={{ background: '#FEE2E2', color: styles.red, padding: '12px 16px', borderRadius: 8, marginTop: 20, display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.9rem' }}><span>⚠️</span> {error}</div>}
        </form>
        <div style={{ textAlign: 'center', marginTop: 32, fontSize: '0.8rem', color: styles.gray500 }}>MMAYA © 2025 - Todos los derechos reservados</div>
      </div>
    </div>
  );
}

// Sidebar Component with Accordion
function Sidebar({ user, menuItems, activeView, setActiveView, collapsed }) {
  const [expandedGroups, setExpandedGroups] = useState({});
  const getIcon = (name) => {
    const icons = { 'CONFIGURACION': '⚙️', 'PARAMETRICAS': '📋', 'OPERACIONES': '📈', 'Usuarios': '👥', 'Roles': '🔐', 'Rol': '🔐', 'Menu': '☰', 'Sector': '🏭', 'Entidad': '🏛️', 'Pilar': '🏛️', 'Eje': '↔️', 'Meta': '🎯', 'Resultado': '📊', 'Acción': '⚡', 'Banco de Indicadores': '💾', 'Rendición de Cuentas': '📑', 'Seguimiento': '📑' };
    return icons[name] || '📄';
  };
  const toggleGroup = (groupId) => setExpandedGroups(prev => ({ ...prev, [groupId]: !prev[groupId] }));
  const activeMenuItems = menuItems.filter(item => item.estado === 'ACTIVO');
  const groups = {}; const separators = [];
  activeMenuItems.forEach(item => { if (item.tipo_opcion === 'separador') { separators.push(item); groups[item.id_menu] = []; } });
  activeMenuItems.forEach(item => { if (item.tipo_opcion === 'opcion' && item.id_padre && groups[item.id_padre] !== undefined) groups[item.id_padre].push(item); });
  const visibleSeparators = separators.filter(sep => groups[sep.id_menu]?.length > 0);

  return (
    <div style={{ width: collapsed ? 60 : 260, minHeight: '100vh', background: styles.black, position: 'fixed', left: 0, top: 0, transition: 'width 0.3s ease', zIndex: 1000, overflowY: 'auto', overflowX: 'hidden' }}>
      <div style={{ padding: '16px 14px', borderBottom: `1px solid ${styles.gray800}`, display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 32, height: 32, background: styles.white, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><span style={{ fontSize: 16 }}>📊</span></div>
        {!collapsed && <div><div style={{ color: styles.white, fontWeight: 600, fontSize: '0.8rem' }}>SMS</div><div style={{ color: styles.gray500, fontSize: '0.6rem' }}>Monitoreo Sectorial</div></div>}
      </div>
      <div onClick={() => setActiveView('home')} style={{ padding: '8px 14px', color: activeView === 'home' ? styles.white : styles.gray400, background: activeView === 'home' ? styles.gray800 : 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.8rem' }}><span>🏠</span>{!collapsed && <span>Inicio</span>}</div>
      {visibleSeparators.map(sep => (
        <div key={sep.id_menu}>
          <div onClick={() => toggleGroup(sep.id_menu)} style={{ padding: '8px 14px', background: styles.gray900, color: styles.white, fontWeight: 600, fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.5px', marginTop: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', userSelect: 'none' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><span>{getIcon(sep.opcion)}</span>{!collapsed && <span>{sep.opcion}</span>}</div>
            {!collapsed && <span style={{ fontSize: '0.55rem', transition: 'transform 0.2s', transform: expandedGroups[sep.id_menu] ? 'rotate(180deg)' : 'rotate(0deg)' }}>▼</span>}
          </div>
          {!collapsed && expandedGroups[sep.id_menu] && groups[sep.id_menu]?.map(item => (
            <div key={item.id_menu} onClick={() => item.enlace && setActiveView(item.enlace)} style={{ padding: '6px 14px 6px 40px', color: activeView === item.enlace ? styles.white : styles.gray400, background: activeView === item.enlace ? styles.gray800 : 'transparent', cursor: 'pointer', fontSize: '0.75rem', transition: 'all 0.15s ease' }}>{item.opcion}</div>
          ))}
        </div>
      ))}
    </div>
  );
}

// Generic CRUD Table Component
function CrudTable({ title, endpoint, columns, formFields, idField = 'id' }) {
  const [data, setData] = useState([]); const [loading, setLoading] = useState(true); const [showModal, setShowModal] = useState(false); const [editItem, setEditItem] = useState(null); const [formData, setFormData] = useState({});
  const fetchData = useCallback(async () => { try { setLoading(true); const res = await fetch(`${API_URL}/api/sms/${endpoint}`); setData(await res.json()); } catch (err) { console.error(err); } finally { setLoading(false); } }, [endpoint]);
  useEffect(() => { fetchData(); }, [fetchData]);
  const openModal = (item = null) => { if (item) { setEditItem(item); setFormData({ ...item }); } else { setEditItem(null); setFormData({ estado: 'ACTIVO' }); } setShowModal(true); };
  const saveItem = async () => { try { const method = editItem ? 'PUT' : 'POST'; const url = editItem ? `${API_URL}/api/sms/${endpoint}/${editItem[idField]}` : `${API_URL}/api/sms/${endpoint}`; const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formData) }); if (res.ok) { setShowModal(false); fetchData(); } else { const err = await res.json(); alert(err.detail || 'Error al guardar'); } } catch (err) { console.error(err); alert('Error de conexión'); } };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <h2 style={{ fontWeight: 700, fontSize: '1.2rem' }}>{title}</h2>
        <button onClick={() => openModal()} style={{ padding: '8px 16px', background: styles.black, color: styles.white, border: 'none', borderRadius: 5, fontWeight: 600, cursor: 'pointer', fontSize: '0.8rem' }}>+ Adicionar</button>
      </div>
      {loading ? <div style={{ textAlign: 'center', padding: 24 }}>Cargando...</div> : (
        <div style={{ background: styles.white, borderRadius: 6, overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr>{columns.map(col => <th key={col.key} style={headerStyle}>{col.label}</th>)}<th style={{ ...headerStyle, textAlign: 'center' }}>Op</th></tr></thead>
            <tbody>{data.map((item, idx) => (
              <tr key={item[idField] || idx} style={{ borderBottom: `1px solid ${styles.gray200}` }}>
                {columns.map(col => <td key={col.key} style={rowStyle}>{col.key === 'estado' ? <span style={{ padding: '2px 8px', borderRadius: 10, fontSize: '0.65rem', fontWeight: 600, background: item[col.key] === 'ACTIVO' ? '#D1FAE5' : '#FEE2E2', color: item[col.key] === 'ACTIVO' ? styles.green : styles.red }}>{item[col.key]}</span> : item[col.key]}</td>)}
                <td style={{ ...rowStyle, textAlign: 'center' }}><button onClick={() => openModal(item)} style={{ padding: '3px 10px', background: styles.gray100, border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: '0.75rem' }}>✏️</button></td>
              </tr>
            ))}</tbody>
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
                {field.type === 'select' ? <select value={formData[field.key] || ''} onChange={(e) => setFormData({ ...formData, [field.key]: e.target.value })} style={{ width: '100%', padding: 8, border: `2px solid ${styles.gray300}`, borderRadius: 5, fontSize: '0.8rem' }}>{field.options.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}</select>
                : field.type === 'textarea' ? <textarea value={formData[field.key] || ''} onChange={(e) => setFormData({ ...formData, [field.key]: e.target.value })} rows={2} style={{ width: '100%', padding: 8, border: `2px solid ${styles.gray300}`, borderRadius: 5, fontSize: '0.8rem', resize: 'vertical' }} />
                : <input type={field.type || 'text'} value={formData[field.key] || ''} onChange={(e) => setFormData({ ...formData, [field.key]: e.target.value })} style={{ width: '100%', padding: 8, border: `2px solid ${styles.gray300}`, borderRadius: 5, fontSize: '0.8rem', boxSizing: 'border-box' }} />}
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

// Entidades con Areas View
function EntidadesAreasView() {
  const [entidades, setEntidades] = useState([]);
  const [selectedEntidad, setSelectedEntidad] = useState(null);
  const [areas, setAreas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showEntidadModal, setShowEntidadModal] = useState(false);
  const [showAreaModal, setShowAreaModal] = useState(false);
  const [editEntidad, setEditEntidad] = useState(null);
  const [editArea, setEditArea] = useState(null);
  const [entidadForm, setEntidadForm] = useState({ nombre: '', estado: 'ACTIVO' });
  const [areaForm, setAreaForm] = useState({ nombre: '', estado: 'ACTIVO' });
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmMessage, setConfirmMessage] = useState('');

  // Load entidades
  useEffect(() => {
    fetch(`${API_URL}/api/sms/entidades`)
      .then(r => r.json())
      .then(data => setEntidades(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  // Load areas when entidad is selected
  const loadAreas = async (entidadId) => {
    setSelectedEntidad(entidadId);
    const res = await fetch(`${API_URL}/api/sms/entidades/${entidadId}/areas`);
    setAreas(await res.json());
  };

  // Entidad CRUD
  const openEntidadModal = (entidad = null) => {
    if (entidad) {
      setEditEntidad(entidad);
      setEntidadForm({ nombre: entidad.nombre, estado: entidad.estado });
    } else {
      setEditEntidad(null);
      setEntidadForm({ nombre: '', estado: 'ACTIVO' });
    }
    setShowEntidadModal(true);
  };

  const saveEntidad = async () => {
    if (!entidadForm.nombre.trim()) {
      setConfirmMessage('El nombre de la entidad es obligatorio');
      setShowConfirmModal(true);
      return;
    }
    const method = editEntidad ? 'PUT' : 'POST';
    const url = editEntidad 
      ? `${API_URL}/api/sms/entidades/${editEntidad.id}` 
      : `${API_URL}/api/sms/entidades`;
    
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(entidadForm)
    });
    
    if (res.ok) {
      setShowEntidadModal(false);
      const data = await fetch(`${API_URL}/api/sms/entidades`).then(r => r.json());
      setEntidades(data);
      setConfirmMessage(editEntidad ? 'Entidad actualizada exitosamente' : 'Entidad creada exitosamente');
      setShowConfirmModal(true);
    }
  };

  // Area CRUD
  const openAreaModal = (area = null) => {
    if (area) {
      setEditArea(area);
      setAreaForm({ nombre: area.nombre, estado: area.estado });
    } else {
      setEditArea(null);
      setAreaForm({ nombre: '', estado: 'ACTIVO' });
    }
    setShowAreaModal(true);
  };

  const saveArea = async () => {
    if (!areaForm.nombre.trim()) {
      setConfirmMessage('El nombre del área es obligatorio');
      setShowConfirmModal(true);
      return;
    }
    
    if (editArea) {
      // Update
      const res = await fetch(`${API_URL}/api/sms/areas/${editArea.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(areaForm)
      });
      if (res.ok) {
        setShowAreaModal(false);
        loadAreas(selectedEntidad);
        setConfirmMessage('Área actualizada exitosamente');
        setShowConfirmModal(true);
      }
    } else {
      // Create
      const res = await fetch(`${API_URL}/api/sms/areas/json`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...areaForm, id_entidad: selectedEntidad })
      });
      if (res.ok) {
        setShowAreaModal(false);
        loadAreas(selectedEntidad);
        setConfirmMessage('Área creada exitosamente');
        setShowConfirmModal(true);
      }
    }
  };

  const deleteArea = async (areaId) => {
    if (!window.confirm('¿Está seguro de eliminar esta área?')) return;
    const res = await fetch(`${API_URL}/api/sms/areas/${areaId}`, { method: 'DELETE' });
    if (res.ok) {
      loadAreas(selectedEntidad);
      setConfirmMessage('Área eliminada exitosamente');
      setShowConfirmModal(true);
    }
  };

  if (loading) return <div style={{ textAlign: 'center', padding: 24 }}>Cargando...</div>;

  const selectedEntidadName = entidades.find(e => e.id === selectedEntidad)?.nombre || '';

  return (
    <div>
      {/* Entidades Section */}
      <div style={{ background: styles.white, borderRadius: 8, overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', marginBottom: 20 }}>
        <div style={{ background: styles.black, padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '0.8rem', fontWeight: 600, color: styles.white, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Entidad</span>
          <button onClick={() => openEntidadModal()} style={{ padding: '6px 14px', background: styles.white, color: styles.black, border: 'none', borderRadius: 6, fontWeight: 600, cursor: 'pointer', fontSize: '0.75rem' }}>Adicionar</button>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={headerStyle}>#</th>
              <th style={headerStyle}>Nombre de la Entidad</th>
              <th style={headerStyle}>Estado</th>
              <th style={{ ...headerStyle, textAlign: 'center' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {entidades.map((ent, idx) => (
              <tr key={ent.id} style={{ borderBottom: `1px solid ${styles.gray200}`, background: selectedEntidad === ent.id ? '#E3F2FD' : 'transparent' }}>
                <td style={{ ...rowStyle, textAlign: 'center' }}>{idx + 1}</td>
                <td style={rowStyle}>{ent.nombre}</td>
                <td style={{ ...rowStyle, textAlign: 'center' }}>
                  <span style={{ padding: '2px 8px', borderRadius: 10, fontSize: '0.65rem', fontWeight: 600, background: ent.estado === 'ACTIVO' ? '#D1FAE5' : '#FEE2E2', color: ent.estado === 'ACTIVO' ? styles.green : styles.red }}>{ent.estado}</span>
                </td>
                <td style={{ ...rowStyle, textAlign: 'center' }}>
                  <button onClick={() => openEntidadModal(ent)} style={{ padding: '4px 8px', background: styles.gray100, border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: '0.7rem', marginRight: 4 }} title="Editar">✏️</button>
                  <button onClick={() => loadAreas(ent.id)} style={{ padding: '4px 8px', background: styles.blue, color: styles.white, border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: '0.7rem' }} title="Ver Áreas">🏢</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Areas Section - Only show when an entidad is selected */}
      {selectedEntidad && (
        <div style={{ background: styles.white, borderRadius: 8, overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
          <div style={{ background: styles.black, padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: styles.white, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Área Organizacional - {selectedEntidadName}</span>
            <button onClick={() => openAreaModal()} style={{ padding: '6px 14px', background: styles.white, color: styles.black, border: 'none', borderRadius: 6, fontWeight: 600, cursor: 'pointer', fontSize: '0.75rem' }}>Adicionar</button>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={headerStyle}>#</th>
                <th style={headerStyle}>Nombre del Área Organizacional</th>
                <th style={headerStyle}>Estado</th>
                <th style={{ ...headerStyle, textAlign: 'center' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {areas.length === 0 ? (
                <tr><td colSpan={4} style={{ ...rowStyle, textAlign: 'center', color: styles.gray500, padding: 24 }}>No hay áreas registradas para esta entidad</td></tr>
              ) : areas.map((area, idx) => (
                <tr key={area.id} style={{ borderBottom: `1px solid ${styles.gray200}` }}>
                  <td style={{ ...rowStyle, textAlign: 'center' }}>{idx + 1}</td>
                  <td style={rowStyle}>{area.nombre}</td>
                  <td style={{ ...rowStyle, textAlign: 'center' }}>
                    <span style={{ padding: '2px 8px', borderRadius: 10, fontSize: '0.65rem', fontWeight: 600, background: area.estado === 'ACTIVO' ? '#D1FAE5' : '#FEE2E2', color: area.estado === 'ACTIVO' ? styles.green : styles.red }}>{area.estado}</span>
                  </td>
                  <td style={{ ...rowStyle, textAlign: 'center' }}>
                    <button onClick={() => openAreaModal(area)} style={{ padding: '4px 8px', background: styles.gray100, border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: '0.7rem', marginRight: 4 }} title="Editar">✏️</button>
                    <button onClick={() => deleteArea(area.id)} style={{ padding: '4px 8px', background: styles.red, color: styles.white, border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: '0.7rem' }} title="Eliminar">🗑️</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Entidad Modal */}
      {showEntidadModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}>
          <div style={{ background: styles.white, borderRadius: 10, overflow: 'hidden', maxWidth: 420, width: '90%' }}>
            <div style={{ background: styles.black, padding: '14px 18px' }}>
              <h3 style={{ color: styles.white, fontWeight: 700, fontSize: '1rem', margin: 0 }}>{editEntidad ? 'Editar Entidad' : 'Nueva Entidad'}</h3>
            </div>
            <div style={{ padding: 18 }}>
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, fontSize: '0.8rem', color: styles.gray700 }}>Entidad *</label>
                <input type="text" value={entidadForm.nombre} onChange={(e) => setEntidadForm({ ...entidadForm, nombre: e.target.value })} style={{ width: '100%', padding: 10, border: `2px solid ${styles.gray300}`, borderRadius: 6, fontSize: '0.85rem', boxSizing: 'border-box' }} placeholder="Nombre de la entidad" />
              </div>
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, fontSize: '0.8rem', color: styles.gray700 }}>Estado</label>
                <select value={entidadForm.estado} onChange={(e) => setEntidadForm({ ...entidadForm, estado: e.target.value })} style={{ width: '100%', padding: 10, border: `2px solid ${styles.gray300}`, borderRadius: 6, fontSize: '0.85rem' }}>
                  <option value="ACTIVO">ACTIVO</option>
                  <option value="INACTIVO">INACTIVO</option>
                </select>
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={saveEntidad} style={{ flex: 1, padding: 10, background: styles.black, color: styles.white, border: 'none', borderRadius: 6, fontWeight: 600, cursor: 'pointer', fontSize: '0.85rem' }}>Grabar</button>
                <button onClick={() => setShowEntidadModal(false)} style={{ flex: 1, padding: 10, background: styles.blue, color: styles.white, border: 'none', borderRadius: 6, fontWeight: 600, cursor: 'pointer', fontSize: '0.85rem' }}>Volver</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Area Modal */}
      {showAreaModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}>
          <div style={{ background: styles.white, borderRadius: 10, overflow: 'hidden', maxWidth: 420, width: '90%' }}>
            <div style={{ background: styles.black, padding: '14px 18px' }}>
              <h3 style={{ color: styles.white, fontWeight: 700, fontSize: '1rem', margin: 0 }}>Área Organizacional</h3>
            </div>
            <div style={{ padding: 18 }}>
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, fontSize: '0.8rem', color: styles.gray700 }}>Área *</label>
                <input type="text" value={areaForm.nombre} onChange={(e) => setAreaForm({ ...areaForm, nombre: e.target.value })} style={{ width: '100%', padding: 10, border: `2px solid ${styles.gray300}`, borderRadius: 6, fontSize: '0.85rem', boxSizing: 'border-box' }} placeholder="Nombre del área" />
              </div>
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, fontSize: '0.8rem', color: styles.gray700 }}>Estado</label>
                <select value={areaForm.estado} onChange={(e) => setAreaForm({ ...areaForm, estado: e.target.value })} style={{ width: '100%', padding: 10, border: `2px solid ${styles.gray300}`, borderRadius: 6, fontSize: '0.85rem' }}>
                  <option value="ACTIVO">ACTIVO</option>
                  <option value="INACTIVO">INACTIVO</option>
                </select>
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={saveArea} style={{ flex: 1, padding: 10, background: styles.black, color: styles.white, border: 'none', borderRadius: 6, fontWeight: 600, cursor: 'pointer', fontSize: '0.85rem' }}>Grabar</button>
                <button onClick={() => setShowAreaModal(false)} style={{ flex: 1, padding: 10, background: styles.blue, color: styles.white, border: 'none', borderRadius: 6, fontWeight: 600, cursor: 'pointer', fontSize: '0.85rem' }}>Volver</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2001 }}>
          <div style={{ background: styles.white, borderRadius: 12, overflow: 'hidden', maxWidth: 380, width: '90%', boxShadow: '0 10px 40px rgba(0,0,0,0.3)' }}>
            <div style={{ background: confirmMessage.includes('obligatorio') ? styles.red : styles.green, padding: '18px 24px', textAlign: 'center' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: 6 }}>{confirmMessage.includes('obligatorio') ? '⚠️' : '✅'}</div>
              <h3 style={{ color: styles.white, fontWeight: 700, fontSize: '1rem', margin: 0 }}>
                {confirmMessage.includes('obligatorio') ? 'Atención' : '¡Operación Exitosa!'}
              </h3>
            </div>
            <div style={{ padding: 20, textAlign: 'center' }}>
              <p style={{ fontSize: '0.9rem', color: styles.gray700, marginBottom: 16 }}>{confirmMessage}</p>
              <button onClick={() => setShowConfirmModal(false)} style={{ padding: '10px 28px', background: styles.black, color: styles.white, border: 'none', borderRadius: 6, fontWeight: 600, cursor: 'pointer', fontSize: '0.85rem' }}>Aceptar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Banco de Indicadores View - Filtered by user area
function IndicadoresView({ user }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchIndicadores = async () => {
      try {
        // Admin (rol 1) sees all, others see only their area's indicators
        const isAdmin = user?.id_rol === 1;
        const endpoint = isAdmin 
          ? `${API_URL}/api/sms/matriz_parametros`
          : `${API_URL}/api/sms/indicadores/area/${user?.id_area}`;
        const res = await fetch(endpoint);
        setData(await res.json());
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    fetchIndicadores();
  }, [user]);

  if (loading) return <div style={{ textAlign: 'center', padding: 24 }}>Cargando...</div>;

  return (
    <div>
      <h2 style={{ fontWeight: 700, fontSize: '1.2rem', marginBottom: 12 }}>Banco de Indicadores</h2>
      <div style={{ background: styles.white, borderRadius: 6, overflow: 'auto', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 900 }}>
          <thead><tr>{['ID', 'CÓDIGO', 'INDICADOR', 'META', 'RESULTADO', 'ACCIÓN', 'AÑO BASE', 'L. BASE', 'LOGRO', 'ESTADO'].map(h => <th key={h} style={headerStyle}>{h}</th>)}</tr></thead>
          <tbody>
            {data.length === 0 ? (
              <tr><td colSpan={10} style={{ ...rowStyle, textAlign: 'center', color: styles.gray500, padding: 24 }}>No hay indicadores asignados a su área</td></tr>
            ) : data.map(item => (
              <tr key={item.id_indicador} style={{ borderBottom: `1px solid ${styles.gray200}` }}>
                <td style={{ ...rowStyle, textAlign: 'center' }}>{item.id_indicador}</td>
                <td style={rowStyle}>{item.codi}</td>
                <td style={{ ...rowStyle, maxWidth: 240 }}>{item.indicador_resultado}</td>
                <td style={rowStyle}>{item.codi_meta}</td>
                <td style={rowStyle}>{item.codi_resultado}</td>
                <td style={rowStyle}>{item.codi_accion}</td>
                <td style={{ ...rowStyle, textAlign: 'center' }}>{item.anio_base}</td>
                <td style={rowStyle}>{item.linea_base}</td>
                <td style={rowStyle}>{item.logro}</td>
                <td style={{ ...rowStyle, textAlign: 'center' }}><span style={{ padding: '2px 8px', borderRadius: 10, fontSize: '0.65rem', fontWeight: 600, background: item.estado === 'ACTIVO' ? '#D1FAE5' : '#FEE2E2', color: item.estado === 'ACTIVO' ? styles.green : styles.red }}>{item.estado}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// UBER Style Seguimiento View
function SeguimientoView({ user }) {
  const [indicadores, setIndicadores] = useState([]);
  const [selectedIndicador, setSelectedIndicador] = useState(null);
  const [gestion, setGestion] = useState(new Date().getFullYear());
  const [mes, setMes] = useState('ENERO');
  const [rendicion, setRendicion] = useState({});
  const [loading, setLoading] = useState(true);
  const [contexto, setContexto] = useState({});
  const [archivos, setArchivos] = useState([]);
  const [showFileModal, setShowFileModal] = useState(false);
  const [fileDescription, setFileDescription] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmMessage, setConfirmMessage] = useState('');
  const [saving, setSaving] = useState(false);

  const meses = ['ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO', 'JULIO', 'AGOSTO', 'SEPTIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE'];
  const mesesCortos = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'];
  const años = [2021, 2022, 2023, 2024, 2025, 2026, 2027, 2028, 2029, 2030];

  // Get current month index based on selected mes
  const getMesIndex = () => meses.indexOf(mes);

  useEffect(() => {
    const loadData = async () => {
      try {
        if (user?.id_area) {
          const ctxRes = await fetch(`${API_URL}/api/sms/contexto_usuario/${user.id_area}`);
          if (ctxRes.ok) setContexto(await ctxRes.json());
        }
        const isAdmin = user?.id_rol === 1;
        const endpoint = isAdmin ? `${API_URL}/api/sms/matriz_parametros` : `${API_URL}/api/sms/indicadores/area/${user?.id_area}`;
        const indRes = await fetch(endpoint);
        const indData = await indRes.json();
        setIndicadores(indData);
        if (indData.length > 0) setSelectedIndicador(indData[0]);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    loadData();
  }, [user]);

  // Load rendicion data when indicator or year changes
  useEffect(() => {
    if (selectedIndicador) {
      fetch(`${API_URL}/api/sms/rendicion/${selectedIndicador.id_indicador}/${gestion}`)
        .then(r => r.json()).then(data => setRendicion(data || {})).catch(console.error);
      // Load attached files
      fetch(`${API_URL}/api/sms/archivos/${selectedIndicador.id_indicador}/${gestion}`)
        .then(r => r.json()).then(data => setArchivos(data || [])).catch(console.error);
    }
  }, [selectedIndicador, gestion]);

  const handleChange = (field, value) => setRendicion(prev => ({ ...prev, [field]: value }));

  const saveRendicion = async () => {
    if (!selectedIndicador) return;
    setSaving(true);
    try {
      // Include id_area from user and from indicator
      const dataToSave = {
        id_indicador: selectedIndicador.id_indicador,
        gestion,
        id_area: selectedIndicador.id_area || user?.id_area,
        ...rendicion
      };
      
      const res = await fetch(`${API_URL}/api/sms/rendicion`, {
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataToSave)
      });
      
      if (res.ok) {
        const result = await res.json();
        const isUpdate = rendicion.id_rendicion ? true : false;
        setRendicion(result);
        setConfirmMessage(isUpdate ? 'Registro actualizado exitosamente' : 'Registro guardado exitosamente');
        setShowConfirmModal(true);
      } else {
        const error = await res.json();
        setConfirmMessage(`Error: ${error.detail || 'No se pudo guardar el registro'}`);
        setShowConfirmModal(true);
      }
    } catch (e) { 
      console.error(e); 
      setConfirmMessage('Error de conexión al guardar');
      setShowConfirmModal(true);
    } finally {
      setSaving(false);
    }
  };

  // File upload handler
  const handleFileUpload = async () => {
    if (!selectedFile || !selectedIndicador) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('archivo', selectedFile);
      formData.append('id_indicador', selectedIndicador.id_indicador);
      formData.append('gestion', gestion);
      formData.append('descripcion', fileDescription);
      
      const res = await fetch(`${API_URL}/api/sms/archivos`, { method: 'POST', body: formData });
      if (res.ok) {
        const newFile = await res.json();
        setArchivos(prev => [...prev, { ...newFile, nombre_original: selectedFile.name, tamaño: selectedFile.size }]);
        setShowFileModal(false);
        setSelectedFile(null);
        setFileDescription('');
      } else {
        alert('Error al subir archivo');
      }
    } catch (e) { console.error(e); alert('Error al subir archivo'); }
    finally { setUploading(false); }
  };

  // File delete handler
  const handleDeleteFile = async (fileId) => {
    if (!window.confirm('¿Está seguro de eliminar este archivo?')) return;
    try {
      const res = await fetch(`${API_URL}/api/sms/archivos/${fileId}`, { method: 'DELETE' });
      if (res.ok) {
        setArchivos(prev => prev.filter(f => f.id !== fileId));
      }
    } catch (e) { console.error(e); alert('Error al eliminar archivo'); }
  };

  // Format file size
  const formatFileSize = (bytes) => {
    if (!bytes) return '-';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  if (loading) return <div style={{ textAlign: 'center', padding: 40 }}>Cargando...</div>;

  const cellInput = { width: '100%', padding: '4px 6px', fontSize: '0.75rem', border: `1px solid ${styles.gray300}`, borderRadius: 4, textAlign: 'center', boxSizing: 'border-box' };
  const disabledInput = { ...cellInput, background: styles.gray200, color: styles.gray500, cursor: 'not-allowed' };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2 style={{ fontWeight: 700, fontSize: '1.2rem' }}>Seguimiento de Indicadores</h2>
      </div>

      {/* Context Header - UBER Style with dark header */}
      <div style={{ background: styles.white, borderRadius: 8, overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', marginBottom: 16 }}>
        <div style={{ background: styles.black, padding: '10px 16px' }}>
          <span style={{ fontSize: '0.7rem', fontWeight: 600, color: styles.white, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Contexto del Usuario</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)' }}>
          {[{ label: 'ENTIDAD', value: contexto.entidad || '-' }, { label: 'ÁREA', value: contexto.area || '-' }, { label: 'SECTOR', value: contexto.sector || '-' },
            { label: 'AÑO', value: <select value={gestion} onChange={(e) => setGestion(parseInt(e.target.value))} style={{ ...cellInput, background: styles.white }}>{años.map(y => <option key={y} value={y}>{y}</option>)}</select> },
            { label: 'MES', value: <select value={mes} onChange={(e) => setMes(e.target.value)} style={{ ...cellInput, background: styles.white }}>{meses.map(m => <option key={m} value={m}>{m}</option>)}</select> },
            { label: 'ESTADO', value: <span style={{ padding: '4px 12px', borderRadius: 20, fontSize: '0.7rem', fontWeight: 600, background: '#D1FAE5', color: styles.green }}>ABIERTO</span> }
          ].map((item, i) => (
            <div key={i} style={{ padding: '12px 16px', borderRight: i < 5 ? `1px solid ${styles.gray200}` : 'none' }}>
              <div style={{ fontSize: '0.65rem', fontWeight: 600, color: styles.gray500, textTransform: 'uppercase', marginBottom: 6 }}>{item.label}</div>
              <div style={{ fontSize: '0.85rem', fontWeight: 500 }}>{item.value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Indicator Selector - UBER Style with dark header */}
      <div style={{ background: styles.white, borderRadius: 8, overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', marginBottom: 16 }}>
        <div style={{ background: styles.black, padding: '10px 16px' }}>
          <span style={{ fontSize: '0.7rem', fontWeight: 600, color: styles.white, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Selección de Indicador</span>
        </div>
        <div style={{ padding: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 16, alignItems: 'end' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 600, color: styles.gray500, textTransform: 'uppercase', marginBottom: 8 }}>Indicador</label>
              <select value={selectedIndicador?.id_indicador || ''} onChange={(e) => setSelectedIndicador(indicadores.find(i => i.id_indicador === parseInt(e.target.value)))}
                style={{ width: '100%', padding: 12, fontSize: '0.85rem', border: `2px solid ${styles.gray300}`, borderRadius: 8, background: styles.white }}>
                {indicadores.map(ind => <option key={ind.id_indicador} value={ind.id_indicador}>{ind.codi} - {ind.indicador_resultado?.substring(0, 80)}...</option>)}
              </select>
            </div>
            <button onClick={saveRendicion} disabled={saving} style={{ padding: '12px 24px', background: saving ? styles.gray500 : styles.black, color: styles.white, border: 'none', borderRadius: 8, fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer', fontSize: '0.85rem', opacity: saving ? 0.7 : 1 }}>
              {saving ? '⏳ Guardando...' : '💾 Guardar'}
            </button>
          </div>
          
          {selectedIndicador && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginTop: 16, paddingTop: 16, borderTop: `1px solid ${styles.gray200}` }}>
              <div><div style={{ fontSize: '0.65rem', fontWeight: 600, color: styles.gray500, marginBottom: 4 }}>AÑO BASE</div><div style={{ fontSize: '0.9rem', fontWeight: 600 }}>{selectedIndicador.anio_base || '-'}</div></div>
              <div><div style={{ fontSize: '0.65rem', fontWeight: 600, color: styles.gray500, marginBottom: 4 }}>LÍNEA BASE</div><div style={{ fontSize: '0.9rem', fontWeight: 600 }}>{selectedIndicador.linea_base || '-'}</div></div>
              <div><div style={{ fontSize: '0.65rem', fontWeight: 600, color: styles.gray500, marginBottom: 4 }}>AÑO LOGRO</div><div style={{ fontSize: '0.9rem', fontWeight: 600 }}>{selectedIndicador.anio_logro || '-'}</div></div>
              <div><div style={{ fontSize: '0.65rem', fontWeight: 600, color: styles.gray500, marginBottom: 4 }}>LOGRO PROGRAMADO</div><div style={{ fontSize: '0.9rem', fontWeight: 600 }}>{selectedIndicador.logro || '-'}</div></div>
            </div>
          )}
        </div>
      </div>

      {/* Monthly Grid - UBER Style with dark header */}
      <div style={{ background: styles.white, borderRadius: 8, overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', marginBottom: 16 }}>
        <div style={{ background: styles.black, padding: '10px 16px' }}>
          <span style={{ fontSize: '0.7rem', fontWeight: 600, color: styles.white, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Registro Mensual de Ejecución</span>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 950 }}>
            <thead>
              <tr>
                <th style={{ ...headerStyle, width: 100 }}>#</th>
                {mesesCortos.map((m, idx) => <th key={m} style={{ ...headerStyle, textAlign: 'center', minWidth: 55, background: idx === getMesIndex() ? styles.green : styles.black }}>{m}</th>)}
                <th style={{ ...headerStyle, textAlign: 'center', background: styles.blue, minWidth: 70 }}>PROGRAMADO</th>
                <th style={{ ...headerStyle, textAlign: 'center', background: styles.red, minWidth: 70 }}>LOGRADO</th>
              </tr>
            </thead>
            <tbody>
              {[{ key: 'ejecutado', label: 'EJECUCIÓN' }, { key: 'proc_ejecutado', label: '% EJEC' }, { key: 'acumulado', label: 'ACUMULADO' }].map(row => (
                <tr key={row.key} style={{ borderBottom: `1px solid ${styles.gray200}` }}>
                  <td style={{ ...rowStyle, fontWeight: 600, background: styles.gray100 }}>{row.label}</td>
                  {mesesCortos.map((m, idx) => {
                    const isEditable = idx === getMesIndex();
                    return (
                      <td key={m} style={{ ...rowStyle, padding: 4, background: isEditable ? '#E8F5E9' : 'transparent' }}>
                        <input 
                          type="number" 
                          step={row.key === 'proc_ejecutado' ? '0.001' : '1'} 
                          value={rendicion[`${row.key}_${m.toLowerCase()}`] || ''} 
                          onChange={(e) => handleChange(`${row.key}_${m.toLowerCase()}`, e.target.value)} 
                          style={isEditable ? cellInput : disabledInput}
                          disabled={!isEditable}
                        />
                      </td>
                    );
                  })}
                  <td style={{ ...rowStyle, textAlign: 'center', background: '#DBEAFE', fontWeight: 600, color: styles.blue }}>{row.key === 'ejecutado' ? (rendicion.programado_periodo || selectedIndicador?.logro || '-') : ''}</td>
                  <td style={{ ...rowStyle, textAlign: 'center', background: '#FEE2E2', fontWeight: 600, color: styles.red }}>{row.key === 'ejecutado' ? (rendicion.logrado_periodo || '-') : ''}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Qualitative Description - UBER Style with dark headers */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
        <div style={{ background: styles.white, borderRadius: 8, overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
          <div style={{ background: styles.black, padding: '10px 16px' }}>
            <span style={{ fontSize: '0.7rem', fontWeight: 600, color: styles.white, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Descripción Cualitativa del Avance</span>
          </div>
          <div style={{ padding: 16 }}>
            <textarea value={rendicion.descripcion_cualitativa || ''} onChange={(e) => handleChange('descripcion_cualitativa', e.target.value)} rows={5}
              style={{ width: '100%', padding: 12, border: `2px solid ${styles.gray300}`, borderRadius: 8, fontSize: '0.85rem', resize: 'vertical', boxSizing: 'border-box' }}
              placeholder="Ingrese la descripción cualitativa del avance..." />
          </div>
        </div>
        <div style={{ background: styles.white, borderRadius: 8, overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
          <div style={{ background: styles.black, padding: '10px 16px' }}>
            <span style={{ fontSize: '0.7rem', fontWeight: 600, color: styles.white, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Modificaciones</span>
          </div>
          <div style={{ padding: 16 }}>
            <textarea value={rendicion.modificaciones || ''} onChange={(e) => handleChange('modificaciones', e.target.value)} rows={5}
              style={{ width: '100%', padding: 12, border: `2px solid ${styles.gray300}`, borderRadius: 8, fontSize: '0.85rem', resize: 'vertical', boxSizing: 'border-box' }}
              placeholder="Ingrese las modificaciones..." />
          </div>
        </div>
      </div>

      {/* Attachments - UBER Style with dark header */}
      <div style={{ background: styles.white, borderRadius: 8, overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
        <div style={{ background: styles.black, padding: '10px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '0.7rem', fontWeight: 600, color: styles.white, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Archivos Adjuntos</span>
          <button onClick={() => setShowFileModal(true)} style={{ padding: '6px 12px', background: styles.white, color: styles.black, border: 'none', borderRadius: 6, fontWeight: 600, cursor: 'pointer', fontSize: '0.75rem' }}>+ Agregar archivo</button>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead><tr>{['NOMBRE', 'DESCRIPCIÓN', 'TAMAÑO', 'ACCIONES'].map(h => <th key={h} style={headerStyle}>{h}</th>)}</tr></thead>
          <tbody>
            {archivos.length === 0 ? (
              <tr><td colSpan={4} style={{ ...rowStyle, textAlign: 'center', color: styles.gray500, padding: 24 }}>No hay archivos adjuntos</td></tr>
            ) : archivos.map(archivo => (
              <tr key={archivo.id} style={{ borderBottom: `1px solid ${styles.gray200}` }}>
                <td style={rowStyle}>{archivo.nombre_original}</td>
                <td style={rowStyle}>{archivo.descripcion || '-'}</td>
                <td style={{ ...rowStyle, textAlign: 'center' }}>{formatFileSize(archivo.tamaño)}</td>
                <td style={{ ...rowStyle, textAlign: 'center' }}>
                  <a href={`${API_URL}/api/sms/archivos/download/${archivo.id}`} download style={{ padding: '3px 8px', background: styles.blue, color: styles.white, borderRadius: 4, textDecoration: 'none', fontSize: '0.7rem', marginRight: 4 }}>⬇️</a>
                  <button onClick={() => handleDeleteFile(archivo.id)} style={{ padding: '3px 8px', background: styles.red, color: styles.white, border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: '0.7rem' }}>🗑️</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* File Upload Modal */}
      {showFileModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}>
          <div style={{ background: styles.white, borderRadius: 10, overflow: 'hidden', maxWidth: 480, width: '90%' }}>
            <div style={{ background: styles.black, padding: '14px 18px' }}>
              <h3 style={{ color: styles.white, fontWeight: 700, fontSize: '1rem', margin: 0 }}>Agregar Archivo Adjunto</h3>
            </div>
            <div style={{ padding: 18 }}>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, fontSize: '0.8rem', color: styles.gray700 }}>Seleccionar Archivo *</label>
                <input type="file" onChange={(e) => setSelectedFile(e.target.files[0])} style={{ width: '100%', padding: 10, border: `2px solid ${styles.gray300}`, borderRadius: 6, fontSize: '0.85rem', boxSizing: 'border-box' }} />
                {selectedFile && <div style={{ marginTop: 6, fontSize: '0.75rem', color: styles.gray500 }}>Tamaño: {formatFileSize(selectedFile.size)}</div>}
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, fontSize: '0.8rem', color: styles.gray700 }}>Descripción del Archivo</label>
                <textarea value={fileDescription} onChange={(e) => setFileDescription(e.target.value)} rows={3}
                  style={{ width: '100%', padding: 10, border: `2px solid ${styles.gray300}`, borderRadius: 6, fontSize: '0.85rem', resize: 'vertical', boxSizing: 'border-box' }}
                  placeholder="Describa el contenido o propósito del archivo..." />
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => { setShowFileModal(false); setSelectedFile(null); setFileDescription(''); }} style={{ flex: 1, padding: 10, border: `2px solid ${styles.black}`, background: 'transparent', borderRadius: 6, fontWeight: 600, cursor: 'pointer', fontSize: '0.85rem' }}>Cancelar</button>
                <button onClick={handleFileUpload} disabled={!selectedFile || uploading} style={{ flex: 1, padding: 10, background: styles.black, color: styles.white, border: 'none', borderRadius: 6, fontWeight: 600, cursor: selectedFile && !uploading ? 'pointer' : 'not-allowed', fontSize: '0.85rem', opacity: selectedFile && !uploading ? 1 : 0.6 }}>
                  {uploading ? 'Subiendo...' : '📤 Subir Archivo'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}>
          <div style={{ background: styles.white, borderRadius: 12, overflow: 'hidden', maxWidth: 400, width: '90%', boxShadow: '0 10px 40px rgba(0,0,0,0.3)' }}>
            <div style={{ background: confirmMessage.includes('Error') ? styles.red : styles.green, padding: '20px 24px', textAlign: 'center' }}>
              <div style={{ fontSize: '3rem', marginBottom: 8 }}>{confirmMessage.includes('Error') ? '❌' : '✅'}</div>
              <h3 style={{ color: styles.white, fontWeight: 700, fontSize: '1.1rem', margin: 0 }}>
                {confirmMessage.includes('Error') ? 'Error' : '¡Operación Exitosa!'}
              </h3>
            </div>
            <div style={{ padding: 24, textAlign: 'center' }}>
              <p style={{ fontSize: '0.95rem', color: styles.gray700, marginBottom: 20, lineHeight: 1.5 }}>{confirmMessage}</p>
              <button 
                onClick={() => setShowConfirmModal(false)} 
                style={{ 
                  padding: '12px 32px', 
                  background: styles.black, 
                  color: styles.white, 
                  border: 'none', 
                  borderRadius: 8, 
                  fontWeight: 600, 
                  cursor: 'pointer', 
                  fontSize: '0.9rem',
                  minWidth: 120
                }}
              >
                Aceptar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Roles View
function RolesView() {
  const [roles, setRoles] = useState([]); const [selectedRoleId, setSelectedRoleId] = useState(null); const [options, setOptions] = useState([]); const [loading, setLoading] = useState(true); const [showModal, setShowModal] = useState(false); const [editRole, setEditRole] = useState(null); const [formData, setFormData] = useState({ rol: '', estado: 'ACTIVO' });
  useEffect(() => { fetch(`${API_URL}/api/sms/roles`).then(r => r.json()).then(setRoles).catch(console.error).finally(() => setLoading(false)); }, []);
  const fetchOptions = async (roleId) => { setSelectedRoleId(roleId); const res = await fetch(`${API_URL}/api/sms/opciones/${roleId}`); setOptions(await res.json()); };
  const updateOptionState = async (id, estado) => { await fetch(`${API_URL}/api/sms/opciones/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ estado }) }); setOptions(prev => prev.map(o => o.id_opcion === id ? { ...o, estado } : o)); };
  const openModal = (role = null) => { if (role) { setEditRole(role); setFormData({ rol: role.rol, estado: role.estado }); } else { setEditRole(null); setFormData({ rol: '', estado: 'ACTIVO' }); } setShowModal(true); };
  const saveRole = async () => { if (!formData.rol.trim()) { alert('El nombre del rol es obligatorio'); return; } const method = editRole ? 'PUT' : 'POST'; const url = editRole ? `${API_URL}/api/sms/roles/${editRole.id_rol}` : `${API_URL}/api/sms/roles`; const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formData) }); if (res.ok) { setShowModal(false); const data = await fetch(`${API_URL}/api/sms/roles`).then(r => r.json()); setRoles(data); } };
  if (loading) return <div style={{ textAlign: 'center', padding: 24 }}>Cargando...</div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}><h2 style={{ fontWeight: 700, fontSize: '1.2rem' }}>ROLES</h2><button onClick={() => openModal()} style={{ padding: '8px 16px', background: styles.black, color: styles.white, border: 'none', borderRadius: 5, fontWeight: 600, cursor: 'pointer', fontSize: '0.8rem' }}>+ Adicionar</button></div>
      <div style={{ background: styles.white, borderRadius: 6, overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', marginBottom: 16 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}><thead><tr><th style={headerStyle}>ID ROL</th><th style={headerStyle}>ROL</th><th style={headerStyle}>ESTADO</th><th style={{ ...headerStyle, textAlign: 'center' }}>OP</th></tr></thead>
          <tbody>{roles.map(role => (
            <tr key={role.id_rol} onClick={() => fetchOptions(role.id_rol)} style={{ borderBottom: `1px solid ${styles.gray200}`, cursor: 'pointer', background: selectedRoleId === role.id_rol ? styles.gray100 : 'transparent' }}>
              <td style={{ ...rowStyle, textAlign: 'center' }}>{role.id_rol}</td><td style={rowStyle}>{role.rol}</td>
              <td style={{ ...rowStyle, textAlign: 'center' }}><span style={{ padding: '2px 8px', borderRadius: 10, fontSize: '0.65rem', fontWeight: 600, background: role.estado === 'ACTIVO' ? '#D1FAE5' : '#FEE2E2', color: role.estado === 'ACTIVO' ? styles.green : styles.red }}>{role.estado}</span></td>
              <td style={{ ...rowStyle, textAlign: 'center' }}><button onClick={(e) => { e.stopPropagation(); openModal(role); }} style={{ padding: '3px 10px', background: styles.gray100, border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: '0.75rem' }}>✏️</button></td>
            </tr>
          ))}</tbody>
        </table>
      </div>
      <h4 style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: 10, color: styles.gray700 }}>ACCESO</h4>
      <div style={{ background: styles.white, borderRadius: 6, overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}><thead><tr><th style={headerStyle}>ID</th><th style={headerStyle}>OPCIÓN</th><th style={{ ...headerStyle, textAlign: 'center' }}>ESTADO</th></tr></thead>
          <tbody>{options.length === 0 ? <tr><td colSpan={3} style={{ ...rowStyle, textAlign: 'center', color: styles.gray500 }}>Seleccione un Rol</td></tr> : options.map(opt => (
            <tr key={opt.id_opcion} style={{ borderBottom: `1px solid ${styles.gray200}` }}><td style={{ ...rowStyle, textAlign: 'center' }}>{opt.id_opcion}</td><td style={rowStyle}>{opt.opcion}</td>
              <td style={{ ...rowStyle, textAlign: 'center' }}><select value={opt.estado} onChange={(e) => updateOptionState(opt.id_opcion, e.target.value)} style={{ padding: '3px 6px', border: 'none', borderRadius: 4, background: styles.gray100, fontSize: '0.75rem', cursor: 'pointer' }}><option value="ACTIVO">ACTIVO</option><option value="INACTIVO">INACTIVO</option></select></td>
            </tr>
          ))}</tbody>
        </table>
      </div>
      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}>
          <div style={{ background: styles.white, borderRadius: 10, padding: 18, maxWidth: 380, width: '90%' }}>
            <h3 style={{ marginBottom: 14, fontWeight: 700, fontSize: '1rem' }}>{editRole ? 'Editar Rol' : 'Nuevo Rol'}</h3>
            <div style={{ marginBottom: 10 }}><label style={{ display: 'block', marginBottom: 4, fontWeight: 600, fontSize: '0.75rem' }}>Nombre del Rol</label><input type="text" value={formData.rol} onChange={(e) => setFormData({ ...formData, rol: e.target.value })} style={{ width: '100%', padding: 8, border: `2px solid ${styles.gray300}`, borderRadius: 5, fontSize: '0.8rem', boxSizing: 'border-box' }} /></div>
            <div style={{ marginBottom: 10 }}><label style={{ display: 'block', marginBottom: 4, fontWeight: 600, fontSize: '0.75rem' }}>Estado</label><select value={formData.estado} onChange={(e) => setFormData({ ...formData, estado: e.target.value })} style={{ width: '100%', padding: 8, border: `2px solid ${styles.gray300}`, borderRadius: 5, fontSize: '0.8rem' }}><option value="ACTIVO">ACTIVO</option><option value="INACTIVO">INACTIVO</option></select></div>
            <div style={{ display: 'flex', gap: 8, marginTop: 14 }}><button onClick={() => setShowModal(false)} style={{ flex: 1, padding: 8, border: `2px solid ${styles.black}`, background: 'transparent', borderRadius: 5, fontWeight: 600, cursor: 'pointer', fontSize: '0.8rem' }}>Cancelar</button><button onClick={saveRole} style={{ flex: 1, padding: 8, background: styles.black, color: styles.white, border: 'none', borderRadius: 5, fontWeight: 600, cursor: 'pointer', fontSize: '0.8rem' }}>Guardar</button></div>
          </div>
        </div>
      )}
    </div>
  );
}

// Menu Admin View
function MenuAdminView() {
  const [menus, setMenus] = useState([]); const [loading, setLoading] = useState(true); const [showModal, setShowModal] = useState(false); const [editMenu, setEditMenu] = useState(null); const [formData, setFormData] = useState({}); const [separadores, setSeparadores] = useState([]);
  useEffect(() => { fetch(`${API_URL}/api/sms/menu_admin`).then(r => r.json()).then(data => { setMenus(data); setSeparadores(data.filter(m => m.tipo_opcion === 'separador')); }).catch(console.error).finally(() => setLoading(false)); }, []);
  const openModal = (menu = null) => { if (menu) { setEditMenu(menu); setFormData({ opcion: menu.opcion, tipo_opcion: menu.tipo_opcion, enlace: menu.enlace || '', id_padre: menu.id_padre || '', estado: menu.estado }); } else { setEditMenu(null); setFormData({ opcion: '', tipo_opcion: 'opcion', enlace: '', id_padre: '', estado: 'ACTIVO' }); } setShowModal(true); };
  const saveMenu = async () => { if (!formData.opcion.trim()) { alert('El nombre de la opción es obligatorio'); return; } const method = editMenu ? 'PUT' : 'POST'; const url = editMenu ? `${API_URL}/api/sms/menu/${editMenu.id_menu}` : `${API_URL}/api/sms/menu`; const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...formData, id_padre: formData.id_padre || null }) }); if (res.ok) { setShowModal(false); const data = await fetch(`${API_URL}/api/sms/menu_admin`).then(r => r.json()); setMenus(data); setSeparadores(data.filter(m => m.tipo_opcion === 'separador')); } };
  if (loading) return <div style={{ textAlign: 'center', padding: 24 }}>Cargando...</div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}><h2 style={{ fontWeight: 700, fontSize: '1.2rem' }}>GESTIÓN DE MENÚ</h2><button onClick={() => openModal()} style={{ padding: '8px 16px', background: styles.black, color: styles.white, border: 'none', borderRadius: 5, fontWeight: 600, cursor: 'pointer', fontSize: '0.8rem' }}>+ Adicionar</button></div>
      <div style={{ background: styles.white, borderRadius: 6, overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}><thead><tr><th style={headerStyle}>ID</th><th style={headerStyle}>OPCIONES</th><th style={headerStyle}>TIPO</th><th style={headerStyle}>ESTADO</th><th style={{ ...headerStyle, textAlign: 'center' }}>OP</th></tr></thead>
          <tbody>{menus.map(menu => (
            <tr key={menu.id_menu} style={{ borderBottom: `1px solid ${styles.gray200}` }}><td style={{ ...rowStyle, textAlign: 'center' }}>{menu.id_menu}</td><td style={rowStyle}>{menu.opcion}</td><td style={{ ...rowStyle, textAlign: 'center' }}>{menu.tipo_opcion}</td>
              <td style={{ ...rowStyle, textAlign: 'center' }}><span style={{ padding: '2px 8px', borderRadius: 10, fontSize: '0.65rem', fontWeight: 600, background: menu.estado === 'ACTIVO' ? '#D1FAE5' : '#FEE2E2', color: menu.estado === 'ACTIVO' ? styles.green : styles.red }}>{menu.estado}</span></td>
              <td style={{ ...rowStyle, textAlign: 'center' }}><button onClick={() => openModal(menu)} style={{ padding: '3px 10px', background: styles.gray100, border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: '0.75rem' }}>✏️</button></td>
            </tr>
          ))}</tbody>
        </table>
      </div>
      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}>
          <div style={{ background: styles.white, borderRadius: 10, padding: 18, maxWidth: 420, width: '90%' }}>
            <h3 style={{ marginBottom: 14, fontWeight: 700, fontSize: '1rem' }}>{editMenu ? 'Editar Menú' : 'Nuevo Menú'}</h3>
            <div style={{ marginBottom: 10 }}><label style={{ display: 'block', marginBottom: 4, fontWeight: 600, fontSize: '0.75rem' }}>Grupo Padre</label><select value={formData.id_padre || ''} onChange={(e) => setFormData({ ...formData, id_padre: e.target.value })} style={{ width: '100%', padding: 8, border: `2px solid ${styles.gray300}`, borderRadius: 5, fontSize: '0.8rem' }}><option value="">Ninguno</option>{separadores.filter(s => s.id_menu !== editMenu?.id_menu).map(s => <option key={s.id_menu} value={s.id_menu}>{s.opcion}</option>)}</select></div>
            <div style={{ marginBottom: 10 }}><label style={{ display: 'block', marginBottom: 4, fontWeight: 600, fontSize: '0.75rem' }}>Opción</label><input type="text" value={formData.opcion} onChange={(e) => setFormData({ ...formData, opcion: e.target.value })} style={{ width: '100%', padding: 8, border: `2px solid ${styles.gray300}`, borderRadius: 5, fontSize: '0.8rem', boxSizing: 'border-box' }} /></div>
            <div style={{ marginBottom: 10 }}><label style={{ display: 'block', marginBottom: 4, fontWeight: 600, fontSize: '0.75rem' }}>Tipo</label><select value={formData.tipo_opcion} onChange={(e) => setFormData({ ...formData, tipo_opcion: e.target.value })} style={{ width: '100%', padding: 8, border: `2px solid ${styles.gray300}`, borderRadius: 5, fontSize: '0.8rem' }}><option value="opcion">Opción</option><option value="separador">Separador</option></select></div>
            <div style={{ marginBottom: 10 }}><label style={{ display: 'block', marginBottom: 4, fontWeight: 600, fontSize: '0.75rem' }}>Enlace JS</label><input type="text" value={formData.enlace} onChange={(e) => setFormData({ ...formData, enlace: e.target.value })} style={{ width: '100%', padding: 8, border: `2px solid ${styles.gray300}`, borderRadius: 5, fontSize: '0.8rem', boxSizing: 'border-box' }} /></div>
            <div style={{ marginBottom: 10 }}><label style={{ display: 'block', marginBottom: 4, fontWeight: 600, fontSize: '0.75rem' }}>Estado</label><select value={formData.estado} onChange={(e) => setFormData({ ...formData, estado: e.target.value })} style={{ width: '100%', padding: 8, border: `2px solid ${styles.gray300}`, borderRadius: 5, fontSize: '0.8rem' }}><option value="ACTIVO">ACTIVO</option><option value="INACTIVO">INACTIVO</option></select></div>
            <div style={{ display: 'flex', gap: 8, marginTop: 14 }}><button onClick={() => setShowModal(false)} style={{ flex: 1, padding: 8, border: `2px solid ${styles.black}`, background: 'transparent', borderRadius: 5, fontWeight: 600, cursor: 'pointer', fontSize: '0.8rem' }}>Cancelar</button><button onClick={saveMenu} style={{ flex: 1, padding: 8, background: styles.black, color: styles.white, border: 'none', borderRadius: 5, fontWeight: 600, cursor: 'pointer', fontSize: '0.8rem' }}>Guardar</button></div>
          </div>
        </div>
      )}
    </div>
  );
}

// Usuarios View
function UsuariosView() {
  const [data, setData] = useState([]); const [areas, setAreas] = useState([]); const [roles, setRoles] = useState([]); const [loading, setLoading] = useState(true); const [showModal, setShowModal] = useState(false); const [editItem, setEditItem] = useState(null); const [formData, setFormData] = useState({});
  useEffect(() => { Promise.all([fetch(`${API_URL}/api/sms/usuarios`).then(r => r.json()), fetch(`${API_URL}/api/sms/areas`).then(r => r.json()), fetch(`${API_URL}/api/sms/roles`).then(r => r.json())]).then(([u, a, r]) => { setData(u); setAreas(a); setRoles(r); }).catch(console.error).finally(() => setLoading(false)); }, []);
  const openModal = (item = null) => { if (item) { setEditItem(item); setFormData({ ...item, clave: '' }); } else { setEditItem(null); setFormData({ estado: 'ACTIVO' }); } setShowModal(true); };
  const saveItem = async () => { if (!formData.username || !formData.nombre) { alert('Nombre y Usuario son obligatorios'); return; } if (!editItem && !formData.clave) { alert('Contraseña es obligatoria'); return; } const method = editItem ? 'PUT' : 'POST'; const url = editItem ? `${API_URL}/api/sms/usuarios/${editItem.id_usuario}` : `${API_URL}/api/sms/usuarios`; const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formData) }); if (res.ok) { setShowModal(false); setData(await fetch(`${API_URL}/api/sms/usuarios`).then(r => r.json())); } };
  if (loading) return <div style={{ textAlign: 'center', padding: 24 }}>Cargando...</div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}><h2 style={{ fontWeight: 700, fontSize: '1.2rem' }}>Usuarios</h2><button onClick={() => openModal()} style={{ padding: '8px 16px', background: styles.black, color: styles.white, border: 'none', borderRadius: 5, fontWeight: 600, cursor: 'pointer', fontSize: '0.8rem' }}>+ Adicionar</button></div>
      <div style={{ background: styles.white, borderRadius: 6, overflow: 'auto', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}><thead><tr>{['ID', 'Doc', 'Nombre', 'Usuario', 'Fecha', 'Área', 'Rol', 'Estado', 'Op'].map(h => <th key={h} style={headerStyle}>{h}</th>)}</tr></thead>
          <tbody>{data.map(item => (
            <tr key={item.id_usuario} style={{ borderBottom: `1px solid ${styles.gray200}` }}>
              <td style={{ ...rowStyle, textAlign: 'center' }}>{item.id_usuario}</td><td style={rowStyle}>{item.nro_documento || '-'}</td><td style={rowStyle}>{item.nombre}</td><td style={rowStyle}>{item.username}</td><td style={rowStyle}>{item.fecha_creacion?.split('T')[0] || '-'}</td><td style={rowStyle}>{item.area || '-'}</td><td style={rowStyle}>{item.rol || '-'}</td>
              <td style={{ ...rowStyle, textAlign: 'center' }}><span style={{ padding: '2px 8px', borderRadius: 10, fontSize: '0.65rem', fontWeight: 600, background: item.estado === 'ACTIVO' ? '#D1FAE5' : '#FEE2E2', color: item.estado === 'ACTIVO' ? styles.green : styles.red }}>{item.estado}</span></td>
              <td style={{ ...rowStyle, textAlign: 'center' }}><button onClick={() => openModal(item)} style={{ padding: '3px 10px', background: styles.gray100, border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: '0.75rem' }}>✏️</button></td>
            </tr>
          ))}</tbody>
        </table>
      </div>
      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}>
          <div style={{ background: styles.white, borderRadius: 10, padding: 18, maxWidth: 520, width: '95%' }}>
            <h3 style={{ marginBottom: 14, fontWeight: 700, fontSize: '1rem' }}>{editItem ? 'Editar' : 'Nuevo'} Usuario</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div><label style={{ display: 'block', marginBottom: 4, fontWeight: 600, fontSize: '0.75rem' }}>Nro. Doc</label><input type="text" value={formData.nro_documento || ''} onChange={(e) => setFormData({ ...formData, nro_documento: e.target.value })} style={{ width: '100%', padding: 8, border: `2px solid ${styles.gray300}`, borderRadius: 5, fontSize: '0.8rem', boxSizing: 'border-box' }} /></div>
              <div><label style={{ display: 'block', marginBottom: 4, fontWeight: 600, fontSize: '0.75rem' }}>Nombre *</label><input type="text" value={formData.nombre || ''} onChange={(e) => setFormData({ ...formData, nombre: e.target.value })} style={{ width: '100%', padding: 8, border: `2px solid ${styles.gray300}`, borderRadius: 5, fontSize: '0.8rem', boxSizing: 'border-box' }} /></div>
              <div><label style={{ display: 'block', marginBottom: 4, fontWeight: 600, fontSize: '0.75rem' }}>Usuario *</label><input type="text" value={formData.username || ''} onChange={(e) => setFormData({ ...formData, username: e.target.value })} style={{ width: '100%', padding: 8, border: `2px solid ${styles.gray300}`, borderRadius: 5, fontSize: '0.8rem', boxSizing: 'border-box' }} /></div>
              <div><label style={{ display: 'block', marginBottom: 4, fontWeight: 600, fontSize: '0.75rem' }}>Contraseña</label><input type="password" value={formData.clave || ''} onChange={(e) => setFormData({ ...formData, clave: e.target.value })} style={{ width: '100%', padding: 8, border: `2px solid ${styles.gray300}`, borderRadius: 5, fontSize: '0.8rem', boxSizing: 'border-box' }} /></div>
              <div><label style={{ display: 'block', marginBottom: 4, fontWeight: 600, fontSize: '0.75rem' }}>Área</label><select value={formData.id_area || ''} onChange={(e) => setFormData({ ...formData, id_area: e.target.value ? parseInt(e.target.value) : null })} style={{ width: '100%', padding: 8, border: `2px solid ${styles.gray300}`, borderRadius: 5, fontSize: '0.8rem' }}><option value="">-- Seleccionar --</option>{areas.map(a => <option key={a.id} value={a.id}>{a.nombre}</option>)}</select></div>
              <div><label style={{ display: 'block', marginBottom: 4, fontWeight: 600, fontSize: '0.75rem' }}>Rol</label><select value={formData.id_rol || ''} onChange={(e) => setFormData({ ...formData, id_rol: e.target.value ? parseInt(e.target.value) : null })} style={{ width: '100%', padding: 8, border: `2px solid ${styles.gray300}`, borderRadius: 5, fontSize: '0.8rem' }}><option value="">-- Seleccionar --</option>{roles.map(r => <option key={r.id_rol} value={r.id_rol}>{r.rol}</option>)}</select></div>
              <div><label style={{ display: 'block', marginBottom: 4, fontWeight: 600, fontSize: '0.75rem' }}>Estado</label><select value={formData.estado || 'ACTIVO'} onChange={(e) => setFormData({ ...formData, estado: e.target.value })} style={{ width: '100%', padding: 8, border: `2px solid ${styles.gray300}`, borderRadius: 5, fontSize: '0.8rem' }}><option value="ACTIVO">ACTIVO</option><option value="INACTIVO">INACTIVO</option></select></div>
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 14 }}><button onClick={() => setShowModal(false)} style={{ flex: 1, padding: 8, border: `2px solid ${styles.black}`, background: 'transparent', borderRadius: 5, fontWeight: 600, cursor: 'pointer', fontSize: '0.8rem' }}>Cancelar</button><button onClick={saveItem} style={{ flex: 1, padding: 8, background: styles.black, color: styles.white, border: 'none', borderRadius: 5, fontWeight: 600, cursor: 'pointer', fontSize: '0.8rem' }}>Guardar</button></div>
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
      <div style={{ width: 60, height: 60, background: styles.black, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}><span style={{ fontSize: 26 }}>📊</span></div>
      <h2 style={{ fontWeight: 700, marginBottom: 6, fontSize: '1.2rem' }}>Sistema de Monitoreo Sectorial</h2>
      <p style={{ color: styles.gray600, marginBottom: 20, fontSize: '0.85rem' }}>MMAYA - Ministerio de Medio Ambiente y Agua</p>
      <p style={{ color: styles.gray500, fontSize: '0.8rem' }}>Bienvenido, {user?.nombre || user?.username}</p>
    </div>
  );
}

// Main App Component
function App() {
  const [user, setUser] = useState(null); const [token, setToken] = useState(null); const [menuItems, setMenuItems] = useState([]); const [activeView, setActiveView] = useState('home'); const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  useEffect(() => { const storedToken = localStorage.getItem('sms_token'); const storedUser = localStorage.getItem('sms_user'); if (storedToken && storedUser) { setToken(storedToken); setUser(JSON.parse(storedUser)); } }, []);
  useEffect(() => {
    if (user?.id_rol) {
      fetch(`${API_URL}/api/sms/opciones/${user.id_rol}`).then(res => res.json()).then(opciones => {
        fetch(`${API_URL}/api/sms/menu_admin`).then(res => res.json()).then(allMenus => {
          const menuWithAccess = opciones.map(opt => { const menuItem = allMenus.find(m => m.id_menu === opt.id_menu); return menuItem ? { ...menuItem, estado: opt.estado } : null; }).filter(Boolean);
          setMenuItems(menuWithAccess);
        });
      }).catch(console.error);
    }
  }, [user]);
  const handleLogin = (userData, tokenData) => { setUser(userData); setToken(tokenData); };
  const handleLogout = () => { localStorage.removeItem('sms_token'); localStorage.removeItem('sms_user'); setUser(null); setToken(null); setActiveView('home'); };
  if (!user || !token) return <Login onLogin={handleLogin} />;

  const renderView = () => {
    switch (activeView) {
      case 'home': return <HomeView user={user} />;
      case 'loadSectorView': return <CrudTable title="Sectores" endpoint="sectores" columns={[{ key: 'id', label: 'ID' }, { key: 'nombre', label: 'Sector' }, { key: 'estado', label: 'Estado' }]} formFields={[{ key: 'nombre', label: 'Nombre', type: 'text' }, { key: 'estado', label: 'Estado', type: 'select', options: [{ value: 'ACTIVO', label: 'ACTIVO' }, { value: 'INACTIVO', label: 'INACTIVO' }] }]} />;
      case 'loadEntidadView': return <EntidadesAreasView />;
      case 'loadPilarView': return <CrudTable title="Pilares" endpoint="pilares" columns={[{ key: 'id', label: 'ID' }, { key: 'nombre', label: 'Pilar' }, { key: 'estado', label: 'Estado' }]} formFields={[{ key: 'nombre', label: 'Nombre', type: 'text' }, { key: 'estado', label: 'Estado', type: 'select', options: [{ value: 'ACTIVO', label: 'ACTIVO' }, { value: 'INACTIVO', label: 'INACTIVO' }] }]} />;
      case 'loadEjeView': return <CrudTable title="Ejes" endpoint="ejes" columns={[{ key: 'id', label: 'ID' }, { key: 'nombre', label: 'Eje' }, { key: 'estado', label: 'Estado' }]} formFields={[{ key: 'nombre', label: 'Nombre', type: 'text' }, { key: 'estado', label: 'Estado', type: 'select', options: [{ value: 'ACTIVO', label: 'ACTIVO' }, { value: 'INACTIVO', label: 'INACTIVO' }] }]} />;
      case 'loadMetaView': return <CrudTable title="Metas" endpoint="metas" columns={[{ key: 'id', label: 'ID' }, { key: 'codigo', label: 'Código' }, { key: 'nombre', label: 'Meta' }, { key: 'estado', label: 'Estado' }]} formFields={[{ key: 'codigo', label: 'Código', type: 'text' }, { key: 'nombre', label: 'Descripción', type: 'textarea' }, { key: 'estado', label: 'Estado', type: 'select', options: [{ value: 'ACTIVO', label: 'ACTIVO' }, { value: 'INACTIVO', label: 'INACTIVO' }] }]} />;
      case 'loadResultadoView': return <CrudTable title="Resultados" endpoint="resultados" columns={[{ key: 'id', label: 'ID' }, { key: 'codigo', label: 'Código' }, { key: 'nombre', label: 'Resultado' }, { key: 'estado', label: 'Estado' }]} formFields={[{ key: 'codigo', label: 'Código', type: 'text' }, { key: 'nombre', label: 'Descripción', type: 'textarea' }, { key: 'estado', label: 'Estado', type: 'select', options: [{ value: 'ACTIVO', label: 'ACTIVO' }, { value: 'INACTIVO', label: 'INACTIVO' }] }]} />;
      case 'loadAccionView': return <CrudTable title="Acciones" endpoint="acciones" columns={[{ key: 'id', label: 'ID' }, { key: 'codigo', label: 'Código' }, { key: 'nombre', label: 'Acción' }, { key: 'estado', label: 'Estado' }]} formFields={[{ key: 'codigo', label: 'Código', type: 'text' }, { key: 'nombre', label: 'Descripción', type: 'textarea' }, { key: 'estado', label: 'Estado', type: 'select', options: [{ value: 'ACTIVO', label: 'ACTIVO' }, { value: 'INACTIVO', label: 'INACTIVO' }] }]} />;
      case 'loadIndicadorView': return <IndicadoresView user={user} />;
      case 'loadRendicionView': case 'loadSeguimientoView': return <SeguimientoView user={user} />;
      case 'loadUsuariosView': return <UsuariosView />;
      case 'loadRolesView': case 'loadRolView': return <RolesView />;
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
            <div style={{ textAlign: 'right' }}><div style={{ fontWeight: 600, fontSize: '0.8rem' }}>{user?.nombre || user?.username}</div><div style={{ fontSize: '0.65rem', color: styles.gray500 }}>{user?.rol || 'Usuario'}</div></div>
            <button onClick={handleLogout} style={{ padding: '5px 12px', background: styles.red, color: styles.white, border: 'none', borderRadius: 4, cursor: 'pointer', fontWeight: 500, fontSize: '0.75rem' }}>Salir</button>
          </div>
        </nav>
        <div style={{ padding: 20 }}>{renderView()}</div>
      </div>
    </div>
  );
}

export default App;
