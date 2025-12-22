import React, { useState, useEffect, useCallback } from 'react';
import './App.css';

const API_URL = process.env.REACT_APP_BACKEND_URL || '';

// Styles
const styles = {
  // Colors
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
            <label style={{
              display: 'block',
              fontSize: '0.8rem',
              fontWeight: 600,
              color: styles.gray600,
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              marginBottom: 8
            }}>Usuario</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Ingrese su usuario"
              style={{
                width: '100%',
                padding: 16,
                fontSize: '1rem',
                border: `2px solid ${styles.gray300}`,
                borderRadius: 8,
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={{
              display: 'block',
              fontSize: '0.8rem',
              fontWeight: 600,
              color: styles.gray600,
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              marginBottom: 8
            }}>Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Ingrese su contraseña"
              style={{
                width: '100%',
                padding: 16,
                fontSize: '1rem',
                border: `2px solid ${styles.gray300}`,
                borderRadius: 8,
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: 16,
              fontSize: '1rem',
              fontWeight: 600,
              background: styles.black,
              color: styles.white,
              border: 'none',
              borderRadius: 8,
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.6 : 1,
              marginTop: 8
            }}
          >
            {loading ? 'Ingresando...' : 'Iniciar Sesión'}
          </button>

          {error && (
            <div style={{
              background: '#FEE2E2',
              color: styles.red,
              padding: '12px 16px',
              borderRadius: 8,
              marginTop: 20,
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              fontSize: '0.9rem'
            }}>
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

// Sidebar Component
function Sidebar({ user, menuItems, activeView, setActiveView, collapsed, setCollapsed }) {
  const getIcon = (name) => {
    const icons = {
      'CONFIGURACION': '⚙️',
      'PARAMETRICAS': '📋',
      'OPERACIONES': '📈',
      'Usuarios': '👥',
      'Roles': '🔐',
      'Menu': '☰',
      'Sector': '🏭',
      'Entidad': '🏛️',
      'Pilar': '🏛️',
      'Eje': '↔️',
      'Meta': '🎯',
      'Resultado': '📊',
      'Acción': '⚡',
      'Banco de Indicadores': '💾',
      'Rendición de Cuentas': '📑',
      'Seguimiento': '📑'
    };
    return icons[name] || '📄';
  };

  const handleMenuClick = (item) => {
    if (item.enlace) {
      setActiveView(item.enlace);
    }
  };

  // Group items by parent
  const groups = {};
  const rootItems = [];
  
  menuItems.forEach(item => {
    if (item.tipo_opcion === 'separador') {
      groups[item.id_menu] = { header: item, items: [] };
    }
  });
  
  menuItems.forEach(item => {
    if (item.tipo_opcion === 'opcion') {
      if (item.id_padre && groups[item.id_padre]) {
        groups[item.id_padre].items.push(item);
      } else {
        rootItems.push(item);
      }
    }
  });

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
      <div style={{
        padding: '24px 20px',
        borderBottom: `1px solid ${styles.gray800}`,
        display: 'flex',
        alignItems: 'center',
        gap: 12
      }}>
        <div style={{
          width: 40,
          height: 40,
          background: styles.white,
          borderRadius: 8,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0
        }}>
          <span style={{ fontSize: 20 }}>📊</span>
        </div>
        {!collapsed && (
          <div>
            <div style={{ color: styles.white, fontWeight: 600, fontSize: '0.85rem' }}>SMS</div>
            <div style={{ color: styles.gray500, fontSize: '0.7rem' }}>Monitoreo Sectorial</div>
          </div>
        )}
      </div>

      {/* Home Button */}
      <div
        onClick={() => setActiveView('home')}
        style={{
          padding: '12px 20px',
          color: activeView === 'home' ? styles.white : styles.gray400,
          background: activeView === 'home' ? styles.gray800 : 'transparent',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: 12
        }}
      >
        <span>🏠</span>
        {!collapsed && <span>Inicio</span>}
      </div>

      {/* Menu Groups */}
      {Object.values(groups).map(group => (
        <div key={group.header.id_menu}>
          <div style={{
            padding: '12px 20px',
            background: styles.gray900,
            color: styles.white,
            fontWeight: 600,
            fontSize: '0.75rem',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            marginTop: 8,
            display: 'flex',
            alignItems: 'center',
            gap: 12
          }}>
            <span>{getIcon(group.header.opcion)}</span>
            {!collapsed && <span>{group.header.opcion}</span>}
          </div>
          {!collapsed && group.items.map(item => (
            <div
              key={item.id_menu}
              onClick={() => handleMenuClick(item)}
              style={{
                padding: '12px 20px 12px 52px',
                color: activeView === item.enlace ? styles.white : styles.gray400,
                background: activeView === item.enlace ? styles.gray800 : 'transparent',
                cursor: 'pointer',
                fontSize: '0.85rem'
              }}
            >
              {item.opcion}
            </div>
          ))}
        </div>
      ))}

      {/* Root Items */}
      {rootItems.map(item => (
        <div
          key={item.id_menu}
          onClick={() => handleMenuClick(item)}
          style={{
            padding: '12px 20px',
            color: activeView === item.enlace ? styles.white : styles.gray400,
            background: activeView === item.enlace ? styles.gray800 : 'transparent',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 12
          }}
        >
          <span>{getIcon(item.opcion)}</span>
          {!collapsed && <span>{item.opcion}</span>}
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
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [endpoint]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const openModal = (item = null) => {
    if (item) {
      setEditItem(item);
      setFormData({ ...item });
    } else {
      setEditItem(null);
      setFormData({ estado: 'ACTIVO' });
    }
    setShowModal(true);
  };

  const saveItem = async () => {
    try {
      const method = editItem ? 'PUT' : 'POST';
      const url = editItem
        ? `${API_URL}/api/sms/${endpoint}/${editItem[idField]}`
        : `${API_URL}/api/sms/${endpoint}`;
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        setShowModal(false);
        fetchData();
      } else {
        const err = await res.json();
        alert(err.detail || 'Error al guardar');
      }
    } catch (err) {
      console.error(err);
      alert('Error de conexión');
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h2 style={{ fontWeight: 700, fontSize: '1.5rem' }}>{title}</h2>
        <button
          onClick={() => openModal()}
          style={{
            padding: '12px 24px',
            background: styles.black,
            color: styles.white,
            border: 'none',
            borderRadius: 8,
            fontWeight: 600,
            cursor: 'pointer'
          }}
        >
          + Nuevo
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 40 }}>Cargando...</div>
      ) : (
        <div style={{
          background: styles.white,
          borderRadius: 12,
          overflow: 'hidden',
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {columns.map(col => (
                  <th key={col.key} style={{
                    background: styles.black,
                    color: styles.white,
                    padding: 16,
                    textAlign: 'left',
                    fontWeight: 600,
                    fontSize: '0.8rem',
                    textTransform: 'uppercase'
                  }}>{col.label}</th>
                ))}
                <th style={{
                  background: styles.black,
                  color: styles.white,
                  padding: 16,
                  textAlign: 'center',
                  fontWeight: 600,
                  fontSize: '0.8rem'
                }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {data.map((item, idx) => (
                <tr key={item[idField] || idx} style={{ borderBottom: `1px solid ${styles.gray200}` }}>
                  {columns.map(col => (
                    <td key={col.key} style={{ padding: '14px 16px', fontSize: '0.9rem' }}>
                      {col.key === 'estado' ? (
                        <span style={{
                          padding: '4px 12px',
                          borderRadius: 20,
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          background: item[col.key] === 'ACTIVO' ? '#D1FAE5' : '#FEE2E2',
                          color: item[col.key] === 'ACTIVO' ? styles.green : styles.red
                        }}>{item[col.key]}</span>
                      ) : item[col.key]}
                    </td>
                  ))}
                  <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                    <button
                      onClick={() => openModal(item)}
                      style={{
                        padding: '8px 16px',
                        background: styles.gray100,
                        border: 'none',
                        borderRadius: 6,
                        cursor: 'pointer',
                        fontSize: '0.85rem'
                      }}
                    >Editar</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2000
        }}>
          <div style={{
            background: styles.white,
            borderRadius: 16,
            padding: 24,
            maxWidth: 500,
            width: '90%',
            maxHeight: '80vh',
            overflow: 'auto'
          }}>
            <h3 style={{ marginBottom: 24, fontWeight: 700 }}>
              {editItem ? 'Editar' : 'Nuevo'} {title}
            </h3>

            {formFields.map(field => (
              <div key={field.key} style={{ marginBottom: 16 }}>
                <label style={{
                  display: 'block',
                  marginBottom: 8,
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  color: styles.gray700
                }}>{field.label}</label>
                {field.type === 'select' ? (
                  <select
                    value={formData[field.key] || ''}
                    onChange={(e) => setFormData({ ...formData, [field.key]: e.target.value })}
                    style={{
                      width: '100%',
                      padding: 12,
                      border: `2px solid ${styles.gray300}`,
                      borderRadius: 8,
                      fontSize: '0.9rem'
                    }}
                  >
                    {field.options.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                ) : field.type === 'textarea' ? (
                  <textarea
                    value={formData[field.key] || ''}
                    onChange={(e) => setFormData({ ...formData, [field.key]: e.target.value })}
                    rows={3}
                    style={{
                      width: '100%',
                      padding: 12,
                      border: `2px solid ${styles.gray300}`,
                      borderRadius: 8,
                      fontSize: '0.9rem',
                      resize: 'vertical'
                    }}
                  />
                ) : (
                  <input
                    type={field.type || 'text'}
                    value={formData[field.key] || ''}
                    onChange={(e) => setFormData({ ...formData, [field.key]: e.target.value })}
                    style={{
                      width: '100%',
                      padding: 12,
                      border: `2px solid ${styles.gray300}`,
                      borderRadius: 8,
                      fontSize: '0.9rem',
                      boxSizing: 'border-box'
                    }}
                  />
                )}
              </div>
            ))}

            <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
              <button
                onClick={() => setShowModal(false)}
                style={{
                  flex: 1,
                  padding: 12,
                  border: `2px solid ${styles.black}`,
                  background: 'transparent',
                  borderRadius: 8,
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >Cancelar</button>
              <button
                onClick={saveItem}
                style={{
                  flex: 1,
                  padding: 12,
                  background: styles.black,
                  color: styles.white,
                  border: 'none',
                  borderRadius: 8,
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >Guardar</button>
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
    <div style={{ textAlign: 'center', paddingTop: 80 }}>
      <div style={{
        width: 80,
        height: 80,
        background: styles.black,
        borderRadius: 20,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        margin: '0 auto 24px'
      }}>
        <span style={{ fontSize: 32 }}>📊</span>
      </div>
      <h2 style={{ fontWeight: 700, marginBottom: 8 }}>Sistema de Monitoreo Sectorial</h2>
      <p style={{ color: styles.gray600, marginBottom: 32 }}>MMAYA - Ministerio de Medio Ambiente y Agua</p>
      <p style={{ color: styles.gray500 }}>Bienvenido, {user?.nombre || user?.username}</p>
    </div>
  );
}

// Indicadores View
function IndicadoresView() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_URL}/api/sms/matriz_parametros`)
      .then(res => res.json())
      .then(json => setData(json))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <h2 style={{ fontWeight: 700, fontSize: '1.5rem', marginBottom: 24 }}>Banco de Indicadores</h2>
      
      {loading ? (
        <div style={{ textAlign: 'center', padding: 40 }}>Cargando...</div>
      ) : (
        <div style={{
          background: styles.white,
          borderRadius: 12,
          overflow: 'auto',
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 1200 }}>
            <thead>
              <tr>
                {['ID', 'Código', 'Indicador', 'Meta', 'Resultado', 'Acción', 'Año Base', 'Línea Base', 'Año Logro', 'Logro', 'Estado'].map(h => (
                  <th key={h} style={{
                    background: styles.black,
                    color: styles.white,
                    padding: 12,
                    textAlign: 'left',
                    fontWeight: 600,
                    fontSize: '0.75rem',
                    textTransform: 'uppercase',
                    whiteSpace: 'nowrap'
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map(item => (
                <tr key={item.id_indicador} style={{ borderBottom: `1px solid ${styles.gray200}` }}>
                  <td style={{ padding: 12, fontSize: '0.85rem' }}>{item.id_indicador}</td>
                  <td style={{ padding: 12, fontSize: '0.85rem' }}>{item.codi}</td>
                  <td style={{ padding: 12, fontSize: '0.85rem', maxWidth: 300 }}>{item.indicador_resultado}</td>
                  <td style={{ padding: 12, fontSize: '0.85rem' }}>{item.codi_meta}</td>
                  <td style={{ padding: 12, fontSize: '0.85rem' }}>{item.codi_resultado}</td>
                  <td style={{ padding: 12, fontSize: '0.85rem' }}>{item.codi_accion}</td>
                  <td style={{ padding: 12, fontSize: '0.85rem' }}>{item.anio_base}</td>
                  <td style={{ padding: 12, fontSize: '0.85rem' }}>{item.linea_base}</td>
                  <td style={{ padding: 12, fontSize: '0.85rem' }}>{item.anio_logro}</td>
                  <td style={{ padding: 12, fontSize: '0.85rem' }}>{item.logro}</td>
                  <td style={{ padding: 12 }}>
                    <span style={{
                      padding: '4px 12px',
                      borderRadius: 20,
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      background: item.estado === 'ACTIVO' ? '#D1FAE5' : '#FEE2E2',
                      color: item.estado === 'ACTIVO' ? styles.green : styles.red
                    }}>{item.estado}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
    ])
      .then(([usuarios, areasData, rolesData]) => {
        setData(usuarios);
        setAreas(areasData);
        setRoles(rolesData);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const openModal = (item = null) => {
    if (item) {
      setEditItem(item);
      setFormData({ ...item, clave: '' });
    } else {
      setEditItem(null);
      setFormData({ estado: 'ACTIVO' });
    }
    setShowModal(true);
  };

  const saveItem = async () => {
    try {
      const method = editItem ? 'PUT' : 'POST';
      const url = editItem
        ? `${API_URL}/api/sms/usuarios/${editItem.id_usuario}`
        : `${API_URL}/api/sms/usuarios`;
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        setShowModal(false);
        const updated = await fetch(`${API_URL}/api/sms/usuarios`).then(r => r.json());
        setData(updated);
      } else {
        const err = await res.json();
        alert(err.detail || 'Error al guardar');
      }
    } catch (err) {
      console.error(err);
      alert('Error de conexión');
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h2 style={{ fontWeight: 700, fontSize: '1.5rem' }}>Usuarios</h2>
        <button
          onClick={() => openModal()}
          style={{
            padding: '12px 24px',
            background: styles.black,
            color: styles.white,
            border: 'none',
            borderRadius: 8,
            fontWeight: 600,
            cursor: 'pointer'
          }}
        >
          + Nuevo Usuario
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 40 }}>Cargando...</div>
      ) : (
        <div style={{
          background: styles.white,
          borderRadius: 12,
          overflow: 'auto',
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {['ID', 'Documento', 'Nombre', 'Usuario', 'Área', 'Rol', 'Estado', 'Acciones'].map(h => (
                  <th key={h} style={{
                    background: styles.black,
                    color: styles.white,
                    padding: 16,
                    textAlign: 'left',
                    fontWeight: 600,
                    fontSize: '0.8rem',
                    textTransform: 'uppercase'
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map(item => (
                <tr key={item.id_usuario} style={{ borderBottom: `1px solid ${styles.gray200}` }}>
                  <td style={{ padding: '14px 16px', fontSize: '0.9rem' }}>{item.id_usuario}</td>
                  <td style={{ padding: '14px 16px', fontSize: '0.9rem' }}>{item.nro_documento || '-'}</td>
                  <td style={{ padding: '14px 16px', fontSize: '0.9rem' }}>{item.nombre}</td>
                  <td style={{ padding: '14px 16px', fontSize: '0.9rem' }}>{item.username}</td>
                  <td style={{ padding: '14px 16px', fontSize: '0.9rem' }}>{item.area || '-'}</td>
                  <td style={{ padding: '14px 16px', fontSize: '0.9rem' }}>{item.rol || '-'}</td>
                  <td style={{ padding: '14px 16px' }}>
                    <span style={{
                      padding: '4px 12px',
                      borderRadius: 20,
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      background: item.estado === 'ACTIVO' ? '#D1FAE5' : '#FEE2E2',
                      color: item.estado === 'ACTIVO' ? styles.green : styles.red
                    }}>{item.estado}</span>
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <button
                      onClick={() => openModal(item)}
                      style={{
                        padding: '8px 16px',
                        background: styles.gray100,
                        border: 'none',
                        borderRadius: 6,
                        cursor: 'pointer',
                        fontSize: '0.85rem'
                      }}
                    >Editar</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2000
        }}>
          <div style={{
            background: styles.white,
            borderRadius: 16,
            padding: 24,
            maxWidth: 600,
            width: '90%'
          }}>
            <h3 style={{ marginBottom: 24, fontWeight: 700 }}>
              {editItem ? 'Editar' : 'Nuevo'} Usuario
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, fontSize: '0.85rem' }}>Nro. Documento</label>
                <input
                  type="text"
                  value={formData.nro_documento || ''}
                  onChange={(e) => setFormData({ ...formData, nro_documento: e.target.value })}
                  style={{ width: '100%', padding: 12, border: `2px solid ${styles.gray300}`, borderRadius: 8, boxSizing: 'border-box' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, fontSize: '0.85rem' }}>Nombre Completo *</label>
                <input
                  type="text"
                  value={formData.nombre || ''}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  style={{ width: '100%', padding: 12, border: `2px solid ${styles.gray300}`, borderRadius: 8, boxSizing: 'border-box' }}
                  required
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, fontSize: '0.85rem' }}>Usuario *</label>
                <input
                  type="text"
                  value={formData.username || ''}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  style={{ width: '100%', padding: 12, border: `2px solid ${styles.gray300}`, borderRadius: 8, boxSizing: 'border-box' }}
                  required
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, fontSize: '0.85rem' }}>Contraseña {editItem ? '(vacío = mantener)' : '*'}</label>
                <input
                  type="password"
                  value={formData.clave || ''}
                  onChange={(e) => setFormData({ ...formData, clave: e.target.value })}
                  style={{ width: '100%', padding: 12, border: `2px solid ${styles.gray300}`, borderRadius: 8, boxSizing: 'border-box' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, fontSize: '0.85rem' }}>Área</label>
                <select
                  value={formData.id_area || ''}
                  onChange={(e) => setFormData({ ...formData, id_area: e.target.value ? parseInt(e.target.value) : null })}
                  style={{ width: '100%', padding: 12, border: `2px solid ${styles.gray300}`, borderRadius: 8 }}
                >
                  <option value="">-- Seleccionar --</option>
                  {areas.map(a => (
                    <option key={a.id} value={a.id}>{a.nombre}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, fontSize: '0.85rem' }}>Rol</label>
                <select
                  value={formData.id_rol || ''}
                  onChange={(e) => setFormData({ ...formData, id_rol: e.target.value ? parseInt(e.target.value) : null })}
                  style={{ width: '100%', padding: 12, border: `2px solid ${styles.gray300}`, borderRadius: 8 }}
                >
                  <option value="">-- Seleccionar --</option>
                  {roles.map(r => (
                    <option key={r.id_rol} value={r.id_rol}>{r.rol}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, fontSize: '0.85rem' }}>Estado</label>
                <select
                  value={formData.estado || 'ACTIVO'}
                  onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
                  style={{ width: '100%', padding: 12, border: `2px solid ${styles.gray300}`, borderRadius: 8 }}
                >
                  <option value="ACTIVO">ACTIVO</option>
                  <option value="INACTIVO">INACTIVO</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
              <button
                onClick={() => setShowModal(false)}
                style={{ flex: 1, padding: 12, border: `2px solid ${styles.black}`, background: 'transparent', borderRadius: 8, fontWeight: 600, cursor: 'pointer' }}
              >Cancelar</button>
              <button
                onClick={saveItem}
                style={{ flex: 1, padding: 12, background: styles.black, color: styles.white, border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer' }}
              >Guardar</button>
            </div>
          </div>
        </div>
      )}
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
    
    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
    }
  }, []);

  useEffect(() => {
    if (user?.id_rol) {
      fetch(`${API_URL}/api/sms/menu/${user.id_rol}`)
        .then(res => res.json())
        .then(setMenuItems)
        .catch(console.error);
    }
  }, [user]);

  const handleLogin = (userData, tokenData) => {
    setUser(userData);
    setToken(tokenData);
  };

  const handleLogout = () => {
    localStorage.removeItem('sms_token');
    localStorage.removeItem('sms_user');
    setUser(null);
    setToken(null);
    setActiveView('home');
  };

  if (!user || !token) {
    return <Login onLogin={handleLogin} />;
  }

  const renderView = () => {
    switch (activeView) {
      case 'home':
        return <HomeView user={user} />;
      case 'loadSectorView':
        return (
          <CrudTable
            title="Sectores"
            endpoint="sectores"
            columns={[
              { key: 'id', label: 'ID' },
              { key: 'nombre', label: 'Sector' },
              { key: 'estado', label: 'Estado' }
            ]}
            formFields={[
              { key: 'nombre', label: 'Nombre del Sector', type: 'text' },
              { key: 'estado', label: 'Estado', type: 'select', options: [{ value: 'ACTIVO', label: 'ACTIVO' }, { value: 'INACTIVO', label: 'INACTIVO' }] }
            ]}
          />
        );
      case 'loadEntidadView':
        return (
          <CrudTable
            title="Entidades"
            endpoint="entidades"
            columns={[
              { key: 'id', label: 'ID' },
              { key: 'nombre', label: 'Entidad' },
              { key: 'estado', label: 'Estado' }
            ]}
            formFields={[
              { key: 'nombre', label: 'Nombre de la Entidad', type: 'text' },
              { key: 'estado', label: 'Estado', type: 'select', options: [{ value: 'ACTIVO', label: 'ACTIVO' }, { value: 'INACTIVO', label: 'INACTIVO' }] }
            ]}
          />
        );
      case 'loadPilarView':
        return (
          <CrudTable
            title="Pilares"
            endpoint="pilares"
            columns={[
              { key: 'id', label: 'ID' },
              { key: 'nombre', label: 'Pilar' },
              { key: 'estado', label: 'Estado' }
            ]}
            formFields={[
              { key: 'nombre', label: 'Nombre del Pilar', type: 'text' },
              { key: 'estado', label: 'Estado', type: 'select', options: [{ value: 'ACTIVO', label: 'ACTIVO' }, { value: 'INACTIVO', label: 'INACTIVO' }] }
            ]}
          />
        );
      case 'loadEjeView':
        return (
          <CrudTable
            title="Ejes"
            endpoint="ejes"
            columns={[
              { key: 'id', label: 'ID' },
              { key: 'nombre', label: 'Eje' },
              { key: 'estado', label: 'Estado' }
            ]}
            formFields={[
              { key: 'nombre', label: 'Nombre del Eje', type: 'text' },
              { key: 'estado', label: 'Estado', type: 'select', options: [{ value: 'ACTIVO', label: 'ACTIVO' }, { value: 'INACTIVO', label: 'INACTIVO' }] }
            ]}
          />
        );
      case 'loadMetaView':
        return (
          <CrudTable
            title="Metas"
            endpoint="metas"
            columns={[
              { key: 'id', label: 'ID' },
              { key: 'codigo', label: 'Código' },
              { key: 'nombre', label: 'Meta' },
              { key: 'estado', label: 'Estado' }
            ]}
            formFields={[
              { key: 'codigo', label: 'Código', type: 'text' },
              { key: 'nombre', label: 'Descripción de la Meta', type: 'textarea' },
              { key: 'estado', label: 'Estado', type: 'select', options: [{ value: 'ACTIVO', label: 'ACTIVO' }, { value: 'INACTIVO', label: 'INACTIVO' }] }
            ]}
          />
        );
      case 'loadResultadoView':
        return (
          <CrudTable
            title="Resultados"
            endpoint="resultados"
            columns={[
              { key: 'id', label: 'ID' },
              { key: 'codigo', label: 'Código' },
              { key: 'nombre', label: 'Resultado' },
              { key: 'estado', label: 'Estado' }
            ]}
            formFields={[
              { key: 'codigo', label: 'Código', type: 'text' },
              { key: 'nombre', label: 'Descripción del Resultado', type: 'textarea' },
              { key: 'estado', label: 'Estado', type: 'select', options: [{ value: 'ACTIVO', label: 'ACTIVO' }, { value: 'INACTIVO', label: 'INACTIVO' }] }
            ]}
          />
        );
      case 'loadAccionView':
        return (
          <CrudTable
            title="Acciones"
            endpoint="acciones"
            columns={[
              { key: 'id', label: 'ID' },
              { key: 'codigo', label: 'Código' },
              { key: 'nombre', label: 'Acción' },
              { key: 'estado', label: 'Estado' }
            ]}
            formFields={[
              { key: 'codigo', label: 'Código', type: 'text' },
              { key: 'nombre', label: 'Descripción de la Acción', type: 'textarea' },
              { key: 'estado', label: 'Estado', type: 'select', options: [{ value: 'ACTIVO', label: 'ACTIVO' }, { value: 'INACTIVO', label: 'INACTIVO' }] }
            ]}
          />
        );
      case 'loadIndicadorView':
        return <IndicadoresView />;
      case 'loadRendicionView':
      case 'loadSeguimientoView':
        return (
          <div>
            <h2 style={{ fontWeight: 700, fontSize: '1.5rem', marginBottom: 24 }}>Rendición de Cuentas</h2>
            <p style={{ color: styles.gray600 }}>Seleccione un indicador para ver o registrar la rendición.</p>
          </div>
        );
      case 'loadUsuariosView':
        return <UsuariosView />;
      case 'loadRolesView':
        return (
          <CrudTable
            title="Roles"
            endpoint="roles"
            idField="id_rol"
            columns={[
              { key: 'id_rol', label: 'ID' },
              { key: 'rol', label: 'Rol' },
              { key: 'estado', label: 'Estado' }
            ]}
            formFields={[
              { key: 'rol', label: 'Nombre del Rol', type: 'text' },
              { key: 'estado', label: 'Estado', type: 'select', options: [{ value: 'ACTIVO', label: 'ACTIVO' }, { value: 'INACTIVO', label: 'INACTIVO' }] }
            ]}
          />
        );
      default:
        return <HomeView user={user} />;
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: styles.gray100 }}>
      <Sidebar
        user={user}
        menuItems={menuItems}
        activeView={activeView}
        setActiveView={setActiveView}
        collapsed={sidebarCollapsed}
        setCollapsed={setSidebarCollapsed}
      />
      
      {/* Main Content */}
      <div style={{
        flex: 1,
        marginLeft: sidebarCollapsed ? 60 : 260,
        transition: 'margin-left 0.3s ease'
      }}>
        {/* Navbar */}
        <nav style={{
          background: styles.white,
          padding: '16px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: `1px solid ${styles.gray200}`,
          position: 'sticky',
          top: 0,
          zIndex: 100
        }}>
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '1.2rem',
              cursor: 'pointer',
              padding: 8
            }}
          >☰</button>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{user?.nombre || user?.username}</div>
              <div style={{ fontSize: '0.75rem', color: styles.gray500 }}>{user?.rol || 'Usuario'}</div>
            </div>
            <button
              onClick={handleLogout}
              style={{
                padding: '8px 16px',
                background: styles.red,
                color: styles.white,
                border: 'none',
                borderRadius: 6,
                cursor: 'pointer',
                fontWeight: 500,
                fontSize: '0.85rem'
              }}
            >Salir</button>
          </div>
        </nav>

        {/* Content Area */}
        <div style={{ padding: 32 }}>
          {renderView()}
        </div>
      </div>
    </div>
  );
}

export default App;
