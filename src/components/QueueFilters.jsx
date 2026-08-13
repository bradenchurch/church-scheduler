import React from 'react';

const STATUS_OPTIONS = [
  { value: 'pending', label: 'Pending' },
  { value: 'completed', label: 'Completed' },
  { value: 'all', label: 'All' },
];

const DISTRICT_OPTIONS = [
  { value: '1', label: 'District 1' },
  { value: '2', label: 'District 2' },
  { value: '3', label: 'District 3' },
];

export default function QueueFilters({ status, onStatusChange, district, onDistrictChange, isAdmin }) {
  return (
    <div className="flex flex-wrap items-end gap-4">
      {/* Status filter (pills) */}
      <div>
        <span className="block text-xs font-semibold text-brown-light uppercase tracking-wider mb-1.5">
          Status
        </span>
        <div className="inline-flex rounded-lg border-[1.5px] border-warm-border bg-warm-white p-1 gap-1">
          {STATUS_OPTIONS.map((opt) => {
            const active = status === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => onStatusChange(opt.value)}
                className={`min-h-[44px] px-4 rounded-md text-sm font-semibold transition-colors ${
                  active
                    ? 'bg-burgundy text-warm-white'
                    : 'text-brown-light hover:text-burgundy hover:bg-cream'
                }`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* District filter (admin only) */}
      {isAdmin && (
        <label className="flex flex-col gap-1">
          <span className="text-xs font-semibold text-brown-light uppercase tracking-wider">District</span>
          <select
            value={district}
            onChange={(e) => onDistrictChange(e.target.value)}
            className="min-h-[44px] px-3 py-2 border-[1.5px] border-warm-border rounded-md bg-warm-white text-brown text-sm focus:border-burgundy focus:ring focus:ring-burgundy-light outline-none transition-all"
          >
            <option value="all">All districts</option>
            {DISTRICT_OPTIONS.map((d) => (
              <option key={d.value} value={d.value}>
                {d.label}
              </option>
            ))}
          </select>
        </label>
      )}
    </div>
  );
}
