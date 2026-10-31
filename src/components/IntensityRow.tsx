import type { Intensity } from '../types';

const LABELS = ['None', 'Mild', 'Moderate', 'Strong'];

export default function IntensityRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: Intensity;
  onChange: (v: Intensity) => void;
}) {
  return (
    <div className="intensity-row" role="radiogroup" aria-label={label}>
      <span className="intensity-label">{label}</span>
      <div className="intensity-buttons">
        {([0, 1, 2, 3] as Intensity[]).map((v) => (
          <button
            key={v}
            type="button"
            role="radio"
            aria-checked={value === v}
            aria-label={`${label}: ${LABELS[v]}`}
            title={LABELS[v]}
            className={`lvl lvl-${v}${value === v ? ' on' : ''}`}
            onClick={() => onChange(v)}
          >
            {v}
          </button>
        ))}
      </div>
    </div>
  );
}
