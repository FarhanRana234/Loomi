declare global {
  interface Window {
    YT: {
      Player: new (
        id: string | HTMLElement,
        config: {
          videoId?: string;
          width?: string | number;
          height?: string | number;
          playerVars?: Record<string, number | string>;
          events?: Record<string, (event: { target: SoundManagerPlayer }) => void>;
        }
      ) => SoundManagerPlayer;
    };
    onYouTubeIframeAPIReady: () => void;
  }

  class SoundManagerPlayer {
    playVideo(): void;
    pauseVideo(): void;
    mute(): void;
    unMute(): void;
    isMuted(): boolean;
    destroy(): void;
  }
}

let apiLoaded = false;
let apiLoading = false;

function loadYouTubeAPI(): Promise<void> {
  if (apiLoaded) return Promise.resolve();
  if (apiLoading) {
    return new Promise((resolve) => {
      const check = setInterval(() => {
        if (apiLoaded) { clearInterval(check); resolve(); }
      }, 100);
    });
  }

  apiLoading = true;
  return new Promise((resolve) => {
    if (typeof window === "undefined") { resolve(); return; }

    const tag = document.createElement("script");
    tag.src = "https://www.youtube.com/iframe_api";
    const firstScriptTag = document.getElementsByTagName("script")[0];
    firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);

    window.onYouTubeIframeAPIReady = () => {
      apiLoaded = true;
      resolve();
    };

    setTimeout(() => { apiLoaded = true; resolve(); }, 5000);
  });
}

class SoundManager {
  private players: Map<string, SoundManagerPlayer> = new Map();
  private containers: Map<string, HTMLDivElement> = new Map();
  private currentId: string | null = null;
  private onStateChange?: (id: string | null) => void;

  setOnStateChange(cb: (id: string | null) => void) {
    this.onStateChange = cb;
  }

  getCurrentId(): string | null {
    return this.currentId;
  }

  async load(trackId: string, container: HTMLDivElement): Promise<void> {
    if (this.players.has(trackId)) return;
    if (!container) return;

    this.containers.set(trackId, container);

    await loadYouTubeAPI();

    if (!window.YT || !window.YT.Player) return;

    const playerContainerId = `yt-sound-${trackId}-${Math.random().toString(36).slice(2, 8)}`;
    const div = document.createElement("div");
    div.id = playerContainerId;
    container.innerHTML = "";
    container.appendChild(div);

    try {
      const player = new window.YT.Player(playerContainerId, {
        videoId: trackId,
        width: 1,
        height: 1,
        playerVars: {
          autoplay: 0,
          controls: 0,
          disablekb: 1,
          fs: 0,
          iv_load_policy: 3,
          modestbranding: 1,
          rel: 0,
          showinfo: 0,
          loop: 1,
        },
      });
      this.players.set(trackId, player);
    } catch {
      // ignore
    }
  }

  unload(trackId: string) {
    const player = this.players.get(trackId);
    if (player) {
      try { player.destroy(); } catch {}
      this.players.delete(trackId);
      this.containers.delete(trackId);
    }
    if (this.currentId === trackId) {
      this.currentId = null;
      this.onStateChange?.(null);
    }
  }

  play(trackId: string) {
    // Stop the currently playing track first
    if (this.currentId && this.currentId !== trackId) {
      this.stop(this.currentId);
    }

    const player = this.players.get(trackId);
    if (!player) return;

    try {
      player.unMute();
      player.playVideo();
      this.currentId = trackId;
      this.onStateChange?.(trackId);
    } catch {}
  }

  stop(trackId: string) {
    const player = this.players.get(trackId);
    if (!player) return;

    try {
      player.pauseVideo();
      player.mute();
    } catch {}

    if (this.currentId === trackId) {
      this.currentId = null;
      this.onStateChange?.(null);
    }
  }

  toggle(trackId: string): boolean {
    if (this.currentId === trackId) {
      this.stop(trackId);
      return false;
    } else {
      this.play(trackId);
      return true;
    }
  }

  isPlaying(trackId: string): boolean {
    return this.currentId === trackId;
  }
}

export const soundManager = new SoundManager();
