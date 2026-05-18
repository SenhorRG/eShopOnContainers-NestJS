import type { TimeRangePreset } from '../observability/time-range';

type TimeRangeSelectProps = {
  value: TimeRangePreset;
  onChange: (value: TimeRangePreset) => void;
};

const OPTIONS: Array<{ value: TimeRangePreset; label: string }> = [
  { value: '15m', label: 'Last 15 minutes' },
  { value: '1h', label: 'Last hour' },
  { value: '6h', label: 'Last 6 hours' },
  { value: '24h', label: 'Last 24 hours' },
];

export function TimeRangeSelect({ value, onChange }: TimeRangeSelectProps) {
  return (
    <label className="ops-field">
      <span>Time range</span>
      <select value={value} onChange={(event) => onChange(event.target.value as TimeRangePreset)}>
        {OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
