import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import styled from "styled-components";
import {
  HiHome,
  HiChat,
  HiUserGroup,
  HiBell,
  HiUser,
  HiPhotograph,
  HiMenu,
  HiX,
} from "react-icons/hi";
import { IoMdClose } from "react-icons/io";

export default function Sidebar({ currentUser, socket, unreadNotifications }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const menuItems = [
    { icon: HiHome, label: "Home", path: "/", id: "home" },
    { icon: HiChat, label: "Messages", path: "/messages", id: "messages" },
    { icon: HiUserGroup, label: "Friends", path: "/friends", id: "friends" },
    { icon: HiPhotograph, label: "Stories", path: "/stories", id: "stories" },
    { icon: HiUserGroup, label: "Groups", path: "/groups", id: "groups" },
    { icon: HiBell, label: "Notifications", path: "/notifications", id: "notifications" },
    { icon: HiUser, label: "Profile", path: `/profile/${currentUser?._id}`, id: "profile" },
  ];

  const handleNavigate = (path) => {
    navigate(path);
    setIsMobileMenuOpen(false);
  };

  const isActive = (path) => {
    if (path === "/") {
      return location.pathname === "/";
    }
    return location.pathname.startsWith(path);
  };

  return (
    <>
      <MobileMenuButton onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
        {isMobileMenuOpen ? <HiX /> : <HiMenu />}
      </MobileMenuButton>

      <Container $isOpen={isMobileMenuOpen}>
        <CloseButton onClick={() => setIsMobileMenuOpen(false)}>
          <IoMdClose />
        </CloseButton>

        <Logo>
          <LogoIcon>💬</LogoIcon>
          <LogoText>SocialChat</LogoText>
        </Logo>

        <Menu>
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            const showBadge = item.id === "notifications" && unreadNotifications > 0;

            return (
              <MenuItem
                key={item.id}
                $active={active}
                onClick={() => handleNavigate(item.path)}
              >
                <IconWrapper $active={active}>
                  <Icon />
                  {showBadge && <Badge>{unreadNotifications}</Badge>}
                </IconWrapper>
                <MenuItemLabel>{item.label}</MenuItemLabel>
              </MenuItem>
            );
          })}
        </Menu>

        <UserSection>
          {currentUser && (
            <UserInfo onClick={() => handleNavigate(`/profile/${currentUser._id}`)}>
              <Avatar>
                {currentUser.avatarImage ? (
                  <img
                    src={
                      currentUser.avatarImage.startsWith("data:")
                        ? currentUser.avatarImage
                        : currentUser.avatarImage
                    }
                    alt={currentUser.username}
                  />
                ) : (
                  <DefaultAvatar>{currentUser.username[0].toUpperCase()}</DefaultAvatar>
                )}
              </Avatar>
              <UserDetails>
                <Username>{currentUser.username}</Username>
                <UserStatus>Online</UserStatus>
              </UserDetails>
            </UserInfo>
          )}
        </UserSection>
      </Container>

      {isMobileMenuOpen && <Overlay onClick={() => setIsMobileMenuOpen(false)} />}
    </>
  );
}

const Container = styled.div`
  width: 260px;
  height: 100%;
  background-color: #2f3136;
  display: flex;
  flex-direction: column;
  z-index: 1000;
  transition: transform 0.3s ease;
  flex-shrink: 0;

  @media (max-width: 768px) {
    position: fixed;
    left: 0;
    top: 0;
    height: 100vh;
    transform: ${(props) => (props.$isOpen ? "translateX(0)" : "translateX(-100%)")};
    box-shadow: ${(props) => (props.$isOpen ? "2px 0 10px rgba(0,0,0,0.3)" : "none")};
  }
`;

const Overlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 999;

  @media (min-width: 769px) {
    display: none;
  }
`;

const MobileMenuButton = styled.button`
  position: fixed;
  top: 15px;
  left: 15px;
  z-index: 1001;
  background-color: #2f3136;
  color: white;
  border: none;
  padding: 10px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 24px;
  display: flex;
  align-items: center;
  justify-content: center;

  @media (min-width: 769px) {
    display: none;
  }
`;

const CloseButton = styled.button`
  position: absolute;
  top: 15px;
  right: 15px;
  background: none;
  border: none;
  color: white;
  font-size: 24px;
  cursor: pointer;
  display: none;

  @media (max-width: 768px) {
    display: block;
  }
`;

const Logo = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 20px 16px;
  border-bottom: 1px solid #202225;
`;

const LogoIcon = styled.div`
  font-size: 28px;
`;

const LogoText = styled.h1`
  color: white;
  font-size: 20px;
  font-weight: 700;
  margin: 0;
`;

const Menu = styled.nav`
  flex: 1;
  padding: 8px;
  overflow-y: auto;
`;

const MenuItem = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  margin-bottom: 4px;
  border-radius: 6px;
  cursor: pointer;
  transition: background-color 0.2s;
  background-color: ${(props) => (props.$active ? "#5865f2" : "transparent")};
  color: ${(props) => (props.$active ? "white" : "#b9bbbe")};

  &:hover {
    background-color: ${(props) => (props.$active ? "#5865f2" : "#202225")};
    color: white;
  }
`;

const IconWrapper = styled.div`
  position: relative;
  font-size: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const Badge = styled.span`
  position: absolute;
  top: -6px;
  right: -6px;
  background-color: #ed4245;
  color: white;
  border-radius: 10px;
  padding: 2px 6px;
  font-size: 11px;
  font-weight: 700;
  min-width: 18px;
  text-align: center;
`;

const MenuItemLabel = styled.span`
  font-size: 16px;
  font-weight: 500;
`;

const UserSection = styled.div`
  padding: 16px;
  border-top: 1px solid #202225;
  background-color: #292b2f;
`;

const UserInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  padding: 8px;
  border-radius: 6px;
  transition: background-color 0.2s;

  &:hover {
    background-color: #202225;
  }
`;

const Avatar = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  overflow: hidden;
  background-color: #5865f2;
  display: flex;
  align-items: center;
  justify-content: center;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

const DefaultAvatar = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 700;
  font-size: 18px;
`;

const UserDetails = styled.div`
  flex: 1;
  min-width: 0;
`;

const Username = styled.div`
  color: white;
  font-weight: 600;
  font-size: 14px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const UserStatus = styled.div`
  color: #b9bbbe;
  font-size: 12px;
`;

