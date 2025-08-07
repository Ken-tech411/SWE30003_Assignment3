"use client"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Minus, Plus, Trash2 } from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/context/AuthContext"
import { Footer } from "@/components/footer"

interface CartItem {
  cartId: number
  customerId: number
  productId: number
  name: string
  price: number
  quantity: number
  description: string
  requiresPrescription: boolean
}

function getErrorMessage(error: unknown): string {
  if (typeof error === "object" && error !== null && "message" in error) {
    return String((error as { message: string }).message)
  }
  return "An unknown error occurred"
}

export default function CartPage() {
  const { user } = useAuth()
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [loading, setLoading] = useState(true)
  const [approvedPrescriptions, setApprovedPrescriptions] = useState<unknown[]>([])

  useEffect(() => {
    if (user && user.customerId) {
      fetchCartItems(user.customerId)
    }
  }, [user])

  useEffect(() => {
    async function fetchApprovedPrescriptions() {
      if (!user?.customerId) return
      const res = await fetch(`/api/prescriptions?customerId=${user.customerId}&status=approved`)
      const data = await res.json()
      setApprovedPrescriptions(Array.isArray(data.data) ? data.data : [])
    }
    fetchApprovedPrescriptions()
  }, [user?.customerId])

  const fetchCartItems = async (cid: number) => {
    setLoading(true)
    try {
      const response = await fetch(`/api/cart?customerId=${cid}`)
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to fetch cart items")
      }
      const data = await response.json()
      setCartItems(data.cartItems || [])
    } catch (error: unknown) {
      console.error("Error fetching cart items:", error)
      alert(getErrorMessage(error))
    } finally {
      setLoading(false)
    }
  }

  const updateQuantity = async (cartId: number, productId: number, newQuantity: number) => {
    if (!user?.customerId || newQuantity < 1) return

    try {
      const response = await fetch("/api/cart", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          customerId: user.customerId,
          productId,
          quantity: newQuantity,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to update quantity")
      }

      setCartItems((items) =>
        items.map((item) =>
          item.cartId === cartId ? { ...item, quantity: newQuantity } : item
        )
      )
    } catch (error: unknown) {
      console.error("Error updating quantity:", error)
      alert(getErrorMessage(error))
    }
  }

  const removeItem = async (cartId: number) => {
    try {
      const response = await fetch(`/api/cart?cartId=${cartId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to remove item")
      }

      setCartItems((items) => items.filter((item) => item.cartId !== cartId))
    } catch (error: unknown) {
      console.error("Error removing item:", error)
      alert(getErrorMessage(error))
    }
  }

  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const tax = subtotal * 0.1
  const total = subtotal + tax
  const hasApprovedPrescription = approvedPrescriptions.length > 0

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col">
        <div className="container mx-auto px-4 py-8 flex-1">
          <div className="text-center mt-16">
            <p className="mb-4 text-lg">Please sign in to view your cart.</p>
            <Link href="/login">
              <Button className="bg-orange-500 text-white hover:bg-orange-600">Sign In</Button>
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <div className="container mx-auto px-4 py-8 flex-1">
          <div className="text-center">Loading cart...</div>
        </div>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col">
      <div className="container mx-auto px-4 py-8 flex-1">
        <h1 className="text-3xl font-bold mb-8">Shopping Cart</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Cart Items ({cartItems.length})</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {cartItems.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500 mb-4">Your cart is empty</p>
                    <Link href="/products">
                      <Button>Browse Products</Button>
                    </Link>
                  </div>
                ) : (
                  cartItems.map((item) => (
                    <div key={item.cartId} className="flex items-center space-x-4 p-4 border rounded-lg">
                      <div className="w-20 h-20 bg-gray-200 rounded flex items-center justify-center">
                        <span className="text-gray-500 text-xs">No Image</span>
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold">{item.name}</h3>
                        {/* Only show text if prescription is required */}
                        {item.requiresPrescription && (
                          <span className="text-sm text-red-600 font-medium">Prescription Required</span>
                        )}
                        <p className="text-gray-600 text-sm">{item.description}</p>
                        <p className="text-gray-600">${Number(item.price).toFixed(2)}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateQuantity(item.cartId, item.productId, item.quantity - 1)}
                        >
                          <Minus className="w-4 h-4" />
                        </Button>
                        <Input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => updateQuantity(item.cartId, item.productId, Number(e.target.value) || 1)}
                          className="w-16 text-center"
                          min="1"
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateQuantity(item.cartId, item.productId, item.quantity + 1)}
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">${(Number(item.price) * item.quantity).toFixed(2)}</p>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeItem(item.cartId)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>

          <div>
            <Card>
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tax (10%):</span>
                  <span>${tax.toFixed(2)}</span>
                </div>
                <div className="border-t pt-4">
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total:</span>
                    <span>${total.toFixed(2)}</span>
                  </div>
                </div>
                <Link href="/purchase" className="w-full">
                  <Button
                    className="w-full bg-orange-500 text-white hover:bg-orange-600"
                    size="lg"
                    disabled={
                      cartItems.length === 0 ||
                      cartItems.some(item => item.requiresPrescription && !hasApprovedPrescription)
                    }
                  >
                    {cartItems.some(item => item.requiresPrescription) && !hasApprovedPrescription
                      ? "Complete Prescription First"
                      : "Proceed to Checkout"}
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  )
}