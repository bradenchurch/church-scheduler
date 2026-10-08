import React, { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import AdminAvailability from '../pages/AdminAvailability';
import { expandPattern } from '../../shared/availability.js';

const STATES = ['empty', 'loading', 'list', 'editor', 'overlap', 'saved', 'error'];

if (typeof localStorage !== 'undefined') {
  localStorage.removeItem('eq-confirmations-banner-until');
}

function withIds(rows, prefix) {
  return rows.map((row, index) => ({
    ...row,
    id: `${prefix}-${index}`,
    series_id: '11111111-1111-4111-8111-111111111111',
    booked_count: index === 0 ? 1 : 0,
  }));
}

function rememberSave(payload) {
  window.__availabilitySaves = (window.__availabilitySaves || 0) + 1;
  return {
    created: payload.windows.map((row, index) => ({
      ...row,
      id: `saved-${index}`,
      series_id: payload.series_id,
      booked_count: 0,
    })),
    skipped_existing: [],
    conflicts: [],
    series_id: payload.series_id,
  };
}

const colePrefill = {
  weekdays: [1, 2, 3, 4, 5],
  start: '19:00',
  end: '21:00',
  slot: 15,
  from: '2026-10-08',
  to: '2026-11-20',
};

export default function AvailabilityPreview() {
  const [params] = useSearchParams();
  const requested = params.get('state') || 'empty';
  const state = STATES.includes(requested) ? requested : 'empty';

  const fixture = useMemo(() => {
    const list = withIds(expandPattern({
      ranges: [{ weekdays: [4, 5], start: '19:00', end: '21:00' }],
      slot: 30,
      from: '2026-10-08',
      to: '2026-10-16',
    }), 'list');
    const base = {
      leaderId: 'cole',
      role: 'leader',
      leaderUuid: '00000000-0000-4000-8000-000000000001',
      googleConnected: true,
      onSave: async (payload) => {
        await new Promise((resolve) => { setTimeout(resolve, 250); });
        return rememberSave(payload);
      },
    };
    if (state === 'loading') {
      return { ...base, loading: true, editor: 'pattern', windows: [] };
    }
    if (state === 'list') {
      return { ...base, windows: list };
    }
    if (state === 'editor') {
      return { ...base, windows: [], editor: 'pattern', prefill: colePrefill };
    }
    if (state === 'overlap') {
      return {
        ...base,
        editor: 'pattern',
        prefill: colePrefill,
        windows: [{
          id: 'overlap-1',
          leader_id: 'cole',
          window_date: '2026-10-09',
          start_time: '18:00',
          end_time: '20:00',
          slot_duration_minutes: 30,
          buffer_minutes: 0,
          booked_count: 1,
          series_id: null,
        }],
      };
    }
    if (state === 'saved') {
      return {
        ...base,
        windows: list,
        freshIds: list.map((row) => row.id),
        toast: {
          text: `Saved ${list.length} windows.`,
          undo: true,
          persist: true,
          ids: list.map((row) => row.id),
        },
      };
    }
    if (state === 'error') {
      return { ...base, loadError: "Couldn't load your availability.", windows: [] };
    }
    return { ...base, googleConnected: false, windows: [] };
  }, [state]);

  return (
    <div data-preview-state={state}>
      <AdminAvailability key={state} fixture={fixture} />
    </div>
  );
}
