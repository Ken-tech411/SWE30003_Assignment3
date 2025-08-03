"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { MessageSquare, Star, User, Clock, CheckCircle, Flag } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import NavbarAuthButton from "@/components/NavbarAuthButton";

const categories = [
  "Service",
  "Product Quality",
  "Delivery",
  "Payment",
  "Other",
];

interface Feedback {
  feedbackId: number;
  customerId?: number;
  orderId?: number;
  rating: number;
  comments?: string;
  submittedDate: string;
  category?: string;
  channel?: string;
  status?: string;
  isFlagged?: boolean;
  flagReason?: string;
  response?: string;
  respondedBy?: number;
  responseDate?: string;
  resolutionStatus?: string;
  lastUpdated?: string;
  productId?: number;
  type?: "general" | "product";
}

function getStatusColor(status?: string) {
  switch (status) {
    case "pending":
      return "bg-yellow-100 text-yellow-800";
    case "reviewed":
      return "bg-blue-100 text-blue-800";
    case "resolved":
      return "bg-green-100 text-green-800";
    case "Flagged":
      return "bg-red-100 text-red-800";
    case "Responded":
      return "bg-green-100 text-green-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}

export default function FeedbackPage() {
  const { user } = useAuth();

  const [feedbackType, setFeedbackType] = useState<"general" | "product">("general");
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    orderId: "",
    productId: "",
    rating: 0,
    category: "",
    comments: ""
  });
  const [orderProducts, setOrderProducts] = useState<{ productId: number, name: string, unitPrice: number, quantity: number }[]>([]);
  const [customerFeedbacks, setCustomerFeedbacks] = useState<Feedback[]>([]);
  const [staffFeedbacks, setStaffFeedbacks] = useState<Feedback[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [statusCounts, setStatusCounts] = useState<{ [status: string]: number }>({});
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [allCategories, setAllCategories] = useState<string[]>([]);

  const statusDisplay: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
    Pending:   { label: "Pending",   icon: <Clock className="w-8 h-8 text-yellow-500" />, color: "text-yellow-500" },
    Responded: { label: "Responded", icon: <CheckCircle className="w-8 h-8 text-green-500" />, color: "text-green-500" },
    Flagged:   { label: "Flagged",   icon: <Flag className="w-8 h-8 text-red-500" />, color: "text-red-500" },
  };
  const allStatuses = ["Responded", "Flagged", "Pending"];

  // Fetch products for the entered orderId (only for product feedback)
  useEffect(() => {
    if (feedbackType === "product" && formData.orderId) {
      fetch(`/api/orders/${formData.orderId}/items`)
        .then(res => res.json())
        .then(data => setOrderProducts(data.items || []))
        .catch(() => setOrderProducts([]));
    } else {
      setOrderProducts([]);
      setFormData(f => ({ ...f, productId: "" }));
    }
  }, [formData.orderId, feedbackType]);

  // Fetch feedbacks for the current type/orderId/productId (customer view)
  useEffect(() => {
    if (user?.role === "customer") {
      setIsLoading(true);
      fetch("/api/feedback")
        .then(res => res.json())
        .then(data => {
          const feedbackArray = Array.isArray(data.data) ? data.data : [];
          let filtered: Feedback[] = [];
          if (feedbackType === "general") {
            filtered = feedbackArray.filter((f: Feedback) => !f.orderId && !f.productId);
          } else {
            filtered = feedbackArray.filter(
              (f: Feedback) =>
                Number(f.orderId) === Number(formData.orderId) &&
                (!formData.productId || Number(f.productId) === Number(formData.productId))
            );
          }
          setCustomerFeedbacks(filtered);
          setIsLoading(false);
        });
    }
  }, [formData.orderId, formData.productId, feedbackType, user?.role]);

  // Fetch staff feedbacks (staff view, backend-driven filtering & pagination)
  const fetchStaffFeedbacks = async () => {
    setIsLoading(true);
    const statusParams = selectedStatuses.map(s => `status=${encodeURIComponent(s)}`).join('&');
    const categoryParams = selectedCategories.map(c => `category=${encodeURIComponent(c)}`).join('&');
    const query = [`page=${page}`, `pageSize=${pageSize}`, statusParams, categoryParams]
      .filter(Boolean)
      .join('&');
    const res = await fetch(`/api/feedback?${query}`);
    const data = await res.json();
    setStaffFeedbacks(data.data || []);
    setTotal(data.total || 0);
    setStatusCounts(data.statusCounts || {});
    if (Array.isArray(data.allCategories)) {
      setAllCategories(data.allCategories);
    } else if (data.data) {
      const cats = new Set<string>();
      data.data.forEach((fb: Feedback) => { if (fb.category) cats.add(fb.category); });
      setAllCategories(Array.from(cats));
    }
    setIsLoading(false);
  };

  // Fetch staff feedbacks when staff view, page, filters change
  useEffect(() => {
    if (user?.role === "pharmacist") {
      fetchStaffFeedbacks();
    }
    // eslint-disable-next-line
  }, [page, pageSize, selectedStatuses, selectedCategories, user?.role]);

  // Reset page to 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [selectedStatuses, selectedCategories]);

  const renderStars = (value: number) => (
    <div className="flex">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`w-5 h-5 ${value >= star ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`}
        />
      ))}
    </div>
  );

  const handleSubmitFeedback = async () => {
    if (
      (feedbackType === "product" && (!formData.orderId || !formData.productId)) ||
      !formData.rating ||
      !formData.comments
    ) {
      alert(
        feedbackType === "product"
          ? "Order ID, Product, rating, and feedback are required."
          : "Rating and feedback are required."
      );
      return;
    }
    try {
      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId: 1, // Replace with actual customer ID
          orderId: feedbackType === "product" ? Number(formData.orderId) : null,
          productId: feedbackType === "product" ? Number(formData.productId) : null,
          rating: formData.rating,
          comments: formData.comments,
          category: formData.category,
          channel: "Web",
        }),
      });
      if (response.ok) {
        alert("Thank you for your feedback!");
        setFormData({
          fullName: "",
          email: "",
          phone: "",
          orderId: "",
          productId: "",
          rating: 0,
          category: "",
          comments: ""
        });
        setOrderProducts([]);
        // Refresh list
        const newData = await fetch("/api/feedback").then(res => res.json());
        const feedbackArray = Array.isArray(newData.data) ? newData.data : [];
        let filtered: Feedback[] = [];
        if (feedbackType === "general") {
          filtered = feedbackArray.filter((f: Feedback) => !f.orderId && !f.productId);
        } else {
          filtered = feedbackArray.filter(
            (f: Feedback) =>
              Number(f.orderId) === Number(formData.orderId) &&
              (!formData.productId || Number(f.productId) === Number(formData.productId))
          );
        }
        setCustomerFeedbacks(filtered);
      }
    } catch (error) {
      alert("Failed to submit feedback");
    }
  };

  const updateFeedback = async (feedbackId: number, updates: Partial<Feedback>) => {
    try {
      const response = await fetch(`/api/feedback/${feedbackId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (response.ok) {
        fetchStaffFeedbacks();
      }
    } catch (error) {
      console.error('Failed to update feedback:', error);
    }
  };

  // --- Account status bar ---
  if (user === undefined) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Loading feedback page...</div>
      </div>
    );
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

  return (
    <div>
      <div className="flex items-center justify-end gap-4 p-4 border-b bg-white">
        <div className="text-sm text-gray-700">
          Signed in as: <span className="font-semibold">{user.username}</span>
          {" · "}
          <span className="capitalize">{user.role}</span>
        </div>
        <NavbarAuthButton />
      </div>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Customer Feedback</h1>
        {/* Only show Customer view for customers */}
        {user.role === "customer" && (
          <div className="space-y-6">
            {/* --- Customer Feedback Form and History (from your TabsContent value="customer") --- */}
            {/* ...copy your customer feedback UI here... */}
            {/* --- Begin Customer Feedback Form --- */}
            <Card className="overflow-visible">
              <CardHeader>
                <CardTitle>Submit Your Feedback</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="feedbackType">Feedback Type</Label>
                  <select
                    id="feedbackType"
                    className="w-full border rounded px-3 py-2"
                    value={feedbackType}
                    onChange={e => setFeedbackType(e.target.value as "general" | "product")}
                  >
                    <option value="general">General Feedback (for Long Châu)</option>
                    <option value="product">Product Feedback (for a specific product)</option>
                  </select>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="fullName">Full Name</Label>
                    <Input
                      id="fullName"
                      type="text"
                      placeholder="Enter your full name"
                      value={formData.fullName}
                      onChange={(e) =>
                        setFormData({ ...formData, fullName: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="your.email@example.com"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      type="text"
                      placeholder="e.g., 0912345678"
                      value={formData.phone}
                      onChange={(e) =>
                        setFormData({ ...formData, phone: e.target.value })
                      }
                    />
                  </div>
                  {feedbackType === "product" && (
                    <>
                      <div>
                        <Label htmlFor="orderId">Order ID</Label>
                        <Input
                          id="orderId"
                          type="text"
                          placeholder="Enter your order ID"
                          value={formData.orderId}
                          onChange={(e) =>
                            setFormData({ ...formData, orderId: e.target.value })
                          }
                        />
                      </div>
                      <div>
                        <Label htmlFor="productId">Product</Label>
                        <select
                          id="productId"
                          className="w-full border rounded px-3 py-2"
                          value={formData.productId}
                          onChange={e =>
                            setFormData({ ...formData, productId: e.target.value })
                          }
                          disabled={orderProducts.length === 0}
                        >
                          <option value="">Select a product</option>
                          {orderProducts.map(product => (
                            <option key={product.productId} value={product.productId}>
                              {product.name} (x{product.quantity})
                            </option>
                          ))}
                        </select>
                      </div>
                    </>
                  )}
                </div>
                <div>
                  <Label>Overall Rating</Label>
                  <div className="flex items-center space-x-1 mt-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <span
                        key={star}
                        className={`cursor-pointer text-2xl ${formData.rating >= star ? "text-yellow-400" : "text-gray-300"}`}
                        onClick={() => setFormData({ ...formData, rating: star })}
                        role="button"
                        aria-label={`Rate ${star}`}
                      >
                        ★
                      </span>
                    ))}
                    <span className="ml-3 text-sm text-gray-600">
                      {formData.rating > 0
                        ? `${formData.rating} out of 5 stars`
                        : "Click to rate"}
                    </span>
                  </div>
                </div>
                <div>
                  <Label htmlFor="category">Feedback Category</Label>
                  <select
                    id="category"
                    className="w-full border rounded px-3 py-2"
                    value={formData.category}
                    onChange={(e) =>
                      setFormData({ ...formData, category: e.target.value })
                    }
                  >
                    <option value="">Select a category</option>
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label htmlFor="comments">Your Feedback</Label>
                  <Textarea
                    id="comments"
                    placeholder="Please share your experience, suggestions, or concerns..."
                    value={formData.comments}
                    onChange={(e) =>
                      setFormData({ ...formData, comments: e.target.value })
                    }
                    className="min-h-[120px]"
                  />
                </div>
                <Button onClick={handleSubmitFeedback} className="w-full">
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Submit Feedback
                </Button>
              </CardContent>
            </Card>
            {/* Customer Feedback History */}
            <div className="grid gap-4">
              <h2 className="text-xl font-semibold">Your Feedback History</h2>
              {isLoading ? (
                <Card>
                  <CardContent className="p-6 text-center">Loading...</CardContent>
                </Card>
              ) : customerFeedbacks.length === 0 ? (
                <Card>
                  <CardContent className="p-6 text-center">
                    No feedback found for this {feedbackType === "general" ? "type" : "order"}.
                  </CardContent>
                </Card>
              ) : (
                customerFeedbacks.map((fb) => (
                  <Card key={fb.feedbackId} className="border rounded-lg mb-4">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            {fb.status === "pending" && <Clock className="w-4 h-4" />}
                            {fb.status === "reviewed" && <CheckCircle className="w-4 h-4" />}
                            {fb.status === "resolved" && <CheckCircle className="w-4 h-4 text-green-500" />}
                            <Badge className={getStatusColor(fb.status)}>
                              {fb.status?.toUpperCase() || "PENDING"}
                            </Badge>
                          </div>
                          <div className="text-sm text-gray-600">
                            Feedback ID: {fb.feedbackId}
                            {fb.category && <> | Category: {fb.category}</>}
                          </div>
                          <div className="text-xs text-gray-400">
                            {fb.channel && <>Channel: {fb.channel} | </>}
                            Submitted: {fb.submittedDate ? new Date(fb.submittedDate).toLocaleDateString() : ""}
                          </div>
                        </div>
                        <div className="text-right min-w-[120px]">
                          <div className="flex items-center justify-end gap-1 font-medium text-yellow-500">
                            {fb.rating
                              ? [...Array(fb.rating)].map((_, i) => (
                                  <Star key={i} className="w-5 h-5 fill-yellow-400" />
                                ))
                              : <span className="text-gray-400">No rating</span>
                            }
                            {[...Array(5 - (fb.rating || 0))].map((_, i) => (
                              <Star key={i} className="w-5 h-5 text-gray-300" />
                            ))}
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            {fb.lastUpdated && <>Last Updated: {new Date(fb.lastUpdated).toLocaleDateString()}</>}
                          </div>
                        </div>
                      </div>
                      <div className="mb-2">
                        <span className="font-semibold">Comments:</span> {fb.comments}
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>
        )}

        {/* Only show Staff view for pharmacists */}
        {user.role === "pharmacist" && (
          <div className="space-y-6">
            {/* --- Filter Section --- */}
            <Card>
              <CardContent className="py-4">
                <div className="flex flex-wrap gap-8 items-center">
                  {/* Status Filter */}
                  <div>
                    <div className="font-semibold mb-2">Filter by Status:</div>
                    <div className="flex gap-3 flex-wrap">
                      {allStatuses.map(status => (
                        <label key={status} className="flex items-center gap-1 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={selectedStatuses.includes(status)}
                            onChange={e => {
                              setSelectedStatuses(prev =>
                                e.target.checked
                                  ? [...prev, status]
                                  : prev.filter(s => s !== status)
                              );
                            }}
                          />
                          {statusDisplay[status]?.label || status}
                        </label>
                      ))}
                    </div>
                  </div>
                  {/* Category Filter */}
                  <div>
                    <div className="font-semibold mb-2">Filter by Category:</div>
                    <div className="flex gap-3 flex-wrap">
                      {allCategories.map(cat => (
                        <label key={cat} className="flex items-center gap-1 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={selectedCategories.includes(cat)}
                            onChange={e => {
                              setSelectedCategories(prev =>
                                e.target.checked
                                  ? [...prev, cat]
                                  : prev.filter(c => c !== cat)
                              );
                            }}
                          />
                          {cat}
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            {/* --- End Filter Section --- */}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
              {allStatuses.map(status => (
                <Card key={status}>
                  <CardContent className="p-8">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">
                          {statusDisplay[status]?.label || status}
                        </p>
                        <p className="text-2xl font-bold">
                          {statusCounts[status] ?? 0}
                        </p>
                      </div>
                      {statusDisplay[status]?.icon}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            <div className="grid gap-4">
              <h2 className="text-xl font-semibold">All Feedback</h2>
              {isLoading ? (
                <Card>
                  <CardContent className="p-6 text-center">Loading...</CardContent>
                </Card>
              ) : staffFeedbacks.length === 0 ? (
                <Card>
                  <CardContent className="p-6 text-center">No feedback found.</CardContent>
                </Card>
              ) : (
                staffFeedbacks.map((fb) => (
                  <Card key={fb.feedbackId} className="border rounded-lg mb-4">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            {fb.status === "pending" && <Clock className="w-4 h-4" />}
                            {fb.status === "reviewed" && <CheckCircle className="w-4 h-4" />}
                            {fb.status === "resolved" && <CheckCircle className="w-4 h-4 text-green-500" />}
                            <Badge className={getStatusColor(fb.status)}>
                              {fb.status?.toUpperCase() || "PENDING"}
                            </Badge>
                          </div>
                          <div className="text-sm text-gray-600">
                            Feedback ID: {fb.feedbackId}
                            {fb.customerId && <> | Customer ID: {fb.customerId}</>}
                            {fb.orderId && <> | Order ID: {fb.orderId}</>}
                            {fb.category && <> | Category: {fb.category}</>}
                          </div>
                          <div className="text-xs text-gray-400">
                            {fb.channel && <>Channel: {fb.channel} | </>}
                            Submitted: {fb.submittedDate ? new Date(fb.submittedDate).toLocaleDateString() : ""}
                          </div>
                        </div>
                        <div className="text-right min-w-[120px]">
                          <div className="flex items-center justify-end gap-1 font-medium text-yellow-500">
                            {fb.rating
                              ? [...Array(fb.rating)].map((_, i) => (
                                  <Star key={i} className="w-5 h-5 fill-yellow-400" />
                                ))
                              : <span className="text-gray-400">No rating</span>
                            }
                            {[...Array(5 - (fb.rating || 0))].map((_, i) => (
                              <Star key={i} className="w-5 h-5 text-gray-300" />
                            ))}
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            {fb.lastUpdated && <>Last Updated: {new Date(fb.lastUpdated).toLocaleDateString()}</>}
                          </div>
                        </div>
                      </div>
                      <div className="mb-2">
                        <span className="font-semibold">Comments:</span> {fb.comments}
                      </div>
                      {/* Staff actions (optional) */}
                      <div className="flex flex-wrap gap-2 mt-2">
                        {fb.status === "pending" && (
                          <Button
                            size="sm"
                            className="bg-blue-500 hover:bg-blue-600 text-white"
                            onClick={() => updateFeedback(fb.feedbackId, { status: "reviewed" })}
                          >
                            Mark Reviewed
                          </Button>
                        )}
                        {fb.status === "reviewed" && (
                          <Button
                            size="sm"
                            className="bg-green-500 hover:bg-green-600 text-white"
                            onClick={() => updateFeedback(fb.feedbackId, { status: "resolved" })}
                          >
                            Mark as Resolved
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
            <div className="flex justify-center items-center gap-2 mt-4">
              <Button
                variant="outline"
                size="sm"
                disabled={page === 1}
                onClick={() => setPage(prev => Math.max(prev - 1, 1))}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page * pageSize >= total}
                onClick={() => setPage(prev => Math.min(prev + 1, Math.ceil(total / pageSize)))}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}