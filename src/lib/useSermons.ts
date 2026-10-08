import { useEffect, useState } from "react";
import { loadSermons } from "./sermons";
import type { Sermon } from "../types/sermon";

export type SermonsState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; sermons: Sermon[] };

/**
 * Load the sermon index.
 *
 * `loadSermons` memoises the request at module level, so navigating between
 * pages re-renders from the cache instead of re-fetching 72KB each time.
 */
export function useSermons(): SermonsState {
  const [state, setState] = useState<SermonsState>({ status: "loading" });

  useEffect(() => {
    let active = true;

    loadSermons().then(
      (sermons) => {
        if (active) setState({ status: "ready", sermons });
      },
      (error: unknown) => {
        if (!active) return;
        console.error("Could not load sermons:", error);
        setState({
          status: "error",
          message: "We couldn't load the messages. Please check your connection and try again.",
        });
      },
    );

    return () => {
      active = false;
    };
  }, []);

  return state;
}
