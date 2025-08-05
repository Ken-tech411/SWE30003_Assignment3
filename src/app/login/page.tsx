"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Footer } from "@/components/footer";

export default function LoginPage() {
  const [isSignup, setIsSignup] = useState(false);
  const [form, setForm] = useState({
    username: "",
    password: "",
    role: "customer",
    name: "",
    phoneNumber: "",
    email: "",
    address: "",
    dateOfBirth: "",
    gender: ""
  });
  const [error, setError] = useState("");
  const router = useRouter();
  const { setUser } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const url = isSignup ? "/api/auth/signup" : "/api/auth/login";
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Something went wrong");
      return;
    }
    if (!isSignup) {
      // Fetch user info after login to update context
      const meRes = await fetch("/api/auth/me");
      const meData = await meRes.json();
      setUser(meData.user);
      if (meData.user?.role === "pharmacist") {
        router.push("/delivery"); // or wherever your staff view is
      } else {
        router.push("/"); // customer home
      }
    } else {
      setIsSignup(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex-1">
        <div className="max-w-sm mx-auto mt-16 p-6 border rounded">
          <h2 className="text-2xl font-bold mb-4">{isSignup ? "Sign Up" : "Log In"}</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              className="w-full border px-3 py-2 rounded"
              placeholder="Username"
              value={form.username}
              onChange={e => setForm({ ...form, username: e.target.value })}
            />
            <input
              className="w-full border px-3 py-2 rounded"
              type="password"
              placeholder="Password"
              value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })}
            />
            {isSignup && (
              <>
                <input
                  className="w-full border px-3 py-2 rounded"
                  placeholder="Full Name"
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                />
                <input
                  className="w-full border px-3 py-2 rounded"
                  placeholder="Phone Number"
                  value={form.phoneNumber}
                  onChange={e => setForm({ ...form, phoneNumber: e.target.value })}
                />
                <input
                  className="w-full border px-3 py-2 rounded"
                  placeholder="Email"
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                />
                <input
                  className="w-full border px-3 py-2 rounded"
                  placeholder="Address"
                  value={form.address}
                  onChange={e => setForm({ ...form, address: e.target.value })}
                />
                <input
                  className="w-full border px-3 py-2 rounded"
                  type="date"
                  placeholder="Date of Birth"
                  value={form.dateOfBirth}
                  onChange={e => setForm({ ...form, dateOfBirth: e.target.value })}
                />
                <input
                  className="w-full border px-3 py-2 rounded"
                  placeholder="Gender"
                  value={form.gender}
                  onChange={e => setForm({ ...form, gender: e.target.value })}
                />
                <select
                  className="w-full border px-3 py-2 rounded"
                  value={form.role}
                  onChange={e => setForm({ ...form, role: e.target.value })}
                >
                  <option value="customer">Customer</option>
                  <option value="pharmacist">Pharmacist</option>
                </select>
              </>
            )}
            {error && <div className="text-red-500">{error}</div>}
            <button
              className="w-full bg-orange-500 hover:bg-orange-600 text-white py-2 rounded transition-colors"
              type="submit"
            >
              {isSignup ? "Sign Up" : "Log In"}
            </button>
          </form>
          <div className="mt-4 text-center">
            {isSignup ? (
              <span>
                Already have an account?{" "}
                <button
                  className="text-orange-600 hover:text-orange-800 font-semibold transition-colors"
                  onClick={() => setIsSignup(false)}
                >
                  Log In
                </button>
              </span>
            ) : (
              <span>
                Don&apos;t have an account?{" "}
                <button
                  className="text-orange-600 hover:text-orange-800 font-semibold transition-colors"
                  onClick={() => setIsSignup(true)}
                >
                  Sign Up
                </button>
              </span>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}