import Link from "next/link"
import { ShoppingCart, Package, RefreshCw, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export function Navbar() {
  return (
    <nav className="border-b bg-white shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-4">
            <Link href="/" className="flex items-center space-x-2">
              <div className="flex space-x-1">
                <div className="w-6 h-6 bg-blue-500 rounded"></div>
                <div className="w-6 h-6 bg-orange-500 rounded"></div>
                <div className="w-6 h-6 bg-green-500 rounded"></div>
              </div>
              <span className="font-bold text-xl">PharmaCare</span>
            </Link>
          </div>

          <div className="flex-1 max-w-md mx-8">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input placeholder="Search products..." className="pl-10" />
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <Link href="/cart">
              <Button variant="ghost" size="sm">
                <ShoppingCart className="w-4 h-4 mr-2" />
                Cart
              </Button>
            </Link>
            <Link href="/delivery">
              <Button variant="ghost" size="sm">
                <Package className="w-4 h-4 mr-2" />
                Delivery
              </Button>
            </Link>
            <Link href="/returns">
              <Button variant="ghost" size="sm">
                <RefreshCw className="w-4 h-4 mr-2" />
                Returns
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  )
}
