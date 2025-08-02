-- Complete database schema for LCPMS with exact IDs and relationships

CREATE DATABASE IF NOT EXISTS lcpms;
USE lcpms;

-- Customer table
CREATE TABLE IF NOT EXISTS Customer (
  customerId INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  phoneNumber VARCHAR(20) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  address TEXT NOT NULL,
  dateOfBirth DATE,
  gender VARCHAR(10)
);

-- Branch table
CREATE TABLE IF NOT EXISTS Branch (
  branchId INT AUTO_INCREMENT PRIMARY KEY,
  location VARCHAR(255) NOT NULL,
  managerName VARCHAR(255) NOT NULL,
  contactNumber VARCHAR(20) NOT NULL
);

-- Pharmacist table
CREATE TABLE IF NOT EXISTS Pharmacist (
  pharmacistId INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  licenseNumber VARCHAR(50) UNIQUE NOT NULL,
  branchId INT NOT NULL,
  FOREIGN KEY (branchId) REFERENCES Branch(branchId)
);

-- Product table
CREATE TABLE IF NOT EXISTS Product (
  productId INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  category VARCHAR(100) NOT NULL,
  requiresPrescription BOOLEAN DEFAULT FALSE
);

-- Inventory table
CREATE TABLE IF NOT EXISTS Inventory (
  inventoryId INT AUTO_INCREMENT PRIMARY KEY,
  productId INT NOT NULL,
  branchId INT NOT NULL,
  stockQuantity INT NOT NULL DEFAULT 0,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (productId) REFERENCES Product(productId),
  FOREIGN KEY (branchId) REFERENCES Branch(branchId),
  UNIQUE KEY unique_product_branch (productId, branchId)
);

-- Payment table
CREATE TABLE IF NOT EXISTS Payment (
  paymentId INT AUTO_INCREMENT PRIMARY KEY,
  method ENUM('Cash', 'CreditCard', 'E-Wallet') NOT NULL,
  transactionDate TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  status ENUM('Success', 'Failed', 'Refunded') NOT NULL
);

-- Prescription table
CREATE TABLE IF NOT EXISTS Prescription (
  prescriptionId INT AUTO_INCREMENT PRIMARY KEY,
  imageFile VARCHAR(500) NOT NULL,
  uploadDate TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  approved BOOLEAN DEFAULT FALSE,
  pharmacistId INT NOT NULL,
  FOREIGN KEY (pharmacistId) REFERENCES Pharmacist(pharmacistId)
);

-- Order table
CREATE TABLE IF NOT EXISTS `Order` (
  orderId INT AUTO_INCREMENT PRIMARY KEY,
  orderDate TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  status ENUM('Pending', 'Approved', 'Delivered', 'Cancelled') NOT NULL DEFAULT 'Pending',
  totalAmount DECIMAL(10,2) NOT NULL,
  customerId INT NOT NULL,
  prescriptionId INT NULL,
  paymentId INT NOT NULL,
  FOREIGN KEY (customerId) REFERENCES Customer(customerId),
  FOREIGN KEY (prescriptionId) REFERENCES Prescription(prescriptionId),
  FOREIGN KEY (paymentId) REFERENCES Payment(paymentId)
);

-- Feedback table
CREATE TABLE IF NOT EXISTS Feedback (
  feedbackId INT AUTO_INCREMENT PRIMARY KEY,
  customerId INT NOT NULL,
  orderId INT NOT NULL,
  rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comments TEXT,
  submittedDate TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (customerId) REFERENCES Customer(customerId),
  FOREIGN KEY (orderId) REFERENCES `Order`(orderId)
);

-- Delivery table
CREATE TABLE IF NOT EXISTS Delivery (
  id INT AUTO_INCREMENT PRIMARY KEY,
  orderId INT NOT NULL,
  trackingNumber VARCHAR(100) UNIQUE NOT NULL,
  carrier VARCHAR(100) NOT NULL DEFAULT 'PharmaCare Delivery',
  status ENUM('preparing', 'in_transit', 'out_for_delivery', 'delivered', 'failed') NOT NULL DEFAULT 'preparing',
  estimated_delivery DATE NOT NULL,
  actual_delivery TIMESTAMP NULL,
  shipping_address TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (orderId) REFERENCES `Order`(orderId)
);

-- Returns table
CREATE TABLE IF NOT EXISTS Returns (
  returnId INT AUTO_INCREMENT PRIMARY KEY,
  orderId INT NOT NULL,
  productId INT NOT NULL,
  reason VARCHAR(255) NOT NULL,
  description TEXT,
  status ENUM('pending', 'approved', 'rejected', 'completed') NOT NULL DEFAULT 'pending',
  refundAmount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  submittedDate TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  processedDate TIMESTAMP NULL,
  FOREIGN KEY (orderId) REFERENCES `Order`(orderId),
  FOREIGN KEY (productId) REFERENCES Product(productId)
);

-- Cart table
CREATE TABLE IF NOT EXISTS Cart (
  cartId INT AUTO_INCREMENT PRIMARY KEY,
  customerId INT NOT NULL,
  productId INT NOT NULL,
  quantity INT NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (customerId) REFERENCES Customer(customerId),
  FOREIGN KEY (productId) REFERENCES Product(productId),
  UNIQUE KEY unique_customer_product (customerId, productId)
);

-- Insert sample data
INSERT IGNORE INTO Branch (branchId, location, managerName, contactNumber) VALUES
(1, 'Downtown Branch', 'John Manager', '+1-555-0101'),
(2, 'Uptown Branch', 'Jane Manager', '+1-555-0102'),
(3, 'Suburban Branch', 'Bob Manager', '+1-555-0103');

INSERT IGNORE INTO Pharmacist (pharmacistId, name, licenseNumber, branchId) VALUES
(1, 'Dr. Sarah Wilson', 'PH001', 1),
(2, 'Dr. Michael Brown', 'PH002', 2),
(3, 'Dr. Emily Davis', 'PH003', 3);

INSERT IGNORE INTO Customer (customerId, name, phoneNumber, email, address, dateOfBirth, gender) VALUES
(1, 'John Doe', '+1-555-1001', 'john.doe@email.com', '123 Main St, New York, NY 10001', '1985-06-15', 'Male'),
(2, 'Jane Smith', '+1-555-1002', 'jane.smith@email.com', '456 Oak Ave, Brooklyn, NY 11201', '1990-03-22', 'Female'),
(3, 'Mike Johnson', '+1-555-1003', 'mike.johnson@email.com', '789 Pine St, Queens, NY 11375', '1988-11-08', 'Male');

INSERT IGNORE INTO Product (productId, name, description, price, category, requiresPrescription) VALUES
(1, 'Paracetamol 500mg', 'Pain relief and fever reducer', 5.99, 'Pain Relief', FALSE),
(2, 'Amoxicillin 250mg', 'Antibiotic for bacterial infections', 12.50, 'Antibiotics', TRUE),
(3, 'Vitamin D3', 'Vitamin D supplement for bone health', 8.75, 'Vitamins', FALSE),
(4, 'Ibuprofen 400mg', 'Anti-inflammatory pain reliever', 7.25, 'Pain Relief', FALSE),
(5, 'Cough Syrup', 'Relief for cough and cold symptoms', 15.99, 'Cold & Flu', FALSE);

INSERT IGNORE INTO Inventory (inventoryId, productId, branchId, stockQuantity) VALUES
(1, 1, 1, 100),
(2, 2, 1, 50),
(3, 3, 1, 75),
(4, 4, 1, 80),
(5, 5, 1, 60),
(6, 1, 2, 120),
(7, 2, 2, 40),
(8, 3, 2, 90),
(9, 4, 2, 70),
(10, 5, 2, 55);
