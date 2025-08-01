"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { CheckCircle, CreditCard, Clock, AlertCircle } from "lucide-react"
import Link from "next/link"

export default function PaymentPage() {
  const [paymentStatus, setPaymentStatus] = useState<"processing" | "success" | "failed">("processing")

  const handlePayment = () => {
    // Simulate payment processing
    setTimeout(() => {
      setPaymentStatus(Math.random() > 0.1 ? "success" : "failed")
    }, 2000)
  }

  if (paymentStatus === "processing") {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto">
          <Card>
            <CardContent className="text-center py-12">
              <Clock className="w-16 h-16 mx-auto mb-4 text-blue-500 animate-spin" />
              <h2 className="text-2xl font-bold mb-2">Processing Payment</h2>
              <p className="text-gray-600 mb-6">Please wait while we process your payment...</p>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-blue-500 h-2 rounded-full animate-pulse" style={{ width: "60%" }}></div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (paymentStatus === "success") {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto">
          <Card>
            <CardContent className="text-center py-12">
              <CheckCircle className="w-16 h-16 mx-auto mb-4 text-green-500" />
              <h2 className="text-2xl font-bold mb-2 text-green-700">Payment Successful!</h2>
              <p className="text-gray-600 mb-6">Your order has been confirmed and will be processed shortly.</p>

              <div className="bg-gray-50 p-4 rounded-lg mb-6">
                <div className="text-sm space-y-2">
                  <div className="flex justify-between">
                    <span>Order ID:</span>
                    <span className="font-mono">#ORD-2024-001</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Amount:</span>
                    <span className="font-semibold">$32.24</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Payment Method:</span>
                    <span>Credit Card ****3456</span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <Link href="/delivery/track" className="w-full">
                  <Button className="w-full">Track Your Order</Button>
                </Link>
                <Link href="/" className="w-full">
                  <Button variant="outline" className="w-full bg-transparent">
                    Continue Shopping
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-md mx-auto">
        <Card>
          <CardContent className="text-center py-12">
            <AlertCircle className="w-16 h-16 mx-auto mb-4 text-red-500" />
            <h2 className="text-2xl font-bold mb-2 text-red-700">Payment Failed</h2>
            <p className="text-gray-600 mb-6">There was an issue processing your payment. Please try again.</p>

            <div className="space-y-3">
              <Button onClick={handlePayment} className="w-full">
                <CreditCard className="w-4 h-4 mr-2" />
                Try Again
              </Button>
              <Link href="/purchase" className="w-full">
                <Button variant="outline" className="w-full bg-transparent">
                  Back to Checkout
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
