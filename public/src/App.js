import React, { useState, useEffect, useRef } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { io } from "socket.io-client";
import { host } from "./utils/APIRoutes";
import SetAvatar from "./components/SetAvatar";
import Chat from "./pages/Chat";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Home from "./pages/Home";
import Profile from "./pages/Profile";
import Friends from "./pages/Friends";
import Stories from "./pages/Stories";
import Groups from "./pages/Groups";
import Notifications from "./pages/Notifications";
import MainLayout from "./components/Layout/MainLayout";

export default function App() {
  const [currentUser, setCurrentUser] = useState(undefined);
  const socket = useRef();

  useEffect(() => {
    const fetchCurrentUser = async () => {
      const userData = localStorage.getItem(process.env.REACT_APP_LOCALHOST_KEY);
      if (userData) {
        setCurrentUser(JSON.parse(userData));
      }
    };
    fetchCurrentUser();
  }, []);

  useEffect(() => {
    if (currentUser) {
      socket.current = io(host);
      socket.current.emit("add-user", currentUser._id);
    }
    return () => {
      if (socket.current) {
        socket.current.disconnect();
      }
    };
  }, [currentUser]);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/setAvatar" element={<SetAvatar />} />
        <Route
          path="/"
          element={
            <MainLayout currentUser={currentUser} socket={socket}>
              <Home currentUser={currentUser} socket={socket} />
            </MainLayout>
          }
        />
        <Route
          path="/messages"
          element={
            <MainLayout currentUser={currentUser} socket={socket}>
              <Chat currentUser={currentUser} socket={socket} />
            </MainLayout>
          }
        />
        <Route
          path="/profile/:userId"
          element={
            <MainLayout currentUser={currentUser} socket={socket}>
              <Profile currentUser={currentUser} socket={socket} />
            </MainLayout>
          }
        />
        <Route
          path="/friends"
          element={
            <MainLayout currentUser={currentUser} socket={socket}>
              <Friends currentUser={currentUser} socket={socket} />
            </MainLayout>
          }
        />
        <Route
          path="/stories"
          element={
            <MainLayout currentUser={currentUser} socket={socket}>
              <Stories currentUser={currentUser} socket={socket} />
            </MainLayout>
          }
        />
        <Route
          path="/groups"
          element={
            <MainLayout currentUser={currentUser} socket={socket}>
              <Groups currentUser={currentUser} socket={socket} />
            </MainLayout>
          }
        />
        <Route
          path="/notifications"
          element={
            <MainLayout currentUser={currentUser} socket={socket}>
              <Notifications currentUser={currentUser} socket={socket} />
            </MainLayout>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
