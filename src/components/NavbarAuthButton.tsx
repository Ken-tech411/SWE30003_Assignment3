"use client";

import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";

export default function NavbarAuthButton() {
  const { user, setUser } = useAuth();

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
  };

  if (!user) {
    return (
      <Link href="/login">
        <Button variant="outline" className="text-white border-white hover:bg-white hover:text-blue-600">
          Sign In
        </Button>
      </Link>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-white">
        Hello, {user.role === "customer" && user.name ? user.name : user.username}
      </span>
      <Button
        variant="outline"
        className="text-white border-white hover:bg-white hover:text-blue-600"
        onClick={handleLogout}
      >
        Sign Out
      </Button>
    </div>
  );
}