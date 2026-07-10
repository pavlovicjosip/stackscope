import { describe, expect, it } from "vitest";
import { initialPlaybackState, parsePlaybackParams, playbackReducer, toPlaybackParams } from "./playback";

describe("playbackReducer", () => {
  it("plays, advances, completes, and never exceeds the final step", () => {
    let state = playbackReducer(initialPlaybackState, { type: "PLAY" });
    expect(state.status).toBe("playing");
    state = playbackReducer(state, { type: "NEXT", total: 2 });
    expect(state).toMatchObject({ stepIndex: 1, status: "complete" });
    expect(playbackReducer(state, { type: "NEXT", total: 2 }).stepIndex).toBe(1);
  });

  it("clamps restored state and preserves a chosen depth on reset", () => {
    const restored = playbackReducer(initialPlaybackState, {
      type: "RESTORE",
      total: 3,
      state: { stepIndex: 99, depth: "production", selectedId: "api" },
    });
    expect(restored).toMatchObject({ stepIndex: 2, depth: "production", selectedId: "api", status: "paused" });
    expect(playbackReducer(restored, { type: "RESET" })).toMatchObject({ stepIndex: 0, depth: "production" });
  });

  it("round-trips valid public URL state and repairs invalid state", () => {
    const params = toPlaybackParams({ stepIndex: 2, depth: "engineering", selectedId: "cache", status: "paused" });
    expect(parsePlaybackParams(params, 5, new Set(["cache"]))).toMatchObject({ stepIndex: 2, depth: "engineering", selectedId: "cache" });
    expect(parsePlaybackParams(new URLSearchParams("step=999&depth=unknown"), 4)).toMatchObject({ stepIndex: 3, depth: "plain" });
    expect(parsePlaybackParams(new URLSearchParams("selected=missing"), 4, new Set(["api"])).selectedId).toBeNull();
  });
});
