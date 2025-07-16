/**
 * Signup Component
 * 
 * A comprehensive user registration component with validation, error handling,
 * and localStorage-based user management. Supports creating both admin and regular
 * user accounts with persistent storage across browser sessions.
 * 
 * Features:
 * - Form validation with clear error feedback
 * - Password strength and matching validation
 * - Role-based account creation
 * - Persistent user storage in localStorage
 * - Automatic login after successful registration
 * 
 * @author Senior Full-Stack Engineer
 * @version 2.0.0
 */

import React, { useState, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { FaUser, FaEnvelope, FaLock, FaExclamationCircle, FaSpinner } from "react-icons/fa";

const Signup = () => {
  // Form state with proper initialization
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState({
    score: 0,
    message: "",
    color: "gray"
  });
  
  // Hooks initialization
  const { signup } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Extract role from location state or default to user
  const role = location.state?.role || "user";

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
   * Handles form input changes and updates state
   * 
   * @param {Event} e - Input change event
   */
  const handleChange = (e) => {
    const { name, value } = e.target;
    
    setFormData(prevData => ({
      ...prevData,
      [name]: value
    }));
    
    // Check password strength when password field changes
    if (name === 'password') {
      evaluatePasswordStrength(value);
    }
  };

  /**
   * Evaluates password strength and updates UI feedback
   * 
   * @param {string} password - Password to evaluate
   */
  const evaluatePasswordStrength = (password) => {
    // Simple password strength evaluation
    let score = 0;
    let message = "";
    let color = "gray";
    
    if (!password) {
      setPasswordStrength({ score: 0, message: "", color: "gray" });
      return;
    }
    
    // Length check
    if (password.length >= 8) score += 1;
    if (password.length >= 12) score += 1;
    
    // Complexity checks
    if (/[A-Z]/.test(password)) score += 1;
    if (/[0-9]/.test(password)) score += 1;
    if (/[^A-Za-z0-9]/.test(password)) score += 1;
    
    // Determine message and color based on score
    if (score < 2) {
      message = "Weak";
      color = "red";
    } else if (score < 4) {
      message = "Moderate";
      color = "yellow";
    } else {
      message = "Strong";
      color = "green";
    }
    
    setPasswordStrength({ score, message, color });
  };

  /**
   * Handles form submission and user registration
   * Implements localStorage-based user management
   * 
   * @param {Event} e - Form submission event
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Reset error
    setError("");
    
    // Validate form inputs
    if (!formData.fullName.trim()) {
      setError("Full name is required");
      return;
    }
    
    if (!formData.email.trim()) {
      setError("Email is required");
      return;
    }
    
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError("Please enter a valid email address");
      return;
    }
    
    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    
    // Validate password strength
    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    
    setLoading(true);
    
    try {
      // Simulate network latency for realistic UX
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Get existing users from localStorage or initialize with default users
      const storedUsers = JSON.parse(localStorage.getItem('users') || JSON.stringify([
        { email: 'admin@example.com', password: 'password123', role: 'admin', userId: 'admin-123' },
        { email: 'user@example.com', password: 'password123', role: 'user', userId: 'user-456' }
      ]));
      
      // Check if email already exists
      if (storedUsers.some(user => user.email === formData.email)) {
        setError("Email already in use");
        setLoading(false);
        return;
      }
      
      // Create new user object
      const newUser = {
        email: formData.email,
        password: formData.password,
        role: role,
        userId: `user-${Date.now()}`,
        fullName: formData.fullName,
        createdAt: new Date().toISOString()
      };
      
      // Add to stored users
      storedUsers.push(newUser);
      localStorage.setItem('users', JSON.stringify(storedUsers));
      
      // Generate authentication token
      const mockToken = `mock-token-${Date.now()}`;
      
      // Store authentication data for automatic login
      localStorage.setItem("token", mockToken);
      localStorage.setItem("userRole", newUser.role);
      localStorage.setItem("userId", newUser.userId);
      localStorage.setItem("email", newUser.email);
      
      // Create log entry for admin tracking
      const logData = {
        userId: newUser.userId,
        username: newUser.email,
        fullName: newUser.fullName,
        role: newUser.role,
        action: "register",
        loginTime: new Date().toISOString(),
        ipAddress: "127.0.0.1", // In production, this would be captured from the request
        tokenName: mockToken.substring(0, 10) + "..." // Truncated for security
      };
      
      // Store registration log
      const existingLogs = JSON.parse(localStorage.getItem('userLogs') || '[]');
      existingLogs.push(logData);
      localStorage.setItem('userLogs', JSON.stringify(existingLogs));
      
      console.log("User registration:", logData);
      
      // Call the context signup method
      signup(formData.email, formData.password);
      
      // Navigate to the appropriate dashboard
      navigate(newUser.role === "admin" ? "/admin/dashboard" : "/user/dashboard");
    } catch (err) {
      console.error("Registration error:", err);
      setError("Failed to create an account. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600 p-6">
      <div className="bg-white shadow-lg rounded-xl p-8 w-full max-w-md transform transition duration-300 hover:scale-105">
        {/* Header */}
        <h2 className="text-3xl font-bold text-center text-gray-800 mb-6">
          {role === "admin" ? "Admin Registration" : "User Registration"}
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

        {/* Registration form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Full Name field */}
          <div>
            <label htmlFor="fullName" className="block text-gray-700 text-sm font-medium mb-1">Full Name</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaUser className="text-gray-400" aria-hidden="true" />
              </div>
              <input
                id="fullName"
                type="text"
                name="fullName"
                className="w-full pl-10 px-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none shadow-sm"
                placeholder="Enter your full name"
                value={formData.fullName}
                onChange={handleChange}
                required
                aria-label="Full Name"
                autoComplete="name"
              />
            </div>
          </div>

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
                name="email"
                className="w-full pl-10 px-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none shadow-sm"
                placeholder="Enter your email"
                value={formData.email}
                onChange={handleChange}
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
                name="password"
                className="w-full pl-10 px-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none shadow-sm"
                placeholder="Create a password"
                value={formData.password}
                onChange={handleChange}
                required
                aria-label="Password"
                autoComplete="new-password"
              />
            </div>
            
            {/* Password strength indicator */}
            {formData.password && (
              <div className="mt-1 flex items-center">
                <div className="w-full bg-gray-200 rounded-full h-2 mr-2">
                  <div 
                    className={`h-2 rounded-full ${
                      passwordStrength.color === "red" ? "bg-red-500" : 
                      passwordStrength.color === "yellow" ? "bg-yellow-500" : 
                      passwordStrength.color === "green" ? "bg-green-500" : "bg-gray-300"
                    }`}
                    style={{ width: `${(passwordStrength.score / 5) * 100}%` }}
                  ></div>
                </div>
                <span className={`text-xs ${
                  passwordStrength.color === "red" ? "text-red-500" : 
                  passwordStrength.color === "yellow" ? "text-yellow-600" : 
                  passwordStrength.color === "green" ? "text-green-500" : "text-gray-500"
                }`}>
                  {passwordStrength.message}
                </span>
              </div>
            )}
          </div>

          {/* Confirm Password field */}
          <div>
            <label htmlFor="confirmPassword" className="block text-gray-700 text-sm font-medium mb-1">Confirm Password</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaLock className="text-gray-400" aria-hidden="true" />
              </div>
              <input
                id="confirmPassword"
                type="password"
                name="confirmPassword"
                className="w-full pl-10 px-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none shadow-sm"
                placeholder="Confirm your password"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                aria-label="Confirm Password"
                autoComplete="new-password"
              />
            </div>
            
            {/* Password match indicator */}
            {formData.password && formData.confirmPassword && (
              <p className={`text-xs mt-1 ${
                formData.password === formData.confirmPassword ? "text-green-500" : "text-red-500"
              }`}>
                {formData.password === formData.confirmPassword ? 
                  "Passwords match" : 
                  "Passwords do not match"}
              </p>
            )}
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
            aria-label="Sign Up Button"
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <FaSpinner className="animate-spin mr-2" aria-hidden="true" />
                Creating Account...
              </span>
            ) : (
              "Sign Up"
            )}
          </button>
        </form>

        {/* Additional links */}
        <div className="text-center mt-4">
          <span className="text-gray-600 text-sm">Already have an account? </span>
          <Link
            to="/login"
            state={{ role }}
            className="text-blue-600 text-sm hover:underline"
          >
            Log in
          </Link>
          <div className="mt-2">
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

export default Signup;
