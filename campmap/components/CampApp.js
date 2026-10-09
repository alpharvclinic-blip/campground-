'use client';

import { useEffect, useRef, useState } from 'react';
import MapView from './MapView';
import { STATES, US_VIEW } from '../lib/states';
import { PIN_COLORS } from '../lib/pins';
import { loadGroups, saveGroups } from '../lib/storage';
import { geocodeAddress } from '../lib/geocode';
import { parseWorkbook } from '../lib/parse';

export default function CampApp() {
  const [groups, setGroups] = useState([]);
  const [stateName, setStateName] = useState('');
  const [target, setTarget] = useState(null);

  const [file, setFile] = useState(null);
  const [groupName, setGroupName] = useState('');
  const [color, setColor] = useState(PIN_COLORS[0].hex);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState('');
  const [error, setError] = useState('');
  const fileInput = useRef(null);

  useEffect(() => {
    setGroups(loadGroups());
  }, []);

  function commit(next) {
    saveGroups(next);
    setGroups(next);
  }

  function toggleGroup(id) {
    commit(groups.map((g) => (g.id === id ? { ...g, visible: !g.visible } : g)));
  }

  function deleteGroup(id) {
    const group = groups.find((g) => g.id === id);
    if (!group) return;
    if (!window.confirm(`Delete the group "${group.name}"?`)) return;
    commit(groups.filter((g) => g.id !== id));
  }

  function onStateChange(e) {
    const value = e.target.value;
    setStateName(value);
    if (!value) {
      setTarget({ center: US_VIEW.center, zoom: US_VIEW.zoom });
      return;
    }
    const state = STATES.find((s) => s.name === value);
    if (state) setTarget({ center: state.center, zoom: state.zoom });
  }

  async function handleImport(e) {
    e.preventDefault();
    setError('');
    setProgress('');

    const name = groupName.trim();
    if (!file) return setError('Choose an Excel file first.');
    if (!name) return setError('Name the group before importing.');
    if (groups.some((g) => g.name.toLowerCase() === name.toLowerCase())) {
      return setError('A group with that name already exists. Choose another name.');
    }

    setBusy(true);
    try {
      const rows = await parseWorkbook(file);
      if (rows.length === 0) throw new Error('No campground rows were found in the file.');

      const places = [];
      const failed = [];

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        setProgress(`Placing ${i + 1} of ${rows.length}…`);

        if (row.lat !== null && row.lng !== null) {
          places.push({ name: row.name, address: row.address, notes: row.notes, lat: row.lat, lng: row.lng });
          continue;
        }

        if (!row.address) {
          failed.push({ row: row.row, name: row.name, address: '', reason: 'No address' });
          continue;
        }

        try {
          const point = await geocodeAddress(row.address);
          if (point) {
            places.push({ name: row.name, address: row.address, notes: row.notes, lat: point.lat, lng: point.lng });
          } else {
            failed.push({ row: row.row, name: row.name, address: row.address, reason: 'Address not found' });
          }
        } catch (err) {
          failed.push({ row: row.row, name: row.name, address: row.address, reason: `Lookup error: ${err.message}` });
        }
      }

      const group = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        name,
        color,
        visible: true,
        places,
        failed,
      };

      // Read the latest saved groups so nothing is overwritten.
      commit([...loadGroups(), group]);

      setProgress(`Finished: ${places.length} placed, ${failed.length} not placed. See the group in the list.`);
      setFile(null);
      setGroupName('');
      if (fileInput.current) fileInput.current.value = '';
    } catch (err) {
      setError(err.message || 'The import failed.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="app">
      <aside className="sidebar">
        <h1>Campground Map</h1>

        <h2>Find a state</h2>
        <select value={stateName} onChange={onStateChange}>
          <option value="">All of USA</option>
          {STATES.map((s) => (
            <option key={s.name} value={s.name}>
              {s.name}
            </option>
          ))}
        </select>

        <h2>Import an Excel file</h2>
        <form onSubmit={handleImport}>
          <label>
            Excel file (.xlsx, .xls, or .csv)
            <input
              ref={fileInput}
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={(e) => setFile(e.target.files[0] || null)}
            />
          </label>
          <label>
            Group name
            <input
              type="text"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="e.g. Summer trip"
            />
          </label>
          <label>
            Pin color
            <select value={color} onChange={(e) => setColor(e.target.value)}>
              {PIN_COLORS.map((c) => (
                <option key={c.hex} value={c.hex}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          <button type="submit" disabled={busy}>
            {busy ? 'Importing…' : 'Import group'}
          </button>
        </form>

        {busy && <p className="msg">Keep this tab open. Addresses are looked up about one per second.</p>}
        {progress && <p className="msg">{progress}</p>}
        {error && <p className="msg error">{error}</p>}

        <h2>Saved groups</h2>
        {groups.length === 0 && <p className="msg">No groups yet. Import an Excel file above.</p>}
        <ul className="groups">
          {groups.map((g) => (
            <li key={g.id}>
              <div className="group-row">
                <label>
                  <input type="checkbox" checked={g.visible} onChange={() => toggleGroup(g.id)} />
                  <span className="swatch" style={{ background: g.color }} />
                  {g.name} ({g.places.length})
                </label>
                <button type="button" onClick={() => deleteGroup(g.id)}>
                  Delete
                </button>
              </div>
              {g.failed.length > 0 && (
                <details className="failed">
                  <summary>{g.failed.length} not placed</summary>
                  <ul>
                    {g.failed.map((f, i) => (
                      <li key={i}>
                        Row {f.row}: {f.name}
                        {f.address ? ` (${f.address})` : ''} – {f.reason}
                      </li>
                    ))}
                  </ul>
                </details>
              )}
            </li>
          ))}
        </ul>
      </aside>

      <main className="map">
        <MapView groups={groups} target={target} />
      </main>
    </div>
  );
}
