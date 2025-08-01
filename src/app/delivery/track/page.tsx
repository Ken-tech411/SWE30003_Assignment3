"use client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, Circle, Package, Truck, MapPin, Clock } from "lucide-react"

export default function TrackDeliveryPage() {
  const trackingData = {
    id: "DEL-001",
    orderId: "ORD-2024-001",
    status: "in_transit",
    estimatedDelivery: "2024-08-30",
    currentLocation: "Distribution Center - Brooklyn",
    timeline: [
      {
        status: "Order Confirmed",
        timestamp: "2024-08-28 10:30 AM",
        completed: true,
        description: "Your order has been confirmed and is being prepared.",
      },
      {
        status: "Package Prepared",
        timestamp: "2024-08-28 2:15 PM",
        completed: true,
        description: "Your package has been prepared and is ready for pickup.",
      },
      {
        status: "In Transit",
        timestamp: "2024-08-29 8:00 AM",
        completed: true,
        description: "Your package is on the way to the delivery address.",
      },
      {
        status: "Out for Delivery",
        timestamp: "Expected: 2024-08-30 9:00 AM",
        completed: false,
        description: "Your package will be out for delivery.",
      },
      {
        status: "Delivered",
        timestamp: "Expected: 2024-08-30 6:00 PM",
        completed: false,
        description: "Your package will be delivered.",
      },
    ],
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Track Your Delivery</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Delivery Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {trackingData.timeline.map((event, index) => (
                  <div key={index} className="flex items-start space-x-4">
                    <div className="flex flex-col items-center">
                      {event.completed ? (
                        <CheckCircle className="w-6 h-6 text-green-500" />
                      ) : (
                        <Circle className="w-6 h-6 text-gray-300" />
                      )}
                      {index < trackingData.timeline.length - 1 && (
                        <div className={`w-0.5 h-12 mt-2 ${event.completed ? "bg-green-500" : "bg-gray-200"}`} />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h3 className={`font-semibold ${event.completed ? "text-green-700" : "text-gray-500"}`}>
                          {event.status}
                        </h3>
                        <span className="text-sm text-gray-500">{event.timestamp}</span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{event.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Delivery Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Tracking ID:</span>
                <span className="text-sm font-mono">{trackingData.id}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Order ID:</span>
                <span className="text-sm font-mono">{trackingData.orderId}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Status:</span>
                <Badge className="bg-blue-100 text-blue-800">
                  {trackingData.status.replace("_", " ").toUpperCase()}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Est. Delivery:</span>
                <span className="text-sm">{trackingData.estimatedDelivery}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Current Location</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-3">
                <MapPin className="w-5 h-5 text-blue-500" />
                <div>
                  <p className="font-medium">{trackingData.currentLocation}</p>
                  <p className="text-sm text-gray-600">Last updated: 2 hours ago</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Delivery Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center space-x-3">
                <Package className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm font-medium">3 items</p>
                  <p className="text-xs text-gray-600">Standard packaging</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Truck className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm font-medium">Standard Delivery</p>
                  <p className="text-xs text-gray-600">5-7 business days</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Clock className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm font-medium">Delivery Window</p>
                  <p className="text-xs text-gray-600">9:00 AM - 6:00 PM</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
