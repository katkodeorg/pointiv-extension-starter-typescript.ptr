import {
  Output,
  googleCalendar,
  googleGmail,
  http,
  log,
  readInput,
  storage,
  tile,
  writeOutput,
  writeTileOutput,
  type ExtensionOutput,
  type Input,
  type TileNode,
} from "@katkode/pointiv-extension-sdk";

/** One todo item, stored under the "todos" storage key as a JSON array. */
interface Todo {
  text: string;
  done: boolean;
}

export function execute() {
  const input = readInput();
  const cmd = input.command.trim().toLowerCase();

  if (cmd === "todo" || cmd.startsWith("todo ")) {
    // Tile actions land here too: clicking "Done" on a tile row runs
    // `todo done <n>` through this same execute function.
    writeOutput(todoCommand(input.command.trim()));
    return;
  }
  if (cmd === "http") {
    writeOutput(demoHttp());
    return;
  }
  if (cmd === "calendar" || cmd === "cal") {
    writeOutput(demoCalendar(input));
    return;
  }
  if (cmd.startsWith("gmail") || cmd === "email") {
    writeOutput(demoGmail(input));
    return;
  }

  const count = Number.parseInt(storage.read("run_count") ?? "0", 10) + 1;
  storage.write("run_count", String(count));

  log.info(
    `execute: count=${count}, text_len=${input.text.length}, cmd=${input.command}`,
  );

  const name = input.text.trim();
  const greeting = name.length === 0 ? "Hello, World!" : `Hello, ${name}!`;

  writeOutput(
    Output.text(
      `${greeting}\n\nRun #${count}. Commands: todo add <text>, http, calendar, gmail to@example.com`,
    ),
  );
}

function demoHttp() {
  const resp = http.get("https://httpbin.org/get");
  if (resp.status === 403) {
    return Output.error(
      'network permission not granted. Add "network" to pointiv-extension.json.',
    );
  }
  if (resp.status === 0) {
    return Output.error("HTTP request failed (host returned no response).");
  }
  const preview = resp.body.slice(0, 400);
  return Output.text(`HTTP ${resp.status}\n\n${preview}`);
}

function demoCalendar(input: Input) {
  const text = input.text.trim();
  let title = "Pointiv test event";
  let date = "2026-12-01";

  if (text.length === 10 && text[4] === "-") {
    date = text;
  } else if (text.length > 0) {
    title = text;
  }

  try {
    const result = googleCalendar.schedule(
      title,
      date,
      "15:00",
      "15:30",
      "Created by the Hello World example extension",
    );
    return Output.text(`Calendar event created.\n\n${JSON.stringify(result)}`);
  } catch (error) {
    return Output.error(`Calendar failed: ${String(error)}`);
  }
}

function demoGmail(input: Input) {
  const parts = input.command.split(/\s+/);
  const to = (parts[1] ?? "").trim();
  if (to.length === 0 || !to.includes("@")) {
    return Output.error(
      "Usage: gmail you@example.com\nPut the email address in the command. Optional body in selected text.",
    );
  }

  const body =
    input.text.trim().length === 0
      ? "Sent from the Pointiv Hello World example extension."
      : input.text.trim();

  try {
    const result = googleGmail.send(to, "Hello from Pointiv", body);
    return Output.text(`Email sent to ${to}.\n\n${JSON.stringify(result)}`);
  } catch (error) {
    return Output.error(`Gmail failed: ${String(error)}`);
  }
}

// ── Todo list + tile ─────────────────────────────────────────────────────────
//
// The todo list demonstrates the tile feature end to end: `execute` mutates
// the list in extension storage, `render_tile` reads the same storage and
// returns a declarative TileUi for the host to draw.

function loadTodos(): Todo[] {
  return storage.readJson<Todo[]>("todos") ?? [];
}

function saveTodos(todos: Todo[]): void {
  storage.writeJson("todos", todos);
}

/** Handle `todo add <text>`, `todo done <n>`, `todo list`. */
function todoCommand(command: string): ExtensionOutput {
  const rest = command.replace(/^todo\s*/i, "");
  const spaceAt = rest.search(/\s/);
  const verb = spaceAt === -1 ? rest : rest.slice(0, spaceAt);
  const arg = spaceAt === -1 ? "" : rest.slice(spaceAt).trim();

  if (verb === "add" && arg.length > 0) {
    const todos = loadTodos();
    // Cap stored text so tile rows stay well under the host's 300-char
    // row limit.
    const text = arg.slice(0, 280);
    todos.push({ text, done: false });
    saveTodos(todos);
    return Output.text(`Added todo #${todos.length}: ${text}`);
  }

  if (verb === "done") {
    // Indices are 1-based positions in the stored array, the same numbering
    // `todo list` prints and the tile rows use.
    const todos = loadTodos();
    const n = Number.parseInt(arg, 10);
    if (!Number.isInteger(n) || n < 1 || n > todos.length) {
      if (todos.length === 0) {
        return Output.error("No todos yet. Add one with: todo add <text>");
      }
      return Output.error(`Usage: todo done <n> (1..${todos.length})`);
    }
    todos[n - 1].done = true;
    saveTodos(todos);
    return Output.text(`Done: ${todos[n - 1].text}`);
  }

  if (verb === "list" || verb === "") {
    const todos = loadTodos();
    if (todos.length === 0) {
      return Output.text("No todos yet. Add one with: todo add <text>");
    }
    const lines = todos.map(
      (t, i) => `${i + 1} ${t.done ? "[x]" : "[ ]"} ${t.text}`,
    );
    return Output.text(lines.join("\n"));
  }

  return Output.error("Usage: todo add <text> | todo done <n> | todo list");
}

/**
 * Render the "Todos" tile. The host calls this when the popup opens and again
 * after a tile action runs. Only storage host calls are available here, and
 * the render has a 3 second budget. Input is `{"now":"<RFC3339>"}` via
 * `readTileInput()` when you need the current time.
 */
export function render_tile() {
  const todos = loadTodos();
  const open = todos.filter((t) => !t.done).length;

  const body: TileNode[] = [
    // Badge first: open count in warn, or an ok "all done" badge.
    open > 0
      ? tile.badge(`${open} open`, "warn")
      : tile.badge("all done", "ok"),
  ];

  // Up to 5 not-done rows. Each row's action command carries the item's
  // 1-based index in the stored array, so `todo done <n>` hits the right
  // item even when done items sit between open ones.
  let shown = 0;
  for (let i = 0; i < todos.length && shown < 5; i++) {
    if (todos[i].done) continue;
    // The host rejects the whole tile if any row text exceeds 300 chars,
    // so truncate defensively (older stored todos may predate the add cap).
    const text =
      todos[i].text.length > 280
        ? `${todos[i].text.slice(0, 280)}…`
        : todos[i].text;
    body.push(
      tile.row(text, {
        actions: [tile.action("Done", `todo done ${i + 1}`)],
      }),
    );
    shown++;
  }

  writeTileOutput(
    tile.ui("Todos", body, {
      footer: [
        tile.action("Add", "todo add", "New todo"),
        tile.action("Refresh", "todo list"),
      ],
    }),
  );
}
