/**
 * Reusable utility for CSV generation and parsing.
 * Handles quoting for fields containing commas, newlines, or double quotes.
 */

/**
 * Converts an array of objects to a CSV string.
 * @param data Array of objects to convert.
 * @returns CSV string.
 */
export function jsonToCsv(data: Record<string, unknown>[]): string {
  if (!data || data.length === 0) return '';

  // Get headers from all objects to ensure no optional fields are missed
  const headerSet = new Set<string>();
  data.forEach(row => {
    Object.keys(row).forEach(key => {
      if (!key.startsWith('_') && key !== '__v') {
        headerSet.add(key);
      }
    });
  });
  const headers = Array.from(headerSet);
  
  const csvRows = [];
  
  // Add header row
  csvRows.push(headers.join(','));
  
  // Add data rows
  for (const row of data) {
    const values = headers.map(header => {
      const val = row[header];
      
      // Handle null/undefined
      if (val === null || val === undefined) return '';
      
      // Convert to string and escape double quotes
      const escaped = String(val).replace(/"/g, '""');
      
      // Wrap in double quotes if it contains a comma, newline, or double quote
      if (escaped.includes(',') || escaped.includes('\n') || escaped.includes('"')) {
        return `"${escaped}"`;
      }
      
      return escaped;
    });
    csvRows.push(values.join(','));
  }
  
  return csvRows.join('\n');
}

/**
 * Parses a CSV string into an array of objects.
 * @param csv CSV string to parse.
 * @returns Array of objects.
 */
export function csvToJson(csv: string): Record<string, unknown>[] {
  if (!csv || csv.trim() === '') return [];

  const lines = csv.split(/\r?\n/);
  if (lines.length < 2) return [];

  const headers = lines[0].split(',');
  const result: Record<string, unknown>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (line.trim() === '') continue;

    // A more robust regex to handle quoted commas
    const values: string[] = [];
    let currentVal = '';
    let inQuotes = false;
    
    for (let charIndex = 0; charIndex < line.length; charIndex++) {
      const char = line[charIndex];
      if (char === '"' && line[charIndex + 1] === '"') {
        currentVal += '"';
        charIndex++;
      } else if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(currentVal);
        currentVal = '';
      } else {
        currentVal += char;
      }
    }
    values.push(currentVal);

    const obj: Record<string, unknown> = {};
    headers.forEach((header, index) => {
      const val = values[index];
      // Try to parse numbers or booleans
      if (val === 'true') obj[header] = true;
      else if (val === 'false') obj[header] = false;
      else if (!isNaN(Number(val)) && val !== '') obj[header] = Number(val);
      else obj[header] = val;
    });
    
    result.push(obj);
  }

  return result;
}
