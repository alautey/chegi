// No privileged APIs are exposed yet — the renderer runs the game engine,
// AI, and (later) the multiplayer WebSocket client directly, since none of
// that needs OS-level access. Reserved for future use (e.g. native file
// dialogs) so the renderer stays context-isolated from Node.
