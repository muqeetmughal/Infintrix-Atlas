import React, { useState, useEffect, useMemo, useCallback, useRef, memo } from 'react';
import { 
  Card, 
  Tag, 
  Avatar, 
  Typography, 
  Spin, 
  Empty, 
  Badge, 
  Tooltip,
  Layout,
  ConfigProvider
} from 'antd';
import { 
  Clock, 
  Briefcase, 
  AlertCircle, 
  ChevronRight,
  GripVertical,
  PlusCircle
} from 'lucide-react';
import { useGetDoctypeField } from '../hooks/doctype';
import { useFrappePaginatedTasksCall } from '../hooks/query';

const { Header, Content } = Layout;
const { Text, Title } = Typography;

// --- CONFIG & CONSTANTS ---
const PAGE_SIZE = 20;
// const COLUMNS = ['Open', 'Working', 'Pending Review', 'Completed', 'Cancelled'];
const SCROLL_THRESHOLD = 150; // Pixels from edge to start scrolling
const MAX_SCROLL_SPEED = 15; // Max pixels per frame

const PRIORITY_COLORS = {
  High: 'red',
  Medium: 'orange',
  Low: 'blue',
  Urgent: 'volcano'
};

// --- MOCK API LAYER ---
const mockApi = {
  // fetchColumns: async () => {
  //   await new Promise(r => setTimeout(r, 600));
  //   return COLUMNS;
  // },
  
  fetchTasks: async (status, page = 1) => {
    await new Promise(r => setTimeout(r, 800)); 
    const tasks = [];
    for (let i = 0; i < PAGE_SIZE; i++) {
      const id = (page - 1) * PAGE_SIZE + i;
      tasks.push({
        name: `TASK-2026-${status.toUpperCase().slice(0, 3)}-${id.toString().padStart(5, '0')}`,
        subject: `Performance optimization for module ${id}`,
        status: status,
        type: "Task",
        cycle: null,
        priority: ["Low", "Medium", "High", "Urgent"][Math.floor(Math.random() * 4)],
        modified: new Date().toISOString(),
        project: "PROJ-0006",
        project_name: "GSI Infrastructure",
        assignee: "Administrator"
      });
    }
    return { tasks, hasMore: page < 10 }; 
  },

  updateTaskStatus: async (taskName, newStatus) => {
    await new Promise(r => setTimeout(r, 400));
    return { success: true };
  }
};

// --- MEMOIZED COMPONENTS ---

const TaskCard = memo(({ task, isDragging, onDragStart, onDragEnd }) => {
  return (
    <div 
      draggable 
      onDragStart={(e) => onDragStart(e, task)}
      onDragEnd={onDragEnd}
      className={`mb-3 transition-all duration-200 ${
        isDragging ? 'opacity-30 scale-95 grayscale' : 'opacity-100 cursor-grab active:cursor-grabbing hover:scale-[1.01]'
      }`}
    >
      <Card 
        size="small" 
        hoverable
        className="shadow-sm border-l-4"
        style={{ borderLeftColor: `var(--ant-${PRIORITY_COLORS[task.priority]}-5)` }}
        bodyStyle={{ padding: '12px' }}
      >
        <div className="flex justify-between items-start mb-2">
          <Text strong className="text-[10px] text-gray-400 uppercase tracking-wider">{task.name}</Text>
          <GripVertical size={14} className="text-gray-300" />
        </div>
        
        <Title level={5} className="!mb-3 !text-sm leading-snug">
          {task.subject}
        </Title>
        
        <div className="space-y-2">
          <div className="flex items-center text-gray-500 text-[10px]">
            <Briefcase size={12} className="mr-1" />
            <span className="truncate">{task.project_name}</span>
          </div>
          
          <div className="flex items-center justify-between mt-4">
            <div className="flex items-center gap-2">
              <Tag color={PRIORITY_COLORS[task.priority]} className="m-0 text-[9px] px-1 py-0 border-none">
                {task.priority}
              </Tag>
              <div className="flex items-center text-gray-400 text-[9px]">
                <Clock size={10} className="mr-1" />
                {new Date(task.modified).toLocaleDateString()}
              </div>
            </div>
            
            <Tooltip title={task.assignee}>
              <Avatar size={18} className="bg-blue-500 text-[9px]">
                {task.assignee.charAt(0)}
              </Avatar>
            </Tooltip>
          </div>
        </div>
      </Card>
    </div>
  );
});

const KanbanColumn = memo(({ 
  status, 
  tasks, 
  loading, 
  hasMore, 
  onLoadMore, 
  onMoveTask, 
  draggingTaskId,
  onDragStart,
  onDragEnd
}) => {
  const scrollRef = useRef(null);
  const [isOver, setIsOver] = useState(false);

  useEffect(() => {
    const options = { root: scrollRef.current, threshold: 0.1 };
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && hasMore && !loading) {
        onLoadMore(status);
      }
    }, options);

    const sentinel = document.getElementById(`sentinel-${status}`);
    if (sentinel) observer.observe(sentinel);

    return () => observer.disconnect();
  }, [status, hasMore, loading, onLoadMore]);

  const handleDragOver = (e) => {
    e.preventDefault(); 
    e.dataTransfer.dropEffect = "move";
  };

  const handleDragEnter = (e) => {
    e.preventDefault();
    setIsOver(true);
  };

  const handleDragLeave = (e) => {
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setIsOver(false);
    }
  };
  
  const handleDrop = (e) => {
    e.preventDefault();
    setIsOver(false);
    try {
        const data = e.dataTransfer.getData("task");
        if (!data) return;
        const taskData = JSON.parse(data);
        if (taskData.status !== status) {
          onMoveTask(taskData, status);
        }
    } catch (err) {
        console.error("Invalid task data on drop", err);
    }
  };

  return (
    <div 
      className={`flex-shrink-0 w-80 rounded-xl flex flex-col h-full max-h-full border transition-all duration-300 ${
        isOver ? 'bg-blue-50/50 border-blue-400 border-dashed ring-2 ring-blue-100' : 'bg-gray-50 border-gray-200'
      }`}
      onDragOver={handleDragOver}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="p-4 flex items-center justify-between border-b border-gray-200 bg-white rounded-t-xl">
        <div className="flex items-center gap-2">
          <Title level={5} className="!m-0 text-xs uppercase font-bold tracking-widest text-gray-500">
            {status}
          </Title>
          <Badge 
            count={tasks.length} 
            showZero 
            overflowCount={999}
            style={{ backgroundColor: '#f0f0f0', color: '#8c8c8c', boxShadow: 'none', fontSize: '10px' }}
          />
        </div>
        <div className="flex gap-2">
            <PlusCircle size={16} className="text-gray-300 hover:text-blue-500 cursor-pointer" />
            <ChevronRight size={16} className="text-gray-400" />
        </div>
      </div>

      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-3 custom-scrollbar"
      >
        {isOver && (
          <div className="mb-3 border-2 border-dashed border-blue-200 rounded-lg h-24 flex items-center justify-center bg-blue-50/30 animate-pulse">
            <Text type="secondary" className="text-xs font-medium text-blue-400">Release to Move</Text>
          </div>
        )}

        {tasks.map((task) => (
          <TaskCard 
            key={task.name} 
            task={task} 
            isDragging={draggingTaskId === task.name}
            onDragStart={onDragStart} 
            onDragEnd={onDragEnd}
          />
        ))}
        
        {loading && (
          <div className="py-4 text-center">
            <Spin size="small" />
          </div>
        )}
        
        <div id={`sentinel-${status}`} className="h-4 w-full" />
        
        {!hasMore && tasks.length > 0 && (
          <div className="text-center py-6">
            <div className="h-[1px] bg-gray-200 w-12 mx-auto mb-2" />
            <Text type="secondary" className="text-[10px] tracking-tighter uppercase font-bold opacity-30">End of Stream</Text>
          </div>
        )}

        {tasks.length === 0 && !loading && !isOver && (
          <div className="h-full flex items-center justify-center opacity-40">
            <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={<span className="text-xs">No tasks in {status}</span>} />
          </div>
        )}
      </div>
    </div>
  );
});

// --- MAIN BOARD COMPONENT ---

export default function KanbanView2() {
  const [columns, setColumns] = useState([]);
  const [tasksByStatus, setTasksByStatus] = useState({});
  const [loadingStates, setLoadingStates] = useState({});
  const [pagination, setPagination] = useState({});
  const [draggingTaskId, setDraggingTaskId] = useState(null);


    const columns_query = useGetDoctypeField("Task", "status", "options");
      const { options : COLUMNS } = columns_query.data || [];
const tasks_query = useFrappePaginatedTasksCall(
  "infintrix_atlas.api.v1.list_tasks",
  { project: "PROJ-0001" },
  PAGE_SIZE,
  false
);
  // console.log("KanbanView2 - Columns fetched from doctype schema:", COLUMNS);
   // Initial load for page 1
  
  // Scroller refs
  const boardRef = useRef(null);
  const scrollAnimationRef = useRef(null);
  const scrollVelocity = useRef(0);

  useEffect(() => {
    const init = async () => {
      const cols = COLUMNS || [];
      setColumns(cols);
      
      const initialTasks = {};
      const initialLoading = {};
      const initialPages = {};
      
      cols.forEach(col => {
        initialTasks[col] = [];
        initialLoading[col] = false;
        initialPages[col] = { page: 1, hasMore: true };
      });
      
      setTasksByStatus(initialTasks);
      setLoadingStates(initialLoading);
      setPagination(initialPages);

      cols.forEach(col => loadMore(col));
    };

    if (!columns_query.isLoading) {
      init();
    }
  }, [columns_query.isLoading]);

  const loadMore = useCallback(async (status) => {
    setLoadingStates(prev => ({ ...prev, [status]: true }));
    
    try {
      const currentPage = pagination[status]?.page || 1;
      console.log(`Loading tasks for status "${status}", page ${currentPage}`);
      const { tasks, hasMore } = await mockApi.fetchTasks(status, currentPage);
      
      
      setTasksByStatus(prev => ({
        ...prev,
        [status]: currentPage === 1 ? tasks : [...prev[status], ...tasks]
      }));
      
      setPagination(prev => ({
        ...prev,
        [status]: { page: currentPage + 1, hasMore }
      }));
    } finally {
      setLoadingStates(prev => ({ ...prev, [status]: false }));
    }
  }, [pagination]);

  // --- AUTO SCROLL LOGIC ---
  
  const startScrollLoop = useCallback(() => {
    if (scrollAnimationRef.current) return;
    
    const animate = () => {
        if (boardRef.current && scrollVelocity.current !== 0) {
            boardRef.current.scrollLeft += scrollVelocity.current;
        }
        scrollAnimationRef.current = requestAnimationFrame(animate);
    };
    scrollAnimationRef.current = requestAnimationFrame(animate);
  }, []);

  const stopScrollLoop = useCallback(() => {
    if (scrollAnimationRef.current) {
        cancelAnimationFrame(scrollAnimationRef.current);
        scrollAnimationRef.current = null;
        scrollVelocity.current = 0;
    }
  }, []);

  const handleBoardDragOver = (e) => {
    if (!draggingTaskId || !boardRef.current) return;

    const rect = boardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    
    // Calculate velocity based on proximity to edges
    if (x < SCROLL_THRESHOLD) {
        // Left edge: Velocity is negative
        const intensity = (SCROLL_THRESHOLD - x) / SCROLL_THRESHOLD;
        scrollVelocity.current = -MAX_SCROLL_SPEED * intensity;
        startScrollLoop();
    } else if (x > rect.width - SCROLL_THRESHOLD) {
        // Right edge: Velocity is positive
        const intensity = (x - (rect.width - SCROLL_THRESHOLD)) / SCROLL_THRESHOLD;
        scrollVelocity.current = MAX_SCROLL_SPEED * intensity;
        startScrollLoop();
    } else {
        scrollVelocity.current = 0;
        // We don't stop the loop immediately to avoid restart overhead, 
        // but velocity 0 means no movement.
    }
  };

  const handleDragStart = useCallback((e, task) => {
    e.dataTransfer.setData("task", JSON.stringify(task));
    e.dataTransfer.effectAllowed = "move";
    
    setTimeout(() => {
        setDraggingTaskId(task.name);
    }, 0);
  }, []);

  const handleDragEnd = useCallback(() => {
    setDraggingTaskId(null);
    stopScrollLoop();
  }, [stopScrollLoop]);

  const handleMoveTask = useCallback(async (task, newStatus) => {
    setDraggingTaskId(null);
    stopScrollLoop();

    setTasksByStatus(prev => {
      const oldList = prev[task.status].filter(t => t.name !== task.name);
      const updatedTask = { ...task, status: newStatus, modified: new Date().toISOString() };
      const newList = [updatedTask, ...(prev[newStatus] || []).filter(t => t.name !== task.name)];
      
      return {
        ...prev,
        [task.status]: oldList,
        [newStatus]: newList
      };
    });

    try {
      await mockApi.updateTaskStatus(task.name, newStatus);
    } catch (error) {
      console.error("Failed to update task", error);
    }
  }, [stopScrollLoop]);

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#1677ff',
          borderRadius: 12,
        },
      }}
    >
      <Layout className="h-screen bg-white overflow-hidden">
        {/* <Header className="bg-white border-b border-gray-100 px-8 flex items-center justify-between h-20">
          <div className="flex items-center gap-5">
            <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-2.5 rounded-xl shadow-lg shadow-blue-100">
              <Briefcase className="text-white" size={22} />
            </div>
            <div>
              <Title level={4} className="!m-0 !text-lg !font-bold text-gray-900">Engineering Pipeline</Title>
              <div className="flex items-center gap-2">
                <Text type="secondary" className="text-[11px] font-medium uppercase tracking-wider">Infintrix Technologies</Text>
                <div className="w-1 h-1 rounded-full bg-gray-300" />
                <Text type="secondary" className="text-[11px] font-medium uppercase tracking-wider text-blue-500">GSI-PROJ-0006</Text>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Avatar.Group maxCount={4} size="small">
              {[...Array(6)].map((_, i) => (
                <Avatar key={i} src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${i + 20}`} />
              ))}
            </Avatar.Group>
            <div className="h-8 w-[1px] bg-gray-100 mx-2" />
            <Badge dot color="#52c41a">
              <AlertCircle size={20} className="text-gray-400 cursor-pointer hover:text-blue-500 transition-colors" />
            </Badge>
          </div>
        </Header> */}
        
        <Content className="p-0 h-[calc(100vh-80px)]">
          <div 
            ref={boardRef}
            onDragOver={handleBoardDragOver}
            className="flex h-full gap-8 p-8 overflow-x-auto bg-[#fafbfc] items-start scroll-smooth"
          >
            {columns.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center gap-4">
                <Spin size="large" />
                <Text type="secondary" className="animate-pulse">Building workspace...</Text>
              </div>
            ) : (
              columns.map(status => (
                <KanbanColumn
                  key={status}
                  status={status}
                  tasks={tasksByStatus[status] || []}
                  loading={loadingStates[status]}
                  hasMore={pagination[status]?.hasMore}
                  onLoadMore={loadMore}
                  onMoveTask={handleMoveTask}
                  draggingTaskId={draggingTaskId}
                  onDragStart={handleDragStart}
                  onDragEnd={handleDragEnd}
                />
              ))
            )}
          </div>
        </Content>

        <style>{`
          .custom-scrollbar::-webkit-scrollbar {
            width: 5px;
            height: 6px;
          }
          .custom-scrollbar::-webkit-scrollbar-track {
            background: transparent;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb {
            background: #e2e8f0;
            border-radius: 20px;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background: #cbd5e1;
          }
        `}</style>
      </Layout>
    </ConfigProvider>
  );
}