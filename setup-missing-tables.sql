-- Create missing tables for the pharmacy app

USE lcpms;

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

-- Insert some sample data for testing

-- Sample cart items
INSERT IGNORE INTO Cart (cartId, customerId, productId, quantity) VALUES
(1, 1, 1, 2),
(2, 1, 3, 1),
(3, 2, 2, 1),
(4, 2, 4, 3);

-- Sample deliveries
INSERT IGNORE INTO Delivery (id, orderId, trackingNumber, carrier, status, estimated_delivery, shipping_address) VALUES
(1, 1, 'PC001234567', 'PharmaCare Express', 'in_transit', '2024-01-15', '123 Main St, New York, NY 10001'),
(2, 2, 'PC001234568', 'PharmaCare Standard', 'delivered', '2024-01-10', '456 Oak Ave, Brooklyn, NY 11201'),
(3, 3, 'PC001234569', 'PharmaCare Express', 'preparing', '2024-01-20', '789 Pine St, Queens, NY 11375');

-- Sample returns
INSERT IGNORE INTO Returns (returnId, orderId, productId, reason, description, status, refundAmount) VALUES
(1, 1, 1, 'damaged', 'Product arrived damaged during shipping', 'pending', 5.99),
(2, 2, 2, 'wrong_product', 'Received wrong medication', 'approved', 12.50),
(3, 3, 3, 'expired', 'Product was expired upon arrival', 'completed', 8.75);

SELECT 'Missing tables created successfully!' as message;
