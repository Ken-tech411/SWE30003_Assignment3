"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Clock, CheckCircle, AlertCircle, Package, RefreshCw } from "lucide-react"
import { useAuth } from "@/context/AuthContext";
import NavbarAuthButton from "@/components/NavbarAuthButton";

interface ReturnItem {
  returnId: number
  orderId: number
  productId: number
  reason: string
  description: string
  status: string
  refundAmount: number
  submittedDate: string
  customerName?: string
  productName?: string
  customerId?: number
  linkedId?: number
}

export default function ReturnsPage() {
  const { user } = useAuth();

  // Loading and not-logged-in states
  const [returnReason, setReturnReason] = useState("")
  const [returnDescription, setReturnDescription] = useState("")
  const [orderId, setOrderId] = useState("")
  const [productId, setProductId] = useState<number | null>(null)
  const [orderProducts, setOrderProducts] = useState<{ productId: number, name: string, unitPrice: number, quantity: number }[]>([])
  const [customerReturns, setCustomerReturns] = useState<ReturnItem[]>([])
  const [staffReturns, setStaffReturns] = useState<ReturnItem[]>([])
  const [loading, setLoading] = useState(true)
  const [orderError, setOrderError] = useState<string | null>(null)

  // Pagination for customer view
  const [page, setPage] = useState(1)
  const [pageSize] = useState(5)
  const [total, setTotal] = useState(0)

  // Pagination for staff view
  const [staffPage, setStaffPage] = useState(1)
  const [staffPageSize] = useState(10)
  const [staffTotal, setStaffTotal] = useState(0)

  // Modal state for View Details
  const [viewDetailOpen, setViewDetailOpen] = useState(false)
  const [selectedReturn, setSelectedReturn] = useState<ReturnItem | null>(null)

  // Staff filters and debounce
  const [staffStatusFilters, setStaffStatusFilters] = useState<string[]>([])
  const [staffOrderId, setStaffOrderId] = useState("")
  const [staffCustomerId, setStaffCustomerId] = useState("")
  const [debouncedStaffOrderId, setDebouncedStaffOrderId] = useState("")
  const [debouncedStaffCustomerId, setDebouncedStaffCustomerId] = useState("")

  // Stats for staff view
  const [stats, setStats] = useState({ pending: 0, approved: 0, rejected: 0, totalRefunds: 0 });

  // Debounce for staff filters
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedStaffOrderId(staffOrderId), 400)
    return () => clearTimeout(handler)
  }, [staffOrderId])

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedStaffCustomerId(staffCustomerId), 400)
    return () => clearTimeout(handler)
  }, [staffCustomerId])

  // Fetch order products when orderId changes, but only if the order belongs to the signed-in customer
  useEffect(() => {
    if (!orderId) {
      setOrderProducts([])
      setProductId(null)
      setOrderError(null)
      return
    }
    const validateOrder = async () => {
      setOrderError(null)
      if (!user?.customerId) return
      const res = await fetch(`/api/orders/track?orderId=${encodeURIComponent(orderId)}&customerId=${user.customerId}`)
      if (!res.ok) {
        setOrderProducts([])
        setProductId(null)
        setOrderError("You can only request returns for your own orders.")
        return
      }
      const data = await res.json()
      // Fix: handle both { items: [...] } and { ...order, items: [...] }
      if (Array.isArray(data.items)) {
        setOrderProducts(data.items)
      } else if (Array.isArray(data.order?.items)) {
        setOrderProducts(data.order.items)
      } else {
        setOrderProducts([])
      }
      setOrderError(null)
    }
    validateOrder()
  }, [orderId, user?.customerId])

  // Fetch returns when user changes
  useEffect(() => {
    if (user?.role === "customer" && user.customerId) {
      fetchCustomerReturns()
    } else if (user?.role === "pharmacist") {
      fetchAllReturns()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, page, staffPage])

  // Refetch staff returns on filter change
  useEffect(() => {
    if (user?.role === "pharmacist") {
      fetchAllReturns()
    }
    // eslint-disable-next-line
  }, [staffStatusFilters, debouncedStaffOrderId, debouncedStaffCustomerId])

  const fetchCustomerReturns = async () => {
    if (!user?.customerId) return;
    setLoading(true);
    try {
      const response = await fetch(`/api/returns?customerId=${user.customerId}&page=${page}&pageSize=${pageSize}&sort=desc`);
      const data = await response.json();
      setCustomerReturns(Array.isArray(data.returns) ? data.returns : []);
      setTotal(data.total || (Array.isArray(data.returns) ? data.returns.length : 0));
    } catch (error) {
      setCustomerReturns([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }

  const fetchAllReturns = async () => {
    setLoading(true);
    const statusParams = staffStatusFilters.map(s => `status=${encodeURIComponent(s)}`).join('&');
    const orderIdParam = debouncedStaffOrderId ? `&orderId=${encodeURIComponent(debouncedStaffOrderId)}` : '';
    const customerIdParam = debouncedStaffCustomerId ? `&customerId=${encodeURIComponent(debouncedStaffCustomerId)}` : '';
    const pageParam = `&page=${staffPage}`;
    const pageSizeParam = `&pageSize=${staffPageSize}`;
    const query = [statusParams, orderIdParam, customerIdParam, pageParam, pageSizeParam].filter(Boolean).join('&');
    try {
      const response = await fetch(`/api/returns?${query}`);
      const data = await response.json();
      setStaffReturns(data.returns || []);
      setStats(data.stats || { pending: 0, approved: 0, rejected: 0, totalRefunds: 0 });
      setStaffTotal(data.total || (Array.isArray(data.returns) ? data.returns.length : 0));
    } catch (error) {
      console.error('Error fetching all returns:', error);
    } finally {
      setLoading(false);
    }
  }

  const handleReturnSubmit = async () => {
    if (!orderId || !productId || !returnReason) {
      alert("Please fill in all required fields")
      return
    }
    if (orderError) {
      alert(orderError)
      return
    }

    try {
      const response = await fetch('/api/returns', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId: parseInt(orderId),
          productId,
          reason: returnReason,
          description: returnDescription
        })
      })

      if (response.ok) {
        alert("Return request submitted successfully!")
        setOrderId("")
        setProductId(null)
        setReturnReason("")
        setReturnDescription("")
        setOrderProducts([])
        setPage(1) // Reset to first page to show latest
        fetchCustomerReturns()
      } else {
        alert("Failed to submit return request")
      }
    } catch (error) {
      console.error('Error submitting return request:', error)
      alert("Error submitting return request")
    }
  }

  const updateReturnStatus = async (returnId: number, newStatus: string) => {
    try {
      const response = await fetch('/api/returns', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          returnId,
          status: newStatus,
          processedDate: new Date().toISOString()
        })
      })

      if (response.ok) {
        // Refresh the returns list
        if (user?.role === "customer") {
          fetchCustomerReturns()
        } else {
          fetchAllReturns()
        }
      }
    } catch (error) {
      console.error('Error updating return status:', error)
    }
  }

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

  // --- Only change below: filter customerReturns for current user ---
  const filteredCustomerReturns = customerReturns; // Already filtered by backend
  // --- End change ---

  if (user === undefined) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Loading returns...</div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="w-full flex justify-end p-4 border-b bg-white">
        <NavbarAuthButton />
        <div className="flex justify-center items-center h-96 w-full">
          <div className="text-xl">Please sign in to access this page.</div>
        </div>
      </div>
    );
  }

  // --- Account status bar ---
  return (
    <div>
      <div className="flex items-center justify-end gap-4 p-4 border-b bg-white">
        {/* Only show "Hello, Name" and Sign Out */}
        <NavbarAuthButton />
      </div>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Returns & Exchanges</h1>

        {/* Pharmacist: Show staff view directly, no tabs */}
        {user.role === "pharmacist" ? (
          <div className="space-y-6">
            {/* --- Staff Filters --- */}
            <Card>
              <CardContent className="py-4">
                <div className="flex flex-wrap gap-8 items-center">
                  {/* Status Filter */}
                  <div>
                    <div className="font-semibold mb-2">Filter by Status:</div>
                    <div className="flex gap-3 flex-wrap">
                      {["pending", "approved", "rejected"].map(status => (
                        <label key={status} className="flex items-center gap-1 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={staffStatusFilters.includes(status)}
                            onChange={e => {
                              setStaffStatusFilters(prev =>
                                e.target.checked
                                  ? [...prev, status]
                                  : prev.filter(s => s !== status)
                              );
                            }}
                          />
                          {status.charAt(0).toUpperCase() + status.slice(1)}
                        </label>
                      ))}
                    </div>
                  </div>
                  {/* Order ID Filter */}
                  <div>
                    <div className="font-semibold mb-2">Filter by Order ID:</div>
                    <Input
                      type="number"
                      placeholder="Order ID"
                      value={staffOrderId}
                      onChange={e => setStaffOrderId(e.target.value)}
                    />
                  </div>
                  {/* Customer ID Filter */}
                  <div>
                    <div className="font-semibold mb-2">Filter by Customer ID:</div>
                    <Input
                      type="number"
                      placeholder="Customer ID"
                      value={staffCustomerId}
                      onChange={e => setStaffCustomerId(e.target.value)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
            {/* --- End Staff Filters --- */}

            {/* --- Stats Cards --- */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <Card>
                <CardContent className="p-6 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Pending</p>
                    <p className="text-2xl font-bold">{stats.pending}</p>
                  </div>
                  <Clock className="w-8 h-8 text-yellow-500" />
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Approved</p>
                    <p className="text-2xl font-bold">{stats.approved}</p>
                  </div>
                  <CheckCircle className="w-8 h-8 text-green-500" />
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Rejected</p>
                    <p className="text-2xl font-bold">{stats.rejected}</p>
                  </div>
                  <AlertCircle className="w-8 h-8 text-red-500" />
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Refunds</p>
                    <p className="text-2xl font-bold">
                      ${Number(stats.totalRefunds).toFixed(2)}
                    </p>
                  </div>
                  <RefreshCw className="w-8 h-8 text-blue-500" />
                </CardContent>
              </Card>
            </div>
            {/* --- End Stats Cards --- */}

            {/* --- All Returns List --- */}
            <div className="grid gap-4">
              <h2 className="text-xl font-semibold">All Returns</h2>
              {staffReturns.length === 0 ? (
                <Card>
                  <CardContent className="p-6 text-center">
                    <p className="text-gray-500">No returns found</p>
                  </CardContent>
                </Card>
              ) : (
                staffReturns.map((item) => (
                  <Card key={item.returnId}>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <div className="flex items-center gap-2">
                            {getStatusIcon(item.status)}
                            <Badge className={getStatusColor(item.status)}>
                              {item.status.toUpperCase()}
                            </Badge>
                          </div>
                          <div className="text-sm text-gray-600 mt-1">
                            Return ID: {item.returnId} | Order ID: {item.orderId} | Product ID: {item.productId}
                          </div>
                          <div className="text-xs text-gray-400">
                            {item.customerName && <>Customer: {item.customerName} | </>}
                            {item.productName && <>Product: {item.productName}</>}
                          </div>
                          {item.customerId && (
                            <div className="text-xs text-gray-400">
                              Customer ID: {item.customerId}
                            </div>
                          )}
                        </div>
                        <div className="text-right">
                          <div className="font-medium text-blue-700">
                            ${Number(item.refundAmount).toFixed(2)}
                          </div>
                          <div className="text-xs text-gray-500">
                            {item.submittedDate && (
                              <>Submitted: {new Date(item.submittedDate).toLocaleDateString()}</>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="mb-2">
                        <span className="font-semibold">Reason:</span> {item.reason}
                      </div>
                      {item.description && (
                        <div className="mb-2">
                          <span className="font-semibold">Description:</span> {item.description}
                        </div>
                      )}

                      {/* --- ACTION BUTTONS --- */}
                      <div className="flex flex-wrap gap-2 mt-2">
                        {item.status === "pending" && (
                          <>
                            <Button
                              size="sm"
                              className="bg-blue-500 hover:bg-blue-600 text-white"
                              onClick={() => updateReturnStatus(item.returnId, "approved")}
                            >
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              className="bg-red-500 hover:bg-red-600 text-white"
                              onClick={() => updateReturnStatus(item.returnId, "rejected")}
                            >
                              Reject
                            </Button>
                          </>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedReturn(item);
                            setViewDetailOpen(true);
                          }}
                        >
                          View Details
                        </Button>
                      </div>
                      {/* --- END ACTION BUTTONS --- */}
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
            {/* --- Staff Pagination Controls --- */}
            {staffReturns.length > 0 && (
              <div className="flex justify-center items-center space-x-2 mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={staffPage === 1}
                  onClick={() => setStaffPage(1)}
                >
                  First
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={staffPage === 1}
                  onClick={() => setStaffPage((prev) => Math.max(1, prev - 1))}
                >
                  &lt;
                </Button>
                <span className="px-2">
                  Page {staffPage} of {Math.ceil(staffTotal / staffPageSize) || 1}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={staffPage === Math.ceil(staffTotal / staffPageSize) || staffTotal === 0}
                  onClick={() => setStaffPage((prev) => Math.min(Math.ceil(staffTotal / staffPageSize), prev + 1))}
                >
                  &gt;
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={staffPage === Math.ceil(staffTotal / staffPageSize) || staffTotal === 0}
                  onClick={() => setStaffPage(Math.max(1, Math.ceil(staffTotal / staffPageSize)))}
                >
                  Last
                </Button>
              </div>
            )}
          </div>
        ) : (
          // Customer: Show customer view directly, no tabs
          <div className="space-y-6">
            <Card className="overflow-visible">
              <CardHeader>
                <CardTitle>Request Return/Exchange</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 overflow-visible">
                <div>
                  <Label htmlFor="orderId">Order ID</Label>
                  <Input
                    id="orderId"
                    placeholder="Enter your order ID (e.g., 123)"
                    value={orderId}
                    onChange={(e) => setOrderId(e.target.value)}
                  />
                  {orderError && (
                    <div className="text-red-500 text-sm mt-1">{orderError}</div>
                  )}
                </div>

                {orderProducts.length > 0 && (
                  <div>
                    <Label htmlFor="productId">Product</Label>
                    <select
                      id="productId"
                      value={productId ?? ""}
                      onChange={e => setProductId(Number(e.target.value))}
                      className="block w-full border rounded px-3 py-2"
                    >
                      <option value="">Select a product</option>
                      {orderProducts.map(product => (
                        <option key={product.productId} value={product.productId}>
                          {product.name} (${Number(product.unitPrice).toFixed(2)})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <Label htmlFor="reason">Reason for Return</Label>
                  <select
                    id="reason"
                    value={returnReason}
                    onChange={e => setReturnReason(e.target.value)}
                    className="block w-full border rounded px-3 py-2"
                  >
                    <option value="">Select a reason</option>
                    <option value="damaged">Damaged product</option>
                    <option value="wrong_product">Wrong product received</option>
                    <option value="expired">Expired product</option>
                    <option value="not_as_described">Not as described</option>
                    <option value="allergic_reaction">Allergic reaction</option>
                    <option value="other">Other</option>
                  </select>
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

                <Button
                  onClick={handleReturnSubmit}
                  className="w-full"
                  disabled={!!orderError}
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Submit Return Request
                </Button>
              </CardContent>
            </Card>

            <div className="grid gap-4">
              <h2 className="text-xl font-semibold">Your Return Requests</h2>
              {loading ? (
                <Card>
                  <CardContent className="p-6 text-center">
                    <p className="text-gray-500">Loading...</p>
                  </CardContent>
                </Card>
              ) : filteredCustomerReturns.length === 0 ? (
                <Card>
                  <CardContent className="p-6 text-center">
                    <p className="text-gray-500">No return requests found</p>
                  </CardContent>
                </Card>
              ) : (
                <>
                  {filteredCustomerReturns.map((item) => (
                    <Card key={item.returnId} className="border rounded-lg mb-4">
                      <CardContent className="p-6">
                        <div className="flex items-center mb-2">
                          {getStatusIcon(item.status)}
                          <h3 className="font-semibold ml-2">{item.productName || "Product"}</h3>
                          <span className="ml-auto">
                            <Badge className={getStatusColor(item.status)}>
                              {item.status.toUpperCase()}
                            </Badge>
                          </span>
                        </div>
                        <div className="text-sm text-gray-600 mb-2">
                          Order #{item.orderId}
                        </div>
                        <div className="mb-2">
                          <span className="font-semibold">Reason:</span> {item.reason}
                        </div>
                        {item.description && (
                          <div className="mb-2">
                            <span className="font-semibold">Description:</span> {item.description}
                          </div>
                        )}
                        <div className="mb-2">
                          <span className="font-semibold">Request Date:</span> {new Date(item.submittedDate).toLocaleDateString()}
                        </div>
                        <div className="text-right font-medium text-blue-700 mb-2">
                          ${Number(item.refundAmount).toFixed(2)}
                        </div>
                        {/* Notification */}
                        {item.status === "approved" && (
                          <div className="mt-4 p-3 rounded bg-green-50 text-green-800 text-sm">
                            Your return has been approved. Please package the item and use the provided return label.
                          </div>
                        )}
                        {item.status === "rejected" && (
                          <div className="mt-4 p-3 rounded bg-red-50 text-red-800 text-sm">
                            Your return request has been rejected. Please contact customer service for more information.
                          </div>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedReturn(item);
                            setViewDetailOpen(true);
                          }}
                        >
                          View Details
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                  {/* --- Customer Pagination Controls --- */}
                  <div className="flex justify-center items-center space-x-2 mt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page === 1}
                      onClick={() => setPage(1)}
                    >
                      First
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page === 1}
                      onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                    >
                      &lt;
                    </Button>
                    <span className="px-2">
                      Page {page} of {Math.ceil(total / pageSize) || 1}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page === Math.ceil(total / pageSize) || total === 0}
                      onClick={() => setPage((prev) => Math.min(Math.ceil(total / pageSize), prev + 1))}
                    >
                      &gt;
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page === Math.ceil(total / pageSize) || total === 0}
                      onClick={() => setPage(Math.max(1, Math.ceil(total / pageSize)))}
                    >
                      Last
                    </Button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* --- View Details Modal --- */}
        {viewDetailOpen && selectedReturn && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
            <div className="bg-white rounded-lg shadow-lg max-w-lg w-full p-6 relative">
              <button
                className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 text-2xl"
                onClick={() => setViewDetailOpen(false)}
                aria-label="Close"
              >
                ×
              </button>
              <h2 className="text-xl font-bold mb-4">Return Details</h2>
              <div className="mb-2">
                <span className="font-semibold">Return ID:</span> {selectedReturn.returnId}
              </div>
              <div className="mb-2">
                <span className="font-semibold">Order ID:</span> {selectedReturn.orderId}
              </div>
              <div className="mb-2">
                <span className="font-semibold">Product ID:</span> {selectedReturn.productId}
              </div>
              <div className="mb-2">
                <span className="font-semibold">Customer Name:</span> {selectedReturn.customerName || "N/A"}
              </div>
              <div className="mb-2">
                <span className="font-semibold">Product Name:</span> {selectedReturn.productName || "N/A"}
              </div>
              <div className="mb-2">
                <span className="font-semibold">Status:</span> {selectedReturn.status}
              </div>
              <div className="mb-2">
                <span className="font-semibold">Refund Amount:</span> ${Number(selectedReturn.refundAmount).toFixed(2)}
              </div>
              <div className="mb-2">
                <span className="font-semibold">Reason:</span> {selectedReturn.reason}
              </div>
              <div className="mb-2">
                <span className="font-semibold">Description:</span> {selectedReturn.description}
              </div>
              <div className="mb-2">
                <span className="font-semibold">Submitted Date:</span> {new Date(selectedReturn.submittedDate).toLocaleDateString()}
              </div>
              {selectedReturn.customerId && (
                <div className="mb-2">
                  <span className="font-semibold">Customer ID:</span> {selectedReturn.customerId}
                </div>
              )}
            </div>
          </div>
        )}
        {/* --- End View Details Modal --- */}
      </div>
    </div>
  )
}