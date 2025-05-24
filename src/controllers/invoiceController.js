const { PrismaClient } = require('@prisma/client');
const PDFDocument = require('pdfkit');
const nodemailer = require('nodemailer');
const fs = require('fs');

const prisma = new PrismaClient();

// Listar facturas
exports.getAll = async (req, res) => {
  try {
    const invoices = await prisma.invoice.findMany({
      include: {
        order: {
          include: {
            table: true,
            user: true,
            items: { include: { product: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(invoices);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener facturas', error });
  }
};

// Crear factura (al cerrar pedido)
exports.create = async (req, res) => {
  const { orderId, subtotal, tax, total, paymentDetails } = req.body;
  try {
    // Calcular el total pagado
    const totalPagado = Array.isArray(paymentDetails)
      ? paymentDetails.reduce((acc, p) => acc + Number(p.amount || 0), 0)
      : 0;
    // Determinar el estado de la factura
    const status = totalPagado >= total ? 'PAID' : 'PENDING';
    // Generar número de factura único
    const lastInvoice = await prisma.invoice.findFirst({ orderBy: { createdAt: 'desc' } });
    const number = lastInvoice ? `F-${parseInt(lastInvoice.number.split('-')[1] || '0') + 1}` : 'F-1';
    const invoice = await prisma.invoice.create({
      data: {
        number,
        orderId,
        subtotal,
        tax,
        total,
        status,
        paymentDetails,
      },
      include: {
        order: {
          include: {
            table: true,
            user: true,
            items: { include: { product: true } },
          },
        },
      },
    });
    // Actualizar estado del pedido relacionado
    await prisma.order.update({
      where: { id: orderId },
      data: { paymentStatus: status },
    });
    res.status(201).json(invoice);
  } catch (error) {
    res.status(500).json({ message: 'Error al crear factura', error });
  }
};

// Ver detalle de factura
exports.getById = async (req, res) => {
  const { id } = req.params;
  try {
    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        order: {
          include: {
            table: true,
            user: true,
            items: { include: { product: true } },
          },
        },
      },
    });
    if (!invoice) return res.status(404).json({ message: 'Factura no encontrada' });
    res.json(invoice);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener factura', error });
  }
};

// Anular factura
exports.cancel = async (req, res) => {
  const { id } = req.params;
  try {
    const invoice = await prisma.invoice.update({
      where: { id },
      data: { status: 'CANCELLED' },
    });
    res.json({ message: 'Factura anulada', invoice });
  } catch (error) {
    res.status(500).json({ message: 'Error al anular factura', error });
  }
};

// Descargar PDF de factura (real)
exports.downloadPDF = async (req, res) => {
  const { id } = req.params;
  try {
    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        order: {
          include: {
            table: true,
            user: true,
            items: { include: { product: true } },
          },
        },
      },
    });
    if (!invoice) return res.status(404).json({ message: 'Factura no encontrada' });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="factura_${invoice.number}.pdf"`);

    const doc = new PDFDocument({ margin: 40, size: 'A4' });
    doc.pipe(res);

    // Encabezado
    doc.fontSize(20).text('Factura', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text(`N°: ${invoice.number}`);
    doc.text(`Fecha: ${new Date(invoice.createdAt).toLocaleString('es-ES')}`);
    doc.text(`Mesa: ${invoice.order?.table?.number || '-'}`);
    doc.text(`Atendido por: ${invoice.order?.user?.name || '-'}`);
    doc.text(`Pedido: ${invoice.order?.id}`);

    // Métodos de pago
    if (invoice.paymentDetails && Array.isArray(invoice.paymentDetails) && invoice.paymentDetails.length > 0) {
      doc.fontSize(14).text('Pagos:', { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(12);
      invoice.paymentDetails.forEach((p, idx) => {
        doc.text(`Pago ${idx + 1}: $${Number(p.amount).toFixed(2)} - ${p.method || ''}`);
      });
      doc.moveDown();
    } else {
      doc.text(`Método de pago: ${invoice.order?.paymentMethod || '-'}`);
      doc.moveDown();
    }

    // Productos
    doc.fontSize(14).text('Productos:', { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(12);
    doc.text('Producto', 50, doc.y, { continued: true });
    doc.text('Cantidad', 200, doc.y, { continued: true });
    doc.text('Precio', 300, doc.y, { continued: true });
    doc.text('Total', 400, doc.y);
    doc.moveDown(0.2);
    doc.moveTo(50, doc.y).lineTo(500, doc.y).stroke();
    invoice.order?.items?.forEach(item => {
      doc.text(item.product?.name, 50, doc.y, { continued: true });
      doc.text(item.quantity.toString(), 200, doc.y, { continued: true });
      doc.text(`$${item.price.toFixed(2)}`, 300, doc.y, { continued: true });
      doc.text(`$${(item.price * item.quantity).toFixed(2)}`, 400, doc.y);
    });
    doc.moveDown();

    // Totales
    doc.fontSize(12).text(`Subtotal: $${invoice.subtotal.toFixed(2)}`, { align: 'right' });
    doc.text(`Impuestos: $${invoice.tax.toFixed(2)}`, { align: 'right' });
    doc.fontSize(14).text(`Total: $${invoice.total.toFixed(2)}`, { align: 'right', underline: true });

    doc.end();
  } catch (error) {
    res.status(500).json({ message: 'Error al generar PDF', error });
  }
};

// Enviar factura por email
exports.sendByEmail = async (req, res) => {
  const { id } = req.params;
  const { to } = req.body;
  try {
    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        order: {
          include: {
            table: true,
            user: true,
            items: { include: { product: true } },
          },
        },
      },
    });
    if (!invoice) return res.status(404).json({ message: 'Factura no encontrada' });

    // Generar PDF temporal
    const pdfPath = `tmp/factura_${invoice.number}.pdf`;
    await new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 40, size: 'A4' });
      const stream = fs.createWriteStream(pdfPath);
      doc.pipe(stream);
      // ... (reutilizar la lógica de downloadPDF para el contenido) ...
      doc.fontSize(20).text('Factura', { align: 'center' });
      doc.moveDown();
      doc.fontSize(12).text(`N°: ${invoice.number}`);
      doc.text(`Fecha: ${new Date(invoice.createdAt).toLocaleString('es-ES')}`);
      doc.text(`Mesa: ${invoice.order?.table?.number || '-'}`);
      doc.text(`Atendido por: ${invoice.order?.user?.name || '-'}`);
      doc.text(`Pedido: ${invoice.order?.id}`);
      // Métodos de pago
      if (invoice.paymentDetails && Array.isArray(invoice.paymentDetails) && invoice.paymentDetails.length > 0) {
        doc.fontSize(14).text('Pagos:', { underline: true });
        doc.moveDown(0.5);
        doc.fontSize(12);
        invoice.paymentDetails.forEach((p, idx) => {
          doc.text(`Pago ${idx + 1}: $${Number(p.amount).toFixed(2)} - ${p.method || ''}`);
        });
        doc.moveDown();
      } else {
        doc.text(`Método de pago: ${invoice.order?.paymentMethod || '-'}`);
        doc.moveDown();
      }
      doc.fontSize(14).text('Productos:', { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(12);
      doc.text('Producto', 50, doc.y, { continued: true });
      doc.text('Cantidad', 200, doc.y, { continued: true });
      doc.text('Precio', 300, doc.y, { continued: true });
      doc.text('Total', 400, doc.y);
      doc.moveDown(0.2);
      doc.moveTo(50, doc.y).lineTo(500, doc.y).stroke();
      invoice.order?.items?.forEach(item => {
        doc.text(item.product?.name, 50, doc.y, { continued: true });
        doc.text(item.quantity.toString(), 200, doc.y, { continued: true });
        doc.text(`$${item.price.toFixed(2)}`, 300, doc.y, { continued: true });
        doc.text(`$${(item.price * item.quantity).toFixed(2)}`, 400, doc.y);
      });
      doc.moveDown();
      doc.fontSize(12).text(`Subtotal: $${invoice.subtotal.toFixed(2)}`, { align: 'right' });
      doc.text(`Impuestos: $${invoice.tax.toFixed(2)}`, { align: 'right' });
      doc.fontSize(14).text(`Total: $${invoice.total.toFixed(2)}`, { align: 'right', underline: true });
      doc.end();
      stream.on('finish', resolve);
      stream.on('error', reject);
    });

    // Configurar transporte SMTP
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    // Enviar email
    await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to,
      subject: `Factura ${invoice.number} - RestBar`,
      text: `Adjuntamos la factura ${invoice.number} de su consumo en RestBar.`,
      attachments: [
        {
          filename: `factura_${invoice.number}.pdf`,
          path: pdfPath,
        },
      ],
    });
    // Eliminar PDF temporal
    fs.unlinkSync(pdfPath);
    res.json({ message: 'Factura enviada por email' });
  } catch (error) {
    res.status(500).json({ message: 'Error al enviar factura por email', error });
  }
}; 