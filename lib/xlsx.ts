import writeXlsxFile, { type SheetData } from "write-excel-file/node";

type ExportCell = string | number | null | undefined;

const HEADER_STYLE = {
  fontWeight: "bold" as const,
  textColor: "#102C53",
  backgroundColor: "#E7F7FF",
  borderColor: "#C9D9E8",
  borderStyle: "thin" as const,
};

function normalizeCellValue(value: ExportCell) {
  return value == null ? "" : String(value);
}

export async function toXlsx(
  headers: string[],
  rows: ExportCell[][],
  sheetName: string,
) {
  const sheetData: SheetData = [
    headers.map((header) => ({
      value: header,
      type: String,
      ...HEADER_STYLE,
    })),
    ...rows.map((row) =>
      row.map((value) => ({
        value: normalizeCellValue(value),
        type: String,
        borderColor: "#DEEBF6",
        borderStyle: "thin" as const,
      })),
    ),
  ];

  return writeXlsxFile(sheetData, {
    sheet: sheetName,
    stickyRowsCount: 1,
    columns: headers.map((header) => ({ width: Math.max(14, Math.min(34, header.length + 8)) })),
  }).toBuffer();
}

export function xlsxDownloadResponse(filename: string, buffer: Buffer) {
  return new Response(new Uint8Array(buffer), {
    headers: {
      "content-type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "content-disposition": `attachment; filename="${filename}"`,
      "cache-control": "no-store",
    },
  });
}
