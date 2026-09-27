import "server-only";
import ExcelJS from "exceljs";

export interface ExcelColumn {
  header: string;
  key: string;
  width?: number;
}

/** Builds a formatted .xlsx workbook buffer: header row, data rows, and an optional bold totals row. */
export async function buildExcelBuffer(params: {
  sheetName: string;
  title?: string;
  columns: ExcelColumn[];
  rows: Record<string, unknown>[];
  totals?: Record<string, unknown>;
}): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "MAYS HR";
  workbook.created = new Date();

  const sheet = workbook.addWorksheet(params.sheetName.slice(0, 31));
  let headerRowIndex = 1;

  if (params.title) {
    sheet.mergeCells(1, 1, 1, params.columns.length);
    const titleCell = sheet.getCell(1, 1);
    titleCell.value = params.title;
    titleCell.font = { bold: true, size: 14 };
    headerRowIndex = 3;
  }

  sheet.getRow(headerRowIndex).values = params.columns.map((c) => c.header);
  sheet.getRow(headerRowIndex).font = { bold: true };
  sheet.getRow(headerRowIndex).eachCell((cell) => {
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE7F5F2" } };
    cell.border = { bottom: { style: "thin" } };
  });
  sheet.columns = params.columns.map((c) => ({ key: c.key, width: c.width ?? 18 }));

  for (const row of params.rows) {
    sheet.addRow(row);
  }

  if (params.totals) {
    const totalRow = sheet.addRow(params.totals);
    totalRow.font = { bold: true };
    totalRow.eachCell((cell) => {
      cell.border = { top: { style: "thin" } };
    });
  }

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

export function excelResponse(buffer: Buffer, filename: string): Response {
  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
