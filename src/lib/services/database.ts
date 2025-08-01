import { query } from '../db';

// Type definitions
export interface Customer {
  customerId: number;
  name: string;
  phoneNumber: string;
  email: string;
  address: string;
  dateOfBirth: Date;
  gender: string;
}

export interface Order {
  orderId: number;
  orderDate: Date;
  status: 'Pending' | 'Approved' | 'Delivered' | 'Cancelled';
  totalAmount: number;
  customerId: number;
  prescriptionId?: number;
  paymentId: number;
}

export interface Prescription {
  prescriptionId: number;
  imageFile: string;
  uploadDate: Date;
  approved: boolean;
  pharmacistId: number;
}

export interface Product {
  productId: number;
  name: string;
  description: string;
  price: number;
  category: string;
  requiresPrescription: boolean;
}

export interface Inventory {
  inventoryId: number;
  productId: number;
  branchId: number;
  stockQuantity: number;
  updatedAt: Date;
}

export interface Payment {
  paymentId: number;
  method: 'Cash' | 'CreditCard' | 'E-Wallet';
  transactionDate: Date;
  status: 'Success' | 'Failed' | 'Refunded';
}

export interface Pharmacist {
  pharmacistId: number;
  name: string;
  licenseNumber: string;
  branchId: number;
}

export interface Branch {
  branchId: number;
  location: string;
  managerName: string;
  contactNumber: string;
}

export interface Feedback {
  feedbackId: number;
  customerId: number;
  orderId: number;
  rating: number;
  comments?: string;
  submittedDate: Date;
}

// Helper function to handle query results
function getFirstResult<T>(results: any): T | null {
  if (Array.isArray(results) && results.length > 0) {
    return results[0] as T;
  }
  return null;
}

function getAllResults<T>(results: any): T[] {
  if (Array.isArray(results)) {
    return results as T[];
  }
  return [];
}

// Customer Service
export async function createCustomer(customer: Omit<Customer, 'customerId'>): Promise<number> {
  const sql = `
    INSERT INTO Customer (name, phoneNumber, email, address, dateOfBirth, gender)
    VALUES (?, ?, ?, ?, ?, ?)
  `;
  const result = await query(sql, [
    customer.name,
    customer.phoneNumber,
    customer.email,
    customer.address,
    customer.dateOfBirth,
    customer.gender
  ]);
  return (result as any).insertId;
}

export async function getCustomerById(customerId: number): Promise<Customer | null> {
  const sql = 'SELECT * FROM Customer WHERE customerId = ?';
  const results = await query(sql, [customerId]);
  return getFirstResult<Customer>(results);
}

// Order Service
export async function createOrder(order: Omit<Order, 'orderId' | 'orderDate'>): Promise<number> {
  const sql = `
    INSERT INTO \`Order\` (orderDate, status, totalAmount, customerId, prescriptionId, paymentId)
    VALUES (NOW(), ?, ?, ?, ?, ?)
  `;
  const result = await query(sql, [
    order.status,
    order.totalAmount,
    order.customerId,
    order.prescriptionId || null,
    order.paymentId
  ]);
  return (result as any).insertId;
}

export async function getOrderById(orderId: number): Promise<Order | null> {
  const sql = `
    SELECT o.*, c.name as customerName, c.email as customerEmail
    FROM \`Order\` o
    JOIN Customer c ON o.customerId = c.customerId
    WHERE o.orderId = ?
  `;
  const results = await query(sql, [orderId]);
  return getFirstResult<Order>(results);
}

// Product Service
export async function getAllProducts(): Promise<Product[]> {
  const sql = 'SELECT * FROM Product ORDER BY name';
  const results = await query(sql);
  return getAllResults<Product>(results);
}

export async function getProductById(productId: number): Promise<Product | null> {
  const sql = 'SELECT * FROM Product WHERE productId = ?';
  const results = await query(sql, [productId]);
  return getFirstResult<Product>(results);
}

// Inventory Service
export async function getInventoryByProduct(productId: number): Promise<Inventory[]> {
  const sql = `
    SELECT i.*, b.location as branchLocation, b.managerName
    FROM Inventory i
    JOIN Branch b ON i.branchId = b.branchId
    WHERE i.productId = ?
  `;
  const results = await query(sql, [productId]);
  return getAllResults<Inventory>(results);
}

export async function updateInventoryStock(inventoryId: number, newQuantity: number): Promise<void> {
  const sql = 'UPDATE Inventory SET stockQuantity = ?, updatedAt = NOW() WHERE inventoryId = ?';
  await query(sql, [newQuantity, inventoryId]);
}

// Prescription Service
export async function createPrescription(prescription: Omit<Prescription, 'prescriptionId'>): Promise<number> {
  const sql = `
    INSERT INTO Prescription (imageFile, uploadDate, approved, pharmacistId)
    VALUES (?, NOW(), ?, ?)
  `;
  const result = await query(sql, [
    prescription.imageFile,
    prescription.approved,
    prescription.pharmacistId
  ]);
  return (result as any).insertId;
}

export async function getPrescriptionById(prescriptionId: number): Promise<Prescription | null> {
  const sql = `
    SELECT p.*, ph.name as pharmacistName, ph.licenseNumber
    FROM Prescription p
    JOIN Pharmacist ph ON p.pharmacistId = ph.pharmacistId
    WHERE p.prescriptionId = ?
  `;
  const results = await query(sql, [prescriptionId]);
  return getFirstResult<Prescription>(results);
}

// Payment Service
export async function createPayment(payment: Omit<Payment, 'paymentId' | 'transactionDate'>): Promise<number> {
  const sql = `
    INSERT INTO Payment (method, transactionDate, status)
    VALUES (?, NOW(), ?)
  `;
  const result = await query(sql, [payment.method, payment.status]);
  return (result as any).insertId;
}

export async function updatePaymentStatus(paymentId: number, status: string): Promise<void> {
  const sql = 'UPDATE Payment SET status = ? WHERE paymentId = ?';
  await query(sql, [status, paymentId]);
}

// Pharmacist Service
export async function createPharmacist(pharmacist: Omit<Pharmacist, 'pharmacistId'>): Promise<number> {
  const sql = `
    INSERT INTO Pharmacist (name, licenseNumber, branchId)
    VALUES (?, ?, ?)
  `;
  const result = await query(sql, [
    pharmacist.name,
    pharmacist.licenseNumber,
    pharmacist.branchId
  ]);
  return (result as any).insertId;
}

export async function getPharmacistById(pharmacistId: number): Promise<Pharmacist | null> {
  const sql = `
    SELECT ph.*, b.location as branchLocation
    FROM Pharmacist ph
    JOIN Branch b ON ph.branchId = b.branchId
    WHERE ph.pharmacistId = ?
  `;
  const results = await query(sql, [pharmacistId]);
  return getFirstResult<Pharmacist>(results);
}

// Branch Service
export async function getAllBranches(): Promise<Branch[]> {
  const sql = 'SELECT * FROM Branch ORDER BY location';
  const results = await query(sql);
  return getAllResults<Branch>(results);
}

export async function getBranchById(branchId: number): Promise<Branch | null> {
  const sql = 'SELECT * FROM Branch WHERE branchId = ?';
  const results = await query(sql, [branchId]);
  return getFirstResult<Branch>(results);
}

// Feedback Service
export async function createFeedback(feedback: Omit<Feedback, 'feedbackId' | 'submittedDate'>): Promise<number> {
  const sql = `
    INSERT INTO Feedback (customerId, orderId, rating, comments, submittedDate)
    VALUES (?, ?, ?, ?, NOW())
  `;
  const result = await query(sql, [
    feedback.customerId,
    feedback.orderId,
    feedback.rating,
    feedback.comments
  ]);
  return (result as any).insertId;
}

export async function getFeedbackByOrder(orderId: number): Promise<Feedback[]> {
  const sql = `
    SELECT f.*, c.name as customerName
    FROM Feedback f
    JOIN Customer c ON f.customerId = c.customerId
    WHERE f.orderId = ?
    ORDER BY f.submittedDate DESC
  `;
  const results = await query(sql, [orderId]);
  return getAllResults<Feedback>(results);
}

// Complex queries for dashboard
export async function getDashboardStats() {
  const customerCount = await query('SELECT COUNT(*) as count FROM Customer');
  const orderCount = await query('SELECT COUNT(*) as count FROM `Order`');
  const productCount = await query('SELECT COUNT(*) as count FROM Product');
  const branchCount = await query('SELECT COUNT(*) as count FROM Branch');
  
  const customerResult = customerCount as any[];
  const orderResult = orderCount as any[];
  const productResult = productCount as any[];
  const branchResult = branchCount as any[];
  
  return {
    customers: customerResult[0]?.count || 0,
    orders: orderResult[0]?.count || 0,
    products: productResult[0]?.count || 0,
    branches: branchResult[0]?.count || 0
  };
}

export async function getRecentOrders(limit: number = 10): Promise<Order[]> {
  const sql = `
    SELECT o.*, c.name as customerName
    FROM \`Order\` o
    JOIN Customer c ON o.customerId = c.customerId
    ORDER BY o.orderDate DESC
    LIMIT ?
  `;
  const results = await query(sql, [limit]);
  return getAllResults<Order>(results);
}
