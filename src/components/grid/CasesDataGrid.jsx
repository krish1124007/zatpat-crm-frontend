import { useMemo, useRef, useCallback } from 'react';
import { AgGridReact } from 'ag-grid-react';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-quartz.css';

import {
  LOAN_STATUSES,
  PROFESSIONS,
  PRODUCTS,
  CHANNEL_NAMES,
  STATUS_COLORS,
  PROPERTY_TYPES,
  DISBURSEMENT_TYPES,
  POST_DISBURSEMENT_STAGES,
} from '../../utils/constants.js';
import { formatINR, paisaToRupees, rupeesToPaisa, formatDate, toDateInput } from '../../utils/format.js';

// Editable currency: stored as paisa, displayed/edited as rupees.
const currencyCol = (field, headerName, opts = {}) => ({
  field,
  headerName,
  editable: true,
  valueGetter: (p) => paisaToRupees(p.data?.[field]),
  valueSetter: (p) => {
    const next = rupeesToPaisa(p.newValue);
    if (next === p.data[field]) return false;
    p.data[field] = next;
    return true;
  },
  valueFormatter: (p) => (p.value ? formatINR(rupeesToPaisa(p.value)) : ''),
  cellClass: 'text-right tabular-nums',
  width: 130,
  ...opts,
});

const dateCol = (field, headerName, opts = {}) => ({
  field,
  headerName,
  editable: true,
  cellEditor: 'agDateStringCellEditor',
  valueGetter: (p) => toDateInput(p.data?.[field]),
  valueSetter: (p) => {
    p.data[field] = p.newValue ? new Date(p.newValue).toISOString() : null;
    return true;
  },
  valueFormatter: (p) => formatDate(p.value),
  width: 120,
  ...opts,
});

const selectCol = (field, headerName, values, opts = {}) => ({
  field,
  headerName,
  editable: true,
  cellEditor: 'agSelectCellEditor',
  cellEditorParams: { values },
  width: 140,
  ...opts,
});

// Nested boolean for documents.kycDone etc.
const docCheckboxCol = (key, headerName) => ({
  field: `documents.${key}`,
  headerName,
  editable: true,
  width: 80,
  cellClass: 'text-center',
  valueGetter: (p) => !!p.data?.documents?.[key],
  valueSetter: (p) => {
    p.data.documents = p.data.documents || {};
    p.data.documents[key] = !!p.newValue;
    return true;
  },
  cellRenderer: (p) => (p.value ? '✅' : '⬜'),
  cellEditor: 'agCheckboxCellEditor',
});

const STATUS_VALUE_FORMATTER = (p) => p.value || '';

export default function CasesDataGrid({ rows, loading, onRowClick, onCellEdit, onGridReady, quickFilter, onEdit, onDelete }) {
  const gridRef = useRef(null);

  const context = useMemo(() => ({ onEdit, onDelete }), [onEdit, onDelete]);

  const columnDefs = useMemo(
    () => [
      {
        field: 'srNo',
        headerName: 'Sr No',
        editable: false,
        pinned: 'left',
        width: 75,
        cellClass: 'font-semibold text-slate-500',
      },
      {
        field: 'fileNumber',
        headerName: 'File No',
        editable: true,
        pinned: 'left',
        width: 100,
        cellClass: 'font-mono text-xs',
      },
      {
        field: 'customerName',
        headerName: 'Customer Name',
        editable: true,
        pinned: 'left',
        width: 170,
        cellClass: 'font-semibold',
      },
      {
        field: 'phone',
        headerName: 'Phone',
        editable: true,
        pinned: 'left',
        width: 125,
      },
      {
        field: 'handledBy',
        headerName: 'Handled By',
        editable: false,
        width: 130,
        valueGetter: (p) => p.data?.handledBy?.name || '',
        cellClass: 'text-indigo-700 font-medium',
      },
      { field: 'appId', headerName: 'APP ID', editable: true, width: 120 },
      selectCol('profession', 'Profession', PROFESSIONS),
      selectCol('product', 'Product', PRODUCTS, { width: 110 }),
      selectCol('propertyType', 'Property Type', ['', ...PROPERTY_TYPES], { width: 140 }),
      {
        field: 'currentStatus',
        headerName: 'Status',
        editable: true,
        cellEditor: 'agSelectCellEditor',
        cellEditorParams: { values: LOAN_STATUSES },
        valueFormatter: STATUS_VALUE_FORMATTER,
        cellStyle: (p) => {
          const c = STATUS_COLORS[p.value];
          return c
            ? { backgroundColor: c.bg, color: c.fg, fontWeight: 600, textAlign: 'center' }
            : { backgroundColor: '#f1f5f9', color: '#334155', fontWeight: 600, textAlign: 'center' };
        },
        width: 140,
      },
      { field: 'bankName', headerName: 'Bank', editable: true, width: 130 },
      {
        field: 'provisionalBanks',
        headerName: 'Provisional Banks',
        editable: true,
        width: 180,
        valueGetter: (p) => (p.data?.provisionalBanks || []).join(', '),
        valueSetter: (p) => {
          p.data.provisionalBanks = p.newValue
            ? String(p.newValue).split(',').map((s) => s.trim()).filter(Boolean)
            : [];
          return true;
        },
        cellClass: 'text-xs',
      },
      { field: 'bankSMName', headerName: 'Bank SM', editable: true, width: 130 },
      selectCol('channelName', 'Channel Name', CHANNEL_NAMES, { width: 140 }),
      {
        field: 'referenceName',
        headerName: 'Reference',
        editable: true,
        width: 140,
        cellClass: 'text-purple-700',
      },
      {
        field: 'referencePhone',
        headerName: 'Ref. Phone',
        editable: true,
        width: 120,
      },
      dateCol('followDate', 'Follow Date'),
      dateCol('loginDate', 'Login Date'),
      currencyCol('loanAmount', 'Loan Amount', { width: 135 }),
      currencyCol('sanctionedAmount', 'Sanction Amt', { width: 135 }),
      currencyCol('disbursedAmount', 'Disbursed Amt', { width: 135 }),
      selectCol('disbursementType', 'Disb. Type', ['', ...DISBURSEMENT_TYPES], { width: 110 }),
      selectCol('postDisbursementStage', 'Post-Disb Stage', ['', ...POST_DISBURSEMENT_STAGES.map((s) => s.key)], { width: 170 }),
      { field: 'insuranceCompany', headerName: 'Insurance Co.', editable: true, width: 140 },
      currencyCol('insuranceAmount', 'Insurance Amt', { width: 130 }),
      { field: 'insurancePolicyNumber', headerName: 'Policy No.', editable: true, width: 130, cellClass: 'font-mono text-xs' },
      selectCol('insuranceStatus', 'Ins. Status', ['', 'Pending', 'Active', 'Claimed', 'Expired'], { width: 120 }),
      { field: 'bankUserId', headerName: 'Bank User ID', editable: true, width: 130, cellClass: 'font-mono text-xs' },
      { field: 'bankPassword', headerName: 'Bank Password', editable: true, width: 130, cellClass: 'font-mono text-xs' },
      { field: 'bankSMEmail', headerName: 'Bank SM Email', editable: true, width: 170 },
      docCheckboxCol('kycDone', 'KYC'),
      docCheckboxCol('itrDone', 'ITR'),
      docCheckboxCol('bankStatementDone', 'Bank Stmt'),
      docCheckboxCol('propertyDocsDone', 'Prop Docs'),
      { field: 'confirmationStatus', headerName: 'Confirmation', editable: true, width: 140 },
      {
        headerName: 'Last Follow-up',
        editable: false,
        valueGetter: (p) => {
          const fus = p.data?.followUps || [];
          return fus.length ? formatDate(fus[fus.length - 1].date) : '';
        },
        width: 125,
      },
      {
        headerName: 'Last Note',
        editable: false,
        valueGetter: (p) => {
          const fus = p.data?.followUps || [];
          return fus.length ? fus[fus.length - 1].details : '';
        },
        width: 200,
        tooltipValueGetter: (p) => p.value,
      },
      {
        headerName: 'Next Follow-up',
        editable: false,
        valueGetter: (p) => {
          const fus = p.data?.followUps || [];
          return fus.length ? formatDate(fus[fus.length - 1].nextFollowUpDate) : '';
        },
        width: 125,
      },
      { field: 'specialNotes', headerName: 'Special Note', editable: true, width: 200 },
      { field: 'legalAdvocateName', headerName: 'Legal Advocate', editable: true, width: 150 },
      currencyCol('valuationAmount', 'Valuation Amt', { width: 135 }),
      {
        field: 'roi',
        headerName: 'ROI %',
        editable: true,
        width: 85,
        valueParser: (p) => Number(p.newValue) || 0,
        cellClass: 'text-right tabular-nums',
      },
      dateCol('sanctionDate', 'Sanction Date'),
      dateCol('disbursementDate', 'Disb. Date'),
      {
        headerName: 'Full Disbursed',
        field: 'isFullDisbursed',
        width: 130,
        editable: false,
        cellRenderer: (p) => {
          if (p.value) {
            return <span className="text-emerald-600 font-semibold">Yes</span>;
          }
          return <span className="text-amber-600 font-semibold">No</span>;
        },
      },
      currencyCol('pendingPaymentAmount', 'Pending Pay', {
        width: 130,
        editable: false,
        cellClass: 'text-right tabular-nums text-red-600 font-semibold',
      }),
      {
        headerName: 'Actions',
        field: 'actions',
        pinned: 'right',
        width: 100,
        editable: false,
        filter: false,
        sortable: false,
        cellRenderer: (p) => {
          return (
            <div className="flex items-center gap-2 pt-1.5 opacity-60 hover:opacity-100 transition-opacity">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  p.context?.onEdit?.(p.data);
                }}
                className="text-indigo-600 hover:text-indigo-800"
                title="Edit Case"
              >
                ✏️
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  p.context?.onDelete?.(p.data);
                }}
                className="text-red-600 hover:text-red-800"
                title="Delete Case"
              >
                🗑️
              </button>
            </div>
          );
        },
      },
    ],
    []
  );

  const defaultColDef = useMemo(
    () => ({
      resizable: true,
      sortable: true,
      filter: true,
      floatingFilter: true,
      suppressMovable: false,
    }),
    []
  );

  // Row highlighting based on status
  const getRowStyle = useCallback((params) => {
    const status = params.data?.currentStatus;
    const c = STATUS_COLORS[status];
    if (c?.rowBg) {
      return { backgroundColor: c.rowBg };
    }
    return null;
  }, []);

  const onCellValueChanged = useCallback(
    (params) => {
      if (!params.colDef.editable || params.oldValue === params.newValue) return;
      const field = params.colDef.field;
      let patch;
      if (field?.startsWith('documents.')) {
        patch = { documents: params.data.documents };
      } else if (field) {
        patch = { [field]: params.data[field] };
      }
      if (patch) onCellEdit?.(params.data._id, patch, params);
    },
    [onCellEdit]
  );

  const onRowClicked = useCallback(
    (e) => {
      if (e.event?.target?.closest('.ag-cell-edit-wrapper')) return;
      onRowClick?.(e.data);
    },
    [onRowClick]
  );

  return (
    <div className="ag-theme-quartz h-full w-full">
      <AgGridReact
        ref={gridRef}
        context={context}
        rowData={rows}
        columnDefs={columnDefs}
        defaultColDef={defaultColDef}
        animateRows
        rowHeight={36}
        headerHeight={38}
        stopEditingWhenCellsLoseFocus
        singleClickEdit={false}
        getRowStyle={getRowStyle}
        onCellValueChanged={onCellValueChanged}
        onRowClicked={onRowClicked}
        onGridReady={onGridReady}
        getRowId={(p) => p.data._id}
        quickFilterText={quickFilter}
        overlayLoadingTemplate='<span class="ag-overlay-loading-center">Loading cases…</span>'
        overlayNoRowsTemplate='<span class="ag-overlay-loading-center text-slate-400">No cases found.</span>'
      />
    </div>
  );
}
