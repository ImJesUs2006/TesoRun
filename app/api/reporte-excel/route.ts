import { NextResponse } from "next/server";
import ExcelJS from "exceljs";
import { prisma } from "@/lib/prisma";
import { CUOTA_SEMANAL } from "@/lib/config";
import { calcularDeuda } from "@/lib/deuda";

export const dynamic = "force-dynamic";

const formateoFecha = new Intl.DateTimeFormat("es-MX", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

const formateoFechaCorta = new Intl.DateTimeFormat("es-MX", {
  day: "2-digit",
  month: "short",
});

const colorBorde = { style: "thin" as const, color: { argb: "FF000000" } };
const bordeCelda = { top: colorBorde, left: colorBorde, bottom: colorBorde, right: colorBorde };

const rellenoAlDia = { type: "pattern" as const, pattern: "solid" as const, fgColor: { argb: "FFC6EFCE" } };
const rellenoDeuda = { type: "pattern" as const, pattern: "solid" as const, fgColor: { argb: "FFFFC7CE" } };
const rellenoTitulo = { type: "pattern" as const, pattern: "solid" as const, fgColor: { argb: "FF1F2937" } };
const rellenoTotales = { type: "pattern" as const, pattern: "solid" as const, fgColor: { argb: "FFFDE047" } };

export async function GET() {
  const alumnos = await prisma.alumno.findMany({
    orderBy: [{ semanasPagadas: "desc" }, { mejorRacha: "desc" }],
  });
  const config = await prisma.configuracion.findUnique({ where: { id: 1 } });

  const wb = new ExcelJS.Workbook();
  wb.creator = "TesoRun";
  wb.created = new Date();

  const ws = wb.addWorksheet("Tesorería", { views: [{ state: "frozen", ySplit: 3 }] });

  ws.columns = [
    { key: "nombre", width: 26 },
    { key: "estado", width: 20 },
    { key: "semanas", width: 17 },
    { key: "deudaSem", width: 13 },
    { key: "deudaPesos", width: 12 },
    { key: "racha", width: 9 },
    { key: "mejorRacha", width: 12 },
    { key: "ultimoPago", width: 14 },
  ];

  const totalColumnas = ws.columns.length;

  // Filas 1-2: titulo y subtitulo
  ws.mergeCells(1, 1, 1, totalColumnas);
  const titulo = ws.getCell(1, 1);
  titulo.value = "TESORUN - Reporte de tesorería del grupo";
  titulo.font = { size: 16, bold: true, color: { argb: "FFFFFFFF" } };
  titulo.fill = rellenoTitulo;
  titulo.alignment = { vertical: "middle", horizontal: "center" };
  ws.getRow(1).height = 28;

  ws.mergeCells(2, 1, 2, totalColumnas);
  const subtitulo = ws.getCell(2, 1);
  subtitulo.value = `Generado el ${formateoFecha.format(new Date())}${
    config ? ` · Recolección desde el ${formateoFecha.format(config.fechaInicio)}` : ""
  } · Cuota semanal: $${CUOTA_SEMANAL}`;
  subtitulo.alignment = { vertical: "middle", horizontal: "center" };
  subtitulo.font = { italic: true, size: 10 };
  ws.getRow(2).height = 20;

  // Fila 3: encabezados
  const headers = ["Nombre", "Estado", "Semanas pagadas", "Deuda (sem)", "Deuda ($)", "Racha", "Mejor racha", "Último pago"];
  headers.forEach((h, i) => {
    const celda = ws.getCell(3, i + 1);
    celda.value = h;
    celda.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 11 };
    celda.fill = rellenoTitulo;
    celda.border = bordeCelda;
    celda.alignment = { vertical: "middle", horizontal: i === 0 ? "left" : "center" };
  });
  ws.getRow(3).height = 22;

  // Fila de datos
  const filaInicio = 4;
  let fila = filaInicio;
  let totalSemanas = 0;
  let totalDeuda = 0;
  let alDia = 0;

  for (const a of alumnos) {
    const deuda = calcularDeuda(config?.fechaInicio, a.semanasPagadas);
    const atrasado = deuda > 0;
    const montoDeuda = deuda * CUOTA_SEMANAL;
    totalSemanas += a.semanasPagadas;
    totalDeuda += montoDeuda;
    if (!atrasado) alDia += 1;

    const valores: (string | number)[] = [
      a.nombre,
      atrasado ? `Debe ${deuda} sem → $${montoDeuda}` : "Al día",
      a.semanasPagadas,
      deuda,
      montoDeuda,
      a.rachaActual,
      a.mejorRacha,
      a.ultimoPago ? formateoFechaCorta.format(a.ultimoPago) : "—",
    ];
    valores.forEach((v, i) => {
      const celda = ws.getCell(fila, i + 1);
      celda.value = v;
      celda.fill = atrasado ? rellenoDeuda : rellenoAlDia;
      celda.font = {
        bold: false,
        color: { argb: atrasado ? "FF9C0006" : "FF006100" },
      };
      celda.border = bordeCelda;
      celda.alignment = { vertical: "middle", horizontal: i === 0 ? "left" : "center" };
    });

    fila += 1;
  }

  // Fila de totales
  ws.mergeCells(fila, 1, fila, 2);
  const celdaTotal = ws.getCell(fila, 1);
  celdaTotal.value = `TOTAL · ${alumnos.length} alumnos (${alDia} al día)`;
  celdaTotal.font = { bold: true, size: 12 };
  ws.getCell(fila, 3).value = totalSemanas;
  ws.getCell(fila, 5).value = totalDeuda;
  for (let c = 1; c <= totalColumnas; c++) {
    const celda = ws.getCell(fila, c);
    if (celda.value === null) celda.value = "";
    celda.fill = rellenoTotales;
    celda.font = { ...celda.font, bold: true };
    celda.border = bordeCelda;
    celda.alignment = { vertical: "middle", horizontal: c === 1 ? "left" : "center" };
  }
  ws.getRow(fila).height = 22;

  const buf = await wb.xlsx.writeBuffer();

  return new NextResponse(new Uint8Array(buf), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="tesorun-reporte-${new Date()
        .toISOString()
        .slice(0, 10)}.xlsx"`,
    },
  });
}