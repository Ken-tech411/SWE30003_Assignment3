"use client"

import { useState, useEffect, Suspense } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { CheckCircle, Clock, AlertCircle } from "lucide-react"
import Link from "next/link"
import { useSearchParams } from 'next/navigation'
import { Footer } from "@/components/footer"

function getDisplayMethod(method: string) {
  switch (method) {
    case "CreditCard":
      return "Credit/Debit Card"
    case "Cash":
      return "Cash on Delivery"
    default:
      return method
  }
}

function PaymentContent() {
  const [paymentStatus, setPaymentStatus] = useState<"processing" | "success" | "failed">("processing")
  const [paymentData, setPaymentData] = useState<{
    orderId: number;
    customerName: string;
    amount: number;
    method: string;
    paymentId: number;
  } | null>(null)
  const searchParams = useSearchParams()

  useEffect(() => {
    const orderIdParam = searchParams.get('orderId')
    if (orderIdParam) {
      fetchPayment(orderIdParam)
    } else {
      setPaymentStatus("failed")
    }
    // eslint-disable-next-line
  }, [])

  const fetchPayment = async (orderId: string) => {
    try {
      const response = await fetch(`/api/payments?orderId=${orderId}`)
      const result = await response.json()
      if (result && result.payment) {
        setPaymentData(result.payment)
        setPaymentStatus("success")
      } else {
        setPaymentStatus("failed")
      }
    } catch {
      setPaymentStatus("failed")
    }
  }

  if (paymentStatus === "processing") {
    return (
      <div className="min-h-screen flex flex-col">
        <div className="container mx-auto px-4 py-8 flex-1">
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
        <Footer />
      </div>
    )
  }

  if (paymentStatus === "success" && paymentData) {
    return (
      <div className="min-h-screen flex flex-col">
        <div className="container mx-auto px-4 py-8 flex-1">
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
                      <span className="font-mono">#{paymentData?.orderId}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Name:</span>
                      <span>{paymentData?.customerName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Amount:</span>
                      <span className="font-semibold">${Number(paymentData?.amount).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Payment Method:</span>
                      <span>{getDisplayMethod(paymentData?.method)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Payment ID:</span>
                      <span className="font-mono">#{paymentData?.paymentId}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <Link href={`/delivery/${paymentData?.orderId}`} className="w-full">
                    <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                      Track Your Order
                    </Button>
                  </Link>
                  <Link href="/products" className="w-full">
                    <Button variant="outline" className="w-full bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200">
                      Continue Shopping
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col">
      <div className="container mx-auto px-4 py-8 flex-1">
        <div className="max-w-md mx-auto">
          <Card>
            <CardContent className="text-center py-12">
              <AlertCircle className="w-16 h-16 mx-auto mb-4 text-red-500" />
              <h2 className="text-2xl font-bold mb-2 text-red-700">Payment Failed</h2>
              <p className="text-gray-600 mb-6">There was an issue processing your payment. Please try again.</p>
              <div className="space-y-3">
                <Link href="/purchase" className="w-full">
                  <Button variant="outline" className="w-full bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200">
                    Back to Checkout
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      <Footer />
    </div>
  )
}

function PaymentFallback() {
  return (
    <div className="min-h-screen flex flex-col">
      <div className="container mx-auto px-4 py-8 flex-1">
        <div className="max-w-md mx-auto">
          <Card>
            <CardContent className="text-center py-12">
              <Clock className="w-16 h-16 mx-auto mb-4 text-blue-500 animate-spin" />
              <h2 className="text-2xl font-bold mb-2">Loading Payment</h2>
              <p className="text-gray-600">Please wait...</p>
            </CardContent>
          </Card>
        </div>
      </div>
      <Footer />
    </div>
  )
}

export default function PaymentPage() {
  return (
    <Suspense fallback={<PaymentFallback />}>
      <PaymentContent />
    </Suspense>
  )
}
