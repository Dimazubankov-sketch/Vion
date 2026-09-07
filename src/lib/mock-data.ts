/** Static demo content for the Vion prototype (no backend). */

export interface Person {
  id: string;
  name: string;
  handle: string;
  avatar: string;
  online?: boolean;
}

/** A non-image attachment (pdf, zip, doc…). */
export interface FileAttachment {
  name: string;
  size: string;
  /** Object URL when the file was picked in this session. */
  url?: string;
}

/** A recorded voice message. */
export interface AudioAttachment {
  url: string;
  /** Seconds. */
  duration: number;
  /** Normalised 0..1 amplitudes captured while recording, for the waveform. */
  peaks: number[];
}

export interface ChatMessage {
  id: string;
  from: "me" | "them";
  /** Who sent it — group chats show the sender above the bubble. */
  authorId?: string;
  text?: string;
  images?: string[];
  file?: FileAttachment;
  audio?: AudioAttachment;
  time: string;
  read?: boolean;
}

export interface Chat {
  id: string;
  kind: "direct" | "group";
  /** Direct chats only. */
  person?: Person;
  /** Group chats only. */
  name?: string;
  members?: Person[];
  avatar?: string;
  messages: ChatMessage[];
  unread: number;
}

export interface PostComment {
  id: string;
  author: Person;
  text: string;
  time: string;
}

export interface Post {
  id: string;
  author: Person;
  /** Human date line, e.g. "Thursday, Jun 12, 5:50 PM". */
  time: string;
  /** Optional "is at <location>" line. */
  location?: string;
  text: string;
  images?: string[];
  likes: number;
  likers: Person[];
  comments: PostComment[];
  shares: number;
  views: number;
  liked?: boolean;
  /** Reposted by the signed-in user — drives the profile's Reposts tab. */
  reposted?: boolean;
  /** Authored by the signed-in user — drives the profile's Posts tab. */
  mine?: boolean;
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
  { id: "p8", name: "Ray Hammond", handle: "rayh", avatar: avatar(68), online: true },
];

export const CHATS: Chat[] = [
  {
    id: "c1",
    kind: "direct",
    person: PEOPLE[0],
    unread: 1,
    messages: [
      {
        id: "m1",
        from: "them",
        images: [photo(1018), photo(1015), photo(1016), photo(1019)],
        time: "17:23",
      },
      {
        id: "m2",
        from: "me",
        text: "Some shots from my last few trips. Saturday can't come soon enough!",
        time: "17:23",
        read: true,
      },
      { id: "m3", from: "them", text: "Great! Looking forward to it. See you later!", time: "17:23" },
    ],
  },
  {
    id: "g1",
    kind: "group",
    name: "Vion Design Team",
    members: [PEOPLE[1], PEOPLE[3], PEOPLE[5], PEOPLE[7]],
    unread: 3,
    messages: [
      { id: "m1", from: "them", authorId: "p2", text: "Pushed the new light-grey palette to main 🎨", time: "14:02" },
      {
        id: "m2",
        from: "them",
        authorId: "p6",
        text: "Looks so much cleaner. Can we bump the accent a touch?",
        time: "14:06",
      },
      { id: "m3", from: "me", text: "Agreed — I'll take a pass this evening.", time: "14:09", read: true },
      {
        id: "m4",
        from: "them",
        authorId: "p8",
        file: { name: "vion-tokens-v3.pdf", size: "2.4 MB" },
        time: "14:15",
      },
    ],
  },
  {
    id: "c2",
    kind: "direct",
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
    kind: "direct",
    person: PEOPLE[2],
    unread: 0,
    messages: [
      { id: "m1", from: "me", text: "Dinner this weekend?", time: "Yesterday", read: true },
      { id: "m2", from: "them", text: "How about 7 PM at the new Italian place?", time: "Yesterday" },
    ],
  },
  {
    id: "g2",
    kind: "group",
    name: "Weekend Trip 🏔️",
    members: [PEOPLE[0], PEOPLE[2], PEOPLE[4]],
    unread: 0,
    messages: [
      { id: "m1", from: "them", authorId: "p1", text: "Booked the cabin! Two nights.", time: "2 days" },
      { id: "m2", from: "me", text: "Amazing. I'll bring the coffee setup ☕", time: "2 days", read: true },
    ],
  },
  {
    id: "c4",
    kind: "direct",
    person: PEOPLE[3],
    unread: 0,
    messages: [
      { id: "m1", from: "them", text: "Standup moved to 10.", time: "13 days" },
      { id: "m2", from: "me", text: "What time should we meet?", time: "13 days", read: true },
    ],
  },
  {
    id: "c5",
    kind: "direct",
    person: PEOPLE[4],
    unread: 0,
    messages: [
      { id: "m1", from: "me", text: "Running 5 min late!", time: "2 days", read: true },
      { id: "m2", from: "them", text: "No worries at all! I'll grab a table and wait.", time: "2 days" },
    ],
  },
  {
    id: "c6",
    kind: "direct",
    person: PEOPLE[5],
    unread: 0,
    messages: [{ id: "m1", from: "them", text: "She just told me today.", time: "Yesterday" }],
  },
  {
    id: "c7",
    kind: "direct",
    person: PEOPLE[6],
    unread: 0,
    messages: [{ id: "m1", from: "them", text: "Sent the files over 👍", time: "1 day" }],
  },
];

/** Title / avatar / subtitle helpers so screens don't branch on `kind` everywhere. */
export const chatTitle = (c: Chat) => (c.kind === "group" ? c.name! : c.person!.name);
export const chatAvatar = (c: Chat) => (c.kind === "group" ? c.avatar : c.person!.avatar);
export const chatOnline = (c: Chat) => (c.kind === "group" ? undefined : c.person!.online);
export const chatSubtitle = (c: Chat) =>
  c.kind === "group"
    ? `${(c.members?.length ?? 0) + 1} members`
    : c.person!.online
      ? "Online"
      : "last seen recently";

export const POSTS: Post[] = [
  {
    id: "t1",
    author: PEOPLE[7],
    location: "New-York",
    time: "Thursday, Jun 12, 5:50 PM",
    text: "I'm so glad to share with you guys some photos from my recent trip to the New-York. This city looks amazing, the buildings, nature, people all are beautiful, i highly recommend to visit this cool place! Also i would like to know what is your favorite place here or what you would like to visit? 🥰",
    images: [photo(1071, 800, 700), photo(1076, 800, 700)],
    likes: 245,
    likers: [PEOPLE[0], PEOPLE[5], PEOPLE[2], PEOPLE[1]],
    shares: 0,
    views: 12400,
    comments: [
      { id: "cm1", author: PEOPLE[5], text: "Central Park at sunrise — nothing beats it.", time: "2h" },
      { id: "cm2", author: PEOPLE[1], text: "The skyline shot is unreal 🔥", time: "1h" },
    ],
  },
  {
    id: "t2",
    author: PEOPLE[0],
    location: "Dolomites",
    time: "Wednesday, Jun 11, 9:14 AM",
    text: "Some shots from my last few trips. The mountains never disappoint.",
    images: [photo(1018, 800, 700), photo(1015, 800, 700)],
    likes: 421,
    likers: [PEOPLE[7], PEOPLE[3], PEOPLE[6]],
    shares: 12,
    views: 30200,
    comments: [{ id: "cm1", author: PEOPLE[3], text: "Where is the second one taken?", time: "5h" }],
  },
  {
    id: "t3",
    author: PEOPLE[1],
    time: "Wednesday, Jun 11, 8:02 AM",
    text: "Hot take: a good empty state is worth ten onboarding tooltips.",
    likes: 610,
    likers: [PEOPLE[4], PEOPLE[5]],
    shares: 54,
    views: 88100,
    comments: [],
    liked: true,
    reposted: true,
  },
  {
    id: "t4",
    author: PEOPLE[5],
    time: "Tuesday, Jun 10, 7:30 PM",
    text: "Light grey is the new dark mode. Fight me. 🩶",
    likes: 1503,
    likers: [PEOPLE[0], PEOPLE[1], PEOPLE[2], PEOPLE[7]],
    shares: 88,
    views: 154000,
    comments: [
      { id: "cm1", author: PEOPLE[7], text: "Genuinely agree.", time: "12h" },
      { id: "cm2", author: PEOPLE[2], text: "My eyes at 2am disagree 😅", time: "10h" },
    ],
  },
  {
    id: "t5",
    author: PEOPLE[3],
    time: "Tuesday, Jun 10, 11:11 AM",
    text: "Reminder that the best feature you can ship is a fast one.",
    likes: 288,
    likers: [PEOPLE[6]],
    shares: 40,
    views: 21700,
    comments: [],
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
