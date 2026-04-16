const formatDate = (date) => {
  if (!date) return "";
  const d = new Date(date);
  return `${d.getDate().toString().padStart(2, "0")}/${(d.getMonth() + 1)
    .toString()
    .padStart(2, "0")}/${d.getFullYear()}`;
};

exports.getInvoiceHTML = (orderData) => {
  const { order, customer, items, total, totalInWords, deliveryCharges } =
    orderData;

  let itemsHtml = "";
  items.forEach((item, index) => {
    itemsHtml += `
            <tr class="item">
                <td>${index + 1}</td>
                <td>
                    <b>${item.product_name}</b><br>
                    ${item.sell_per_unit_qty} ${item.selling_unit}
                </td>
                <td>${item.quantity.toFixed(2)}</td>
                <td>${item.selling_price.toFixed(2)}</td>
                <td>${(item.quantity * item.selling_price).toFixed(2)}</td>
            </tr>
        `;
  });

  return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>Tax Invoice</title>
        <style>
            body { font-family: 'Helvetica Neue', 'Helvetica', Helvetica, Arial, sans-serif; font-size: 14px; line-height: 1.6; color: #333; }
            .invoice-box { max-width: 800px; margin: auto; padding: 30px; }
            .header { display: flex; justify-content: space-between; align-items: flex-start; }
            .header .logo { max-width: 75px; }
            .header .company-details { text-align: left; }
            .header .invoice-title { text-align: right; font-size: 28px; font-weight: bold; color: #555; }
            .details { display: flex; justify-content: space-between; margin-top: 50px; }
            .details .bill-to { text-align: left; }
            .details .invoice-info { text-align: left; }
            .invoice-table { width: 100%; line-height: inherit; text-align: left; border-collapse: collapse; margin-top: 30px; }
            .invoice-table th, .invoice-table td { padding: 8px; vertical-align: top; border: 1px solid #000000; }
            .invoice-table tr.heading th { background: #f2f2f2; font-weight: bold; }
            .invoice-table tr.item td { border-bottom: 1px solid #eee; }
            .invoice-table tr.total td { border-top: 2px solid #555; font-weight: bold; }
            .summary { display: flex; justify-content: flex-end; margin-top: 20px; }
            .summary-table { width: 40%; }
            .summary-table td { padding: 5px; }
            .footer { margin-top: 40px; font-size: 12px; color: #777; }
        </style>
    </head>
    <body>
        <div class="invoice-box">
            <div class="header">
                <img src="https://farmer-logistics.netlify.app/logo.svg" alt="Farmer Logistics" class="logo">
                <div class="company-details">
                    <b>Farmer Logistics</b><br>
                    Tamil Nadu<br>
                    India<br>
                    +91-8489313670<br>
                    farmerlogistics.buisness@gmail.com
                </div>
                <div class="invoice-title">TAX INVOICE</div>
            </div>

            <div class="details">
                 <div class="invoice-info">
                    #: <b>${
                      order.sales_order_code || `INV-${order.sales_order_id}`
                    }</b><br>
                    Invoice Date: ${formatDate(order.order_date)}<br>
                </div>
                <div class="bill-to">
                    <b>Billed to:</b><br>
                    ${customer.first_name} ${customer.last_name}<br>
                    ${customer.address || ""}<br>
                    ${customer.city || ""}, ${customer.state || ""}
                </div>
            </div>

            <table class="invoice-table">
                <tr class="heading">
                    <th>#</th>
                    <th>Description</th>
                    <th>Qty</th>
                    <th>Rate</th>
                    <th>Amount</th>
                </tr>
                ${itemsHtml}
            </table>

            <div class="summary">
                <table class="summary-table">
                    <tr><td>Sub Total</td><td style="text-align: right;">${total.toFixed(
                      2
                    )}</td></tr>
                    <tr class="total">
                        <td>Delivery Charges</td>
                        <td style="text-align: right;">₹${deliveryCharges.toFixed(2)}</td>
                    </tr>
                    <tr class="total">
                        <td>Total</td>
                        <td style="text-align: right;">₹${orderData.total.toFixed(
                          2
                        )}</td>
                    </tr>
                </table>
            </div>

            <div class="footer">
                <b>Total in Words:</b> Indian Rupee ${totalInWords} Only<br><br>
                Thank you for your business!<br>
                Payment due upon receipt.
            </div>
        </div>
    </body>
    </html>
  `;
};
