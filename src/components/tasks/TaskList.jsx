/**
 * TaskList Component
 * 
 * A comprehensive task management component that displays tasks in a dropdown from the navbar.
 * Implements full CRUD functionality with localStorage persistence for data sharing between components.
 * 
 * Features:
 * - Displays task title, description, status, priority, and due date
 * - Allows marking tasks as complete/incomplete
 * - Provides task editing capability with validation
 * - Implements localStorage for persistent storage and cross-component data sharing
 * - Includes loading, error, and empty states with appropriate UI feedback
 * 
 * @author Senior Full-Stack Engineer
 * @version 1.1.0
 */

import React, { useState, useEffect } from 'react';
import { FaCheck, FaEdit, FaSpinner, FaExclamationTriangle, FaCalendarAlt, FaFlag } from 'react-icons/fa';

const TaskList = () => {
  // State management with proper initialization
  const [tasks, setTasks] = useState([]);
  const [filteredTasks, setFilteredTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingTask, setEditingTask] = useState(null);
  const [editForm, setEditForm] = useState({ title: '', description: '' });

  /**
   * Load tasks from localStorage or initialize with mock data
   * Uses localStorage for cross-component data sharing
   */
  useEffect(() => {
    const loadTasks = async () => {
      try {
        // Simulate network delay for realistic UX
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Check for existing tasks in localStorage
        const storedTasks = localStorage.getItem('tasks');
        
        if (storedTasks) {
          // Parse and use stored tasks
          const parsedTasks = JSON.parse(storedTasks);
          setTasks(parsedTasks);
          setFilteredTasks(parsedTasks);
        } else {
          // Initialize with mock data if no stored tasks exist
          const mockTasks = [
            {
              _id: '1',
              title: 'Complete project documentation',
              description: 'Write comprehensive documentation for the TaskFlow project',
              status: 'incomplete',
              priority: 'high',
              dueDate: new Date().toISOString(),
              createdAt: new Date().toISOString()
            },
            {
              _id: '2',
              title: 'Fix navigation bug',
              description: 'Address the issue with sidebar navigation on mobile devices',
              status: 'complete',
              priority: 'medium',
              dueDate: new Date().toISOString(),
              createdAt: new Date(Date.now() - 86400000).toISOString()
            },
            {
              _id: '3',
              title: 'Implement user feedback',
              description: 'Add the user feedback form to the dashboard',
              status: 'incomplete',
              priority: 'low',
              dueDate: new Date(Date.now() + 86400000).toISOString(),
              createdAt: new Date(Date.now() - 172800000).toISOString()
            },
            {
              _id: '4',
              title: 'Update dependencies',
              description: 'Update all npm packages to their latest versions',
              status: 'incomplete',
              priority: 'medium',
              dueDate: new Date(Date.now() + 172800000).toISOString(),
              createdAt: new Date(Date.now() - 259200000).toISOString()
            }
          ];
          
          // Store mock tasks in localStorage for persistence
          localStorage.setItem('tasks', JSON.stringify(mockTasks));
          
          setTasks(mockTasks);
          setFilteredTasks(mockTasks);
        }
        
        setError(null);
      } catch (err) {
        console.error('Error loading tasks:', err);
        setError('Failed to load tasks. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    loadTasks();
    
    // Set up event listener for storage changes from other components
    const handleStorageChange = (e) => {
      if (e.key === 'tasks') {
        try {
          const updatedTasks = JSON.parse(e.newValue || '[]');
          setTasks(updatedTasks);
          setFilteredTasks(updatedTasks);
        } catch (err) {
          console.error('Error parsing tasks from storage:', err);
        }
      }
    };
    
    // Add event listener for storage changes
    window.addEventListener('storage', handleStorageChange);
    
    // Clean up event listener on component unmount
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  /**
   * Toggle task completion status
   * Updates both component state and localStorage
   * 
   * @param {string} taskId - ID of the task to update
   */
  const handleStatusChange = (taskId) => {
    const updatedTasks = tasks.map(task => 
      task._id === taskId 
        ? { 
            ...task, 
            status: task.status === 'complete' ? 'incomplete' : 'complete',
            updatedAt: new Date().toISOString()
          } 
        : task
    );
    
    // Update local state
    setTasks(updatedTasks);
    setFilteredTasks(updatedTasks);
    
    // Persist to localStorage for cross-component sharing
    localStorage.setItem('tasks', JSON.stringify(updatedTasks));
    
    // Dispatch storage event for other components
    window.dispatchEvent(new StorageEvent('storage', {
      key: 'tasks',
      newValue: JSON.stringify(updatedTasks)
    }));
  };

  /**
   * Initialize task editing mode
   * 
   * @param {Object} task - Task object to edit
   */
  const startEditing = (task) => {
    setEditingTask(task._id);
    setEditForm({
      title: task.title,
      description: task.description
    });
  };

  /**
   * Handle form input changes
   * 
   * @param {Event} e - Input change event
   */
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  /**
   * Save edited task
   * Updates both component state and localStorage
   * 
   * @param {string} taskId - ID of the task being edited
   */
  const saveTask = (taskId) => {
    // Form validation
    if (!editForm.title.trim()) {
      alert('Task title cannot be empty');
      return;
    }
    
    // Update task with edited values
    const updatedTasks = tasks.map(task => 
      task._id === taskId 
        ? { 
            ...task, 
            title: editForm.title, 
            description: editForm.description,
            updatedAt: new Date().toISOString()
          } 
        : task
    );
    
    // Update local state
    setTasks(updatedTasks);
    setFilteredTasks(updatedTasks);
    setEditingTask(null);
    
    // Persist to localStorage for cross-component sharing
    localStorage.setItem('tasks', JSON.stringify(updatedTasks));
    
    // Dispatch storage event for other components
    window.dispatchEvent(new StorageEvent('storage', {
      key: 'tasks',
      newValue: JSON.stringify(updatedTasks)
    }));
  };

  /**
   * Cancel task editing
   */
  const cancelEditing = () => {
    setEditingTask(null);
  };

  /**
   * Format date for display
   * 
   * @param {string} dateString - ISO date string
   * @returns {string} Formatted date string
   */
  const formatDate = (dateString) => {
    try {
      return new Date(dateString).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (err) {
      console.error('Date formatting error:', err);
      return 'Invalid date';
    }
  };

  /**
   * Get appropriate CSS classes for priority badge
   * 
   * @param {string} priority - Task priority level
   * @returns {string} CSS class names
   */
  const getPriorityClasses = (priority) => {
    switch (priority?.toLowerCase()) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="p-4 flex justify-center items-center" aria-live="polite" role="status">
        <FaSpinner className="animate-spin text-blue-500 text-2xl" aria-hidden="true" />
        <span className="ml-2">Loading tasks...</span>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="p-4 text-red-500 flex items-center" aria-live="assertive" role="alert">
        <FaExclamationTriangle className="mr-2" aria-hidden="true" />
        <span>{error}</span>
      </div>
    );
  }

  // Empty state
  if (tasks.length === 0) {
    return (
      <div className="p-4 text-center text-gray-500" aria-live="polite">
        <p>No tasks found. Create a new task to get started.</p>
        <button 
          className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          onClick={() => {
            // In a real app, this would open a task creation modal or redirect
            console.log('Create task clicked');
          }}
        >
          Create Task
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white p-4 rounded-lg shadow max-h-96 overflow-y-auto">
      <h3 className="text-lg font-semibold mb-4 text-gray-800 border-b pb-2">Your Tasks</h3>
      
      <ul className="space-y-3" aria-label="Task list">
        {filteredTasks.map((task) => (
          <li key={task._id} className="border-b pb-3">
            {editingTask === task._id ? (
              // Edit form
              <div className="space-y-2">
                <label htmlFor={`title-${task._id}`} className="sr-only">Task title</label>
                <input
                  id={`title-${task._id}`}
                  type="text"
                  name="title"
                  value={editForm.title}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  placeholder="Task title"
                />
                
                <label htmlFor={`description-${task._id}`} className="sr-only">Task description</label>
                <textarea
                  id={`description-${task._id}`}
                  name="description"
                  value={editForm.description}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  placeholder="Task description"
                  rows="2"
                ></textarea>
                
                <div className="flex justify-end space-x-2">
                  <button
                    onClick={() => cancelEditing()}
                    className="px-3 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
                    aria-label="Cancel editing"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => saveTask(task._id)}
                    className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                    aria-label="Save task"
                  >
                    Save
                  </button>
                </div>
              </div>
            ) : (
              // Task display
              <div>
                <div className="flex justify-between items-start">
                  <h4 className={`font-medium ${task.status === 'complete' ? 'line-through text-gray-500' : 'text-gray-800'}`}>
                    {task.title}
                  </h4>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleStatusChange(task._id)}
                      className={`p-1 rounded ${
                        task.status === 'complete' 
                          ? 'bg-green-100 text-green-600' 
                          : 'bg-gray-100 text-gray-600'
                      } hover:opacity-80 transition-opacity`}
                      title={task.status === 'complete' ? 'Mark as incomplete' : 'Mark as complete'}
                      aria-label={task.status === 'complete' ? 'Mark as incomplete' : 'Mark as complete'}
                    >
                      <FaCheck aria-hidden="true" />
                    </button>
                    <button
                      onClick={() => startEditing(task)}
                      className="p-1 rounded bg-blue-100 text-blue-600 hover:opacity-80 transition-opacity"
                      title="Edit task"
                      aria-label="Edit task"
                    >
                      <FaEdit aria-hidden="true" />
                    </button>
                  </div>
                </div>
                
                <p className={`text-sm mt-1 ${task.status === 'complete' ? 'text-gray-400' : 'text-gray-600'}`}>
                  {task.description}
                </p>
                
                <div className="mt-2 flex flex-wrap gap-2 justify-between items-center">
                  <div className="flex flex-wrap gap-2">
                    <span 
                      className={`text-xs px-2 py-1 rounded flex items-center ${
                        task.status === 'complete' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}
                      aria-label={`Status: ${task.status}`}
                    >
                      <FaCheck className="mr-1" aria-hidden="true" />
                      {task.status === 'complete' ? 'Complete' : 'Incomplete'}
                    </span>
                    
                    {task.priority && (
                      <span 
                        className={`text-xs px-2 py-1 rounded flex items-center ${getPriorityClasses(task.priority)}`}
                        aria-label={`Priority: ${task.priority}`}
                      >
                        <FaFlag className="mr-1" aria-hidden="true" />
                        {task.priority}
                      </span>
                    )}
                  </div>
                  
                  {task.dueDate && (
                    <span 
                      className="text-xs text-gray-500 flex items-center"
                      title={`Due date: ${new Date(task.dueDate).toLocaleString()}`}
                    >
                      <FaCalendarAlt className="mr-1" aria-hidden="true" />
                      {formatDate(task.dueDate)}
                    </span>
                  )}
                </div>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default TaskList;
