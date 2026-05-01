import { useEffect, useState, useCallback } from 'react';
import CasesDataGrid from '../components/grid/CasesDataGrid.jsx';
import { casesService } from '../services/cases.service.js';
import { formatINR } from '../utils/format.js';

export default function RecycleBinPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [total, setTotal] = useState(0);

  const fetchRows = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const r = await casesService.list({ isDeleted: 'true', limit: 100 });
      setRows(r.items);
      setTotal(r.total);
    } catch (e) {
      setError(e.response?.data?.error || 'Failed to load deleted cases');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRows();
  }, [fetchRows]);

  const handleRestore = async (row) => {
    if (window.confirm(`Restore case for ${row.customerName}?`)) {
      try {
        await casesService.restore(row._id);
        setRows((rs) => rs.filter((r) => r._id !== row._id));
        setTotal((t) => t - 1);
      } catch (err) {
        alert(err.response?.data?.error || 'Failed to restore case');
      }
    }
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 border-b border-slate-200 bg-white px-3 py-2">
        <h1 className="text-lg font-bold text-slate-800">Recycle Bin</h1>
        <span className="text-xs text-slate-500">
          {loading ? 'Loading…' : `${total} case${total === 1 ? '' : 's'}`}
        </span>
        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={fetchRows}
            className="rounded-md border border-slate-300 px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50"
          >
            Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="border-b border-red-200 bg-red-50 px-3 py-1.5 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="flex-1 overflow-hidden">
        <CasesDataGrid
          rows={rows}
          loading={loading}
          onRestore={handleRestore}
          // We can disable edit/delete in recycle bin if we want, or just show restore
          isRecycleBin={true}
        />
      </div>
    </div>
  );
}
