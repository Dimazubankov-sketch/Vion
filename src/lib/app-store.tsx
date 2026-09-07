"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  CHATS,
  POSTS,
  type Chat,
  type ChatMessage,
  type Person,
  type Post,
  type PostComment,
} from "./mock-data";
import { useAuth } from "./auth-context";

interface AppStore {
  posts: Post[];
  likedPosts: Post[];
  myPosts: Post[];
  repostedPosts: Post[];
  toggleLike: (id: string) => void;
  toggleRepost: (id: string) => void;
  addComment: (id: string, comment: PostComment) => void;
  addPost: (text: string, images?: string[]) => void;

  chats: Chat[];
  appendMessage: (chatId: string, message: ChatMessage) => void;
  createGroup: (name: string, members: Person[]) => Chat;
}

const StoreContext = createContext<AppStore | null>(null);

export function AppStoreProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>(POSTS);
  const [chats, setChats] = useState<Chat[]>(CHATS);

  const toggleLike = useCallback((id: string) => {
    setPosts((prev) =>
      prev.map((p) =>
        p.id === id ? { ...p, liked: !p.liked, likes: p.likes + (p.liked ? -1 : 1) } : p,
      ),
    );
  }, []);

  const toggleRepost = useCallback((id: string) => {
    setPosts((prev) =>
      prev.map((p) =>
        p.id === id
          ? { ...p, reposted: !p.reposted, shares: p.shares + (p.reposted ? -1 : 1) }
          : p,
      ),
    );
  }, []);

  const addComment = useCallback((id: string, comment: PostComment) => {
    setPosts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, comments: [...p.comments, comment] } : p)),
    );
  }, []);

  const addPost = useCallback(
    (text: string, images?: string[]) => {
      if (!user) return;
      const me: Person = {
        id: "me",
        name: user.name,
        handle: user.handle,
        avatar: user.avatar ?? "",
      };
      const post: Post = {
        id: `p${Date.now()}`,
        author: me,
        time: new Date().toLocaleString(undefined, {
          weekday: "long",
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }),
        text,
        images,
        likes: 0,
        likers: [],
        comments: [],
        shares: 0,
        views: 0,
        mine: true,
      };
      setPosts((prev) => [post, ...prev]);
    },
    [user],
  );

  const appendMessage = useCallback((chatId: string, message: ChatMessage) => {
    setChats((prev) =>
      prev.map((c) => (c.id === chatId ? { ...c, messages: [...c.messages, message] } : c)),
    );
  }, []);

  const createGroup = useCallback((name: string, members: Person[]) => {
    const chat: Chat = {
      id: `g${Date.now()}`,
      kind: "group",
      name,
      members,
      unread: 0,
      messages: [
        {
          id: "m0",
          from: "me",
          text: `You created the group “${name}”.`,
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          read: true,
        },
      ],
    };
    setChats((prev) => [chat, ...prev]);
    return chat;
  }, []);

  const likedPosts = useMemo(() => posts.filter((p) => p.liked), [posts]);
  const myPosts = useMemo(() => posts.filter((p) => p.mine), [posts]);
  const repostedPosts = useMemo(() => posts.filter((p) => p.reposted), [posts]);

  const value = useMemo(
    () => ({
      posts,
      likedPosts,
      myPosts,
      repostedPosts,
      toggleLike,
      toggleRepost,
      addComment,
      addPost,
      chats,
      appendMessage,
      createGroup,
    }),
    [
      posts,
      likedPosts,
      myPosts,
      repostedPosts,
      toggleLike,
      toggleRepost,
      addComment,
      addPost,
      chats,
      appendMessage,
      createGroup,
    ],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used within <AppStoreProvider>");
  return ctx;
}
