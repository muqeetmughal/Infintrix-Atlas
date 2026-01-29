import React from 'react'
import { Bell, CheckCircle, AlertCircle, Clock, User } from 'lucide-react'

const Notifications = () => {
    const notifications = [
        {
            id: 1,
            type: 'success',
            title: 'Task Completed',
            message: 'John Doe completed "Design Homepage" task',
            time: '5 minutes ago',
            read: false,
            icon: CheckCircle,
            color: 'text-green-500'
        },
        {
            id: 2,
            type: 'warning',
            title: 'Deadline Approaching',
            message: 'Project "Website Redesign" is due in 2 days',
            time: '1 hour ago',
            read: false,
            icon: Clock,
            color: 'text-yellow-500'
        },
        {
            id: 3,
            type: 'info',
            title: 'New Assignment',
            message: 'You have been assigned to "Mobile App Development"',
            time: '3 hours ago',
            read: true,
            icon: User,
            color: 'text-blue-500'
        },
        {
            id: 4,
            type: 'error',
            title: 'Task Overdue',
            message: '"API Integration" task is overdue by 1 day',
            time: '5 hours ago',
            read: true,
            icon: AlertCircle,
            color: 'text-red-500'
        }
    ]

    return (
        <div className="max-w-2xl mx-auto p-6">
            <div className="bg-white rounded-lg shadow-lg">
                <div className="border-b border-gray-200 p-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Bell className="w-5 h-5 text-gray-700" />
                        <h2 className="text-xl font-semibold text-gray-800">Notifications</h2>
                        <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                            {notifications.filter(n => !n.read).length}
                        </span>
                    </div>
                    <button className="text-sm text-blue-600 hover:text-blue-800 font-medium">
                        Mark all as read
                    </button>
                </div>

                <div className="divide-y divide-gray-100">
                    {notifications.map((notification) => {
                        const Icon = notification.icon
                        return (
                            <div
                                key={notification.id}
                                className={`p-4 hover:bg-gray-50 transition-colors cursor-pointer ${!notification.read ? 'bg-blue-50' : ''
                                    }`}
                            >
                                <div className="flex gap-3">
                                    <div className={`flex-shrink-0 ${notification.color}`}>
                                        <Icon className="w-6 h-6" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-2">
                                            <p className="font-semibold text-gray-900">{notification.title}</p>
                                            {!notification.read && (
                                                <span className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0 mt-2"></span>
                                            )}
                                        </div>
                                        <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                                        <p className="text-xs text-gray-400 mt-2">{notification.time}</p>
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>

                <div className="border-t border-gray-200 p-4 text-center">
                    <button className="text-sm text-blue-600 hover:text-blue-800 font-medium">
                        View all notifications
                    </button>
                </div>
            </div>
        </div>
    )
}


export default Notifications
