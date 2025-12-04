import React, { useState, useEffect } from "react";
import styled from "styled-components";
import axios from "axios";
import {
  getNotificationsRoute,
  markNotificationReadRoute,
  markAllNotificationsReadRoute,
} from "../utils/APIRoutes";
import { HiCheck, HiX } from "react-icons/hi";
import { toast } from "react-toastify";

export default function Notifications({ currentUser, socket }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
  }, [currentUser]);

  useEffect(() => {
    if (socket?.current) {
      socket.current.on("new-notification", (notification) => {
        setNotifications((prev) => [notification, ...prev]);
      });

      return () => {
        socket.current.off("new-notification");
      };
    }
  }, [socket]);

  const fetchNotifications = async () => {
    if (!currentUser) return;
    try {
      setLoading(true);
      const response = await axios.get(`${getNotificationsRoute}/${currentUser._id}`);
      if (response.data.status) {
        setNotifications(response.data.notifications);
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (notificationId) => {
    try {
      const response = await axios.post(markNotificationReadRoute, {
        notificationId,
        userId: currentUser._id,
      });

      if (response.data.status) {
        setNotifications((prev) =>
          prev.map((notif) =>
            notif._id === notificationId ? { ...notif, isRead: true } : notif
          )
        );
      }
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const response = await axios.post(markAllNotificationsReadRoute, {
        userId: currentUser._id,
      });

      if (response.data.status) {
        setNotifications((prev) =>
          prev.map((notif) => ({ ...notif, isRead: true }))
        );
        toast.success("All notifications marked as read");
      }
    } catch (error) {
      console.error("Error marking all as read:", error);
      toast.error("Error marking notifications as read");
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case "friend_request":
        return "👤";
      case "friend_accepted":
        return "✅";
      case "post_like":
        return "❤️";
      case "post_comment":
        return "💬";
      case "post_share":
        return "🔁";
      case "comment_like":
        return "👍";
      case "comment_reply":
        return "↩️";
      case "story_view":
        return "👁️";
      case "group_invite":
        return "👥";
      default:
        return "🔔";
    }
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <Container>
      <Header>
        <Title>Notifications {unreadCount > 0 && <Badge>{unreadCount}</Badge>}</Title>
        {unreadCount > 0 && (
          <MarkAllButton onClick={handleMarkAllAsRead}>
            Mark all as read
          </MarkAllButton>
        )}
      </Header>

      {loading ? (
        <Loading>Loading notifications...</Loading>
      ) : notifications.length === 0 ? (
        <EmptyState>
          <EmptyIcon>🔔</EmptyIcon>
          <EmptyText>No notifications yet</EmptyText>
        </EmptyState>
      ) : (
        <NotificationsList>
          {notifications.map((notification) => (
            <NotificationItem
              key={notification._id}
              $unread={!notification.isRead}
              onClick={() => handleMarkAsRead(notification._id)}
            >
              <NotificationIcon>{getNotificationIcon(notification.type)}</NotificationIcon>
              <NotificationContent>
                <NotificationText>{notification.content}</NotificationText>
                <NotificationTime>
                  {new Date(notification.createdAt).toLocaleString()}
                </NotificationTime>
              </NotificationContent>
              {!notification.isRead && <UnreadDot />}
            </NotificationItem>
          ))}
        </NotificationsList>
      )}
    </Container>
  );
}

const Container = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background-color: #36393f;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  background-color: #2f3136;
  border-bottom: 1px solid #202225;
`;

const Title = styled.h1`
  color: white;
  font-size: 24px;
  font-weight: 700;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 12px;
`;

const Badge = styled.span`
  background-color: #ed4245;
  color: white;
  border-radius: 12px;
  padding: 2px 8px;
  font-size: 14px;
  font-weight: 700;
`;

const MarkAllButton = styled.button`
  background-color: #5865f2;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s;

  &:hover {
    background-color: #4752c4;
  }
`;

const Loading = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 1;
  color: #b9bbbe;
  font-size: 18px;
`;

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex: 1;
  color: #b9bbbe;
`;

const EmptyIcon = styled.div`
  font-size: 64px;
  margin-bottom: 16px;
`;

const EmptyText = styled.div`
  font-size: 18px;
`;

const NotificationsList = styled.div`
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
`;

const NotificationItem = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px 20px;
  background-color: ${(props) => (props.$unread ? "#2f3136" : "transparent")};
  border-bottom: 1px solid #202225;
  cursor: pointer;
  transition: background-color 0.2s;

  &:hover {
    background-color: #2f3136;
  }
`;

const NotificationIcon = styled.div`
  font-size: 32px;
  flex-shrink: 0;
`;

const NotificationContent = styled.div`
  flex: 1;
  min-width: 0;
`;

const NotificationText = styled.div`
  color: white;
  font-size: 15px;
  margin-bottom: 4px;
`;

const NotificationTime = styled.div`
  color: #72767d;
  font-size: 13px;
`;

const UnreadDot = styled.div`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: #5865f2;
  flex-shrink: 0;
`;

