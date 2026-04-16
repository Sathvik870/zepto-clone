const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

exports.createInvoicePDF = (invoiceData, stream) => {
    const doc = new PDFDocument({
        size: 'A4',
        margin: 50
    });

    doc.pipe(stream);

    const logoPath = path.join(__dirname, '../../assets/logo.png');
    if (fs.existsSync(logoPath)) {
        doc.image(logoPath, 50, 45, { width: 75 });
    }
    
    doc.fontSize(10).text('Farmer Logistics', 200, 50, { align: 'left' });
    doc.text('Tamil Nadu, India', 200, 65, { align: 'left' });
    doc.text('+91-8489313670', 200, 80, { align: 'left' });

    doc.fontSize(20).font('Helvetica-Bold').text('TAX INVOICE', 0, 60, { align: 'right' });

    doc.moveTo(50, 130).lineTo(550, 130).stroke();
    doc.fontSize(10).font('Helvetica-Bold').text('Invoice No:', 50, 140);
    doc.font('Helvetica').text(invoiceData.order.sales_order_code, 150, 140);

    doc.font('Helvetica-Bold').text('Invoice Date:', 50, 155);
    doc.font('Helvetica').text(new Date(invoiceData.order.order_date).toLocaleDateString(), 150, 155);
    
    doc.font('Helvetica-Bold').text('Billed to:', 350, 140);
    doc.font('Helvetica').text(`${invoiceData.customer.first_name} ${invoiceData.customer.last_name}`, 350, 155);
    doc.text(invoiceData.customer.address || '', 350, 170, { width: 200 });

    doc.moveTo(50, 220).lineTo(550, 220).stroke();

    const tableTop = 230;
    doc.fontSize(10).font('Helvetica-Bold');
    doc.text('S.no', 50, tableTop);
    doc.text('Description', 80, tableTop);
    doc.text('Qty', 300, tableTop, { width: 90, align: 'right' });
    doc.text('Rate', 370, tableTop, { width: 90, align: 'right' });
    doc.text('Amount', 440, tableTop, { width: 90, align: 'right' });
    doc.moveTo(50, tableTop + 20).lineTo(550, tableTop + 20).stroke();
    

    let i = 0;
    let y = tableTop + 30;
    doc.fontSize(10).font('Helvetica');

    for (const item of invoiceData.items) {
        y = tableTop + 30 + (i * 30);
        doc.text(i + 1, 50, y);
        doc.text(item.product_name, 80, y);
        doc.text(item.quantity.toFixed(2), 300, y, { width: 90, align: 'right' });
        doc.text(item.selling_price.toFixed(2), 370, y, { width: 90, align: 'right' });
        doc.text((item.quantity * item.selling_price).toFixed(2), 440, y, { width: 90, align: 'right' });
        i++;
    }
    doc.moveTo(50, y + 20).lineTo(550, y + 20).stroke();

    
    const summaryTop = y + 40;
    doc.font('Helvetica');
    doc.text('Sub Total', 370, summaryTop, { width: 90, align: 'right' });
    doc.text(invoiceData.subtotal.toFixed(2), 440, summaryTop, { width: 90, align: 'right' });

    doc.text('Delivery Charges', 370, summaryTop + 20, { width: 90, align: 'right' });
    doc.text(invoiceData.deliveryCharges.toFixed(2), 440, summaryTop + 20, { width: 90, align: 'right' });

    doc.font('Helvetica-Bold');
    doc.text('Total', 370, summaryTop + 40, { width: 90, align: 'right' });
    doc.text(`₹${invoiceData.total.toFixed(2)}`, 440, summaryTop + 40, { width: 90, align: 'right' });

    const footerTop = summaryTop + 80;
    doc.fontSize(10).font('Helvetica-Bold').text('Total in Words:', 50, footerTop);
    doc.font('Helvetica').text(`Indian Rupee ${invoiceData.totalInWords} Only`, 50, footerTop + 15);
    
    doc.fontSize(10).text('Thank you for your business!', 50, footerTop + 50);
    console.log(invoiceData.order.delivery_status);
    if (invoiceData.order.status === 'Cancelled') {
        doc.save(); 
        const pageHeight = doc.page.height;
        const pageWidth = doc.page.width;
        
        doc.translate(pageWidth / 2, pageHeight / 2);
        doc.rotate(-45);
        
        doc.fontSize(50);
        doc.font('Helvetica-Bold');
        doc.fillColor('red');
        doc.opacity(0.3); 
        doc.text('CANCELLED', -200, -40, {
            width: 400,
            align: 'center'
        });
        doc.restore(); 
    }
    doc.end();
};