/**
 * Shared Socket.IO server instance.
 *
 * Extracted into its own module so services (auction.service, bid.service)
 * can import `io` without pulling in the entire server.ts bootstrap — which
 * would start an HTTP listener when imported by the worker or scheduler.
 *
 * Usage:
 *   - server.ts    → calls `initIO(httpServer)` once during startup, then
 *                    attaches the Redis adapter and registers socket handlers.
 *   - services     → import `{ io }` for event emission (io may be a no-op
 *                    stub when running in a worker context without socket clients).
 */
import { Server } from "socket.io";
import type { Server as HttpServer } from "http";

// The singleton io instance. Initialised by server.ts; null in worker/scheduler.
let _io: Server | null = null;

/**
 * Creates and stores the Socket.IO Server instance.
 * Must be called exactly once, in server.ts, before any route or service
 * code that emits events.
 */
export const initIO = (httpServer: HttpServer, options: ConstructorParameters<typeof Server>[1]): Server => {
  if (_io) return _io;
  _io = new Server(httpServer, options);
  return _io;
};

/**
 * Returns the Socket.IO instance.
 *
 * In the API process this is the fully initialised Server.
 * In the worker / scheduler process this is a lightweight no-op proxy
 * so calls like `io.to(room).emit(...)` are silently ignored rather
 * than throwing — the Redis adapter on the API instances delivers the
 * events to connected clients.
 */
export const io: Pick<Server, "to" | "emit" | "in"> = new Proxy({} as Server, {
  get(_target, prop) {
    if (_io) return (_io as any)[prop];

    // Return a chainable no-op so .to(room).emit() doesn't throw in worker context
    const noop: any = () => noop;
    noop.emit = () => false;
    return noop;
  },
});
