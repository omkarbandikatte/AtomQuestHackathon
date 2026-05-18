import * as XLSX from "xlsx";

interface ExportColumn {
  header: string;
  key: string;
}

/**
 * Exports data as an Excel/CSV file download in the browser.
 * Pure client-side — no server dependency.
 */
export function exportToExcel<T extends Record<string, unknown>>(
  data: T[],
  columns: ExportColumn[],
  filename: string,
): void {
  const worksheetData = data.map((row) =>
    columns.reduce<Record<string, unknown>>((acc, col) => {
      acc[col.header] = row[col.key];
      return acc;
    }, {}),
  );

  const worksheet = XLSX.utils.json_to_sheet(worksheetData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Report");
  XLSX.writeFile(workbook, `${filename}.xlsx`);
}

export function exportToCSV<T extends Record<string, unknown>>(
  data: T[],
  columns: ExportColumn[],
  filename: string,
): void {
  const worksheetData = data.map((row) =>
    columns.reduce<Record<string, unknown>>((acc, col) => {
      acc[col.header] = row[col.key];
      return acc;
    }, {}),
  );

  const worksheet = XLSX.utils.json_to_sheet(worksheetData);
  const csv = XLSX.utils.sheet_to_csv(worksheet);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${filename}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}
