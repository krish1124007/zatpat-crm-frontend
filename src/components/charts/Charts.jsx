// Lightweight pure-SVG chart primitives. We avoid pulling in a chart lib to
// keep the bundle small — these handle the modest chart needs of the dashboard.

export function BarChart({ data, height = 140, valueKey = 'value', labelKey = 'label', formatValue }) {
  const max = Math.max(1, ...data.map((d) => d[valueKey] || 0));
  const barWidth = 100 / Math.max(1, data.length);
  return (
    <div>
      <svg viewBox={`0 0 100 ${height}`} preserveAspectRatio="none" className="h-32 w-full">
        {data.map((d, i) => {
          const v = d[valueKey] || 0;
          const h = (v / max) * (height - 24);
          const x = i * barWidth + barWidth * 0.15;
          const w = barWidth * 0.7;
          const y = height - 18 - h;
          return (
            <g key={i}>
              <rect x={x} y={y} width={w} height={h} rx="0.6" className="fill-brand" />
              <text
                x={x + w / 2}
                y={height - 6}
                textAnchor="middle"
                fontSize="5"
                className="fill-slate-500"
              >
                {d[labelKey]}
              </text>
            </g>
          );
        })}
      </svg>
      <div className="mt-1 flex justify-between text-[10px] text-slate-500">
        {data.map((d, i) => (
          <span key={i} className="flex-1 text-center tabular-nums">
            {formatValue ? formatValue(d[valueKey]) : d[valueKey]}
          </span>
        ))}
      </div>
    </div>
  );
}

// Donut chart driven by an array of {label, value, color}.
export function DonutChart({ data, size = 160, thickness = 28 }) {
  const total = data.reduce((a, d) => a + (d.value || 0), 0);
  const radius = size / 2 - thickness / 2;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = 2 * Math.PI * radius;

  let offset = 0;
  return (
    <div className="flex items-center gap-4">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle
          cx={cx}
          cy={cy}
          r={radius}
          fill="none"
          stroke="#f1f5f9"
          strokeWidth={thickness}
        />
        {total > 0 &&
          data.map((d, i) => {
            const v = d.value || 0;
            if (v === 0) return null;
            const len = (v / total) * circumference;
            const dasharray = `${len} ${circumference - len}`;
            const dashoffset = circumference - offset;
            offset += len;
            return (
              <circle
                key={i}
                cx={cx}
                cy={cy}
                r={radius}
                fill="none"
                stroke={d.color}
                strokeWidth={thickness}
                strokeDasharray={dasharray}
                strokeDashoffset={dashoffset}
                transform={`rotate(-90 ${cx} ${cy})`}
              />
            );
          })}
        <text x={cx} y={cy - 2} textAnchor="middle" fontSize="22" fontWeight="700" className="fill-slate-800">
          {total}
        </text>
        <text x={cx} y={cy + 14} textAnchor="middle" fontSize="9" className="fill-slate-500">
          total
        </text>
      </svg>
      <div className="flex-1 space-y-1">
        {data.map((d) => (
          <div key={d.label} className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-1.5">
              <span
                className="inline-block h-2.5 w-2.5 rounded-sm"
                style={{ backgroundColor: d.color }}
              />
              <span className="text-slate-600">{d.label}</span>
            </span>
            <span className="font-semibold tabular-nums text-slate-800">{d.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// Sparkline polyline. Pass an array of numbers.
export function Sparkline({ values, width = 120, height = 36, color = '#2563eb' }) {
  if (!values || values.length === 0) return null;
  const max = Math.max(1, ...values);
  const min = Math.min(...values);
  const range = max - min || 1;
  const step = width / Math.max(1, values.length - 1);
  const points = values
    .map((v, i) => {
      const x = i * step;
      const y = height - ((v - min) / range) * (height - 4) - 2;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
    </svg>
  );
}
