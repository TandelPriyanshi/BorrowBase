import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import api from "../utils/api";
import BorrowRequests from "../components/borrowRequests";
import { FaBell, FaCheck, FaTrash, FaClock, FaExclamationTriangle } from "react-icons/fa";

interface Notification {
  id: number;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  read: boolean;
  created_at: string;
}

const Notification = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'requests' | 'notifications'>('requests');

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const response = await api.get('/api/notifications');
      const data = response.data;
      // Ensure data is always an array
      const notificationsArray = Array.isArray(data) ? data : (data?.notifications || []);
      setNotifications(notificationsArray);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
      toast.error('Failed to load notifications');
      setNotifications([]); // Set empty array on error
    } finally {
      setIsLoading(false);
    }
  };

  const markAsRead = async (notificationId: number) => {
    try {
      await api.put(`/api/notifications/${notificationId}/read`);
      setNotifications(prev => 
        prev.map(notif => 
          notif.id === notificationId ? { ...notif, read: true } : notif
        )
      );
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
      toast.error('Failed to update notification');
    }
  };

  const deleteNotification = async (notificationId: number) => {
    try {
      // Note: Delete endpoint would need to be added to API service if it exists
      // For now, just remove from local state
      setNotifications(prev => prev.filter(notif => notif.id !== notificationId));
      toast.success('Notification deleted');
    } catch (error) {
      console.error('Failed to delete notification:', error);
      toast.error('Failed to delete notification');
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success': return <FaCheck className="text-green-400" />;
      case 'warning': return <FaExclamationTriangle className="text-yellow-400" />;
      case 'error': return <FaExclamationTriangle className="text-red-400" />;
      default: return <FaBell className="text-blue-400" />;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' at ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const unreadCount = Array.isArray(notifications) ? notifications.filter(n => !n.read).length : 0;

  return (
    <div className="p-6 bg-gray-900 min-h-screen">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <FaBell className="text-2xl text-blue-400" />
          <h2 className="text-3xl font-bold text-white">Notifications</h2>
          {unreadCount > 0 && (
            <span className="bg-red-500 text-white text-sm px-2 py-1 rounded-full">
              {unreadCount} unread
            </span>
          )}
        </div>

        {/* Tab Navigation */}
        <div className="flex mb-6 border-b border-gray-700">
          <button
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === 'requests'
                ? 'text-blue-400 border-b-2 border-blue-400'
                : 'text-gray-400 hover:text-white'
            }`}
            onClick={() => setActiveTab('requests')}
          >
            Borrow Requests
          </button>
          <button
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === 'notifications'
                ? 'text-blue-400 border-b-2 border-blue-400'
                : 'text-gray-400 hover:text-white'
            }`}
            onClick={() => setActiveTab('notifications')}
          >
            General Notifications
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'requests' ? (
          <BorrowRequests />
        ) : (
          <div className="space-y-4">
            {isLoading ? (
              <div className="flex justify-center items-center p-8">
                <div className="text-gray-400">Loading notifications...</div>
              </div>
            ) : notifications.length === 0 ? (
              <div className="text-center p-8 bg-gray-800 rounded-lg">
                <FaBell className="text-gray-400 text-3xl mx-auto mb-3" />
                <p className="text-gray-400">No notifications yet</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 rounded-lg border-l-4 ${
                    notification.read
                      ? 'bg-gray-800 border-gray-600'
                      : 'bg-gray-700 border-blue-400'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex items-start gap-3 flex-1">
                      {getNotificationIcon(notification.type)}
                      <div>
                        <h4 className={`font-medium ${
                          notification.read ? 'text-gray-300' : 'text-white'
                        }`}>
                          {notification.title}
                        </h4>
                        <p className={`text-sm mt-1 ${
                          notification.read ? 'text-gray-400' : 'text-gray-200'
                        }`}>
                          {notification.message}
                        </p>
                        <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                          <FaClock />
                          {formatDate(notification.created_at)}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2 ml-4">
                      {!notification.read && (
                        <button
                          onClick={() => markAsRead(notification.id)}
                          className="text-blue-400 hover:text-blue-300 p-1"
                          title="Mark as read"
                        >
                          <FaCheck />
                        </button>
                      )}
                      <button
                        onClick={() => deleteNotification(notification.id)}
                        className="text-red-400 hover:text-red-300 p-1"
                        title="Delete notification"
                      >
                        <FaTrash />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Notification;
