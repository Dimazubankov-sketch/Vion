"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  CHATS,
  POSTS,
  type Chat,
  type ChatMessage,
  type Person,
  type Poll,
  type Post,
  type PostComment,
} from "./mock-data";
import { useAuth } from "./auth-context";
import { uid } from "@/utils/uid";

/** What a new post can carry beyond its text. */
export interface NewPostInput {
  text: string;
  images?: string[];
  poll?: Poll;
  location?: string;
}

interface AppStore {
  posts: Post[];
  likedPosts: Post[];
  myPosts: Post[];
  repostedPosts: Post[];
  toggleLike: (id: string) => void;
  toggleRepost: (id: string) => void;
  /** `parentId` turns the comment into a reply to that comment. */
  addComment: (postId: string, comment: PostComment, parentId?: string) => void;
  toggleCommentLike: (postId: string, commentId: string) => void;
  votePoll: (postId: string, optionId: string) => void;
  addPost: (input: NewPostInput) => void;

  chats: Chat[];
  appendMessage: (chatId: string, message: ChatMessage) => void;
  markChatRead: (chatId: string) => void;
  createGroup: (name: string, members: Person[]) => Chat;
}

const StoreContext = createContext<AppStore | null>(null);

/** Apply `fn` to the comment with `id`, looking inside replies too. */
function mapComment(
  comments: PostComment[],
  id: string,
  fn: (c: PostComment) => PostComment,
): PostComment[] {
  return comments.map((c) => {
    if (c.id === id) return fn(c);
    if (c.replies?.length) {
      return { ...c, replies: mapComment(c.replies, id, fn) };
    }
    return c;
  });
}

export function AppStoreProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>(POSTS);
  const [chats, setChats] = useState<Chat[]>(CHATS);

  // Signing out and back in shouldn't leave the previous account's posts and
  // read state lying around.
  const lastHandle = useRef<string | null>(user?.handle ?? null);
  useEffect(() => {
    const handle = user?.handle ?? null;
    if (handle !== lastHandle.current) {
      lastHandle.current = handle;
      setPosts(POSTS);
      setChats(CHATS);
    }
  }, [user?.handle]);

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

  const addComment = useCallback((postId: string, comment: PostComment, parentId?: string) => {
    setPosts((prev) =>
      prev.map((p) => {
        if (p.id !== postId) return p;
        if (!parentId) return { ...p, comments: [...p.comments, comment] };
        return {
          ...p,
          comments: mapComment(p.comments, parentId, (c) => ({
            ...c,
            replies: [...(c.replies ?? []), comment],
          })),
        };
      }),
    );
  }, []);

  const toggleCommentLike = useCallback((postId: string, commentId: string) => {
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId
          ? {
              ...p,
              comments: mapComment(p.comments, commentId, (c) => ({
                ...c,
                liked: !c.liked,
                likes: c.likes + (c.liked ? -1 : 1),
              })),
            }
          : p,
      ),
    );
  }, []);

  const votePoll = useCallback((postId: string, optionId: string) => {
    setPosts((prev) =>
      prev.map((p) => {
        if (p.id !== postId || !p.poll) return p;
        const previous = p.poll.votedId;
        if (previous === optionId) return p;
        return {
          ...p,
          poll: {
            ...p.poll,
            votedId: optionId,
            options: p.poll.options.map((o) => {
              if (o.id === optionId) return { ...o, votes: o.votes + 1 };
              if (o.id === previous) return { ...o, votes: Math.max(0, o.votes - 1) };
              return o;
            }),
          },
        };
      }),
    );
  }, []);

  const addPost = useCallback(
    ({ text, images, poll, location }: NewPostInput) => {
      if (!user) return;
      const me: Person = {
        id: "me",
        name: user.name,
        handle: user.handle,
        avatar: user.avatar ?? "",
      };
      const post: Post = {
        id: uid("p"),
        author: me,
        time: new Date().toLocaleString(undefined, {
          weekday: "long",
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }),
        location,
        text,
        images,
        poll,
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

  /** Opening a chat clears its unread badge. */
  const markChatRead = useCallback((chatId: string) => {
    setChats((prev) =>
      prev.map((c) => (c.id === chatId && c.unread > 0 ? { ...c, unread: 0 } : c)),
    );
  }, []);

  const createGroup = useCallback((name: string, members: Person[]) => {
    const chat: Chat = {
      id: uid("g"),
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
      toggleCommentLike,
      votePoll,
      addPost,
      chats,
      appendMessage,
      markChatRead,
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
      toggleCommentLike,
      votePoll,
      addPost,
      chats,
      appendMessage,
      markChatRead,
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
