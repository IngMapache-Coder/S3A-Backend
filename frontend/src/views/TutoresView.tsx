import React, { useState, useEffect } from 'react';
import {
  UsersIcon,
  UserPlusIcon,
  TrashIcon,
  EnvelopeIcon,
  XMarkIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';
import { api, type User } from '../api/client.js';

export const TutoresView: React.FC = () => {
  const [tutores, setTutores] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Formulario nuevo tutor
  const [nombre, setNombre] = useState('');
  const [correo, setCorreo] = useState('');
  const [password, setPassword] = useState('');
  const [creando, setCreando] = useState(false);

  const cargarTutores = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.usuarios.list('AMIGO_ACADEMICO');
      setTutores(res.data || []);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al cargar tutores';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarTutores();
  }, []);

  const handleCrearTutor = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setCreando(true);
      setError(null);
      await api.usuarios.create({
        nombre,
        correo,
        password,
        tipo: 'AMIGO_ACADEMICO',
      });
      setModalAbierto(false);
      setNombre('');
      setCorreo('');
      setPassword('');
      await cargarTutores();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al crear cuenta de Amigo Académico';
      setError(msg);
    } finally {
      setCreando(false);
    }
  };

  const handleEliminarTutor = async (id: string, nombreTutor: string) => {
    if (!window.confirm(`¿Seguro que deseas eliminar la cuenta de "${nombreTutor}"?`)) return;
    try {
      await api.usuarios.delete(id);
      await cargarTutores();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al eliminar usuario';
      alert(msg);
    }
  };

  return (
    <div>
      <div className="page-breadcrumb-bar">
        <div>
          <h1 className="page-title">Gestión de Amigos Académicos</h1>
          <p style={{ fontSize: '0.86rem', color: '#607D8B', marginTop: '2px' }}>
            Aprovisionamiento exclusivo por el Director de Programa. Los tutores no poseen autoregistro.
          </p>
        </div>
        <button className="btn btn-red" onClick={() => setModalAbierto(true)}>
          <UserPlusIcon style={{ width: '16px', height: '16px' }} />
          Nuevo Amigo Académico
        </button>
      </div>

      {error && (
        <div
          style={{
            backgroundColor: '#FFEBEE',
            borderLeft: '4px solid #C62828',
            color: '#B71C1C',
            padding: '12px 16px',
            marginBottom: '20px',
            borderRadius: '4px',
            fontSize: '0.9rem',
          }}
        >
          {error}
        </div>
      )}

      <div className="ufps-card card-red">
        <div className="card-header">
          <span className="card-title">
            <UsersIcon style={{ width: '18px', height: '18px', color: '#C62828' }} />
            Cuentas Activas de Tutores ({tutores.length})
          </span>
          <button className="btn btn-secondary" onClick={cargarTutores} style={{ padding: '4px 10px', fontSize: '0.78rem' }}>
            <ArrowPathIcon style={{ width: '13px', height: '13px' }} />
            Refrescar
          </button>
        </div>

        <div className="card-body" style={{ padding: 0 }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: '#666' }}>
              <ArrowPathIcon className="animate-spin" style={{ width: '24px', height: '24px', margin: '0 auto 8px' }} />
              <p>Cargando tutores...</p>
            </div>
          ) : tutores.length === 0 ? (
            <div style={{ padding: '40px 20px', textAlign: 'center', color: '#90A4AE' }}>
              <UsersIcon style={{ width: '36px', height: '36px', margin: '0 auto 8px', opacity: 0.6 }} />
              <p>No hay Amigos Académicos registrados aún.</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="ufps-table">
                <thead>
                  <tr>
                    <th>Nombre Completo</th>
                    <th>Correo Electrónico</th>
                    <th>Rol</th>
                    <th style={{ textAlign: 'right' }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {tutores.map((t: User) => (
                    <tr key={t.id}>
                      <td style={{ fontWeight: 600 }}>{t.nombre}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <EnvelopeIcon style={{ width: '14px', height: '14px', color: '#78909C' }} />
                          <span>{t.correo}</span>
                        </div>
                      </td>
                      <td>
                        <span className="badge-tag green">AMIGO_ACADEMICO</span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button
                          className="btn btn-secondary"
                          onClick={() => handleEliminarTutor(t.id, t.nombre)}
                          style={{ padding: '4px 8px', color: '#C62828' }}
                          title="Eliminar cuenta"
                        >
                          <TrashIcon style={{ width: '14px', height: '14px' }} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Modal Crear Amigo Académico */}
      {modalAbierto && (
        <div className="modal-overlay" onClick={() => setModalAbierto(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Registrar Nuevo Amigo Académico</h3>
              <button
                style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}
                onClick={() => setModalAbierto(false)}
              >
                <XMarkIcon style={{ width: '20px', height: '20px' }} />
              </button>
            </div>
            <form onSubmit={handleCrearTutor}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Nombre Completo del Tutor *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Ej: Daniel Fernando Suárez"
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Correo Institucional *</label>
                  <input
                    type="email"
                    className="form-input"
                    placeholder="tutor@ufps.edu.co"
                    value={correo}
                    onChange={(e) => setCorreo(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Contraseña Temporal *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Contraseña para su primer ingreso"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setModalAbierto(false)}
                >
                  Cancelar
                </button>
                <button type="submit" className="btn btn-red" disabled={creando}>
                  {creando ? 'Creando cuenta...' : 'Guardar y Habilitar Tutor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
