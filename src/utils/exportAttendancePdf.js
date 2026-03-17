import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const CATEGORY_LABELS = {
  iniciacion_hombres: 'Iniciacion Hombres',
  iniciacion_mujeres: 'Iniciacion Mujeres',
  perfeccionamiento_hombres: 'Perfeccionamiento Hombres',
  perfeccionamiento_mujeres: 'Perfeccionamiento Mujeres',
  master_mujeres: 'Master Mujeres'
};

const buildFileName = (exportDate) => {
  const safeDate = exportDate || 'sin-fecha';
  return `reporte-asistencia-${safeDate}.pdf`;
};

const getAthleteName = (athlete) => {
  const firstName = athlete?.users?.nombre || athlete?.nombre || '';
  const lastName = athlete?.users?.apellido || athlete?.apellido || '';
  const fullName = `${firstName} ${lastName}`.trim();
  return fullName || 'Sin nombre';
};

const splitCategories = (attendancesData) => {
  const iniciacion = attendancesData.filter((a) => (
    a.categoria === 'iniciacion_hombres' || a.categoria === 'iniciacion_mujeres'
  ));

  const perfHombres = attendancesData.filter((a) => (
    a.categoria === 'perfeccionamiento_hombres'
  ));

  const perfMujeres = attendancesData.filter((a) => (
    a.categoria === 'perfeccionamiento_mujeres' || a.categoria === 'master_mujeres'
  ));

  return {
    iniciacion,
    perfHombres,
    perfMujeres
  };
};

const addSectionHeader = (doc, text, y) => {
  doc.setFillColor(30, 58, 138);
  doc.rect(14, y - 6, 182, 8, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(11);
  doc.text(text, 16, y);
  doc.setTextColor(0, 0, 0);
};

const buildRows = (list, getPaymentMethodName, includeCategory = false) => {
  if (!list.length) {
    const cols = includeCategory ? 4 : 3;
    return [[{ content: 'Sin asistencias', colSpan: cols, styles: { halign: 'center', textColor: [120, 120, 120] } }]];
  }

  return list.map((athlete, index) => {
    const row = [
      index + 1,
      getAthleteName(athlete),
      getPaymentMethodName(athlete?.attendance?.metodo_pago_id)
    ];

    if (includeCategory) {
      row.splice(2, 0, CATEGORY_LABELS[athlete?.categoria] || 'Sin categoria');
    }

    return row;
  });
};

export const exportAttendancePdf = ({
  exportDate,
  formattedDate,
  attendancesData,
  observations,
  getPaymentMethodName
}) => {
  if (!Array.isArray(attendancesData) || attendancesData.length === 0) {
    throw new Error('No hay asistencias registradas para exportar en la fecha seleccionada.');
  }

  const { iniciacion, perfHombres, perfMujeres } = splitCategories(attendancesData);
  const iniciacionHombres = iniciacion.filter((a) => a.categoria === 'iniciacion_hombres');
  const iniciacionMujeres = iniciacion.filter((a) => a.categoria === 'iniciacion_mujeres');

  const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });

  doc.setFontSize(15);
  doc.text('RIO VOLEY - Control de Asistencias', 14, 16);
  doc.setFontSize(10);
  doc.setTextColor(90, 90, 90);
  doc.text(`Fecha: ${formattedDate || exportDate}`, 14, 22);
  doc.setTextColor(0, 0, 0);

  let y = 31;
  addSectionHeader(doc, '1. INICIACION', y);

  autoTable(doc, {
    startY: y + 3,
    head: [['#', 'Nombre', 'Metodo de Pago']],
    body: buildRows(iniciacionHombres, getPaymentMethodName),
    styles: { fontSize: 9 },
    headStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0] },
    margin: { left: 14, right: 14 }
  });

  y = doc.lastAutoTable.finalY + 7;
  autoTable(doc, {
    startY: y,
    head: [['#', 'Nombre', 'Metodo de Pago']],
    body: buildRows(iniciacionMujeres, getPaymentMethodName),
    styles: { fontSize: 9 },
    headStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0] },
    margin: { left: 14, right: 14 }
  });

  y = doc.lastAutoTable.finalY + 8;
  addSectionHeader(doc, '2. PERFECCIONAMIENTO - HOMBRES', y);
  autoTable(doc, {
    startY: y + 3,
    head: [['#', 'Nombre', 'Metodo de Pago']],
    body: buildRows(perfHombres, getPaymentMethodName),
    styles: { fontSize: 9 },
    headStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0] },
    margin: { left: 14, right: 14 }
  });

  y = doc.lastAutoTable.finalY + 8;
  addSectionHeader(doc, '3. PERFECCIONAMIENTO - MUJERES', y);
  autoTable(doc, {
    startY: y + 3,
    head: [['#', 'Nombre', 'Categoria', 'Metodo de Pago']],
    body: buildRows(perfMujeres, getPaymentMethodName, true),
    styles: { fontSize: 9 },
    headStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0] },
    margin: { left: 14, right: 14 }
  });

  y = doc.lastAutoTable.finalY + 8;
  addSectionHeader(doc, 'RESUMEN GENERAL', y);
  autoTable(doc, {
    startY: y + 3,
    head: [['Categoria', 'Total Asistencias']],
    body: [
      ['Iniciacion', iniciacion.length],
      ['Perfeccionamiento Hombres', perfHombres.length],
      ['Perfeccionamiento Mujeres', perfMujeres.length],
      ['TOTAL', attendancesData.length]
    ],
    styles: { fontSize: 9 },
    headStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0] },
    margin: { left: 14, right: 14 }
  });

  if (observations?.trim()) {
    y = doc.lastAutoTable.finalY + 10;

    if (y > 260) {
      doc.addPage();
      y = 18;
    }

    doc.setFontSize(11);
    doc.text('Observaciones:', 14, y);
    doc.setFontSize(9);
    const wrappedText = doc.splitTextToSize(observations.trim(), 180);
    doc.text(wrappedText, 14, y + 6);
  }

  doc.save(buildFileName(exportDate));
};
