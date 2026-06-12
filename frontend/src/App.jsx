import { Routes, Route } from 'react-router-dom';

import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import ProductsPage from './pages/ProductsPage';
import CategoriesPage from './pages/CategoriesPage';
import BrandsPage from './pages/BrandsPage';
import CustomersPage from './pages/CustomersPage';
import CustomerGroupsPage from './pages/CustomerGroupsPage';
import SalesOrdersPage from './pages/SalesOrdersPage';
import SalesOrderFormPage from './pages/SalesOrderFormPage';
import SalesOrderDetailPage from './pages/SalesOrderDetailPage';
import NotFoundPage from './pages/NotFoundPage';
import UnauthorizedPage from './pages/UnauthorizedPage';
import ComingSoonPage from './pages/ComingSoonPage';
import PriceCheckerPage from './pages/PriceCheckerPage';
import WholesalePricesPage from './pages/WholesalePricesPage';
import ChequesPage from './pages/ChequesPage';
import BankAccountsPage from './pages/BankAccountsPage';
import FundTransfersPage from './pages/FundTransfersPage';
import ExpensesPage from './pages/ExpensesPage';
import WarehousesPage from './pages/WarehousesPage';
import StockPage from './pages/StockPage';
import OpeningStockPage from './pages/OpeningStockPage';
import StockTransferPage from './pages/StockTransferPage';
import StockAdjustmentPage from './pages/StockAdjustmentPage';
import StockMovementsPage from './pages/StockMovementsPage';
import SuppliersPage from './pages/SuppliersPage';
import PurchaseOrdersPage from './pages/PurchaseOrdersPage';
import PurchaseOrderFormPage from './pages/PurchaseOrderFormPage';
import PurchaseOrderDetailPage from './pages/PurchaseOrderDetailPage';
import GrnsPage from './pages/GrnsPage';
import InvoicesPage from './pages/InvoicesPage';
import InvoiceFromSalesOrderPage from './pages/InvoiceFromSalesOrderPage';
import InvoiceFormPage from './pages/InvoiceFormPage';
import InvoiceDetailPage from './pages/InvoiceDetailPage';
import BillsPage from './pages/BillsPage';
import BillDetailPage from './pages/BillDetailPage';
import BillFromGrnPage from './pages/BillFromGrnPage';
import DamagesPage from './pages/DamagesPage';
import SupplierReturnsPage from './pages/SupplierReturnsPage';
import PaymentsPage from './pages/PaymentsPage';
import InstallmentsPage from './pages/InstallmentsPage';
import PaymentFormPage from './pages/PaymentFormPage';
import PaymentDetailPage from './pages/PaymentDetailPage';
import BomsPage from './pages/BomsPage';
import BomFormPage from './pages/BomFormPage';
import BomDetailPage from './pages/BomDetailPage';
import ProductionOrdersPage from './pages/ProductionOrdersPage';
import ProductionOrderFormPage from './pages/ProductionOrderFormPage';
import ProductionOrderDetailPage from './pages/ProductionOrderDetailPage';
import UsersPage from './pages/UsersPage';
import RolesPage from './pages/RolesPage';
import ProfilePage from './pages/ProfilePage';
import SettingsPage from './pages/SettingsPage';
import ReturnsPage from './pages/ReturnsPage';
import ReturnFormPage from './pages/ReturnFormPage';
import ReturnDetailPage from './pages/ReturnDetailPage';
import CreditNotesPage from './pages/CreditNotesPage';
import CreditNoteDetailPage from './pages/CreditNoteDetailPage';
import SupplierReturnDetailPage from './pages/SupplierReturnDetailPage';
import RepairsPage from './pages/RepairsPage';
import RepairDetailPage from './pages/RepairDetailPage';
import PosPage from './pages/PosPage';
import PosSessionsPage from './pages/PosSessionsPage';

import EmployeesPage from './pages/EmployeesPage';
import EmployeeFormPage from './pages/EmployeeFormPage';
import EmployeeDetailPage from './pages/EmployeeDetailPage';
import DepartmentsPage from './pages/DepartmentsPage';
import DesignationsPage from './pages/DesignationsPage';
import ShiftsPage from './pages/ShiftsPage';
import AttendancePage from './pages/AttendancePage';
import LeaveRequestsPage from './pages/LeaveRequestsPage';
import HolidaysPage from './pages/HolidaysPage';
import SalaryStructuresPage from './pages/SalaryStructuresPage';
import PayrollsPage from './pages/PayrollsPage';
import PayrollDetailPage from './pages/PayrollDetailPage';
import PayslipDetailPage from './pages/PayslipDetailPage';

import ReportsPage from './pages/ReportsPage';
import FinancialReportPage from './pages/FinancialReportPage';
import SalesSummaryReportPage from './pages/reports/SalesSummaryReportPage';
import SalesByProductReportPage from './pages/reports/SalesByProductReportPage';
import SalesByCustomerReportPage from './pages/reports/SalesByCustomerReportPage';
import StockValuationReportPage from './pages/reports/StockValuationReportPage';
import SlowFastMoversReportPage from './pages/reports/SlowFastMoversReportPage';
import LowStockReportPage from './pages/reports/LowStockReportPage';
import StockMovementReportPage from './pages/reports/StockMovementReportPage';
import ProductionReportPage from './pages/reports/ProductionReportPage';
import ReturnsReportPage from './pages/reports/ReturnsReportPage';
import FinancialSnapshotPage from './pages/reports/FinancialSnapshotPage';
import HrReportsPage from './pages/reports/HrReportsPage';

import ProtectedRoute from './components/ProtectedRoute';
import AppLayout from './components/layout/AppLayout';
import ReceiptPrintPage from './pages/ReceiptPrintPage';

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/unauthorized" element={<UnauthorizedPage />} />

      <Route path="/receipt/:id" element={
          <ProtectedRoute allowedRoles={['admin', 'manager', 'accountant', 'sales_manager', 'sales_rep', 'warehouse_staff', 'production_staff', 'inventory_admin', 'staff']}>
            <ReceiptPrintPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/price-checker"
        element={
          <ProtectedRoute allowedRoles={['customer', 'admin', 'manager', 'inventory_admin', 'staff']}>
            <PriceCheckerPage />
          </ProtectedRoute>
        }
      />

      <Route
        element={
          <ProtectedRoute allowedRoles={['admin', 'manager', 'accountant', 'sales_manager', 'sales_rep', 'warehouse_staff', 'production_staff', 'inventory_admin', 'staff']}>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<DashboardPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/products" element={<ProductsPage />} />
        <Route path="/wholesale-prices" element={<WholesalePricesPage />} />
        <Route path="/categories" element={<CategoriesPage />} />
        <Route path="/brands" element={<BrandsPage />} />
        <Route path="/customers" element={<CustomersPage />} />
        <Route path="/customer-groups" element={<CustomerGroupsPage />} />
        <Route path="/sales-orders" element={<SalesOrdersPage />} />
        <Route path="/sales-orders/new" element={<SalesOrderFormPage />} />
        <Route path="/sales-orders/:id" element={<SalesOrderDetailPage />} />
        <Route path="/warehouses" element={<WarehousesPage />} />
        <Route path="/stock" element={<StockPage />} />
        <Route path="/stock/opening" element={<OpeningStockPage />} />
        <Route path="/stock/transfer" element={<StockTransferPage />} />
        <Route path="/stock/adjustment" element={<StockAdjustmentPage />} />
        <Route path="/stock/movements" element={<StockMovementsPage />} />
        <Route path="/damages" element={<DamagesPage />} />
        <Route path="/suppliers" element={<SuppliersPage />} />
        <Route path="/supplier-returns" element={<SupplierReturnsPage />} />
        <Route path="/purchase-orders" element={<PurchaseOrdersPage />} />
        <Route path="/purchase-orders/new" element={<PurchaseOrderFormPage />} />
        <Route path="/purchase-orders/:id" element={<PurchaseOrderDetailPage />} />
        <Route path="/invoices" element={<InvoicesPage />} />
        <Route path="/invoices/new" element={<InvoiceFormPage />} />
        <Route path="/invoices/from-sales-order" element={<InvoiceFromSalesOrderPage />} />
        <Route path="/invoices/:id" element={<InvoiceDetailPage />} />
        <Route path="/grns" element={<GrnsPage />} />
        <Route path="/bills" element={<BillsPage />} />
        <Route path="/bills/from-grn" element={<BillFromGrnPage />} />
        <Route path="/bills/:id" element={<BillDetailPage />} />
        <Route path="/payments" element={<PaymentsPage />} />
        <Route path="/cheques" element={<ChequesPage />} />
        <Route path="/bank-accounts" element={<BankAccountsPage />} />
        <Route path="/fund-transfers" element={<FundTransfersPage />} />
        <Route path="/expenses" element={<ExpensesPage />} />
        <Route path="/payments/new" element={<PaymentFormPage />} />
        <Route path="/payments/:id" element={<PaymentDetailPage />} />
        <Route path="/installments" element={<InstallmentsPage />} />
        <Route path="/boms" element={<BomsPage />} />
        <Route path="/boms/new" element={<BomFormPage />} />
        <Route path="/boms/:id" element={<BomDetailPage />} />
        <Route path="/boms/:id/edit" element={<BomFormPage />} />
        <Route path="/production-orders" element={<ProductionOrdersPage />} />
        <Route path="/production-orders/new" element={<ProductionOrderFormPage />} />
        <Route path="/production-orders/:id" element={<ProductionOrderDetailPage />} />
        <Route path="/returns" element={<ReturnsPage />} />
        <Route path="/returns/new" element={<ReturnFormPage />} />
        <Route path="/returns/:id" element={<ReturnDetailPage />} />
        <Route path="/credit-notes" element={<CreditNotesPage />} />
        <Route path="/credit-notes/:id" element={<CreditNoteDetailPage />} />
        <Route path="/pos" element={<PosPage />} />
        <Route path="/pos-sessions" element={<PosSessionsPage />} />

        <Route path="/supplier-returns/:id" element={<SupplierReturnDetailPage />} />
        <Route path="/repairs" element={<RepairsPage />} />
        <Route path="/repairs/:id" element={<RepairDetailPage />} />
        <Route path="/employees" element={<EmployeesPage />} />
        <Route path="/employees/new" element={<EmployeeFormPage />} />
        <Route path="/employees/:id" element={<EmployeeDetailPage />} />
        <Route path="/employees/:id/edit" element={<EmployeeFormPage />} />
        <Route path="/departments" element={<DepartmentsPage />} />
        <Route path="/designations" element={<DesignationsPage />} />
        <Route path="/shifts" element={<ShiftsPage />} />
        <Route path="/attendance" element={<AttendancePage />} />
        <Route path="/leaves" element={<LeaveRequestsPage />} />
        <Route path="/holidays" element={<HolidaysPage />} />
        <Route path="/salary-structures" element={<SalaryStructuresPage />} />
        <Route path="/payroll" element={<PayrollsPage />} />
        <Route path="/payroll/:id" element={<PayrollDetailPage />} />
        <Route path="/payroll/:payrollId/payslip/:employeeId" element={<PayslipDetailPage />} />

        <Route path="/reports" element={<ReportsPage />} />
        <Route path="/reports/financial" element={<FinancialReportPage />} />
        <Route path="/reports/sales" element={<SalesSummaryReportPage />} />
        <Route path="/reports/sales-by-product" element={<SalesByProductReportPage />} />
        <Route path="/reports/sales-by-customer" element={<SalesByCustomerReportPage />} />
        <Route path="/reports/stock-valuation" element={<StockValuationReportPage />} />
        <Route path="/reports/slow-fast-movers" element={<SlowFastMoversReportPage />} />
        <Route path="/reports/inventory/low-stock" element={<LowStockReportPage />} />
        <Route path="/reports/stock-movement" element={<StockMovementReportPage />} />
        <Route path="/reports/production" element={<ProductionReportPage />} />
        <Route path="/reports/returns-damages" element={<ReturnsReportPage />} />
        <Route path="/reports/financial" element={<FinancialSnapshotPage />} />
        <Route path="/reports/hr" element={<HrReportsPage />} />

        <Route path="/users"
          element={<ProtectedRoute allowedRoles={['admin']}><UsersPage /></ProtectedRoute>} />
        <Route path="/roles"
          element={<ProtectedRoute allowedRoles={['admin']}><RolesPage /></ProtectedRoute>} />

        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

export default App;