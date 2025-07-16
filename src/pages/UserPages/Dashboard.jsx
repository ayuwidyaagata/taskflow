import React, { useEffect, useState, useRef, useCallback } from "react";
import { DndContext, closestCorners } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { Bar } from "react-chartjs-2";
import "chart.js/auto";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import UserSidebar from "./UserSidebar";
import Column from "./Column";
import SortableItem from "./SortableItem";
import notificationSound from "./notification.mp3";
import { FaFilter, FaSearch } from "react-icons/fa";

const UserDashboard = () => {
  const [tasks, setTasks] = useState({
    "To Do": [],
    "In Progress": [],
    Completed: [],
  });
  const [filteredTasks, setFilteredTasks] = useState([]);
  const [filters, setFilters] = useState({
    status: 'all',
    search: ''
  });
  const [notes, setNotes] = useState(localStorage.getItem("notes") || "");
  const audioRef = useRef(new Audio(notificationSound));

  // 🔹 Ensure page starts from top when component loads
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    const storedTasks = JSON.parse(localStorage.getItem("tasks")) || [];
    const categorizedTasks = {
      "To Do": storedTasks.filter((task) => task.progress <= 40),
      "In Progress": storedTasks.filter((task) => task.progress > 40 && task.progress <= 80),
      Completed: storedTasks.filter((task) => task.progress > 80),
    };
    setTasks(categorizedTasks);
    checkDeadlines(storedTasks);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    localStorage.setItem("notes", notes);
  }, [notes]);

  const checkDeadlines = (tasks) => {
    const today = new Date().toISOString().split("T")[0];
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split("T")[0];

    tasks.forEach((task) => {
      if (task.deadline === today) {
        showNotification(`🚨 Task Due Today: "${task.title}"`, "bg-red-500 text-white");
      } else if (task.deadline === tomorrowStr) {
        showNotification(`⏳ Task Due Tomorrow: "${task.title}"`, "bg-yellow-500 text-black");
      }
    });
  };

  const showNotification = (message, bgClass) => {
    toast(
      <div className={`p-2 rounded-lg shadow-md font-semibold text-lg ${bgClass}`}>
        {message}
      </div>,
      { position: "top-right", autoClose: 5000, hideProgressBar: false }
    );
    audioRef.current.play();
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const sourceColumn = Object.keys(tasks).find((column) =>
      tasks[column].some((task) => task.id === active.id)
    );
    const targetColumn = Object.keys(tasks).find((column) =>
      tasks[column].some((task) => task.id === over.id)
    );
    const finalTargetColumn = targetColumn || over.id;
    if (!sourceColumn || !finalTargetColumn || sourceColumn === finalTargetColumn) return;
  
    setTasks((prevTasks) => {
      const updatedTasks = { ...prevTasks };
      const movedTask = updatedTasks[sourceColumn].find((task) => task.id === active.id);
      updatedTasks[sourceColumn] = updatedTasks[sourceColumn].filter((task) => task.id !== active.id);
      updatedTasks[finalTargetColumn] = [...updatedTasks[finalTargetColumn], movedTask];
  
      if (finalTargetColumn === "To Do") {
        movedTask.progress = 0;
        movedTask.status = "incomplete";
      } else if (finalTargetColumn === "In Progress") {
        movedTask.progress = 60;
        movedTask.status = "incomplete";
      } else if (finalTargetColumn === "Completed") {
        movedTask.progress = 100;
        movedTask.status = "complete";
      }
      return updatedTasks;
    });
    const allTasks = [
      ...tasks["To Do"],
      ...tasks["In Progress"],
      ...tasks["Completed"],
    ];
    localStorage.setItem("tasks", JSON.stringify(allTasks));
  };  

  // Automaticly move task based on status
  useEffect(() => {
    const handleUpdate = () => {
      const storedTasks = JSON.parse(localStorage.getItem("tasks")) || [];
      const categorizedTasks = {
        "To Do": [],
        "In Progress": [],
        Completed: [],
      };
      storedTasks.forEach((task) => {
        if (task.status === "incomplete" && task.progress <= 40) {
          categorizedTasks["To Do"].push(task);
        } else if (task.status === "incomplete" && task.progress > 40 && task.progress <= 80) {
          categorizedTasks["In Progress"].push(task);
        } else if (task.status === "complete") {
          categorizedTasks["Completed"].push(task);
        }
      });      
      setTasks(categorizedTasks);
      checkDeadlines(storedTasks);
    };
    handleUpdate();
    window.addEventListener("tasks-updated", handleUpdate);
    return () => {
      window.removeEventListener("tasks-updated", handleUpdate);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);  

  // Task Analytics Chart Data (Bar Graph)
  const chartData = {
    labels: ["To Do", "In Progress", "Completed"],
    datasets: [
      {
        label: "Number of Tasks",
        data: [
          tasks["To Do"].length,
          tasks["In Progress"].length,
          tasks.Completed.length,
        ],
        backgroundColor: ["#FF6384", "#FFCE56", "#36A2EB"],
      },
    ],
  };

  // Filter
  const applyFilters = useCallback((taskList, filterSettings) => {
    let result = [...taskList];
    
    // Apply status filter
    if (filterSettings.status !== 'all') {
      result = result.filter(task => task.status === filterSettings.status);
    }
    
    // Apply search filter
    if (filterSettings.search.trim()) {
      const searchTerm = filterSettings.search.toLowerCase().trim();
      result = result.filter(task => 
        task.title.toLowerCase().includes(searchTerm) || 
        task.description.toLowerCase().includes(searchTerm)
      );
    }
    
    setFilteredTasks(result);
  }, []);
    
  const handleFilterChange = (filterType, value) => {
    const newFilters = {
      ...filters,
      [filterType]: value
    };
    setFilters(newFilters);
  
    const allTasks = [
      ...tasks["To Do"],
      ...tasks["In Progress"],
      ...tasks["Completed"],
    ];
    applyFilters(allTasks, newFilters);
  };  

  useEffect(() => {
    const allTasks = [
      ...tasks["To Do"],
      ...tasks["In Progress"],
      ...tasks["Completed"],
    ];
    applyFilters(allTasks, filters);
  }, [tasks, filters, applyFilters]);
  
  const totalTasksCount = tasks["To Do"].length + tasks["In Progress"].length + tasks["Completed"].length;

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-blue-100 to-gray-100">
      <UserSidebar />

      <div className="flex-1 p-6">
        <h2 className="text-4xl font-bold text-gray-900 mb-6 text-center bg-gradient-to-r from-blue-600 to-purple-600 text-transparent bg-clip-text">
          🚀 User Dashboard
        </h2>
        <div className="mb-6 space-y-4">
          {/* Search input */}
          <div>
            <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
              Search Tasks
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaSearch className="text-gray-400" aria-hidden="true" />
              </div>
              <input
                id="search"
                type="text"
                className="pl-10 h-8 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                placeholder="Search by title or description"
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                aria-label="Search tasks"
              />
            </div>
          </div>
          
          {/* Status filter */}
          <div>
            <label htmlFor="status-filter" className="block text-sm font-medium text-gray-700 mb-1">
              Filter by Status
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaFilter className="text-gray-400" aria-hidden="true" />
              </div>
              <select
                id="status-filter"
                className="pl-10 h-8 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                aria-label="Filter tasks by status"
              >
                <option value="all">All Tasks</option>
                <option value="complete">Complete</option>
                <option value="incomplete">Incomplete</option>
              </select>
            </div>
          </div>
        </div>
        
        {/* Results count */}
        <div className="mb-4 text-sm text-gray-500">
          Showing {filteredTasks.length} of {totalTasksCount} tasks
        </div>
        <ToastContainer position="top-right" autoClose={5000} hideProgressBar />

        {/* Kanban Board */}
        <div className="glassmorphism p-4 rounded-xl shadow-lg bg-gradient-to-br from-white/30 to-white/10 backdrop-blur-lg border border-white/20">
          <DndContext collisionDetection={closestCorners} onDragEnd={handleDragEnd}>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.keys(tasks).map((columnKey) => (
                <Column key={columnKey} title={columnKey} id={columnKey} className="w-[280px]">
                  <SortableContext
                    items={filteredTasks
                      .filter((task) => {
                        if (
                          columnKey === "To Do" &&
                          task.status === "incomplete" &&
                          task.progress <= 40
                        )
                          return true;
                        if (
                          columnKey === "In Progress" &&
                          task.status === "incomplete" &&
                          task.progress > 40 &&
                          task.progress <= 80
                        )
                          return true;
                        if (
                          columnKey === "Completed" &&
                          task.status === "complete"
                        )
                          return true;
                        return false;
                      })
                      .map((task) => task.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    {filteredTasks
                      .filter((task) => {
                        if (
                          columnKey === "To Do" &&
                          task.status === "incomplete" &&
                          task.progress <= 40
                        )
                          return true;
                        if (
                          columnKey === "In Progress" &&
                          task.status === "incomplete" &&
                          task.progress > 40 &&
                          task.progress <= 80
                        )
                          return true;
                        if (
                          columnKey === "Completed" &&
                          task.status === "complete"
                        )
                          return true;
                        return false;
                      })
                      .map((task) => (
                        <SortableItem key={task.id} id={task.id} task={task} />
                      ))}
                  </SortableContext>
                </Column>
              ))}
            </div>
          </DndContext>
        </div>

        {/* Task Analytics & Notes Section */}
        <div className="mt-10 flex flex-col lg:flex-row items-start gap-6">
          {/* Task Analytics Chart */}
          <div className="p-6 w-full lg:w-1/2 bg-white shadow-lg rounded-xl border border-gray-300">
            <h2 className="text-3xl font-extrabold text-gray-900 mb-4 text-center tracking-wide uppercase">
              📊 Task Analytics
            </h2>
            <Bar data={chartData} />
          </div>

          {/* Notes */}
          <div className="p-6 w-full lg:w-[590px] bg-green-900 text-white rounded-xl border-[12px] border-[#8B4501] shadow-lg flex flex-col">
            <h2 className="text-2xl font-bold text-yellow-400 mb-2 text-center">📌 Notes</h2>

            {/* Notes Input Field - Enlarged to match Task Analytics */}
            <textarea
              className="flex-1 bg-transparent border-none outline-none text-white text-lg p-7"
              placeholder="Write your notes here..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              autoFocus
              style={{
                fontFamily: "Chalkduster, Comic Sans MS, cursive",
                height: "320px",
                minHeight: "280px",
                textAlign: "left",
                resize: "none",
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;
