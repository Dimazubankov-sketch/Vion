/** Static demo content for the Vion prototype (no backend). */

export interface Person {
  id: string;
  name: string;
  handle: string;
  avatar: string;
  online?: boolean;
}

export interface ChatMessage {
  id: string;
  from: "me" | "them";
  text?: string;
  images?: string[];
  time: string;
  read?: boolean;
}

export interface Chat {
  id: string;
  person: Person;
  messages: ChatMessage[];
  unread: number;
}

export interface Post {
  id: string;
  author: Person;
  time: string;
  text: string;
  images?: string[];
  replies: number;
  reposts: number;
  likes: number;
  liked?: boolean;
}

export type NotificationKind = "like" | "follow" | "reply" | "repost" | "mention";

export interface AppNotification {
  id: string;
  kind: NotificationKind;
  actor: Person;
  text: string;
  time: string;
  unread?: boolean;
}

const avatar = (n: number) => `https://i.pravatar.cc/200?img=${n}`;
const photo = (id: number, w = 800, h = 600) => `https://picsum.photos/id/${id}/${w}/${h}`;

export const PEOPLE: Person[] = [
  { id: "p1", name: "Jacquenetta Slowgrave", handle: "jacqs", avatar: avatar(12), online: true },
  { id: "p2", name: "Nickola Peever", handle: "nickola", avatar: avatar(33), online: true },
  { id: "p3", name: "Farand Hume", handle: "farand", avatar: avatar(15), online: false },
  { id: "p4", name: "Ossie Peasey", handle: "ossie", avatar: avatar(51), online: true },
  { id: "p5", name: "Hall Negri", handle: "halln", avatar: avatar(45), online: false },
  { id: "p6", name: "Elyssa Segot", handle: "elyssa", avatar: avatar(9), online: true },
  { id: "p7", name: "Gil Wilfing", handle: "gilw", avatar: avatar(60), online: false },
  { id: "p8", name: "Mertcan Esmergül", handle: "sitenley", avatar: avatar(68), online: true },
];

export const CHATS: Chat[] = [
  {
    id: "c1",
    person: PEOPLE[0],
    unread: 1,
    messages: [
      {
        id: "m1",
        from: "them",
        images: [photo(1018), photo(1015), photo(1016), photo(1019)],
        text: "",
        time: "17:23",
      },
      { id: "m2", from: "me", text: "Some shots from my last few trips. Saturday can't come soon enough!", time: "17:23", read: true },
      { id: "m3", from: "them", text: "Great! Looking forward to it. See you later!", time: "17:23" },
    ],
  },
  {
    id: "c2",
    person: PEOPLE[1],
    unread: 1,
    messages: [
      { id: "m1", from: "them", text: "Did you see the new Vion update?", time: "16:52" },
      { id: "m2", from: "me", text: "Not yet — what changed?", time: "16:55", read: true },
      { id: "m3", from: "them", text: "Sounds perfect! I've been wanting to try it.", time: "16:58" },
    ],
  },
  {
    id: "c3",
    person: PEOPLE[2],
    unread: 0,
    messages: [
      { id: "m1", from: "me", text: "Dinner this weekend?", time: "Yesterday", read: true },
      { id: "m2", from: "them", text: "How about 7 PM at the new Italian place?", time: "Yesterday" },
    ],
  },
  {
    id: "c4",
    person: PEOPLE[3],
    unread: 0,
    messages: [
      { id: "m1", from: "them", text: "Standup moved to 10.", time: "13 days" },
      { id: "m2", from: "me", text: "What time should we meet?", time: "13 days", read: true },
    ],
  },
  {
    id: "c5",
    person: PEOPLE[4],
    unread: 0,
    messages: [
      { id: "m1", from: "me", text: "Running 5 min late!", time: "2 days", read: true },
      { id: "m2", from: "them", text: "No worries at all! I'll grab a table and wait.", time: "2 days" },
    ],
  },
  {
    id: "c6",
    person: PEOPLE[5],
    unread: 0,
    messages: [
      { id: "m1", from: "them", text: "She just told me today.", time: "Yesterday" },
    ],
  },
  {
    id: "c7",
    person: PEOPLE[6],
    unread: 0,
    messages: [
      { id: "m1", from: "them", text: "Sent the files over 👍", time: "1 day" },
    ],
  },
];

export const POSTS: Post[] = [
  {
    id: "t1",
    author: PEOPLE[7],
    time: "2h",
    text: "Shipping Vion this week — a messenger that feels like X and Telegram had a very tidy baby. Threads on the left, DMs on the right, and it's fast. 🚀",
    replies: 42,
    reposts: 128,
    likes: 964,
    liked: true,
  },
  {
    id: "t2",
    author: PEOPLE[0],
    time: "4h",
    text: "Some shots from my last few trips. The mountains never disappoint.",
    images: [photo(1018, 800, 500), photo(1015, 800, 500)],
    replies: 18,
    reposts: 33,
    likes: 421,
  },
  {
    id: "t3",
    author: PEOPLE[1],
    time: "6h",
    text: "Hot take: a good empty state is worth ten onboarding tooltips.",
    replies: 76,
    reposts: 54,
    likes: 610,
  },
  {
    id: "t4",
    author: PEOPLE[5],
    time: "9h",
    text: "Light grey is the new dark mode. Fight me. 🩶",
    replies: 210,
    reposts: 88,
    likes: 1503,
    liked: true,
  },
  {
    id: "t5",
    author: PEOPLE[3],
    time: "12h",
    text: "Reminder that the best feature you can ship is a fast one.",
    replies: 12,
    reposts: 40,
    likes: 288,
  },
];

export const NOTIFICATIONS: AppNotification[] = [
  { id: "n1", kind: "like", actor: PEOPLE[0], text: "liked your post", time: "2m", unread: true },
  { id: "n2", kind: "follow", actor: PEOPLE[1], text: "started following you", time: "18m", unread: true },
  { id: "n3", kind: "reply", actor: PEOPLE[3], text: "replied: “this is exactly what I needed 🙌”", time: "1h", unread: true },
  { id: "n4", kind: "repost", actor: PEOPLE[5], text: "reposted your post", time: "3h" },
  { id: "n5", kind: "mention", actor: PEOPLE[7], text: "mentioned you in a thread", time: "5h" },
  { id: "n6", kind: "like", actor: PEOPLE[4], text: "and 87 others liked your reply", time: "1d" },
  { id: "n7", kind: "follow", actor: PEOPLE[6], text: "started following you", time: "2d" },
];
