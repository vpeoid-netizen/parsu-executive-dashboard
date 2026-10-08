"use client";

import { useEffect, useRef, useState } from "react";
import { Volume2, VolumeX } from "lucide-react";
import { cn } from "@/lib/utils";

const PLAYLIST_ID = "PLS846jDKD1qG8qhdxFnCK7CMbD07ME-D_";
const START_VIDEO_ID = "8-mFpTHcDZ8";
const VOLUME = 40;
const STORAGE_KEY = "parsu-site-music";
const ENDED = 0;
const PLAYING = 1;

type YtPlayer = {
  playVideo: () => void;
  pauseVideo: () => void;
  nextVideo: () => void;
  playVideoAt: (index: number) => void;
  mute: () => void;
  unMute: () => void;
  isMuted: () => boolean;
  setLoop: (loopPlaylists: boolean) => void;
  setVolume: (volume: number) => void;
  getPlayerState: () => number;
  destroy: () => void;
};

type YtNamespace = {
  Player: new (
    element: HTMLElement,
    options: {
      width?: number;
      height?: number;
      videoId?: string;
      host?: string;
      playerVars?: Record<string, string | number>;
      events?: {
        onReady?: (event: { target: YtPlayer }) => void;
        onStateChange?: (event: { data: number; target: YtPlayer }) => void;
        onError?: (event: { target: YtPlayer }) => void;
      };
    },
  ) => YtPlayer;
};

declare global {
  interface Window {
    YT?: YtNamespace;
    onYouTubeIframeAPIReady?: () => void;
  }
}

function loadYouTubeIframeAPI() {
  return new Promise<YtNamespace>((resolve, reject) => {
    if (window.YT?.Player) {
      resolve(window.YT);
      return;
    }

    const previous = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      previous?.();
      if (window.YT?.Player) resolve(window.YT);
      else reject(new Error("YouTube player unavailable"));
    };

    if (document.querySelector("script[data-parsu-youtube-api]")) return;

    const script = document.createElement("script");
    script.src = "https://www.youtube.com/iframe_api";
    script.async = true;
    script.dataset.parsuYoutubeApi = "true";
    script.onerror = () => reject(new Error("YouTube API failed to load"));
    document.head.appendChild(script);
  });
}

export function SiteMusic() {
  const hostRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<YtPlayer | null>(null);
  const pausedByUser = useRef(false);
  const [audible, setAudible] = useState(false);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    let cancelled = false;
    let player: YtPlayer | null = null;

    try {
      pausedByUser.current = sessionStorage.getItem(STORAGE_KEY) === "paused";
    } catch {
      pausedByUser.current = false;
    }

    const mount = document.createElement("div");
    host.appendChild(mount);

    const startAudible = (target: YtPlayer) => {
      if (pausedByUser.current) return;
      target.unMute();
      target.setVolume(VOLUME);
      target.playVideo();
      setAudible(true);
    };

    const unlock = (event: Event) => {
      const targetNode = event.target;
      if (targetNode instanceof Element && targetNode.closest("[data-site-music]")) return;
      const current = playerRef.current;
      if (!current) return;
      startAudible(current);
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
    };

    void loadYouTubeIframeAPI()
      .then((YT) => {
        if (cancelled) return;
        player = new YT.Player(mount, {
          width: 320,
          height: 180,
          videoId: START_VIDEO_ID,
          host: "https://www.youtube-nocookie.com",
          playerVars: {
            autoplay: 1,
            mute: 1,
            controls: 0,
            disablekb: 1,
            fs: 0,
            iv_load_policy: 3,
            modestbranding: 1,
            playsinline: 1,
            rel: 0,
            loop: 1,
            listType: "playlist",
            list: PLAYLIST_ID,
            origin: window.location.origin,
          },
          events: {
            onReady: (event) => {
              if (cancelled) return;
              playerRef.current = event.target;
              event.target.setLoop(true);
              event.target.setVolume(VOLUME);
              event.target.mute();
              if (!pausedByUser.current) event.target.playVideo();
            },
            onStateChange: (event) => {
              if (event.data === ENDED) {
                event.target.setLoop(true);
                event.target.playVideoAt(0);
                return;
              }
              if (event.data === PLAYING) {
                setAudible(!event.target.isMuted() && !pausedByUser.current);
              }
            },
            onError: (event) => {
              event.target.nextVideo();
            },
          },
        });
      })
      .catch(() => {
        /* Music control stays available; playback is skipped if YouTube is blocked. */
      });

    window.addEventListener("pointerdown", unlock);
    window.addEventListener("keydown", unlock);

    return () => {
      cancelled = true;
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
      playerRef.current = null;
      player?.destroy();
      mount.remove();
    };
  }, []);

  function toggle() {
    const player = playerRef.current;
    if (!player) return;

    if (!pausedByUser.current && player.getPlayerState() === PLAYING && !player.isMuted()) {
      pausedByUser.current = true;
      try {
        sessionStorage.setItem(STORAGE_KEY, "paused");
      } catch {
        /* ignore quota / private mode */
      }
      player.pauseVideo();
      setAudible(false);
      return;
    }

    pausedByUser.current = false;
    try {
      sessionStorage.setItem(STORAGE_KEY, "playing");
    } catch {
      /* ignore quota / private mode */
    }
    player.unMute();
    player.setVolume(VOLUME);
    player.setLoop(true);
    player.playVideo();
    setAudible(true);
  }

  return (
    <>
      <div
        ref={hostRef}
        aria-hidden="true"
        className="pointer-events-none fixed left-0 top-0 z-0 h-[180px] w-[320px] -translate-x-[85%] -translate-y-[85%] overflow-hidden opacity-[0.02]"
      />
      <button
        type="button"
        data-site-music
        onClick={toggle}
        aria-pressed={audible}
        aria-label={audible ? "Mute background music" : "Play background music"}
        className={cn(
          "fixed z-[58] inline-flex h-12 w-12 items-center justify-center rounded-full border border-gold bg-navy-950 text-white shadow-[0_8px_24px_rgba(7,31,70,0.28)] transition hover:bg-navy-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold",
          "bottom-[max(1rem,env(safe-area-inset-bottom))] left-[max(0.75rem,env(safe-area-inset-left))]",
        )}
      >
        {audible ? <Volume2 className="h-5 w-5" aria-hidden="true" /> : <VolumeX className="h-5 w-5" aria-hidden="true" />}
      </button>
    </>
  );
}
