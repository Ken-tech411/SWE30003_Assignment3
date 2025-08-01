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
  status ENUM('Pending', 'Approved', 'Delivered', 'Cancelled') NOT NULL,
  totalAmount DECIMAL(10,2) NOT NULL,
  customerId INT NOT NULL,
  prescriptionId INT,
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
  rating INT CHECK (rating >= 1 AND rating <= 5),
  comments TEXT,
  submittedDate TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (customerId) REFERENCES Customer(customerId),
  FOREIGN KEY (orderId) REFERENCES `Order`(orderId)
);

-- Create indexes for better performance
CREATE INDEX idx_customer_email ON Customer(email);
CREATE INDEX idx_order_customer ON `Order`(customerId);
CREATE INDEX idx_order_status ON `Order`(status);
CREATE INDEX idx_inventory_product ON Inventory(productId);
CREATE INDEX idx_inventory_branch ON Inventory(branchId);
CREATE INDEX idx_feedback_order ON Feedback(orderId);

-- Insert sample data
INSERT INTO Branch (location, managerName, contactNumber) VALUES
('Main Street Pharmacy', 'John Smith', '+1234567890'),
('Downtown Medical Center', 'Sarah Johnson', '+1234567891'),
('Suburban Health Store', 'Michael Brown', '+1234567892');

INSERT INTO Pharmacist (name, licenseNumber, branchId) VALUES
('Dr. Alice Wilson', 'PHARM-001', 1),
('Dr. Robert Davis', 'PHARM-002', 2),
('Dr. Emma Thompson', 'PHARM-003', 3);

INSERT INTO Product (name, description, price, category, requiresPrescription) VALUES
('Paracetamol 500mg', 'Pain relief medication', 5.99, 'Pain Relief', FALSE),
('Vitamin C 1000mg', 'Immune system support', 12.99, 'Vitamins', FALSE),
('Amoxicillin 250mg', 'Antibiotic medication', 15.99, 'Antibiotics', TRUE),
('Cough Syrup', 'Cough and cold relief', 8.99, 'Cold & Flu', FALSE);

INSERT INTO Customer (name, phoneNumber, email, address, dateOfBirth, gender) VALUES
('Alice Johnson', '+1234567899', 'alice@email.com', '123 Main St', '1990-05-15', 'Female'),
('Bob Williams', '+1234567898', 'bob@email.com', '456 Oak Ave', '1985-08-22', 'Male'),
('Carol Davis', '+1234567897', 'carol@email.com', '789 Pine Rd', '1992-03-10', 'Female');

-- Insert initial inventory
INSERT INTO Inventory (productId, branchId, stockQuantity) VALUES
(1, 1, 100), (1, 2, 80), (1, 3, 120),
(2, 1, 50), (2, 2, 75), (2, 3, 60),
(3, 1, 30), (3, 2, 25), (3, 3, 40),
(4, 1, 200), (4, 2, 150), (4, 3, 180);

-- Grant permissions (adjust as needed)
GRANT ALL PRIVILEGES ON lcpms.* TO 'root'@'%';
FLUSH PRIVILEGES;
