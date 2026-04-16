const cron = require('node-cron');
const db = require('../config/db');
const logger = require('../config/logger');

const checkAndUpdatateInvoices = async () => {
  logger.info('[CRON_JOB] Running job: checkAndUpdatateInvoices');
  try {
    const query = `
      UPDATE invoices
      SET invoice_status = 'Overdue'
      WHERE 
        (invoice_status = 'Upcoming' OR invoice_status = 'Partially Paid')
        AND due_date < CURRENT_DATE;
    `;
    
    const result = await db.query(query);
    logger.info(`[CRON_JOB] Updated ${result.rowCount} invoice statuses.`);
    
  } catch (error) {
    logger.error(`[CRON_JOB] Error running updateInvoiceStatus job: ${error.message}`);
  } 
};

cron.schedule('0/5 * * * *', checkAndUpdatateInvoices, {
  scheduled: true,
  timezone: "Asia/Kolkata" 
});

logger.info('[CRON_JOB] Scheduled job to run every 5 minutes.');

module.exports = { checkAndUpdatateInvoices };