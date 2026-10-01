import React, { useState, useEffect } from 'react';
import {
  DocumentChartBarIcon,
  MagnifyingGlassIcon,
  ArrowDownTrayIcon,
  FunnelIcon,
  EyeIcon,
  XMarkIcon,
  ArrowPathIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';
import * as XLSX from 'xlsx';
import { api, type Asistencia, type Materia } from '../api/client.js';
import { formatColombiaDateTime } from '../utils/date.js';

export const ReportesView: React.FC = () => {
  const [asistencias, setAsistencias] = useState<Asistencia[]>([]);
  const [materias, setMaterias] = useState<Materia[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [desde, setDesde] = useState('');
  const [hasta, setHasta] = useState('');
  const [materiaId, setMateriaId] = useState('');
  const [codigoEstudiante, setCodigoEstudiante] = useState('');
  const [nombreEstudiante, setNombreEstudiante] = useState('');

  const [firmaModalUrl, setFirmaModalUrl] = useState<string | null>(null);
  const [firmaModalEstudiante, setFirmaModalEstudiante] = useState<string | null>(null);

  const cargarMaterias = async () => {
    try {
      const res = await api.materias.list();
      setMaterias(res.data || []);
    } catch {}
  };

  const consultar = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.reportes.consultar({
        desde: desde || undefined,
        hasta: hasta || undefined,
        materiaId: materiaId || undefined,
        codigoEstudiante: codigoEstudiante || undefined,
        nombreEstudiante: nombreEstudiante || undefined,
      });
      setAsistencias(res.data || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al consultar reporte');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarMaterias();
    consultar();
  }, []);

  const handleDescargarExcel = () => {
    if (asistencias.length === 0) {
      alert('No hay asistencias registradas para exportar.');
      return;
    }

    const datosExcel = asistencias.map((a, index) => ({
      'N°': index + 1,
      'Fecha y Hora (Colombia)': formatColombiaDateTime(a.fechaHora),
      'Código Estudiantil': a.codigoEstudiante,
      'Nombre Estudiante': a.nombreEstudiante,
      'Materia': a.materiaNombre || 'Asesoría Académica',
      'Motivo / Tema': a.motivo,
    }));

    const worksheet = XLSX.utils.json_to_sheet(datosExcel);
    worksheet['!cols'] = [
      { wch: 6 },
      { wch: 26 },
      { wch: 18 },
      { wch: 32 },
      { wch: 28 },
      { wch: 36 },
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Asistencias S3A');

    const fechaHoy = new Date().toISOString().slice(0, 10);
    XLSX.writeFile(workbook, `asistencias_amigo_academico_${fechaHoy}.xlsx`);
  };

  return (
    <div>
      <div className="page-breadcrumb-bar">
        <div>
          <h1 className="page-title">Auditoría y Reportes de Asistencia</h1>
          <p style={{ fontSize: '0.86rem', color: '#607D8B', marginTop: '2px' }}>
            Consolidado histórico de asistencias con verificación visual de firmas manuscritas.
          </p>
        </div>
        <button className="btn btn-green" onClick={handleDescargarExcel}>
          <ArrowDownTrayIcon style={{ width: '16px', height: '16px' }} />
          Descargar en Excel (.xlsx)
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

      <div className="ufps-card" style={{ borderTopColor: '#0073B7' }}>
        <div className="card-header">
          <span className="card-title">
            <FunnelIcon style={{ width: '18px', height: '18px', color: '#0073B7' }} />
            Filtros de Auditoría
          </span>
        </div>
        <div className="card-body">
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '14px',
              alignItems: 'flex-end',
            }}
          >
            <div>
              <label className="form-label">Desde</label>
              <input type="date" className="form-input" value={desde} onChange={(e) => setDesde(e.target.value)} />
            </div>

            <div>
              <label className="form-label">Hasta</label>
              <input type="date" className="form-input" value={hasta} onChange={(e) => setHasta(e.target.value)} />
            </div>

            <div>
              <label className="form-label">Materia</label>
              <select className="form-select" value={materiaId} onChange={(e) => setMateriaId(e.target.value)}>
                <option value="">Todas las materias</option>
                {materias.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.codigo} - {m.nombre}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="form-label">Código Estudiante</label>
              <input
                type="text"
                className="form-input"
                placeholder="Ej: 1152..."
                value={codigoEstudiante}
                onChange={(e) => setCodigoEstudiante(e.target.value)}
              />
            </div>

            <div>
              <label className="form-label">Nombre Estudiante</label>
              <input
                type="text"
                className="form-input"
                placeholder="Nombre o apellido..."
                value={nombreEstudiante}
                onChange={(e) => setNombreEstudiante(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button className="btn btn-red" onClick={consultar} style={{ flex: 1 }}>
                <MagnifyingGlassIcon style={{ width: '15px', height: '15px' }} />
                Filtrar
              </button>
              <button
                className="btn btn-secondary"
                onClick={() => {
                  setDesde('');
                  setHasta('');
                  setMateriaId('');
                  setCodigoEstudiante('');
                  setNombreEstudiante('');
                  setTimeout(consultar, 50);
                }}
                title="Limpiar filtros"
              >
                <ArrowPathIcon style={{ width: '15px', height: '15px' }} />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="ufps-card card-red">
        <div className="card-header">
          <span className="card-title">
            <DocumentChartBarIcon style={{ width: '18px', height: '18px', color: '#C62828' }} />
            Registros de Asistencia ({asistencias.length})
          </span>
        </div>

        <div className="card-body" style={{ padding: 0 }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: '#666' }}>
              <ArrowPathIcon className="animate-spin" style={{ width: '24px', height: '24px', margin: '0 auto 8px' }} />
              <p>Consultando asistencias...</p>
            </div>
          ) : asistencias.length === 0 ? (
            <div style={{ padding: '40px 20px', textAlign: 'center', color: '#90A4AE' }}>
              <ClockIcon style={{ width: '36px', height: '36px', margin: '0 auto 8px', opacity: 0.6 }} />
              <p>No se encontraron registros con los filtros seleccionados.</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="ufps-table">
                <thead>
                  <tr>
                    <th>Fecha / Hora (Colombia)</th>
                    <th>Estudiante</th>
                    <th>Código</th>
                    <th>Materia</th>
                    <th>Motivo Asesoría</th>
                    <th style={{ textAlign: 'right' }}>Firma</th>
                  </tr>
                </thead>
                <tbody>
                  {asistencias.map((a) => (
                    <tr key={a.id}>
                      <td style={{ fontSize: '0.82rem', color: '#555', whiteSpace: 'nowrap' }}>
                        {formatColombiaDateTime(a.fechaHora)}
                      </td>
                      <td style={{ fontWeight: 600 }}>{a.nombreEstudiante}</td>
                      <td>
                        <span
                          style={{
                            fontFamily: 'monospace',
                            backgroundColor: '#ECEFF1',
                            padding: '2px 6px',
                            borderRadius: '3px',
                            fontSize: '0.82rem',
                          }}
                        >
                          {a.codigoEstudiante}
                        </span>
                      </td>
                      <td style={{ color: '#0073B7', fontWeight: 500 }}>
                        {a.materiaNombre || 'Materia'}
                      </td>
                      <td style={{ maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {a.motivo}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button
                          className="btn btn-secondary"
                          onClick={() => {
                            setFirmaModalUrl(api.firmas.getUrl(a.id));
                            setFirmaModalEstudiante(a.nombreEstudiante);
                          }}
                          style={{ padding: '3px 8px', fontSize: '0.76rem' }}
                        >
                          <EyeIcon style={{ width: '13px', height: '13px' }} />
                          Auditar
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

      {firmaModalUrl && (
        <div className="modal-overlay" onClick={() => setFirmaModalUrl(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Auditoría Visual de Firma</h3>
              <button
                style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}
                onClick={() => setFirmaModalUrl(null)}
              >
                <XMarkIcon style={{ width: '20px', height: '20px' }} />
              </button>
            </div>
            <div className="modal-body" style={{ textAlign: 'center' }}>
              <p style={{ fontSize: '0.88rem', color: '#555', marginBottom: '14px' }}>
                Estudiante: <strong>{firmaModalEstudiante}</strong>
              </p>
              <div
                style={{
                  backgroundColor: '#FAFAFA',
                  border: '1px solid #E0E0E0',
                  borderRadius: '6px',
                  padding: '16px',
                  minHeight: '160px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <img
                  src={firmaModalUrl}
                  alt="Firma manuscrita"
                  style={{ maxWidth: '100%', maxHeight: '200px', objectFit: 'contain' }}
                  onError={(e) => {
                    const el = e.target as HTMLElement;
                    el.style.display = 'none';
                    if (el.parentElement) {
                      el.parentElement.innerHTML =
                        '<span style="color:#C62828; font-size:0.85rem;">No fue posible cargar la firma desde Cloudflare R2.</span>';
                    }
                  }}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setFirmaModalUrl(null)}>
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
