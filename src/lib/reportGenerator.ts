import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { FinancialMetrics } from "./financialMetrics";

interface ReportData {
  date: Date;
  todayMetrics: FinancialMetrics;
  yesterdayMetrics: FinancialMetrics;
  salesByHour: { hour: number; total: number }[];
  topProducts: { name: string; qty: number; revenue: number }[];
}

export const generateDailyReport = (data: ReportData) => {
  const doc = new jsPDF();
  const dateStr = data.date.toLocaleDateString("es-HN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric"
  });

  // Header con marca
  doc.setFillColor(232, 89, 60);
  doc.rect(0, 0, 210, 30, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.text("BRASA CLANDESTINA", 14, 15);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("Reporte de Operación Diaria", 14, 22);

  // Fecha
  doc.setTextColor(80, 80, 80);
  doc.setFontSize(11);
  doc.text(dateStr.charAt(0).toUpperCase() + dateStr.slice(1), 14, 40);

  // Sección: KPIs Financieros
  doc.setTextColor(20, 20, 20);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("Resumen Financiero", 14, 55);
  doc.setDrawColor(232, 89, 60);
  doc.setLineWidth(0.5);
  doc.line(14, 57, 196, 57);

  autoTable(doc, {
    startY: 62,
    head: [["Métrica", "Hoy", "Ayer", "Cambio"]],
    body: [
      [
        "Ventas Totales",
        `L ${data.todayMetrics.totalSales.toFixed(2)}`,
        `L ${data.yesterdayMetrics.totalSales.toFixed(2)}`,
        getChangeText(
          data.todayMetrics.totalSales, 
          data.yesterdayMetrics.totalSales
        )
      ],
      [
        "Utilidad Bruta",
        `L ${data.todayMetrics.grossProfit.toFixed(2)}`,
        `L ${data.yesterdayMetrics.grossProfit.toFixed(2)}`,
        getChangeText(
          data.todayMetrics.grossProfit,
          data.yesterdayMetrics.grossProfit
        )
      ],
      [
        "Costo de Insumos",
        `L ${data.todayMetrics.totalCost.toFixed(2)}`,
        `L ${data.yesterdayMetrics.totalCost.toFixed(2)}`,
        "—"
      ],
      [
        "Margen %",
        `${data.todayMetrics.marginPercent.toFixed(1)}%`,
        `${data.yesterdayMetrics.marginPercent.toFixed(1)}%`,
        "—"
      ],
      [
        "Food Cost %",
        `${data.todayMetrics.foodCostPercent.toFixed(1)}%`,
        `${data.yesterdayMetrics.foodCostPercent.toFixed(1)}%`,
        "—"
      ],
      [
        "Órdenes",
        `${data.todayMetrics.orderCount}`,
        `${data.yesterdayMetrics.orderCount}`,
        getChangeText(
          data.todayMetrics.orderCount,
          data.yesterdayMetrics.orderCount
        )
      ],
      [
        "Ticket Promedio",
        `L ${data.todayMetrics.avgTicket.toFixed(2)}`,
        `L ${data.yesterdayMetrics.avgTicket.toFixed(2)}`,
        "—"
      ],
    ],
    theme: "striped",
    headStyles: { 
      fillColor: [232, 89, 60], 
      textColor: 255, 
      fontStyle: "bold" 
    },
    styles: { fontSize: 10 },
    margin: { left: 14, right: 14 }
  });

  // Sección: Ventas por hora
  const yPos1 = (doc as any).lastAutoTable.finalY + 15;
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(20, 20, 20);
  doc.text("Ventas por Hora", 14, yPos1);
  doc.line(14, yPos1 + 2, 196, yPos1 + 2);

  autoTable(doc, {
    startY: yPos1 + 7,
    head: [["Hora", "Ventas"]],
    body: data.salesByHour.map(h => [
      `${h.hour > 12 ? h.hour - 12 : h.hour}${h.hour >= 12 ? "pm" : "am"}`,
      `L ${h.total.toFixed(2)}`
    ]),
    theme: "grid",
    headStyles: { 
      fillColor: [232, 89, 60], 
      textColor: 255, 
      fontStyle: "bold" 
    },
    styles: { fontSize: 10 },
    margin: { left: 14, right: 14 }
  });

  // Sección: Top productos
  const yPos2 = (doc as any).lastAutoTable.finalY + 15;
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("Top Productos", 14, yPos2);
  doc.line(14, yPos2 + 2, 196, yPos2 + 2);

  if (data.topProducts.length === 0) {
    doc.setFontSize(10);
    doc.setFont("helvetica", "italic");
    doc.setTextColor(120, 120, 120);
    doc.text("No hay productos vendidos hoy.", 14, yPos2 + 10);
  } else {
    autoTable(doc, {
      startY: yPos2 + 7,
      head: [["#", "Producto", "Cantidad", "Ingresos"]],
      body: data.topProducts.map((p, i) => [
        `${i + 1}`,
        p.name,
        `${p.qty}`,
        `L ${p.revenue.toFixed(2)}`
      ]),
      theme: "striped",
      headStyles: { 
        fillColor: [232, 89, 60], 
        textColor: 255, 
        fontStyle: "bold" 
      },
      styles: { fontSize: 10 },
      margin: { left: 14, right: 14 }
    });
  }

  // Footer
  const pageHeight = doc.internal.pageSize.height;
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.setFont("helvetica", "italic");
  doc.text(
    `Generado el ${new Date().toLocaleString("es-HN")} · Brasa Clandestina · San Pedro Sula`,
    14, 
    pageHeight - 10
  );

  // Descargar
  const fileName = `BrasaClandestina_${data.date.toISOString().split("T")[0]}.pdf`;
  doc.save(fileName);
};

function getChangeText(current: number, previous: number): string {
  if (previous === 0) return current > 0 ? "Nuevo" : "—";
  const change = ((current - previous) / previous) * 100;
  const arrow = change > 0 ? "↑" : change < 0 ? "↓" : "→";
  return `${arrow} ${Math.abs(change).toFixed(1)}%`;
}
