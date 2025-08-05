"use client"
import { useParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Package, MapPin, Clock, User } from "lucide-react"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/context/AuthContext"
import { Footer } from "@/components/footer"

export default function DeliveryDetailPage() {
  const { orderId } = useParams<{ orderId: string }>()
  const { user } = useAuth()
  const [order, setOrder] = useState<{
    orderId: number;
    customerName: string;
    customerEmail: string;
    customerAddress: string;
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
  const [prescriptionId, setPrescriptionId] = useState<number | null>(null)

  useEffect(() => {
    async function fetchOrder() {
      setLoading(true)
      if (!orderId) {
        setOrder(null)
        setLoading(false)
        return
      }
      try {
        const res = await fetch(`/api/orders?orderId=${encodeURIComponent(orderId)}`)
        if (!res.ok) {
          setOrder(null)
        } else {
          const data = await res.json()
          setOrder(data.orders?.[0] || null)
        }
      } catch {
        setOrder(null)
      }
      setLoading(false)
    }
    fetchOrder()
  }, [orderId])

  useEffect(() => {
    async function fetchPrescriptionId() {
      if (!user?.linkedId) {
        setPrescriptionId(null)
        return
      }
      try {
        const res = await fetch(`/api/prescriptions?customerId=${user.linkedId}`)
        if (!res.ok) {
          setPrescriptionId(null)
          return
        }
        const data = await res.json()
        if (order?.prescriptionId) {
          setPrescriptionId(order.prescriptionId)
        } else if (Array.isArray(data.data) && data.data.length > 0) {
          const sorted = data.data.sort((a: unknown, b: unknown) => {
            const aData = a as { uploadDate: string };
            const bData = b as { uploadDate: string };
            return new Date(bData.uploadDate).getTime() - new Date(aData.uploadDate).getTime();
          })
          setPrescriptionId(sorted[0].prescriptionId)
        } else {
          setPrescriptionId(null)
        }
      } catch {
        setPrescriptionId(null)
      }
    }
    if (user?.role === "customer" && order) {
      fetchPrescriptionId()
    }
  }, [user, order])

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "approved":
        return "bg-blue-100 text-blue-800"
      case "delivered":
        return "bg-green-100 text-green-800"
      case "cancelled":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Loading delivery information...</div>
        <Footer />
      </div>
    )
  }

  if (!order) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center text-red-500">No delivery information found.</div>
        <Footer />
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Order Information Card */}
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
                <span className="font-semibold">
                  {(order.customerName && order.customerName.trim().length > 0)
                    ? order.customerName
                    : "Guest"}
                  {order.customerEmail && (
                    <> (<span className="text-gray-600">{order.customerEmail}</span>)</>
                  )}
                </span>
              </div>
              <div className="flex items-center mb-2">
                <MapPin className="w-5 h-5 mr-2" />
                <span>
                  {order.customerAddress || "No address available"}
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
                <span>{prescriptionId ?? "N/A"}</span>
              </div>

              {/* Action buttons aligned right */}
              <div className="flex justify-end gap-2 mt-4">
                {user?.role === "pharmacist" && order.status?.toLowerCase() === "pending" && (
                  <>
                    <Button
                      size="sm"
                      className="bg-blue-500 hover:bg-blue-600 text-white"
                      onClick={async () => {
                        await fetch('/api/orders', {
                          method: 'PUT',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ orderId: order.orderId, status: "approved" }),
                        });
                        window.location.reload();
                      }}
                    >
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      className="bg-red-500 hover:bg-red-600 text-white"
                      onClick={async () => {
                        await fetch('/api/orders', {
                          method: 'PUT',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ orderId: order.orderId, status: "cancelled" }),
                        });
                        window.location.reload();
                      }}
                    >
                      Reject
                    </Button>
                  </>
                )}
                {user?.role === "pharmacist" && order.status?.toLowerCase() === "approved" && (
                  <Button
                    size="sm"
                    className="bg-green-500 hover:bg-green-600 text-white"
                    onClick={async () => {
                      await fetch('/api/orders', {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ orderId: order.orderId, status: "delivered" }),
                      });
                      window.location.reload();
                    }}
                  >
                    Mark Delivered
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
        {/* Ordered Items Card */}
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
      <Footer />
    </div>
  )
}