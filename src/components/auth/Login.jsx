/**
 * Login Component
 * 
 * A comprehensive authentication component that handles user login with proper
 * validation, error handling, and state management. Implements localStorage-based
 * authentication for persistent user sessions across browser refreshes.
 * 
 * Features:
 * - Supports both default and custom user accounts
 * - Persists authentication state across browser sessions
 * - Provides clear error feedback and loading states
 * - Implements role-based redirection
 * - Logs authentication events for admin tracking
 * 
 * @author Senior Full-Stack Engineer
 * @version 2.0.0
 */

import React, { useState, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { FaLock, FaEnvelope, FaExclamationCircle, FaSpinner } from "react-icons/fa";

const Login = () => {
  // State management with proper initialization
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  
  // Hooks initialization
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Extract role from location state or default to user
  const role = location.state?.role || "user";
  const from = location.state?.from || "/";

  /**
   * Effect hook to check for existing authentication
   * Redirects authenticated users to appropriate dashboard
   */
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      const userRole = localStorage.getItem("userRole");
      navigate(userRole === "admin" ? "/admin/dashboard" : "/user/dashboard");
    }
  }, [navigate]);

  /**
   * Handles form submission and authentication
   * Implements localStorage-based authentication with support for custom users
   * 
   * @param {Event} e - The form submission event
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Input validation
    if (!email.trim() || !password.trim()) {
      setError("Email and password are required");
      return;
    }
    
    // Reset previous errors
    setError("");
    setLoading(true);
    
    try {
      // Simulate network latency for realistic UX
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Get stored users from localStorage or initialize with default users
      const storedUsers = JSON.parse(localStorage.getItem('users') || JSON.stringify([
        { email: 'admin@example.com', password: 'password123', role: 'admin', userId: 'admin-123' },
        { email: 'user@example.com', password: 'password123', role: 'user', userId: 'user-456' }
      ]));
      
      // Find matching user
      const user = storedUsers.find(u => u.email === email && u.password === password);
      
      if (user) {
        // User found, proceed with login
        const mockToken = `mock-token-${Date.now()}`;
        
        // Store authentication data in localStorage for persistence
        localStorage.setItem("token", mockToken);
        localStorage.setItem("userRole", user.role);
        localStorage.setItem("userId", user.userId);
        localStorage.setItem("email", email);
        
        // Create log entry for admin tracking
        const logData = {
          userId: user.userId,
          username: email,
          role: user.role,
          action: "login",
          loginTime: new Date().toISOString(),
          ipAddress: "127.0.0.1", // In production, this would be captured from the request
          tokenName: mockToken.substring(0, 10) + "..." // Truncated for security
        };
        
        // Store login logs in localStorage for admin view
        const existingLogs = JSON.parse(localStorage.getItem('userLogs') || '[]');
        existingLogs.push(logData);
        localStorage.setItem('userLogs', JSON.stringify(existingLogs));
        
        console.log("User login:", logData);
        
        // Update authentication context
        login(email);
        
        // Navigate to appropriate dashboard or requested page
        navigate(from !== "/" ? from : (user.role === "admin" ? "/admin/dashboard" : "/user/dashboard"));
      } else {
        // Invalid credentials
        setError("Invalid email or password");
      }
    } catch (err) {
      console.error("Login error:", err);
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600 p-6">
      <div className="bg-white shadow-lg rounded-xl p-8 w-full max-w-md transform transition duration-300 hover:scale-105">
        {/* Header */}
        <h2 className="text-3xl font-bold text-center text-gray-800 mb-6">
          {role === "admin" ? "Admin Login" : "User Login"}
        </h2>

        {/* Error display with animation */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded animate-pulse" role="alert">
            <div className="flex items-center">
              <FaExclamationCircle className="text-red-500 mr-2" aria-hidden="true" />
              <p className="text-red-500 text-sm">{error}</p>
            </div>
          </div>
        )}

        {/* Login form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Email field */}
          <div>
            <label htmlFor="email" className="block text-gray-700 text-sm font-medium mb-1">Email</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaEnvelope className="text-gray-400" aria-hidden="true" />
              </div>
              <input
                id="email"
                type="email"
                className="w-full pl-10 px-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none shadow-sm"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                aria-label="Email Address"
                autoComplete="email"
              />
            </div>
          </div>

          {/* Password field */}
          <div>
            <label htmlFor="password" className="block text-gray-700 text-sm font-medium mb-1">Password</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaLock className="text-gray-400" aria-hidden="true" />
              </div>
              <input
                id="password"
                type="password"
                className="w-full pl-10 px-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none shadow-sm"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                aria-label="Password"
                autoComplete="current-password"
              />
            </div>
          </div>

          {/* Submit button with loading state */}
          <button
            type="submit"
            className={`w-full py-2 rounded-md shadow-md transition duration-200 text-white ${
              loading
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-gradient-to-r from-blue-500 to-purple-600 hover:opacity-90"
            }`}
            disabled={loading}
            aria-label="Login Button"
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <FaSpinner className="animate-spin mr-2" aria-hidden="true" />
                Logging in...
              </span>
            ) : (
              "Login"
            )}
          </button>
        </form>

        {/* Additional links */}
        <div className="text-center mt-4 space-y-2">
          <div>
            <span
              className="text-blue-600 text-sm hover:underline cursor-pointer"
              onClick={() => navigate("/forgot-password", { state: { role } })}
            >
              Forgot Password?
            </span>
          </div>
          <div>
            <span className="text-gray-600 text-sm">Don't have an account? </span>
            <Link
              to="/signup"
              state={{ role }}
              className="text-blue-600 text-sm hover:underline"
            >
              Sign up
            </Link>
          </div>
          <div>
            <Link
              to="/"
              className="text-gray-500 text-sm hover:underline"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
