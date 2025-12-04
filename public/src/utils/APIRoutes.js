export const host = process.env.REACT_APP_API_URL;

// Auth routes 1
export const loginRoute = `${host}/api/auth/login`;
export const registerRoute = `${host}/api/auth/register`;
export const logoutRoute = `${host}/api/auth/logout`;
export const allUsersRoute = `${host}/api/auth/allusers`;
export const setAvatarRoute = `${host}/api/auth/setavatar`;
export const updateProfileRoute = `${host}/api/auth/profile`;
export const getProfileRoute = `${host}/api/auth/profile`;
export const followRoute = `${host}/api/auth/follow`;

// Message routes
export const sendMessageRoute = `${host}/api/messages/addmsg`;
export const recieveMessageRoute = `${host}/api/messages/getmsg`;
export const markReadRoute = `${host}/api/messages/mark-read`;

// Friendship routes
export const sendFriendRequestRoute = `${host}/api/friendships/send-request`;
export const acceptFriendRequestRoute = `${host}/api/friendships/accept-request`;
export const rejectFriendRequestRoute = `${host}/api/friendships/reject-request`;
export const getFriendRequestsRoute = `${host}/api/friendships/requests`;
export const getFriendsRoute = `${host}/api/friendships/friends`;
export const removeFriendRoute = `${host}/api/friendships/remove`;
export const searchUsersRoute = `${host}/api/friendships/search`;

// Post routes
export const createPostRoute = `${host}/api/posts/create`;
export const getPostsFeedRoute = `${host}/api/posts/feed`;
export const getUserPostsRoute = `${host}/api/posts/user`;
export const getPostRoute = `${host}/api/posts`;
export const deletePostRoute = `${host}/api/posts/delete`;
export const likePostRoute = `${host}/api/posts/like`;
export const sharePostRoute = `${host}/api/posts/share`;

// Comment routes
export const createCommentRoute = `${host}/api/comments/create`;
export const getCommentsRoute = `${host}/api/comments/post`;
export const deleteCommentRoute = `${host}/api/comments/delete`;
export const likeCommentRoute = `${host}/api/comments/like`;

// Story routes
export const createStoryRoute = `${host}/api/stories/create`;
export const getStoriesFeedRoute = `${host}/api/stories/feed`;
export const getUserStoriesRoute = `${host}/api/stories/user`;
export const viewStoryRoute = `${host}/api/stories/view`;
export const deleteStoryRoute = `${host}/api/stories/delete`;

// Group routes
export const createGroupRoute = `${host}/api/groups/create`;
export const getGroupsRoute = `${host}/api/groups`;
export const getUserGroupsRoute = `${host}/api/groups/user`;
export const getGroupRoute = `${host}/api/groups`;
export const joinGroupRoute = `${host}/api/groups/join`;
export const leaveGroupRoute = `${host}/api/groups/leave`;
export const addAdminRoute = `${host}/api/groups/add-admin`;
export const removeMemberRoute = `${host}/api/groups/remove-member`;
export const updateGroupRoute = `${host}/api/groups/update`;
export const deleteGroupRoute = `${host}/api/groups/delete`;

// Notification routes
export const getNotificationsRoute = `${host}/api/notifications`;
export const getUnreadCountRoute = `${host}/api/notifications/unread`;
export const markNotificationReadRoute = `${host}/api/notifications/mark-read`;
export const markAllNotificationsReadRoute = `${host}/api/notifications/mark-all-read`;
export const deleteNotificationRoute = `${host}/api/notifications/delete`;
