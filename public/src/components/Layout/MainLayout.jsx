import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import styled from "styled-components";
import Sidebar from "./Sidebar";
import axios from "axios";
import { getUnreadCountRoute } from "../../utils/APIRoutes";

export default function MainLayout({ children, currentUser, socket }) {
  const navigate = useNavigate();
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  useEffect(() => {
    if (!currentUser) {
      navigate("/login");
      return;
    }

    // Fetch unread notifications count
    const fetchUnreadCount = async () => {
      try {
        const response = await axios.get(`${getUnreadCountRoute}/${currentUser._id}`);
        if (response.data.status) {
          setUnreadNotifications(response.data.count);
        }
      } catch (error) {
        console.error("Error fetching unread count:", error);
      }
    };

    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000); // Update every 30 seconds

    // Listen for new notifications via socket
    if (socket?.current) {
      socket.current.on("new-notification", () => {
        fetchUnreadCount();
      });
    }

    return () => {
      clearInterval(interval);
      if (socket?.current) {
        socket.current.off("new-notification");
      }
    };
  }, [currentUser, navigate, socket]);

  if (!currentUser) {
    return null;
  }

  return (
    <Container>
      <Sidebar
        currentUser={currentUser}
        socket={socket}
        unreadNotifications={unreadNotifications}
      />
      <MainContent>{children}</MainContent>
    </Container>
  );
}

const Container = styled.div`
  display: flex;
  height: 100vh;
  width: 100vw;
  background-color: #36393f;
  overflow: hidden;

  @media (max-width: 768px) {
    flex-direction: column;
  }
`;

const MainContent = styled.main`
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;

