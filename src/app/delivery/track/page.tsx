"use client"
import { useAuth } from "@/context/AuthContext"
import { useSearchParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Package, Clock, User } from "lucide-react"
import { useEffect, useState } from "react"

export default function TrackDeliveryPage() {
  const { user } = useAuth();
  const searchParams = useSearchParams()
  const orderId = searchParams.get("orderId") || ""

  const [order, setOrder] = useState<{
    orderId: number;
    customerName: string;
    customerEmail: string;
    orderDate: string;
    status: string;
    totalAmount: number;
    prescriptionId?: number;
    items?: {
      orderItemId: number;
      productName: string;
      productDescription: string;
      quantity: number;
      price: number;
    }[];
  } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchOrder() {
      setLoading(true)
      setError(null)
      if (!orderId || !user?.customerId) {
        setOrder(null)
        setLoading(false)
        return
      }
      try {
        const res = await fetch(`/api/orders/track?orderId=${encodeURIComponent(orderId)}&customerId=${user.customerId}`)
        if (!res.ok) {
          const data = await res.json()
          setError(data.error || "No tracking information found.")
          setOrder(null)
        } else {
          const data = await res.json()
          setOrder(data)
        }
      } catch {
        setError("No tracking information found.")
        setOrder(null)
      }
      setLoading(false)
    }
    fetchOrder()
  }, [orderId, user])

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "preparing":
        return "bg-yellow-100 text-yellow-800"
      case "in_transit":
        return "bg-blue-100 text-blue-800"
      case "delivered":
        return "bg-green-100 text-green-800"
      case "failed":
        return "bg-red-100 text-red-800"
      case "pending":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center text-red-500">Please sign in to track your orders.</div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Loading tracking information...</div>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center text-red-500">
          {error || "No tracking information found."}
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Track Your Delivery</h1>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Order Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center mb-2">
                <Package className="w-5 h-5 mr-2" />
                <span className="font-semibold text-lg">Order #{order.orderId}</span>
              </div>
              <div className="flex items-center mb-2">
                <User className="w-5 h-5 mr-2" />
                <span>
                  {order.customerName} ({order.customerEmail})
                </span>
              </div>
              <div className="flex items-center mb-2">
                <Clock className="w-5 h-5 mr-2" />
                <span>
                  Order Date:{" "}
                  {order.orderDate
                    ? new Date(order.orderDate).toLocaleDateString()
                    : "N/A"}
                </span>
              </div>
              <div className="flex items-center mb-2">
                <span className="font-medium mr-2">Status:</span>
                <Badge className={getStatusColor(order.status)}>
                  {order.status ? order.status.toUpperCase() : "N/A"}
                </Badge>
              </div>
              <div className="flex items-center mb-2">
                <span className="font-medium mr-2">Total Amount (Included Tax):</span>
                <span>${order.totalAmount ? Number(order.totalAmount).toFixed(2) : "0.00"}</span>
              </div>
              <div className="flex items-center mb-2">
                <span className="font-medium mr-2">Prescription ID:</span>
                <span>{order.prescriptionId ?? "N/A"}</span>
              </div>
            </CardContent>
          </Card>
        </div>
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Ordered Items</CardTitle>
            </CardHeader>
            <CardContent>
              {order.items && order.items.length > 0 ? (
                <ul className="space-y-2">
                  {order.items.map((item) => (
                    <li key={item.orderItemId} className="border-b pb-2">
                      <div className="font-medium">{item.productName}</div>
                      <div className="text-sm text-gray-600">{item.productDescription}</div>
                      <div className="text-sm">
                        Quantity: {item.quantity} &nbsp;|&nbsp; Price: ${Number(item.price).toFixed(2)}
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="text-gray-500">No items found for this order.</div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
