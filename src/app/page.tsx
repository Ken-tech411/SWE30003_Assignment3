"use client";

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ShoppingCart, Package, RefreshCw, CreditCard, Truck, Users, Upload, MessageSquare } from "lucide-react"
import { useAuth } from "@/context/AuthContext";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

export default function HomePage() {
  const { user } = useAuth();

  // Show loading or fallback until user is loaded
  if (user === undefined) return <div>Loading...</div>;

  return (
    <Tabs value={user?.role === "pharmacist" ? "staff" : "customer"}>
      <TabsList>
        {user?.role === "pharmacist" && <TabsTrigger value="staff">Staff View</TabsTrigger>}
        {user?.role === "customer" && <TabsTrigger value="customer">Customer View</TabsTrigger>}
      </TabsList>
      <TabsContent value="staff">{/* Staff content */}</TabsContent>
      <TabsContent value="customer">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4">Welcome to PharmaCare</h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Your complete pharmacy management solution with seamless cart, payment, delivery, and return processes.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <ShoppingCart className="w-6 h-6 mr-2 text-blue-500" />
                  Shopping Cart
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">
                  Manage your cart items, update quantities, and proceed to checkout seamlessly.
                </p>
                <Link href="/cart">
                  <Button className="w-full">View Cart</Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Upload className="w-6 h-6 mr-2 text-blue-500" />
                  Upload Prescription
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">
                  Upload your prescription and let our pharmacists prepare your medications quickly and accurately.
                </p>
                <Link href="/prescription">
                  <Button className="w-full">Upload Prescription</Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <CreditCard className="w-6 h-6 mr-2 text-green-500" />
                  Purchase & Payment
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">
                  Complete your purchase with our secure payment system and multiple payment options.
                </p>
                <Link href="/purchase">
                  <Button className="w-full">Start Checkout</Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Package className="w-6 h-6 mr-2 text-purple-500" />
                  Delivery Management
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">
                  Track your deliveries and manage delivery operations for both customers and staff.
                </p>
                <Link href="/delivery">
                  <Button className="w-full">Manage Deliveries</Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <RefreshCw className="w-6 h-6 mr-2 text-orange-500" />
                  Returns & Exchanges
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">
                  Handle return requests and exchanges with our comprehensive return management system.
                </p>
                <Link href="/returns">
                  <Button className="w-full">Manage Returns</Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Truck className="w-6 h-6 mr-2 text-red-500" />
                  Track Delivery
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">
                  Real-time tracking of your delivery with detailed timeline and current location.
                </p>
                <Link href="/delivery/track">
                  <Button className="w-full">Track Package</Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <MessageSquare className="w-6 h-6 mr-2 text-red-500" />
                  Feedback
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">
                  Share your experience and help us improve our services. Your feedback matters to us.
                </p>
                <Link href="/feedback">
                  <Button className="w-full">Fill Your Feedback</Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="w-6 h-6 mr-2 text-indigo-500" />
                  Customer Support
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">
                  Get help with your orders, returns, or any questions about our pharmacy services.
                </p>
                <Button className="w-full bg-transparent" variant="outline">
                  Contact Support
                </Button>
              </CardContent>
            </Card>
          </div>

          <div className="bg-gray-50 rounded-lg p-8 text-center">
            <h2 className="text-2xl font-bold mb-4">Why Choose PharmaCare?</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Package className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="font-semibold mb-2">Fast Delivery</h3>
                <p className="text-sm text-gray-600">Quick and reliable delivery with real-time tracking</p>
              </div>
              <div>
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <CreditCard className="w-6 h-6 text-green-600" />
                </div>
                <h3 className="font-semibold mb-2">Secure Payments</h3>
                <p className="text-sm text-gray-600">Multiple payment options with bank-level security</p>
              </div>
              <div>
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <RefreshCw className="w-6 h-6 text-purple-600" />
                </div>
                <h3 className="font-semibold mb-2">Easy Returns</h3>
                <p className="text-sm text-gray-600">Hassle-free return and exchange process</p>
              </div>
            </div>
          </div>
        </div>
      </TabsContent>
    </Tabs>
  )
}
import "@/app/globals.css"