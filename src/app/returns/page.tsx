"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RefreshCw, Package, AlertCircle, CheckCircle, Clock, User } from "lucide-react"

interface ReturnRequest {
  id: string
  orderId: string
  customerName: string
  productName: string
  reason: string
  status: "pending" | "approved" | "rejected" | "completed"
  requestDate: string
  refundAmount: number
}

export default function ReturnsPage() {
  const [activeTab, setActiveTab] = useState("customer")
  const [returnReason, setReturnReason] = useState("")
  const [returnDescription, setReturnDescription] = useState("")

  const customerReturns: ReturnRequest[] = [
    {
      id: "RET-001",
      orderId: "ORD-2024-001",
      customerName: "John Doe",
      productName: "Paracetamol 500mg",
      reason: "Damaged product",
      status: "pending",
      requestDate: "2024-08-28",
      refundAmount: 5.99,
    },
    {
      id: "RET-002",
      orderId: "ORD-2024-002",
      customerName: "John Doe",
      productName: "Vitamin D3",
      reason: "Wrong product received",
      status: "approved",
      requestDate: "2024-08-25",
      refundAmount: 8.75,
    },
  ]

  const staffReturns: ReturnRequest[] = [
    {
      id: "RET-003",
      orderId: "ORD-2024-003",
      customerName: "Jane Smith",
      productName: "Amoxicillin 250mg",
      reason: "Expired product",
      status: "pending",
      requestDate: "2024-08-29",
      refundAmount: 12.5,
    },
    {
      id: "RET-004",
      orderId: "ORD-2024-004",
      customerName: "Mike Johnson",
      productName: "Ibuprofen 400mg",
      reason: "Allergic reaction",
      status: "approved",
      requestDate: "2024-08-27",
      refundAmount: 7.25,
    },
    {
      id: "RET-005",
      orderId: "ORD-2024-005",
      customerName: "Sarah Wilson",
      productName: "Cough Syrup",
      reason: "Not as described",
      status: "rejected",
      requestDate: "2024-08-26",
      refundAmount: 15.99,
    },
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "approved":
        return "bg-green-100 text-green-800"
      case "rejected":
        return "bg-red-100 text-red-800"
      case "completed":
        return "bg-blue-100 text-blue-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="w-4 h-4" />
      case "approved":
        return <CheckCircle className="w-4 h-4" />
      case "rejected":
        return <AlertCircle className="w-4 h-4" />
      case "completed":
        return <Package className="w-4 h-4" />
      default:
        return <RefreshCw className="w-4 h-4" />
    }
  }

  const handleReturnSubmit = () => {
    // In a real app, this would submit the return request
    console.log("Return request submitted:", { returnReason, returnDescription })
    alert("Return request submitted successfully!")
    setReturnReason("")
    setReturnDescription("")
  }

  const updateReturnStatus = (returnId: string, newStatus: string) => {
    // In a real app, this would update the database
    console.log(`Updating return ${returnId} to ${newStatus}`)
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Returns & Exchanges</h1>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="customer">Customer View</TabsTrigger>
          <TabsTrigger value="staff">Staff View</TabsTrigger>
        </TabsList>

        <TabsContent value="customer" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Request Return/Exchange</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="orderId">Order ID</Label>
                <Input id="orderId" placeholder="Enter your order ID (e.g., ORD-2024-001)" />
              </div>

              <div>
                <Label htmlFor="reason">Reason for Return</Label>
                <Select value={returnReason} onValueChange={setReturnReason}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a reason" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="damaged">Damaged product</SelectItem>
                    <SelectItem value="wrong_product">Wrong product received</SelectItem>
                    <SelectItem value="expired">Expired product</SelectItem>
                    <SelectItem value="not_as_described">Not as described</SelectItem>
                    <SelectItem value="allergic_reaction">Allergic reaction</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Please provide details about your return request..."
                  value={returnDescription}
                  onChange={(e) => setReturnDescription(e.target.value)}
                  className="min-h-[100px]"
                />
              </div>

              <Button onClick={handleReturnSubmit} className="w-full">
                <RefreshCw className="w-4 h-4 mr-2" />
                Submit Return Request
              </Button>
            </CardContent>
          </Card>

          <div className="grid gap-4">
            <h2 className="text-xl font-semibold">Your Return Requests</h2>
            {customerReturns.map((returnReq) => (
              <Card key={returnReq.id}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      {getStatusIcon(returnReq.status)}
                      <div>
                        <h3 className="font-semibold">{returnReq.productName}</h3>
                        <p className="text-sm text-gray-600">Order {returnReq.orderId}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge className={getStatusColor(returnReq.status)}>{returnReq.status.toUpperCase()}</Badge>
                      <p className="text-sm text-gray-600 mt-1">${returnReq.refundAmount}</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="text-sm">
                      <strong>Reason:</strong> {returnReq.reason}
                    </p>
                    <p className="text-sm">
                      <strong>Request Date:</strong> {returnReq.requestDate}
                    </p>
                  </div>

                  {returnReq.status === "approved" && (
                    <div className="mt-4 p-3 bg-green-50 rounded-lg">
                      <p className="text-sm text-green-800">
                        Your return has been approved. Please package the item and use the provided return label.
                      </p>
                    </div>
                  )}

                  {returnReq.status === "rejected" && (
                    <div className="mt-4 p-3 bg-red-50 rounded-lg">
                      <p className="text-sm text-red-800">
                        Your return request has been rejected. Please contact customer service for more information.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="staff" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Pending</p>
                    <p className="text-2xl font-bold">{staffReturns.filter((r) => r.status === "pending").length}</p>
                  </div>
                  <Clock className="w-8 h-8 text-yellow-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Approved</p>
                    <p className="text-2xl font-bold">{staffReturns.filter((r) => r.status === "approved").length}</p>
                  </div>
                  <CheckCircle className="w-8 h-8 text-green-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Rejected</p>
                    <p className="text-2xl font-bold">{staffReturns.filter((r) => r.status === "rejected").length}</p>
                  </div>
                  <AlertCircle className="w-8 h-8 text-red-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Refunds</p>
                    <p className="text-2xl font-bold">
                      ${staffReturns.reduce((sum, r) => sum + r.refundAmount, 0).toFixed(2)}
                    </p>
                  </div>
                  <RefreshCw className="w-8 h-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4">
            <h2 className="text-xl font-semibold">All Return Requests</h2>
            {staffReturns.map((returnReq) => (
              <Card key={returnReq.id}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <User className="w-5 h-5 text-gray-400" />
                      <div>
                        <h3 className="font-semibold">{returnReq.customerName}</h3>
                        <p className="text-sm text-gray-600">{returnReq.productName}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge className={getStatusColor(returnReq.status)}>{returnReq.status.toUpperCase()}</Badge>
                      <span className="text-sm font-medium">${returnReq.refundAmount}</span>
                    </div>
                  </div>

                  <div className="space-y-2 mb-4">
                    <p className="text-sm">
                      <strong>Order ID:</strong> {returnReq.orderId}
                    </p>
                    <p className="text-sm">
                      <strong>Reason:</strong> {returnReq.reason}
                    </p>
                    <p className="text-sm">
                      <strong>Request Date:</strong> {returnReq.requestDate}
                    </p>
                  </div>

                  <div className="flex space-x-2">
                    {returnReq.status === "pending" && (
                      <>
                        <Button size="sm" onClick={() => updateReturnStatus(returnReq.id, "approved")}>
                          Approve
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => updateReturnStatus(returnReq.id, "rejected")}
                        >
                          Reject
                        </Button>
                      </>
                    )}
                    {returnReq.status === "approved" && (
                      <Button size="sm" onClick={() => updateReturnStatus(returnReq.id, "completed")}>
                        Mark Completed
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
