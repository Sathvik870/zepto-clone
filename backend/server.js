const express = require("express");
const dotenv = require("dotenv");
dotenv.config({
  path: process.env.NODE_ENV === "test" ? ".env.test" : ".env",
});
const cors = require("cors");
const os = require("os");
const cookieParser = require("cookie-parser");
const logger = require("./src/config/logger");
const http = require("http");
const { Server } = require("socket.io"); 
 
const adminAuthRoutes = require("./src/routes/admin/auth.routes");
const adminUserRoutes = require("./src/routes/admin/user.routes");
const adminProductRoutes = require("./src/routes/admin/product.routes");
const adminPurchaseRoutes = require("./src/routes/admin/purchase.routes");
const adminStockRoutes = require("./src/routes/admin/stock.routes");
const adminSalesOrderRoutes = require("./src/routes/admin/salesOrder.routes"); 
const adminPushRoutes = require("./src/routes/admin/push.routes");
const adminInvoiceRoutes = require("./src/routes/admin/invoice.routes");
const adminDashboardRoutes = require("./src/routes/admin/dashboard.routes");
const adminReportsRoutes = require("./src/routes/admin/reports.routes");

const customerAuthRoutes = require("./src/routes/customer/auth.routes");
const customerUserRoutes = require("./src/routes/customer/user.routes");
const customerOrderRoutes = require("./src/routes/customer/order.routes");
const customerPushRoutes = require("./src/routes/customer/push.routes");

const publicProductRoutes = require("./src/routes/public/product.routes");

if (process.env.NODE_ENV !== "test") {
  require('./src/jobs/updateInvoiceStatus.js');
}

const app = express();
const PORT = process.env.PORT || 3000;
const HOST = "0.0.0.0";

function findLocalIp() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      const { address, family, internal } = iface;
      if (family === "IPv4" && !internal) {
        return address;
      }
    }
  }
  return null;
}

const allowedOrigins = [
  "http://localhost:5173",
  "http://172.20.64.1:5173",
  "http://192.168.1.6:5173",
  "https://farmer-logistics.netlify.app",
];

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: [
      "GET",
      "POST"
    ],
    credentials: true,
  },
});


io.on("connection", (socket) => {
  logger.info(`[SOCKET] New client connected: ${socket.id}`);
  socket.on("disconnect", () => {
    logger.info(`[SOCKET] Client disconnected: ${socket.id}`);
  });
});

app.use(
  cors({
    origin: function (origin, callback) {
      if (allowedOrigins.indexOf(origin) !== -1 || !origin) {
        callback(null, true);
      } else {
        callback(new Error("This origin is not allowed by CORS"));
      }
    },
    credentials: true,
  })
);

app.use((req, res, next) => {
  req.io = io;
  next();
});

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));
app.use(cookieParser());

const adminRouter = express.Router();
adminRouter.use("/auth", adminAuthRoutes);
adminRouter.use("/users", adminUserRoutes);
adminRouter.use("/products", adminProductRoutes);
adminRouter.use("/purchase-orders", adminPurchaseRoutes);
adminRouter.use("/stock", adminStockRoutes);
adminRouter.use("/sales-orders", adminSalesOrderRoutes);
adminRouter.use("/push", adminPushRoutes);
adminRouter.use("/invoices", adminInvoiceRoutes); 
adminRouter.use("/dashboard", adminDashboardRoutes);
adminRouter.use("/reports", adminReportsRoutes);

app.use("/api/admin", adminRouter);

const customerRouter = express.Router();
customerRouter.use("/auth", customerAuthRoutes);
customerRouter.use("/users", customerUserRoutes);
customerRouter.use("/orders", customerOrderRoutes); 
customerRouter.use("/push", customerPushRoutes);

app.use("/api/customer", customerRouter);


const publicRouter = express.Router();
publicRouter.use("/products", publicProductRoutes);

app.use("/api/public", publicRouter);


app.get("/", (req, res) => {
  res.send("Hello there! Welcome to the Zepto clone Backend Server.");
});

module.exports = { app, server };

if (require.main === module) {
  server.listen(PORT, HOST, () => {
    const localIp = findLocalIp();
    logger.info("Server running and accessible on:");
    logger.info(`  - Local:   http://localhost:${PORT}`);
    if (localIp) {
      logger.info(`  - Network: http://${localIp}:${PORT}`);
    }
  });
}
