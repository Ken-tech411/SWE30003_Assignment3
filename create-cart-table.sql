-- Create Cart table based on your mandatory schema
-- Since Cart is not in your original schema, I'll create it to work with existing tables

USE lcpms;

CREATE TABLE IF NOT EXISTS Cart (
  cartId INT AUTO_INCREMENT PRIMARY KEY,
  customerId INT NOT NULL,
  productId INT NOT NULL,
  quantity INT NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (customerId) REFERENCES Customer(customerId) ON DELETE CASCADE,
  FOREIGN KEY (productId) REFERENCES Product(productId) ON DELETE CASCADE,
  UNIQUE KEY unique_customer_product (customerId, productId)
);

-- Insert sample data to test
INSERT IGNORE INTO Customer (name, phoneNumber, email, address, dateOfBirth, gender) VALUES
('Test Customer', '1234567890', 'test@example.com', '123 Test St', '1990-01-01', 'Male');

INSERT IGNORE INTO Product (name, description, price, category, requiresPrescription) VALUES
('Paracetamol 500mg', 'Pain relief medication', 5.99, 'Pain Relief', false),
('Vitamin C 1000mg', 'Immune system support', 12.99, 'Vitamins', false),
('Ibuprofen 200mg', 'Anti-inflammatory', 8.99, 'Pain Relief', false);
