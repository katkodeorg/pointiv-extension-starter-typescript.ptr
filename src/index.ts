import {
  Output,
  googleCalendar,
  googleGmail,
  http,
  log,
  readInput,
  storage,
  writeOutput,
  type Input,
} from "@katkode/pointiv-extension-sdk";

export function execute() {
  const input = readInput();
  const cmd = input.command.trim().toLowerCase();

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
      `${greeting}\n\nRun #${count}. Commands: http, calendar, gmail to@example.com`,
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
