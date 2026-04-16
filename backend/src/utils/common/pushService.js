const webpush = require("web-push");
const db = require("../../config/db");
const logger = require("../../config/logger");
if (
  process.env.VAPID_SUBJECT &&
  process.env.VAPID_PUBLIC_KEY &&
  process.env.VAPID_PRIVATE_KEY
) {
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT,
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
} else {
  console.warn("VAPID config missing — push notifications disabled");
}

exports.subscribeCustomer = async (subscription, customerId) => {
  try {
    const query = `
      INSERT INTO customer_subscriptions (customer_id, endpoint, keys)
      VALUES ($1, $2, $3)
      ON CONFLICT (endpoint) DO UPDATE SET customer_id = $1;
    `;
    await db.query(query, [customerId, subscription.endpoint, JSON.stringify(subscription.keys)]);
    logger.info(`[PUSH] Saved subscription for customer ID: ${customerId}`);
  } catch (error) {
    logger.error(`[PUSH] Failed to save customer subscription: ${error.message}`);
  }
};

exports.sendPushToCustomer = async (customerId, payload) => {
  try {
    const { rows } = await db.query("SELECT * FROM customer_subscriptions WHERE customer_id = $1", [customerId]);
    if (rows.length === 0) return;

    logger.info(`[PUSH] Sending notification to customer ID: ${customerId}`);
    
    const notifications = rows.map(sub => {
      const subscription = { endpoint: sub.endpoint, keys: sub.keys };
      return webpush.sendNotification(subscription, JSON.stringify(payload))
        .catch(err => {
          if (err.statusCode === 410 || err.statusCode === 404) {
            db.query("DELETE FROM customer_subscriptions WHERE id = $1", [sub.id]);
          }
        });
    });
    await Promise.all(notifications);
  } catch (error) {
    logger.error(`[PUSH] Error sending push to customer ID ${customerId}: ${error.message}`);
  }
};

exports.subscribeAdmin = async (subscription) => {
  try {
    const query = `
      INSERT INTO admin_subscriptions (endpoint, keys)
      VALUES ($1, $2)
      ON CONFLICT (endpoint) DO NOTHING;
    `;
    await db.query(query, [
      subscription.endpoint,
      JSON.stringify(subscription.keys),
    ]);
    logger.info("[PUSH] New admin subscription saved.");
  } catch (error) {
    logger.error(`[PUSH] Failed to save subscription: ${error.message}`);
  }
};

exports.sendPushToAdmins = async (payload) => {
  try {
    const { rows } = await db.query("SELECT * FROM admin_subscriptions");

    const notifications = rows.map((sub) => {
      const subscription = {
        endpoint: sub.endpoint,
        keys: typeof sub.keys === "string" ? JSON.parse(sub.keys) : sub.keys,
      };

      return webpush
        .sendNotification(subscription, JSON.stringify(payload))
        .catch((err) => {
          console.error("Push send FAILED:", err);
          if (err.statusCode === 410 || err.statusCode === 404) {
            db.query("DELETE FROM admin_subscriptions WHERE id = $1", [sub.id]);
          }
        });
    });

    await Promise.all(notifications);
    logger.info(`[PUSH] Sent notifications to ${rows.length} admin devices.`);
  } catch (error) {
    logger.error(`[PUSH] Error sending push notifications: ${error.message}`);
  }
};

exports.unsubscribeCustomer = async (subscription) => {
  try {
    const query = `DELETE FROM customer_subscriptions WHERE endpoint = $1;`;
    await db.query(query, [subscription.endpoint]);
    logger.info(`[PUSH] Removed customer subscription.`);
  } catch (error) {
    logger.error(`[PUSH] Failed to remove customer subscription: ${error.message}`);
  }
};

exports.unsubscribeAdmin = async (subscription) => {
  try {
    const query = `DELETE FROM admin_subscriptions WHERE endpoint = $1;`; 
    await db.query(query, [subscription.endpoint]);
    logger.info("[PUSH] Removed admin subscription.");
  }
  catch (error) {
    logger.error(`[PUSH] Failed to remove admin subscription: ${error.message}`);
  }
};
