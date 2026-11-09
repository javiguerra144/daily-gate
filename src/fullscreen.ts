export function enterFullscreen(): void {
  if (!document.fullscreenElement) void document.documentElement.requestFullscreen?.().catch(() => {});
}

export function toggleFullscreen(): void {
  if (document.fullscreenElement) void document.exitFullscreen().catch(() => {});
  else enterFullscreen();
}
