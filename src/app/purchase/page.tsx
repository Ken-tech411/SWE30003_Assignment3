"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Textarea } from "@/components/ui/textarea"
import { CreditCard, Truck, MapPin } from "lucide-react"
import Link from "next/link"
import { useRouter } from 'next/navigation'

interface CartItem {
  productId: number
  name: string
  price: number
  quantity: number
  description: string
  requiresPrescription: boolean
}

export default function PurchasePage() {
  const [deliveryMethod, setDeliveryMethod] = useState("standard")
  const [paymentMethod, setPaymentMethod] = useState("card")
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [loading, setLoading] = useState(true)
  const [customerId, setCustomerId] = useState<number | null>(null)
  const [customerData, setCustomerData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    zipCode: ""
  })
  const router = useRouter()

  // On mount, get or create customerId for this session
  useEffect(() => {
    const storedId = localStorage.getItem("customerId")
    if (storedId) {
      setCustomerId(Number(storedId))
    } else {
      // Create a new customer in the backend for this session
      fetch("/api/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Guest",
          phoneNumber: "",
          email: "",
          address: "",
          dateOfBirth: null,
          gender: null
        })
      })
        .then(res => res.json())
        .then(data => {
          if (data.customerId) {
            localStorage.setItem("customerId", data.customerId)
            setCustomerId(data.customerId)
          }
        })
    }
  }, [])

  useEffect(() => {
    if (customerId) {
      fetchCartItems(customerId)
      fetchCustomerData(customerId)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customerId])

  const fetchCartItems = async (cid: number) => {
    try {
      const response = await fetch(`/api/cart?customerId=${cid}`)
      const data = await response.json()
      setCartItems(data.cartItems || [])
    } catch (error) {
      console.error('Error fetching cart items:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchCustomerData = async (cid: number) => {
    try {
      const response = await fetch(`/api/customers/${cid}`)
      const data = await response.json()
      if (data.customer) {
        setCustomerData({
          firstName: data.customer.name?.split(' ')[0] || '',
          lastName: data.customer.name?.split(' ').slice(1).join(' ') || '',
          email: data.customer.email || '',
          phone: data.customer.phoneNumber || '',
          address: data.customer.address || '',
          city: '',
          zipCode: ''
        })
      }
    } catch (error) {
      // It's okay if customer is not found (guest)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setCustomerData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const getDeliveryPrice = () => {
    switch (deliveryMethod) {
      case "express": return 9.99
      case "overnight": return 19.99
      default: return 0
    }
  }

  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const tax = subtotal * 0.1
  const deliveryPrice = getDeliveryPrice()
  const total = subtotal + tax + deliveryPrice

  const handlePlaceOrder = async () => {
    if (!customerData.firstName || !customerData.email || !customerData.address) {
      alert("Please fill in all required fields")
      return
    }

    if (cartItems.length === 0) {
      alert("Your cart is empty")
      return
    }

    try {
      // Update customer info before placing order
      await fetch(`/api/customers/${customerId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: `${customerData.firstName} ${customerData.lastName}`.trim(),
          phoneNumber: customerData.phone,
          email: customerData.email,
          address: `${customerData.address}, ${customerData.city} ${customerData.zipCode}`.trim(),
          dateOfBirth: null,
          gender: null
        })
      })

      // Create order
      const orderResponse = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customerId,
          totalAmount: total,
          status: 'Pending',
          shippingAddress: `${customerData.address}, ${customerData.city} ${customerData.zipCode}`,
          items: cartItems
        })
      })

      const orderResult = await orderResponse.json()

      if (orderResult.success && orderResult.orderId) {
        // Create payment record with the new orderId
        const paymentResponse = await fetch('/api/payments', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            orderId: orderResult.orderId,
            method: paymentMethod === 'card' ? 'CreditCard' : 'Cash',
            status: 'Success'
          })
        })

        const paymentResult = await paymentResponse.json()

        if (paymentResult.success) {
          // Clear cart after successful order
          await fetch(`/api/cart?customerId=${customerId}`, {
            method: 'DELETE'
          })

          // Redirect to payment page with order details
          router.push(`/payment?orderId=${orderResult.orderId}&amount=${total.toFixed(2)}`)
        } else {
          alert("Failed to process payment")
        }
      } else {
        alert("Failed to create order")
      }
    } catch (error) {
      console.error('Error placing order:', error)
      alert("Error placing order")
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Loading checkout...</div>
      </div>
    )
  }

  if (cartItems.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4">Your cart is empty</h1>
          <p className="text-gray-600 mb-6">Add some items to your cart before checking out.</p>
          <Link href="/data">
            <Button>Browse Products</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Checkout</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          {/* Shipping Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <MapPin className="w-5 h-5 mr-2" />
                Shipping Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">First Name</Label>
                  <Input 
                    id="firstName" 
                    value={customerData.firstName}
                    onChange={(e) => handleInputChange('firstName', e.target.value)}
                    placeholder="John" 
                  />
                </div>
                <div>
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input 
                    id="lastName" 
                    value={customerData.lastName}
                    onChange={(e) => handleInputChange('lastName', e.target.value)}
                    placeholder="Doe" 
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input 
                  id="email" 
                  type="email" 
                  value={customerData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="john@example.com" 
                />
              </div>
              <div>
                <Label htmlFor="phone">Phone Number</Label>
                <Input 
                  id="phone" 
                  value={customerData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  placeholder="+1 (555) 123-4567" 
                />
              </div>
              <div>
                <Label htmlFor="address">Address</Label>
                <Input 
                  id="address" 
                  value={customerData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  placeholder="123 Main Street" 
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="city">City</Label>
                  <Input 
                    id="city" 
                    value={customerData.city}
                    onChange={(e) => handleInputChange('city', e.target.value)}
                    placeholder="New York" 
                  />
                </div>
                <div>
                  <Label htmlFor="zipCode">ZIP Code</Label>
                  <Input 
                    id="zipCode" 
                    value={customerData.zipCode}
                    onChange={(e) => handleInputChange('zipCode', e.target.value)}
                    placeholder="10001" 
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Delivery Options */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Truck className="w-5 h-5 mr-2" />
                Delivery Options
              </CardTitle>
            </CardHeader>
            <CardContent>
              <RadioGroup value={deliveryMethod} onValueChange={setDeliveryMethod}>
                <div className="flex items-center space-x-2 p-3 border rounded-lg">
                  <RadioGroupItem value="standard" id="standard" />
                  <Label htmlFor="standard" className="flex-1">
                    <div>
                      <p className="font-medium">Standard Delivery</p>
                      <p className="text-sm text-gray-600">5-7 business days - Free</p>
                    </div>
                  </Label>
                </div>
                <div className="flex items-center space-x-2 p-3 border rounded-lg">
                  <RadioGroupItem value="express" id="express" />
                  <Label htmlFor="express" className="flex-1">
                    <div>
                      <p className="font-medium">Express Delivery</p>
                      <p className="text-sm text-gray-600">2-3 business days - $9.99</p>
                    </div>
                  </Label>
                </div>
                <div className="flex items-center space-x-2 p-3 border rounded-lg">
                  <RadioGroupItem value="overnight" id="overnight" />
                  <Label htmlFor="overnight" className="flex-1">
                    <div>
                      <p className="font-medium">Overnight Delivery</p>
                      <p className="text-sm text-gray-600">Next business day - $19.99</p>
                    </div>
                  </Label>
                </div>
              </RadioGroup>
            </CardContent>
          </Card>

          {/* Special Instructions */}
          <Card>
            <CardHeader>
              <CardTitle>Special Instructions</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea placeholder="Any special delivery instructions..." className="min-h-[100px]" />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          {/* Payment Method */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <CreditCard className="w-5 h-5 mr-2" />
                Payment Method
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="card" id="card" />
                  <Label htmlFor="card">Credit/Debit Card</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="cash" id="cash" />
                  <Label htmlFor="cash">Cash on Delivery</Label>
                </div>
              </RadioGroup>
              {paymentMethod === "card" && (
                <div className="space-y-4 mt-4">
                  <div>
                    <Label htmlFor="cardNumber">Card Number</Label>
                    <Input id="cardNumber" placeholder="1234 5678 9012 3456" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="expiry">Expiry Date</Label>
                      <Input id="expiry" placeholder="MM/YY" />
                    </div>
                    <div>
                      <Label htmlFor="cvv">CVV</Label>
                      <Input id="cvv" placeholder="123" />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="cardName">Name on Card</Label>
                    <Input id="cardName" placeholder="John Doe" />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Order Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Cart Items */}
              <div className="space-y-2">
                {cartItems.map((item) => (
                  <div key={item.productId} className="flex justify-between text-sm">
                    <span>{item.name} x{item.quantity}</span>
                    <span>${(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>
              
              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tax:</span>
                  <span>${tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Delivery:</span>
                  <span>
                    {deliveryPrice === 0 ? "Free" : `$${deliveryPrice.toFixed(2)}`}
                  </span>
                </div>
                <div className="border-t pt-2">
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total:</span>
                    <span>${total.toFixed(2)}</span>
                  </div>
                </div>
              </div>
              
              <Button onClick={handlePlaceOrder} className="w-full" size="lg">
                Place Order
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}