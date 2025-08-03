"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function LoginPage() {
  const [isSignup, setIsSignup] = useState(false);
  const [form, setForm] = useState({ username: "", password: "", role: "customer" });
  const [error, setError] = useState("");
  const router = useRouter();
  const { setUser } = useAuth();

  const handleSubmit = async (e: any) => {
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
          <select
            className="w-full border px-3 py-2 rounded"
            value={form.role}
            onChange={e => setForm({ ...form, role: e.target.value })}
          >
            <option value="customer">Customer</option>
            <option value="pharmacist">Pharmacist</option>
          </select>
        )}
        {error && <div className="text-red-500">{error}</div>}
        <button className="w-full bg-blue-600 text-white py-2 rounded" type="submit">
          {isSignup ? "Sign Up" : "Log In"}
        </button>
      </form>
      <div className="mt-4 text-center">
        {isSignup ? (
          <span>
            Already have an account?{" "}
            <button className="text-blue-600" onClick={() => setIsSignup(false)}>
              Log In
            </button>
          </span>
        ) : (
          <span>
            Don't have an account?{" "}
            <button className="text-blue-600" onClick={() => setIsSignup(true)}>
              Sign Up
            </button>
          </span>
        )}
      </div>
    </div>
  );
}