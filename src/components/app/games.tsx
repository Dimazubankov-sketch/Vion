"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useT } from "@/lib/settings-context";
import { cx } from "@/utils/cx";

/** Shared score strip shown above every board. */
function ScoreBar({
  you,
  them,
  themName,
  caption,
}: {
  you: number;
  them: number;
  themName: string;
  caption?: string;
}) {
  const t = useT();
  return (
    <div className="mb-4 flex items-center justify-center gap-4 text-sm">
      <span className="font-semibold text-accent">
        {t("you")} {you}
      </span>
      <span className="text-faint">·</span>
      <span className="font-semibold text-ink">
        {them} {themName}
      </span>
      {caption && <span className="ml-2 text-muted">{caption}</span>}
    </div>
  );
}

function PlayAgain({ onClick }: { onClick: () => void }) {
  const t = useT();
  return (
    <button
      onClick={onClick}
      className="mt-4 rounded-xl bg-accent px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-accent-strong"
    >
      {t("playAgain")}
    </button>
  );
}

function Verdict({ state }: { state: "win" | "lose" | "draw" }) {
  const t = useT();
  return (
    <p
      className={cx(
        "text-lg font-bold",
        state === "win" ? "text-online" : state === "lose" ? "text-danger" : "text-muted",
      )}
    >
      {state === "win" ? t("youWin") : state === "lose" ? t("youLose") : t("draw")}
    </p>
  );
}

/* -------------------------------------------------------------------------- */
/* Rock–Paper–Scissors                                                        */
/* -------------------------------------------------------------------------- */

const RPS = [
  { key: "rock", emoji: "✊" },
  { key: "paper", emoji: "✋" },
  { key: "scissors", emoji: "✌️" },
] as const;
type RpsKey = (typeof RPS)[number]["key"];

/** 1 = left beats right, -1 = right wins, 0 = tie. */
function rpsResult(a: RpsKey, b: RpsKey) {
  if (a === b) return 0;
  const beats: Record<RpsKey, RpsKey> = { rock: "scissors", paper: "rock", scissors: "paper" };
  return beats[a] === b ? 1 : -1;
}

export function RockPaperScissors({ themName }: { themName: string }) {
  const t = useT();
  const [you, setYou] = useState(0);
  const [them, setThem] = useState(0);
  const [pick, setPick] = useState<RpsKey | null>(null);
  const [theirPick, setTheirPick] = useState<RpsKey | null>(null);
  const [revealing, setRevealing] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  const over = you === 3 || them === 3;

  const play = (choice: RpsKey) => {
    if (revealing || over) return;
    setPick(choice);
    setTheirPick(null);
    setRevealing(true);
    timer.current = setTimeout(() => {
      const theirs = RPS[Math.floor(Math.random() * RPS.length)].key;
      setTheirPick(theirs);
      const r = rpsResult(choice, theirs);
      if (r === 1) setYou((v) => v + 1);
      if (r === -1) setThem((v) => v + 1);
      setRevealing(false);
    }, 800);
  };

  const reset = () => {
    setYou(0);
    setThem(0);
    setPick(null);
    setTheirPick(null);
  };

  const round = you + them + 1;
  const last = pick && theirPick ? rpsResult(pick, theirPick) : null;

  return (
    <div className="flex flex-col items-center">
      <ScoreBar
        you={you}
        them={them}
        themName={themName}
        caption={over ? undefined : `${t("round")} ${Math.min(round, 5)}`}
      />

      {/* Reveal area */}
      <div className="mb-5 flex items-center justify-center gap-8">
        <span
          className={cx(
            "text-5xl transition-transform duration-300",
            revealing && "translate-x-2 animate-pulse",
          )}
        >
          {pick ? RPS.find((r) => r.key === pick)!.emoji : "❔"}
        </span>
        <span className="text-sm font-semibold text-faint">VS</span>
        <span
          className={cx(
            "text-5xl transition-transform duration-300",
            revealing && "-translate-x-2 animate-pulse",
          )}
        >
          {theirPick ? RPS.find((r) => r.key === theirPick)!.emoji : "❔"}
        </span>
      </div>

      {over ? (
        <>
          <Verdict state={you === 3 ? "win" : "lose"} />
          <PlayAgain onClick={reset} />
        </>
      ) : (
        <>
          {last !== null && !revealing && (
            <p className="mb-3 text-sm font-medium text-muted">
              {last === 1 ? t("youWin") : last === -1 ? t("youLose") : t("draw")}
            </p>
          )}
          <div className="flex gap-3">
            {RPS.map((r) => (
              <button
                key={r.key}
                onClick={() => play(r.key)}
                disabled={revealing}
                aria-label={r.key}
                className={cx(
                  "flex size-16 items-center justify-center rounded-2xl border border-line bg-surface-2 text-3xl transition",
                  "hover:border-accent hover:bg-accent-soft active:scale-95 disabled:opacity-50",
                  pick === r.key && "border-accent bg-accent-soft",
                )}
              >
                {r.emoji}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Tic-Tac-Toe                                                                */
/* -------------------------------------------------------------------------- */

type Cell = "X" | "O" | null;
const LINES = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6],
];

function winnerOf(board: Cell[]): { player: Cell; line: number[] } | null {
  for (const line of LINES) {
    const [a, b, c] = line;
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return { player: board[a], line };
    }
  }
  return null;
}

/** Win if possible, else block, else centre, else a corner, else anything. */
function botMove(board: Cell[]): number {
  const empty = board.map((c, i) => (c ? -1 : i)).filter((i) => i >= 0);
  for (const player of ["O", "X"] as const) {
    for (const i of empty) {
      const copy = [...board];
      copy[i] = player;
      if (winnerOf(copy)?.player === player) return i;
    }
  }
  if (board[4] === null) return 4;
  const corners = [0, 2, 6, 8].filter((i) => board[i] === null);
  if (corners.length) return corners[Math.floor(Math.random() * corners.length)];
  return empty[Math.floor(Math.random() * empty.length)];
}

export function TicTacToe({ themName }: { themName: string }) {
  const t = useT();
  const [board, setBoard] = useState<Cell[]>(Array(9).fill(null));
  const [busy, setBusy] = useState(false);
  const [score, setScore] = useState({ you: 0, them: 0 });
  const scored = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  const result = winnerOf(board);
  const full = board.every(Boolean);
  const over = !!result || full;

  useEffect(() => {
    if (!over || scored.current) return;
    scored.current = true;
    if (result?.player === "X") setScore((s) => ({ ...s, you: s.you + 1 }));
    if (result?.player === "O") setScore((s) => ({ ...s, them: s.them + 1 }));
  }, [over, result]);

  const play = (i: number) => {
    if (board[i] || over || busy) return;
    const next = [...board];
    next[i] = "X";
    setBoard(next);

    if (winnerOf(next) || next.every(Boolean)) return;
    setBusy(true);
    timer.current = setTimeout(() => {
      setBoard((current) => {
        if (winnerOf(current) || current.every(Boolean)) return current;
        const copy = [...current];
        copy[botMove(copy)] = "O";
        return copy;
      });
      setBusy(false);
    }, 600);
  };

  const reset = () => {
    scored.current = false;
    setBoard(Array(9).fill(null));
    setBusy(false);
  };

  return (
    <div className="flex flex-col items-center">
      <ScoreBar
        you={score.you}
        them={score.them}
        themName={themName}
        caption={over ? undefined : busy ? t("theirTurn") : t("yourTurn")}
      />

      <div className="grid grid-cols-3 gap-2">
        {board.map((cell, i) => {
          const inWin = result?.line.includes(i);
          return (
            <button
              key={i}
              onClick={() => play(i)}
              disabled={!!cell || over || busy}
              aria-label={`cell ${i + 1}`}
              className={cx(
                "flex size-[68px] items-center justify-center rounded-2xl border text-3xl font-bold transition",
                inWin
                  ? "border-accent bg-accent text-white"
                  : "border-line bg-surface-2 hover:border-accent disabled:hover:border-line",
                !inWin && cell === "X" && "text-accent",
                !inWin && cell === "O" && "text-ink",
              )}
            >
              {cell}
            </button>
          );
        })}
      </div>

      {over && (
        <div className="mt-4 flex flex-col items-center">
          <Verdict state={result?.player === "X" ? "win" : result?.player === "O" ? "lose" : "draw"} />
          <PlayAgain onClick={reset} />
        </div>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Four in a Row                                                              */
/* -------------------------------------------------------------------------- */

const COLS = 7;
const ROWS = 6;
type Disc = "you" | "them" | null;

function fourWinner(grid: Disc[]): { player: Disc; cells: number[] } | null {
  const at = (r: number, c: number) => grid[r * COLS + c];
  const dirs = [
    [0, 1],
    [1, 0],
    [1, 1],
    [1, -1],
  ];
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const start = at(r, c);
      if (!start) continue;
      for (const [dr, dc] of dirs) {
        const cells = [r * COLS + c];
        for (let k = 1; k < 4; k++) {
          const nr = r + dr * k;
          const nc = c + dc * k;
          if (nr < 0 || nr >= ROWS || nc < 0 || nc >= COLS || at(nr, nc) !== start) break;
          cells.push(nr * COLS + nc);
        }
        if (cells.length === 4) return { player: start, cells };
      }
    }
  }
  return null;
}

function dropInto(grid: Disc[], col: number, player: Disc): Disc[] | null {
  for (let r = ROWS - 1; r >= 0; r--) {
    if (!grid[r * COLS + col]) {
      const next = [...grid];
      next[r * COLS + col] = player;
      return next;
    }
  }
  return null;
}

export function FourInARow({ themName }: { themName: string }) {
  const t = useT();
  const [grid, setGrid] = useState<Disc[]>(Array(ROWS * COLS).fill(null));
  const [busy, setBusy] = useState(false);
  const [score, setScore] = useState({ you: 0, them: 0 });
  const scored = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  const result = fourWinner(grid);
  const full = grid.every(Boolean);
  const over = !!result || full;

  useEffect(() => {
    if (!over || scored.current) return;
    scored.current = true;
    if (result?.player === "you") setScore((s) => ({ ...s, you: s.you + 1 }));
    if (result?.player === "them") setScore((s) => ({ ...s, them: s.them + 1 }));
  }, [over, result]);

  const pickColumn = useCallback((current: Disc[]) => {
    const valid = Array.from({ length: COLS }, (_, c) => c).filter((c) => !current[c]);
    // Take a win, then block one, then favour the middle.
    for (const player of ["them", "you"] as const) {
      for (const c of valid) {
        const next = dropInto(current, c, player);
        if (next && fourWinner(next)?.player === player) return c;
      }
    }
    const weighted = valid.sort((a, b) => Math.abs(3 - a) - Math.abs(3 - b));
    return weighted[Math.floor(Math.random() * Math.min(3, weighted.length))];
  }, []);

  const play = (col: number) => {
    if (over || busy) return;
    const next = dropInto(grid, col, "you");
    if (!next) return;
    setGrid(next);
    if (fourWinner(next) || next.every(Boolean)) return;

    setBusy(true);
    timer.current = setTimeout(() => {
      setGrid((current) => {
        if (fourWinner(current) || current.every(Boolean)) return current;
        const c = pickColumn(current);
        return dropInto(current, c, "them") ?? current;
      });
      setBusy(false);
    }, 650);
  };

  const reset = () => {
    scored.current = false;
    setGrid(Array(ROWS * COLS).fill(null));
    setBusy(false);
  };

  return (
    <div className="flex flex-col items-center">
      <ScoreBar
        you={score.you}
        them={score.them}
        themName={themName}
        caption={over ? undefined : busy ? t("theirTurn") : t("yourTurn")}
      />

      <div className="grid grid-cols-7 gap-1 rounded-2xl bg-surface-2 p-2">
        {grid.map((disc, i) => {
          const col = i % COLS;
          const inWin = result?.cells.includes(i);
          return (
            <button
              key={i}
              onClick={() => play(col)}
              disabled={over || busy}
              aria-label={`column ${col + 1}`}
              className="flex size-8 items-center justify-center rounded-full bg-surface transition hover:bg-surface-3 disabled:hover:bg-surface"
            >
              <span
                className={cx(
                  "size-6 rounded-full transition",
                  disc === "you" && "bg-accent",
                  disc === "them" && "bg-danger",
                  !disc && "bg-transparent",
                  inWin && "ring-2 ring-ink ring-offset-1 ring-offset-surface",
                )}
              />
            </button>
          );
        })}
      </div>

      {over && (
        <div className="mt-4 flex flex-col items-center">
          <Verdict
            state={result?.player === "you" ? "win" : result?.player === "them" ? "lose" : "draw"}
          />
          <PlayAgain onClick={reset} />
        </div>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* True or False                                                              */
/* -------------------------------------------------------------------------- */

const FACTS: { text: string; answer: boolean }[] = [
  { text: "Honey never spoils.", answer: true },
  { text: "Lightning never strikes the same place twice.", answer: false },
  { text: "Octopuses have three hearts.", answer: true },
  { text: "The Great Wall of China is visible from the Moon.", answer: false },
  { text: "Bananas are berries, botanically speaking.", answer: true },
  { text: "Humans only use 10% of their brains.", answer: false },
  { text: "A group of flamingos is called a flamboyance.", answer: true },
  { text: "Goldfish have a three-second memory.", answer: false },
  { text: "Venus is the hottest planet in our solar system.", answer: true },
  { text: "Sharks are mammals.", answer: false },
];

export function TrueOrFalse({ themName }: { themName: string }) {
  const t = useT();
  const [deck, setDeck] = useState(() => [...FACTS].sort(() => Math.random() - 0.5).slice(0, 5));
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<boolean | null>(null);
  const [you, setYou] = useState(0);
  const [them, setThem] = useState(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  const question = deck[index];
  const done = index >= deck.length;

  const answer = (value: boolean) => {
    if (picked !== null || done) return;
    setPicked(value);
    const right = value === question.answer;
    if (right) setYou((v) => v + 1);
    // The opponent answers too, and is right about 60% of the time.
    if (Math.random() < 0.6) setThem((v) => v + 1);

    timer.current = setTimeout(() => {
      setPicked(null);
      setIndex((i) => i + 1);
    }, 1100);
  };

  const reset = () => {
    setDeck([...FACTS].sort(() => Math.random() - 0.5).slice(0, 5));
    setIndex(0);
    setPicked(null);
    setYou(0);
    setThem(0);
  };

  if (done) {
    return (
      <div className="flex flex-col items-center">
        <ScoreBar you={you} them={them} themName={themName} />
        <Verdict state={you > them ? "win" : you < them ? "lose" : "draw"} />
        <PlayAgain onClick={reset} />
      </div>
    );
  }

  const correct = picked !== null && picked === question.answer;

  return (
    <div className="flex w-full flex-col items-center">
      <ScoreBar
        you={you}
        them={them}
        themName={themName}
        caption={`${t("round")} ${index + 1}/${deck.length}`}
      />

      <p className="mb-5 max-w-xs text-center text-base font-medium text-ink">{question.text}</p>

      {picked !== null && (
        <p className={cx("mb-3 text-sm font-semibold", correct ? "text-online" : "text-danger")}>
          {correct ? t("correct") : t("wrong")}
        </p>
      )}

      <div className="flex gap-3">
        {[true, false].map((value) => (
          <button
            key={String(value)}
            onClick={() => answer(value)}
            disabled={picked !== null}
            className={cx(
              "rounded-xl border px-6 py-3 text-sm font-semibold transition disabled:opacity-60",
              picked === value
                ? value === question.answer
                  ? "border-online bg-online/15 text-online"
                  : "border-danger bg-danger/15 text-danger"
                : "border-line bg-surface-2 text-ink hover:border-accent hover:bg-accent-soft",
            )}
          >
            {value ? t("true_") : t("false_")}
          </button>
        ))}
      </div>
    </div>
  );
}
