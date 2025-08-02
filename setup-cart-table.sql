-- Create Cart table for the pharmacy app
USE lcpms;

CREATE TABLE IF NOT EXISTS Cart (
  cartId INT AUTO_INCREMENT PRIMARY KEY,
  customerId INT NOT NULL,
  productId INT NOT NULL,
  quantity INT NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (customerId) REFERENCES Customer(customerId),
  FOREIGN KEY (productId) REFERENCES Product(productId),
  UNIQUE KEY unique_customer_product (customerId, productId)
);

-- Insert sample products for testing
INSERT INTO Product (name, description, price, category, requiresPrescription) VALUES
('Paracetamol 500mg', 'Pain relief and fever reducer', 5.99, 'Pain Relief', false),
('Vitamin C 1000mg', 'Immune system support', 12.99, 'Vitamins', false),
('Amoxicillin 250mg', 'Antibiotic for bacterial infections', 15.99, 'Antibiotics', true),
('Ibuprofen 200mg', 'Anti-inflammatory pain relief', 8.99, 'Pain Relief', false),
('Multivitamin Complex', 'Daily nutritional supplement', 19.99, 'Vitamins', false);

-- Insert sample customer for testing
INSERT INTO Customer (name, phoneNumber, email, address, dateOfBirth, gender) VALUES
('John Doe', '+1234567890', 'john@example.com', '123 Main St, City', '1990-01-01', 'Male');

-- Insert sample cart item for testing
INSERT INTO Cart (customerId, productId, quantity) VALUES
(1, 1, 2),
(1, 2, 1);
