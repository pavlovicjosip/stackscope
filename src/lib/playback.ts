import type { DetailDepth } from "@/content/types";

export type PlaybackStatus = "idle" | "playing" | "paused" | "complete";

export type PlaybackState = {
  stepIndex: number;
  status: PlaybackStatus;
  selectedId: string | null;
  depth: DetailDepth;
};

export type PlaybackEvent =
  | { type: "PLAY" }
  | { type: "PAUSE" }
  | { type: "NEXT"; total: number }
  | { type: "PREVIOUS" }
  | { type: "RESET" }
  | { type: "SELECT"; id: string | null }
  | { type: "SET_DEPTH"; depth: DetailDepth }
  | { type: "RESTORE"; state: Partial<PlaybackState>; total: number };

export const initialPlaybackState: PlaybackState = {
  stepIndex: 0,
  status: "idle",
  selectedId: null,
  depth: "plain",
};

export function playbackReducer(state: PlaybackState, event: PlaybackEvent): PlaybackState {
  switch (event.type) {
    case "PLAY":
      return { ...state, status: state.status === "complete" ? "complete" : "playing" };
    case "PAUSE":
      return { ...state, status: state.status === "complete" ? "complete" : "paused" };
    case "NEXT": {
      const finalIndex = Math.max(0, event.total - 1);
      if (state.stepIndex >= finalIndex) return { ...state, stepIndex: finalIndex, status: "complete" };
      const stepIndex = state.stepIndex + 1;
      return { ...state, stepIndex, status: stepIndex === finalIndex ? "complete" : state.status };
    }
    case "PREVIOUS":
      return { ...state, stepIndex: Math.max(0, state.stepIndex - 1), status: "paused" };
    case "RESET":
      return { ...initialPlaybackState, depth: state.depth };
    case "SELECT":
      return { ...state, selectedId: event.id, status: state.status === "playing" ? "paused" : state.status };
    case "SET_DEPTH":
      return { ...state, depth: event.depth };
    case "RESTORE": {
      const stepIndex = Math.min(Math.max(0, event.state.stepIndex ?? 0), Math.max(0, event.total - 1));
      return {
        ...initialPlaybackState,
        ...event.state,
        stepIndex,
        status: "paused",
      };
    }
  }
}

export function parsePlaybackParams(
  params: URLSearchParams,
  total: number,
  validSelectedIds?: ReadonlySet<string>,
): Partial<PlaybackState> {
  const rawStep = Number.parseInt(params.get("step") ?? "1", 10);
  const depth = params.get("depth");
  return {
    stepIndex: Number.isFinite(rawStep) ? Math.min(Math.max(rawStep - 1, 0), Math.max(total - 1, 0)) : 0,
    selectedId: validSelectedIds?.has(params.get("selected") ?? "") ? params.get("selected") : null,
    depth: depth === "engineering" || depth === "production" ? depth : "plain",
  };
}

export function toPlaybackParams(state: PlaybackState): URLSearchParams {
  const params = new URLSearchParams();
  params.set("step", String(state.stepIndex + 1));
  if (state.selectedId) params.set("selected", state.selectedId);
  if (state.depth !== "plain") params.set("depth", state.depth);
  return params;
}
