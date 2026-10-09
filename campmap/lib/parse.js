import * as XLSX from 'xlsx';

const clean = (value) => (value === undefined || value === null ? '' : String(value).trim());
const normalize = (text) => String(text).trim().toLowerCase().replace(/[\s_-]+/g, ' ');

// Returns the first normalized header that matches one of the patterns, in priority order.
function pick(headers, patterns) {
  for (const pattern of patterns) {
    const found = headers.find((h) => pattern.test(h));
    if (found) return found;
  }
  return null;
}

// Reads the first sheet of an .xlsx, .xls, or .csv file.
// Returns [{ row, name, address, notes, lat, lng }]. lat and lng are null when not provided.
export async function parseWorkbook(file) {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array' });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  if (!sheet) throw new Error('The file has no sheets.');

  const json = XLSX.utils.sheet_to_json(sheet, { defval: '', raw: false });
  if (json.length === 0) {
    throw new Error('No rows found. Make sure row 1 holds column headers and data is below it.');
  }

  const originalByNormalized = {};
  Object.keys(json[0]).forEach((h) => {
    originalByNormalized[normalize(h)] = h;
  });
  const headers = Object.keys(originalByNormalized);

  const nameCol = pick(headers, [/^(name|campground|campground name|park|park name)$/, /(name|campground|park)/]);
  const addressCol = pick(headers, [/^(address|street address|street|address line 1|addr)$/, /address|street/]);
  const cityCol = pick(headers, [/^city$/]);
  const stateCol = pick(headers, [/^(state|st)$/]);
  const zipCol = pick(headers, [/^(zip|zip code|zipcode|postal code|postal)$/]);
  const notesCol = pick(headers, [/^(notes|note|comments|comment|description)$/, /note|comment/]);
  const latCol = pick(headers, [/^(lat|latitude)$/]);
  const lngCol = pick(headers, [/^(lng|lon|long|longitude)$/]);

  if (!addressCol) {
    throw new Error('Could not find an address column. Add a column named "Address".');
  }

  const get = (row, col) => (col ? clean(row[originalByNormalized[col]]) : '');

  const rows = [];
  json.forEach((raw, index) => {
    const blank = Object.values(raw).every((v) => clean(v) === '');
    if (blank) return;

    const address = [get(raw, addressCol), get(raw, cityCol), get(raw, stateCol), get(raw, zipCol)]
      .filter(Boolean)
      .join(', ');

    const lat = parseFloat(get(raw, latCol));
    const lng = parseFloat(get(raw, lngCol));
    const hasCoords =
      Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180;

    rows.push({
      row: index + 2, // row 1 is the header
      name: get(raw, nameCol) || `Row ${index + 2}`,
      address,
      notes: get(raw, notesCol),
      lat: hasCoords ? lat : null,
      lng: hasCoords ? lng : null,
    });
  });

  return rows;
}
