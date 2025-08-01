"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Package, Truck, MapPin, Clock, User, Search } from "lucide-react"

interface Delivery {
  id: string
  orderId: string
  customerName: string
  address: string
  status: "pending" | "in_transit" | "delivered" | "failed"
  estimatedDelivery: string
  items: number
  total: number
}

export default function DeliveryPage() {
  const [activeTab, setActiveTab] = useState("customer")
  const [trackingId, setTrackingId] = useState("")

  const customerDeliveries: Delivery[] = [
    {
      id: "DEL-001",
      orderId: "ORD-2024-001",
      customerName: "John Doe",
      address: "123 Main St, New York, NY 10001",
      status: "in_transit",
      estimatedDelivery: "2024-08-30",
      items: 3,
      total: 32.24,
    },
    {
      id: "DEL-002",
      orderId: "ORD-2024-002",
      customerName: "John Doe",
      address: "123 Main St, New York, NY 10001",
      status: "delivered",
      estimatedDelivery: "2024-08-25",
      items: 2,
      total: 18.5,
    },
  ]

  const staffDeliveries: Delivery[] = [
    {
      id: "DEL-003",
      orderId: "ORD-2024-003",
      customerName: "Jane Smith",
      address: "456 Oak Ave, Brooklyn, NY 11201",
      status: "pending",
      estimatedDelivery: "2024-08-31",
      items: 1,
      total: 25.99,
    },
    {
      id: "DEL-004",
      orderId: "ORD-2024-004",
      customerName: "Mike Johnson",
      address: "789 Pine St, Queens, NY 11375",
      status: "in_transit",
      estimatedDelivery: "2024-08-30",
      items: 4,
      total: 45.75,
    },
    {
      id: "DEL-005",
      orderId: "ORD-2024-005",
      customerName: "Sarah Wilson",
      address: "321 Elm St, Manhattan, NY 10002",
      status: "delivered",
      estimatedDelivery: "2024-08-29",
      items: 2,
      total: 31.2,
    },
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "in_transit":
        return "bg-blue-100 text-blue-800"
      case "delivered":
        return "bg-green-100 text-green-800"
      case "failed":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="w-4 h-4" />
      case "in_transit":
        return <Truck className="w-4 h-4" />
      case "delivered":
        return <Package className="w-4 h-4" />
      default:
        return <Package className="w-4 h-4" />
    }
  }

  const updateDeliveryStatus = (deliveryId: string, newStatus: string) => {
    // In a real app, this would update the database
    console.log(`Updating delivery ${deliveryId} to ${newStatus}`)
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Delivery Management</h1>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="customer">Customer View</TabsTrigger>
          <TabsTrigger value="staff">Staff View</TabsTrigger>
        </TabsList>

        <TabsContent value="customer" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Track Your Delivery</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex space-x-2">
                <Input
                  placeholder="Enter tracking ID (e.g., DEL-001)"
                  value={trackingId}
                  onChange={(e) => setTrackingId(e.target.value)}
                />
                <Button>
                  <Search className="w-4 h-4 mr-2" />
                  Track
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4">
            <h2 className="text-xl font-semibold">Your Deliveries</h2>
            {customerDeliveries.map((delivery) => (
              <Card key={delivery.id}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      {getStatusIcon(delivery.status)}
                      <div>
                        <h3 className="font-semibold">Order {delivery.orderId}</h3>
                        <p className="text-sm text-gray-600">
                          {delivery.items} items • ${delivery.total}
                        </p>
                      </div>
                    </div>
                    <Badge className={getStatusColor(delivery.status)}>
                      {delivery.status.replace("_", " ").toUpperCase()}
                    </Badge>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center text-sm text-gray-600">
                      <MapPin className="w-4 h-4 mr-2" />
                      {delivery.address}
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <Clock className="w-4 h-4 mr-2" />
                      Estimated delivery: {delivery.estimatedDelivery}
                    </div>
                  </div>

                  {delivery.status === "in_transit" && (
                    <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                      <p className="text-sm text-blue-800">
                        Your order is on the way! Expected delivery today between 2-6 PM.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="staff" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Pending</p>
                    <p className="text-2xl font-bold">{staffDeliveries.filter((d) => d.status === "pending").length}</p>
                  </div>
                  <Clock className="w-8 h-8 text-yellow-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">In Transit</p>
                    <p className="text-2xl font-bold">
                      {staffDeliveries.filter((d) => d.status === "in_transit").length}
                    </p>
                  </div>
                  <Truck className="w-8 h-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Delivered</p>
                    <p className="text-2xl font-bold">
                      {staffDeliveries.filter((d) => d.status === "delivered").length}
                    </p>
                  </div>
                  <Package className="w-8 h-8 text-green-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4">
            <h2 className="text-xl font-semibold">All Deliveries</h2>
            {staffDeliveries.map((delivery) => (
              <Card key={delivery.id}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <User className="w-5 h-5 text-gray-400" />
                      <div>
                        <h3 className="font-semibold">{delivery.customerName}</h3>
                        <p className="text-sm text-gray-600">Order {delivery.orderId}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge className={getStatusColor(delivery.status)}>
                        {delivery.status.replace("_", " ").toUpperCase()}
                      </Badge>
                      <span className="text-sm font-medium">${delivery.total}</span>
                    </div>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center text-sm text-gray-600">
                      <MapPin className="w-4 h-4 mr-2" />
                      {delivery.address}
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <Package className="w-4 h-4 mr-2" />
                      {delivery.items} items
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <Clock className="w-4 h-4 mr-2" />
                      Due: {delivery.estimatedDelivery}
                    </div>
                  </div>

                  <div className="flex space-x-2">
                    {delivery.status === "pending" && (
                      <Button size="sm" onClick={() => updateDeliveryStatus(delivery.id, "in_transit")}>
                        Start Delivery
                      </Button>
                    )}
                    {delivery.status === "in_transit" && (
                      <Button size="sm" onClick={() => updateDeliveryStatus(delivery.id, "delivered")}>
                        Mark Delivered
                      </Button>
                    )}
                    <Button variant="outline" size="sm">
                      View Details
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
