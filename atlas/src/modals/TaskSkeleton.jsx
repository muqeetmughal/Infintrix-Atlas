const TaskSkeleton = () => {
    return (
        <>
            {/* Modal Container */}
            <div className="bg-white dark:bg-[#0f172a] w-full h-[90vh] rounded-xl shadow-2xl flex overflow-hidden border border-gray-200 dark:border-slate-800 animate-pulse">
                
                {/* Main Content Area (Left) */}
                <div className="flex-1 flex flex-col min-w-0 border-r border-gray-200 dark:border-slate-800">
                    {/* Header */}
                    <div className="p-6 border-b border-gray-200 dark:border-slate-800 flex justify-between items-center">
                        <div className="h-4 w-32 bg-gray-300 dark:bg-slate-800 rounded"></div>
                        <div className="flex space-x-4">
                            <div className="h-8 w-8 bg-gray-300 dark:bg-slate-800 rounded-full"></div>
                            <div className="h-8 w-8 bg-gray-300 dark:bg-slate-800 rounded-full"></div>
                        </div>
                    </div>

                    <div className="p-8 overflow-y-auto space-y-10">
                        {/* Title */}
                        <div className="h-10 w-3/4 bg-gray-300 dark:bg-slate-800 rounded-lg"></div>

                        {/* Description Section */}
                        <div className="space-y-4">
                            <div className="h-4 w-24 bg-gray-200 dark:bg-slate-700/50 rounded"></div>
                            <div className="h-4 w-full bg-gray-300 dark:bg-slate-800 rounded"></div>
                            <div className="h-4 w-2/3 bg-gray-300 dark:bg-slate-800 rounded"></div>
                        </div>

                        {/* Subtasks Section */}
                        <div className="space-y-4">
                            <div className="h-4 w-20 bg-gray-200 dark:bg-slate-700/50 rounded"></div>
                            <div className="space-y-3">
                                {[1, 2].map((i) => (
                                    <div key={i} className="flex items-center space-x-3">
                                        <div className="h-5 w-5 bg-gray-300 dark:bg-slate-800 rounded"></div>
                                        <div className="h-4 w-1/2 bg-gray-300 dark:bg-slate-800 rounded"></div>
                                    </div>
                                ))}
                            </div>
                            <div className="h-4 w-28 bg-gray-200 dark:bg-slate-800/50 rounded"></div>
                        </div>

                        {/* Comment Box Area */}
                        <div className="pt-6 border-t border-gray-200 dark:border-slate-800">
                            <div className="flex space-x-4">
                                <div className="h-10 w-10 bg-gray-300 dark:bg-slate-800 rounded-full shrink-0"></div>
                                <div className="flex-1 space-y-3">
                                    <div className="h-24 w-full bg-gray-200 dark:bg-slate-800/50 rounded-lg border border-gray-300 dark:border-slate-700"></div>
                                    <div className="h-8 w-20 bg-blue-200 dark:bg-blue-900/30 rounded"></div>
                                </div>
                            </div>
                        </div>

                        {/* Activity Feed */}
                        <div className="space-y-6">
                            <div className="h-5 w-20 bg-gray-200 dark:bg-slate-700/50 rounded"></div>
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="flex space-x-4">
                                    <div className="h-4 w-4 bg-gray-300 dark:bg-slate-800 rounded-full mt-1"></div>
                                    <div className="space-y-2 flex-1">
                                        <div className="h-4 w-2/3 bg-gray-300 dark:bg-slate-800 rounded"></div>
                                        <div className="h-3 w-20 bg-gray-200 dark:bg-slate-800/50 rounded"></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Sidebar (Right) */}
                <div className="w-80 bg-white dark:bg-[#0f172a] p-6 space-y-8 hidden md:block">
                    {/* Status Picker */}
                    <div className="flex items-center justify-between">
                        <div className="h-8 w-24 bg-orange-100 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-900/30 rounded-md"></div>
                        <div className="h-8 w-8 bg-gray-300 dark:bg-slate-800 rounded-md"></div>
                    </div>

                    {/* Details Section */}
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <div className="h-4 w-16 bg-gray-200 dark:bg-slate-700/50 rounded"></div>
                            <div className="h-4 w-4 bg-gray-300 dark:bg-slate-800 rounded"></div>
                        </div>

                        {/* Field Rows */}
                        {[1, 2, 3, 4, 5].map((i) => (
                            <div key={i} className="flex justify-between items-center py-1">
                                <div className="h-4 w-20 bg-gray-300 dark:bg-slate-800 rounded"></div>
                                <div className="h-6 w-32 bg-gray-200 dark:bg-slate-800/50 rounded"></div>
                            </div>
                        ))}
                    </div>

                    {/* Attachments Section */}
                    <div className="pt-6 border-t border-gray-200 dark:border-slate-800 space-y-4">
                        <div className="h-4 w-24 bg-gray-200 dark:bg-slate-700/50 rounded"></div>
                        <div className="h-10 w-full bg-gray-100 dark:bg-slate-800/50 border border-dashed border-gray-300 dark:border-slate-700 rounded-lg flex items-center justify-center">
                            <div className="h-4 w-20 bg-gray-300 dark:bg-slate-700 rounded"></div>
                        </div>
                    </div>

                    {/* Timestamps */}
                    <div className="pt-20 space-y-3">
                         <div className="flex justify-between">
                                <div className="h-3 w-16 bg-gray-300 dark:bg-slate-800 rounded"></div>
                                <div className="h-3 w-32 bg-gray-200 dark:bg-slate-800/50 rounded"></div>
                         </div>
                         <div className="flex justify-between">
                                <div className="h-3 w-16 bg-gray-300 dark:bg-slate-800 rounded"></div>
                                <div className="h-3 w-32 bg-gray-200 dark:bg-slate-800/50 rounded"></div>
                         </div>
                    </div>
                </div>

                {/* Action Controls (Top Right Close) */}
                <div className="absolute top-4 right-4 flex space-x-2">
                        <div className="h-8 w-8 bg-gray-300 dark:bg-slate-800 rounded-md"></div>
                </div>

            </div>
        </>
    );
};
export default TaskSkeleton;
