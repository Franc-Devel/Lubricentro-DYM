import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

import AuthService from './services/authService.js';
import CatalogService from './services/catalogService.js';
import SalesService from './services/salesService.js';
import CashService from './services/cashService.js';
import ClientService from './services/clientService.js';
import AppointmentService from './services/appointmentService.js';
import VehiculoService from './services/vehiculoService.js';
import DashboardService from './services/dashboardService.js';
import AdminService from './services/adminService.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// ----------------------------------------------------
// AUTH ROUTES
// ----------------------------------------------------
app.post('/api/auth/login', (req, res) => {
  try {
    const { usuario, password, terminal, forceLogin } = req.body;
    const result = AuthService.login(usuario, password, terminal, forceLogin);
    if (!result.success) {
      return res.status(result.sessionConflict ? 409 : 401).json(result);
    }
    return res.json(result);
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/auth/logout', (req, res) => {
  try {
    const { userId } = req.body;
    AuthService.logout(userId);
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

app.get('/api/auth/verify-session', (req, res) => {
  const { userId, token } = req.query;
  const isValid = AuthService.verifySession(userId, token);
  return res.json({ valid: isValid });
});

// ----------------------------------------------------
// CATALOG & PRODUCTS ROUTES
// ----------------------------------------------------
app.get('/api/products', (req, res) => {
  try {
    const { search, categoryId, lowStockOnly } = req.query;
    const products = CatalogService.getProducts({
      search,
      categoryId: categoryId ? Number(categoryId) : null,
      lowStockOnly: lowStockOnly === 'true',
    });
    return res.json(products);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

app.get('/api/products/code/:code', (req, res) => {
  try {
    const product = CatalogService.findProductByCode(req.params.code);
    if (!product) return res.status(404).json({ error: 'Producto no encontrado' });
    return res.json(product);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

app.get('/api/products/:id', (req, res) => {
  try {
    const product = CatalogService.getProduct(req.params.id);
    if (!product) return res.status(404).json({ error: 'Producto no encontrado' });
    return res.json(product);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

app.post('/api/products', (req, res) => {
  try {
    const created = CatalogService.addProduct(req.body);
    return res.status(201).json(created);
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
});

app.put('/api/products/:id', (req, res) => {
  try {
    const updated = CatalogService.updateProduct(req.params.id, req.body);
    return res.json(updated);
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
});

app.delete('/api/products/:id', (req, res) => {
  try {
    const result = CatalogService.deleteProduct(req.params.id);
    return res.json(result);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

app.get('/api/categories', (req, res) => {
  try {
    return res.json(CatalogService.getCategories());
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

app.post('/api/categories', (req, res) => {
  try {
    const { name, slug } = req.body;
    return res.status(201).json(CatalogService.addCategory(name, slug));
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
});

app.put('/api/categories/:id', (req, res) => {
  try {
    const { name, slug } = req.body;
    return res.json(CatalogService.updateCategory(req.params.id, name, slug));
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
});

app.delete('/api/categories/:id', (req, res) => {
  try {
    return res.json(CatalogService.deleteCategory(req.params.id));
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

app.get('/api/catalog-general', (req, res) => {
  try {
    return res.json(CatalogService.searchGeneralCatalog(req.query.search || ''));
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

app.post('/api/catalog-general/import', (req, res) => {
  try {
    const { item, sucursal, stockInicial } = req.body;
    const imported = CatalogService.importFromGeneralCatalog(item, sucursal, stockInicial);
    return res.status(201).json(imported);
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
});

app.get('/api/catalog-branches/stock', (req, res) => {
  try {
    return res.json(CatalogService.checkOtherBranchesStock(req.query.term || ''));
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// ----------------------------------------------------
// SALES & POS ROUTES
// ----------------------------------------------------
app.post('/api/sales', (req, res) => {
  try {
    const result = SalesService.createSale(req.body);
    return res.status(201).json(result);
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
});

app.get('/api/sales', (req, res) => {
  try {
    const { filter, date, cajaId, limit, offset } = req.query;
    const sales = SalesService.getSales({
      filter,
      date,
      cajaId,
      limit: limit ? Number(limit) : 100,
      offset: offset ? Number(offset) : 0,
    });
    return res.json(sales);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

app.get('/api/sales/:id', (req, res) => {
  try {
    const sale = SalesService.getSaleDetail(req.params.id);
    if (!sale) return res.status(404).json({ error: 'Comprobante no encontrado' });
    return res.json(sale);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

app.post('/api/sales/:id/refund', (req, res) => {
  try {
    const { reason, terminal, usuario, userRole } = req.body;
    const result = SalesService.refundSale(req.params.id, reason, terminal, usuario, userRole);
    return res.json(result);
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
});

// ----------------------------------------------------
// CASH / CAJA ROUTES
// ----------------------------------------------------
app.get('/api/cash/status', (req, res) => {
  try {
    const cajaId = req.query.cajaId || 'Caja_1';
    return res.json(CashService.getCashStatus(cajaId));
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

app.post('/api/cash/open', (req, res) => {
  try {
    const { cajaId, operator, initialAmount } = req.body;
    const session = CashService.openCash(cajaId, operator, initialAmount);
    return res.status(201).json(session);
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
});

app.post('/api/cash/close', (req, res) => {
  try {
    const { cajaId, declaredAmount } = req.body;
    const result = CashService.closeCash(cajaId, declaredAmount);
    return res.json(result);
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
});

app.get('/api/cash/sessions', (req, res) => {
  try {
    const { date } = req.query;
    return res.json(CashService.getCashSessionsByDate(date));
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

app.get('/api/cash/summary-by-box', (req, res) => {
  try {
    return res.json(CashService.getBillingSummaryByBox());
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// ----------------------------------------------------
// CLIENTS & CRM ROUTES
// ----------------------------------------------------
app.get('/api/clients', (req, res) => {
  try {
    return res.json(ClientService.getClients(req.query.search || ''));
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

app.get('/api/clients/plate/:plate', (req, res) => {
  try {
    const client = ClientService.getClientByPlate(req.params.plate);
    if (!client) return res.status(404).json({ error: 'Vehículo no encontrado' });
    return res.json(client);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

app.post('/api/clients', (req, res) => {
  try {
    const saved = ClientService.saveClient(req.body);
    return res.status(201).json(saved);
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
});

app.get('/api/clients/plate/:plate/history', (req, res) => {
  try {
    return res.json(ClientService.getMaintenanceHistory(req.params.plate));
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// ----------------------------------------------------
// APPOINTMENTS / TURNOS ROUTES
// ----------------------------------------------------
app.get('/api/appointments', (req, res) => {
  try {
    return res.json(AppointmentService.getAppointments());
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

app.post('/api/appointments', (req, res) => {
  try {
    const created = AppointmentService.createAppointment(req.body);
    return res.status(201).json(created);
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
});

app.patch('/api/appointments/:id/status', (req, res) => {
  try {
    return res.json(AppointmentService.updateAppointmentStatus(req.params.id, req.body.status));
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
});

app.put('/api/appointments/:id', (req, res) => {
  try {
    return res.json(AppointmentService.updateAppointment(req.params.id, req.body));
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
});

app.delete('/api/appointments/:id', (req, res) => {
  try {
    return res.json(AppointmentService.deleteAppointment(req.params.id));
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// ----------------------------------------------------
// VEHICLES TECHNICAL GUIDE ROUTES
// ----------------------------------------------------
app.get('/api/vehicles/types', (req, res) => {
  try {
    return res.json(VehiculoService.getTypes());
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

app.get('/api/vehicles/brands', (req, res) => {
  try {
    return res.json(VehiculoService.getBrandsByType(req.query.type));
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

app.get('/api/vehicles/models', (req, res) => {
  try {
    return res.json(VehiculoService.getModelsByTypeAndBrand(req.query.type, req.query.brand));
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

app.get('/api/vehicles/specs', (req, res) => {
  try {
    const { type, brand, model } = req.query;
    return res.json(VehiculoService.getFicha(type, brand, model));
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

app.get('/api/vehicles/all', (req, res) => {
  try {
    return res.json(VehiculoService.getAllFichas());
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

app.get('/api/vehicles/search', (req, res) => {
  try {
    const { q } = req.query;
    return res.json(VehiculoService.searchVehicles(q));
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

app.post('/api/vehicles/specs', (req, res) => {
  try {
    return res.status(201).json(VehiculoService.saveFicha(req.body));
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
});

// ----------------------------------------------------
// DASHBOARD KPIS
// ----------------------------------------------------
app.get('/api/dashboard/kpis', (req, res) => {
  try {
    return res.json(DashboardService.getKpis());
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// ----------------------------------------------------
// ADMIN ROUTES
// ----------------------------------------------------
app.get('/api/admin/vendors', (req, res) => {
  try {
    return res.json(AdminService.getVendors());
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

app.post('/api/admin/vendors', (req, res) => {
  try {
    const { codigo, nombre } = req.body;
    return res.status(201).json(AdminService.createVendor(codigo, nombre));
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
});

app.delete('/api/admin/vendors/:id', (req, res) => {
  try {
    return res.json(AdminService.deleteVendor(req.params.id));
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

app.get('/api/admin/suppliers', (req, res) => {
  try {
    return res.json(AdminService.getSuppliers());
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

app.post('/api/admin/suppliers', (req, res) => {
  try {
    return res.status(201).json(AdminService.createSupplier(req.body));
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
});

app.delete('/api/admin/suppliers/:id', (req, res) => {
  try {
    return res.json(AdminService.deleteSupplier(req.params.id));
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

app.post('/api/admin/purchases', (req, res) => {
  try {
    return res.status(201).json(AdminService.recordPurchase(req.body));
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
});

app.get('/api/admin/users', (req, res) => {
  try {
    return res.json(AdminService.getSystemUsers());
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

app.post('/api/admin/users', (req, res) => {
  try {
    return res.status(201).json(AdminService.createSystemUser(req.body));
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
});

app.delete('/api/admin/users/:id', (req, res) => {
  try {
    return res.json(AdminService.deleteSystemUser(req.params.id));
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
});

app.post('/api/admin/users/:id/reset-password', (req, res) => {
  try {
    return res.json(AdminService.resetUserPassword(req.params.id, req.body.newPassword));
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
});

app.get('/api/admin/audit-logs', (req, res) => {
  try {
    return res.json(AdminService.getAuditLogs(req.query.limit ? Number(req.query.limit) : 200));
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

app.get('/api/admin/settings', (req, res) => {
  try {
    return res.json(AdminService.getSettings());
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

app.post('/api/admin/settings', (req, res) => {
  try {
    return res.json(AdminService.updateSettings(req.body));
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
});

// ----------------------------------------------------
// PRODUCTION STATIC FILE SERVING
// ----------------------------------------------------
if (process.env.NODE_ENV === 'production') {
  const distPath = path.join(projectRoot, 'dist');
  app.use(express.static(distPath));
  app.get('*', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

// ----------------------------------------------------
// SERVER START
// ----------------------------------------------------
app.listen(PORT, () => {
  console.log(`[Lubricentro Server] API REST ejecutándose en puerto ${PORT}`);
});
