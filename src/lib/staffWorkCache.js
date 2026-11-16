import { get, set, del } from 'idb-keyval';
import { supabase } from './supabaseClient';

const CACHE_KEY = 'staff-work-cache-v1';
const PAGE_SIZE = 1000; // must not exceed Supabase max rows setting (default 1000)
const SAFETY_MARGIN_MS = 60 * 1000;

let inflight = null;

const fetchRange = async (from, to, since) => {
  let q = supabase
    .from('Staff Work')
    .select('*')
    .order('No', { ascending: true }) // unique key, stable pagination
    .range(from, to);
  if (since) q = q.gt('Updated_At', since);
  const { data, error } = await q;
  if (error) throw error;
  return data || [];
};

const fetchAll = async (since = null) => {
  let countQ = supabase.from('Staff Work').select('No', { count: 'exact', head: true });
  if (since) countQ = countQ.gt('Updated_At', since);
  const { count, error } = await countQ;
  if (error) throw error;
  if (!count) return [];

  const pages = Math.ceil(count / PAGE_SIZE);
  const results = await Promise.all(
    Array.from({ length: pages }, (_, i) =>
      fetchRange(i * PAGE_SIZE, (i + 1) * PAGE_SIZE - 1, since)
    )
  );
  return results.flat();
};

const computeLastSync = (rows) => {
  const max = rows.reduce((m, r) => {
    const t = r.Updated_At ? Date.parse(r.Updated_At) : 0;
    return t > m ? t : m;
  }, 0);
  return max ? new Date(max - SAFETY_MARGIN_MS).toISOString() : null;
};

export const getStaffWork = ({ forceRefresh = false } = {}) => {
  if (inflight) return inflight;

  inflight = (async () => {
    try {
      const cached = forceRefresh ? null : await get(CACHE_KEY);

      // First ever load (or forced): full parallel download
      if (!cached || !cached.lastSync) {
        const rows = await fetchAll();
        await set(CACHE_KEY, { rows, lastSync: computeLastSync(rows) });
        return rows;
      }

      // Delta sync: only rows inserted or changed since last sync
      const changed = await fetchAll(cached.lastSync);
      const map = new Map(cached.rows.map((r) => [r.No, r]));
      changed.forEach((r) => map.set(r.No, r));
      let rows = Array.from(map.values());

      // Deletion check: merged set can only exceed the server count if rows were deleted
      const { count, error } = await supabase
        .from('Staff Work')
        .select('No', { count: 'exact', head: true });
      if (error) throw error;
      if (count !== rows.length) {
        rows = await fetchAll();
      }

      await set(CACHE_KEY, { rows, lastSync: computeLastSync(rows) });
      return rows;
    } finally {
      inflight = null;
    }
  })();

  return inflight;
};

export const clearStaffWorkCache = () => del(CACHE_KEY);