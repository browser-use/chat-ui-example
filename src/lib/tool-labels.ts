import type { ToolCallType, ToolStatus } from "./types";

// Map raw tool names → canonical type
const TYPE_MAP: Record<string, ToolCallType> = {
  bash: "bash", bash_output: "bash", shell: "bash", execute_command: "bash",
  read: "read_file", read_file: "read_file",
  write: "create_file", create_file: "create_file",
  edit: "edit_file", multi_edit: "edit_file", edit_file: "edit_file",
  browser_navigate: "browse", go_to_url: "browse", navigate: "browse",
  browser_click: "click", click_element: "click", click: "click",
  browser_type: "type", type_text: "type", input_text: "type",
  browser_scroll: "scroll", scroll: "scroll",
  web_search: "search", browser_search: "search", search: "search",
  browser_wait: "wait", wait: "wait", sleep: "wait",
  screenshot: "screenshot", take_screenshot: "screenshot", browser_screenshot: "screenshot",
  browser_analyze_state: "screenshot",
  glob: "glob", grep: "grep",
};

const LABELS: Record<string, [string, string]> = {
  browse:      ["Navigating", "Navigated"],
  click:       ["Clicking", "Clicked"],
  type:        ["Typing", "Typed"],
  scroll:      ["Scrolling", "Scrolled"],
  search:      ["Searching", "Searched"],
  wait:        ["Waiting", "Waited"],
  screenshot:  ["Taking screenshot", "Took screenshot"],
  read_file:   ["Reading file", "Read file"],
  create_file: ["Creating file", "Created file"],
  edit_file:   ["Editing file", "Edited file"],
  bash:        ["Running command", "Ran command"],
  glob:        ["Finding files", "Found files"],
  grep:        ["Searching code", "Searched code"],
  integration: ["Running integration", "Ran integration"],
  unknown:     ["Running", "Ran"],
};

export function getToolType(name: string | undefined): ToolCallType {
  if (!name) return "unknown";
  return TYPE_MAP[name] ?? "unknown";
}

export function getToolLabel(name: string | undefined, status: ToolStatus = "pending"): string {
  const type = getToolType(name);
  const pair = LABELS[type] ?? LABELS.unknown;
  return status === "completed" || status === "error" ? pair[1] : pair[0];
}

export function getToolDisplayValue(name: string | undefined, args?: Record<string, unknown>): string {
  if (!name || !args) return "";
  const type = getToolType(name);
  switch (type) {
    case "browse":
      return truncate(String(args.url ?? ""), 60);
    case "search":
      return truncate(String(args.query ?? ""), 60);
    case "read_file":
    case "create_file":
    case "edit_file":
      return truncate(String(args.file_path ?? args.path ?? args.filename ?? ""), 60);
    case "bash":
      return truncate(String(args.command ?? args.cmd ?? ""), 50);
    case "glob":
    case "grep":
      return truncate(String(args.pattern ?? ""), 50);
    case "type":
      return truncate(String(args.text ?? ""), 40);
    default:
      return "";
  }
}

// Hidden internal tools that shouldn't render
const HIDDEN_TOOLS = new Set(["browser_state", "done_autonomous", "todo_write"]);
export function isHiddenTool(name: string): boolean {
  return HIDDEN_TOOLS.has(name);
}

function truncate(s: string, max: number): string {
  return s.length > max ? s.slice(0, max) + "…" : s;
}
