import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import styled from "styled-components";
import { allUsersRoute, host } from "../utils/APIRoutes";
import ChatContainer from "../components/ChatContainer";
import Contacts from "../components/Contacts";
import Welcome from "../components/Welcome";

export default function Chat() {
  const navigate = useNavigate();
  const socket = useRef();
  const [contacts, setContacts] = useState([]);
  const [currentChat, setCurrentChat] = useState(undefined);
  const [currentUser, setCurrentUser] = useState(undefined);



  const [onlineUsers, setOnlineUsers] = useState({});
  const [typingUsers, setTypingUsers] = useState({});
  useEffect(() => {
    const fetchCurrentUser = async () => {
      if (!localStorage.getItem(process.env.REACT_APP_LOCALHOST_KEY)) {
        navigate("/login");
      } else {
        setCurrentUser(
          await JSON.parse(
            localStorage.getItem(process.env.REACT_APP_LOCALHOST_KEY)
          )
        );
      }
    };
    fetchCurrentUser();
  }, []);

  useEffect(() => {
    if (currentUser) {
      
      socket.current = io(host);
      socket.current.emit("add-user", currentUser._id);
      socket.current.on("user-typing", ({ userId, isTyping }) => {
        setTypingUsers(prev => ({ ...prev, [userId]: isTyping }));
      });
      socket.current.on("user-status-change", ({ userId, isOnline }) => {
        setOnlineUsers(prev => {
          const newOnlineUsers = { ...prev };
          if (isOnline) {
            newOnlineUsers[userId] = true;
          } else {
            delete newOnlineUsers[userId];
          }
          return newOnlineUsers;
        });
      });
    //  console.log("Current User:", currentUser);
     // console.log("Online User:", onlineUsers);
      return () => {
        socket.current.off("user-status-change");
        socket.current.disconnect();
      };
    }
  }, [currentUser]);

  useEffect(async () => {

    if (currentUser) {
      if (currentUser.isAvatarImageSet) {
        const data = await axios.get(`${allUsersRoute}/${currentUser._id}`);
        setContacts(data.data);
      } else {
        navigate("/setAvatar");
      }
    }
  }, [currentUser]);
  const handleChatChange = (chat) => {
    setCurrentChat(chat);
  };
  return (
    <>

      <Container>
        
        <div className="container">
          <Contacts contacts={contacts} changeChat={handleChatChange} socket={socket}  onlineUsers={onlineUsers}  />
          {currentChat === undefined ? (
            <Welcome />
          ) : (
            <ChatContainer currentChat={currentChat} socket={socket} currentUser={currentUser} onlineUsers={onlineUsers}/>
          )}
        </div>
      </Container>
    </>
  );
}

const Container = styled.div`
  height: 100vh;
  width: 100vw;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 1rem;
  align-items: center;
  // background-color: #131324;
  background-image: url('https://images.kienthuc.net.vn/zoom/800/Uploaded/quocquan/2022_03_07/stars-in-the-sky-16464831158261870257042_XOKT.jpg');
  background-size: cover;
  background-position: 0 0;
  animation: moveBackground 50s linear infinite;

  @keyframes moveBackground {
    0% {
      background-position: 0 0;
    }
    100% {
      background-position: -1000px 0; /* Adjust the value to control the speed and direction */
    }
  }
  .container {
    height: 85vh;
    width: 85vw;
    background-color: #00000076;
    display: grid;
    grid-template-columns: 25% 75%;
    @media screen and (min-width: 720px) and (max-width: 1080px) {
      grid-template-columns: 35% 65%;
    }
  }
`;
