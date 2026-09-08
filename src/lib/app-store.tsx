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
  PEOPLE,
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
  /** Set for a quote-repost. */
  repostOf?: Post;
}

/** Per-chat toggles that live outside the message list. */
export interface ChatSettings {
  screenshots: boolean;
  forwarding: boolean;
  /** Disappearing TTL in seconds; 0 = off. */
  disappearing: number;
}

const DEFAULT_CHAT_SETTINGS: ChatSettings = {
  screenshots: false,
  forwarding: false,
  disappearing: 0,
};

/** People the user follows out of the box — so "Following" differs from "For you". */
const INITIAL_FOLLOWED = ["p1", "p2", "p6", "p8"];

interface AppStore {
  posts: Post[];
  likedPosts: Post[];
  myPosts: Post[];
  repostedPosts: Post[];
  toggleLike: (id: string) => void;
  toggleRepost: (id: string) => void;
  /** Quote-repost: a new post that embeds `original`. */
  repost: (original: Post, text: string) => void;
  hidePost: (id: string) => void;
  addComment: (postId: string, comment: PostComment, parentId?: string) => void;
  toggleCommentLike: (postId: string, commentId: string) => void;
  votePoll: (postId: string, optionId: string) => void;
  addPost: (input: NewPostInput) => void;

  /** Which people the user follows. */
  isFollowing: (personId: string) => boolean;
  toggleFollow: (personId: string) => void;

  chats: Chat[];
  appendMessage: (chatId: string, message: ChatMessage) => void;
  editMessage: (chatId: string, messageId: string, text: string) => void;
  deleteMessages: (chatId: string, messageIds: string[], scope: "me" | "everyone") => void;
  forwardMessage: (message: ChatMessage, toChatId: string) => void;
  clearHistory: (chatId: string) => void;
  markChatRead: (chatId: string) => void;
  createGroup: (name: string, members: Person[]) => Chat;

  chatSettings: (chatId: string) => ChatSettings;
  setChatSetting: <K extends keyof ChatSettings>(chatId: string, key: K, value: ChatSettings[K]) => void;
  isBlocked: (chatId: string) => boolean;
  toggleBlock: (chatId: string) => void;
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
    if (c.replies?.length) return { ...c, replies: mapComment(c.replies, id, fn) };
    return c;
  });
}

export function AppStoreProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>(POSTS);
  const [chats, setChats] = useState<Chat[]>(CHATS);
  const [followed, setFollowed] = useState<Set<string>>(new Set(INITIAL_FOLLOWED));
  const [settings, setSettings] = useState<Record<string, ChatSettings>>({});
  const [blocked, setBlocked] = useState<Record<string, boolean>>({});

  // Signing out and back in shouldn't leave the previous account's state around.
  const lastHandle = useRef<string | null>(user?.handle ?? null);
  useEffect(() => {
    const handle = user?.handle ?? null;
    if (handle !== lastHandle.current) {
      lastHandle.current = handle;
      setPosts(POSTS);
      setChats(CHATS);
      setFollowed(new Set(INITIAL_FOLLOWED));
      setSettings({});
      setBlocked({});
    }
  }, [user?.handle]);

  // Sweep out expired disappearing messages once a second.
  useEffect(() => {
    const id = setInterval(() => {
      const now = Date.now();
      setChats((prev) => {
        let changed = false;
        const next = prev.map((c) => {
          const kept = c.messages.filter((m) => !m.expiresAt || m.expiresAt > now);
          if (kept.length !== c.messages.length) {
            changed = true;
            return { ...c, messages: kept };
          }
          return c;
        });
        return changed ? next : prev;
      });
    }, 1000);
    return () => clearInterval(id);
  }, []);

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

  const hidePost = useCallback((id: string) => {
    setPosts((prev) => prev.map((p) => (p.id === id ? { ...p, hidden: true } : p)));
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

  const meAuthor = useCallback((): Person => {
    return {
      id: "me",
      name: user?.name ?? "You",
      handle: user?.handle ?? "you",
      avatar: user?.avatar ?? "",
    };
  }, [user]);

  const addPost = useCallback(
    ({ text, images, poll, location, repostOf }: NewPostInput) => {
      if (!user) return;
      const post: Post = {
        id: uid("p"),
        author: meAuthor(),
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
        repostOf,
        likes: 0,
        likers: [],
        comments: [],
        shares: 0,
        views: 0,
        mine: true,
      };
      setPosts((prev) => [post, ...prev]);
    },
    [meAuthor, user],
  );

  const repost = useCallback(
    (original: Post, text: string) => {
      // Bump the original's share count and add a quote post to the top.
      setPosts((prev) => prev.map((p) => (p.id === original.id ? { ...p, shares: p.shares + 1, reposted: true } : p)));
      addPost({ text, repostOf: { ...original, repostOf: undefined } });
    },
    [addPost],
  );

  const isFollowing = useCallback((personId: string) => followed.has(personId), [followed]);
  const toggleFollow = useCallback((personId: string) => {
    setFollowed((prev) => {
      const next = new Set(prev);
      if (next.has(personId)) next.delete(personId);
      else next.add(personId);
      return next;
    });
  }, []);

  const appendMessage = useCallback((chatId: string, message: ChatMessage) => {
    setChats((prev) =>
      prev.map((c) => (c.id === chatId ? { ...c, messages: [...c.messages, message] } : c)),
    );
  }, []);

  const editMessage = useCallback((chatId: string, messageId: string, text: string) => {
    setChats((prev) =>
      prev.map((c) =>
        c.id === chatId
          ? {
              ...c,
              messages: c.messages.map((m) =>
                m.id === messageId ? { ...m, text, edited: true } : m,
              ),
            }
          : c,
      ),
    );
  }, []);

  const deleteMessages = useCallback(
    (chatId: string, messageIds: string[], _scope: "me" | "everyone") => {
      // Without a backend both scopes remove the message locally.
      const ids = new Set(messageIds);
      setChats((prev) =>
        prev.map((c) =>
          c.id === chatId
            ? { ...c, messages: c.messages.filter((m) => !ids.has(m.id)) }
            : c,
        ),
      );
    },
    [],
  );

  const forwardMessage = useCallback((message: ChatMessage, toChatId: string) => {
    const fromName = chats.find((c) =>
      c.messages.some((m) => m.id === message.id),
    );
    const label = fromName
      ? fromName.kind === "group"
        ? fromName.name
        : fromName.person?.name
      : undefined;
    setChats((prev) =>
      prev.map((c) =>
        c.id === toChatId
          ? {
              ...c,
              messages: [
                ...c.messages,
                {
                  ...message,
                  id: uid("s"),
                  from: "me",
                  authorId: undefined,
                  read: false,
                  edited: false,
                  expiresAt: undefined,
                  forwardedFrom: label && label !== "You" ? label : message.forwardedFrom,
                  time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
                },
              ],
            }
          : c,
      ),
    );
  }, [chats]);

  const clearHistory = useCallback((chatId: string) => {
    setChats((prev) =>
      prev.map((c) => (c.id === chatId ? { ...c, messages: [], unread: 0 } : c)),
    );
  }, []);

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

  const chatSettings = useCallback(
    (chatId: string) => settings[chatId] ?? DEFAULT_CHAT_SETTINGS,
    [settings],
  );
  const setChatSetting = useCallback(
    <K extends keyof ChatSettings>(chatId: string, key: K, value: ChatSettings[K]) => {
      setSettings((prev) => ({
        ...prev,
        [chatId]: { ...DEFAULT_CHAT_SETTINGS, ...prev[chatId], [key]: value },
      }));
    },
    [],
  );

  const isBlocked = useCallback((chatId: string) => !!blocked[chatId], [blocked]);
  const toggleBlock = useCallback((chatId: string) => {
    setBlocked((prev) => ({ ...prev, [chatId]: !prev[chatId] }));
  }, []);

  const visiblePosts = useMemo(() => posts.filter((p) => !p.hidden), [posts]);
  const likedPosts = useMemo(() => visiblePosts.filter((p) => p.liked), [visiblePosts]);
  const myPosts = useMemo(() => visiblePosts.filter((p) => p.mine), [visiblePosts]);
  const repostedPosts = useMemo(() => visiblePosts.filter((p) => p.reposted), [visiblePosts]);

  const value = useMemo(
    () => ({
      posts: visiblePosts,
      likedPosts,
      myPosts,
      repostedPosts,
      toggleLike,
      toggleRepost,
      repost,
      hidePost,
      addComment,
      toggleCommentLike,
      votePoll,
      addPost,
      isFollowing,
      toggleFollow,
      chats,
      appendMessage,
      editMessage,
      deleteMessages,
      forwardMessage,
      clearHistory,
      markChatRead,
      createGroup,
      chatSettings,
      setChatSetting,
      isBlocked,
      toggleBlock,
    }),
    [
      visiblePosts,
      likedPosts,
      myPosts,
      repostedPosts,
      toggleLike,
      toggleRepost,
      repost,
      hidePost,
      addComment,
      toggleCommentLike,
      votePoll,
      addPost,
      isFollowing,
      toggleFollow,
      chats,
      appendMessage,
      editMessage,
      deleteMessages,
      forwardMessage,
      clearHistory,
      markChatRead,
      createGroup,
      chatSettings,
      setChatSetting,
      isBlocked,
      toggleBlock,
    ],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used within <AppStoreProvider>");
  return ctx;
}

/** Everyone the app knows about — used by the search screen. */
export { PEOPLE };
