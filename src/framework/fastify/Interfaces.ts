import {  } from 'fastify'

export interface ServerListenOptions {
  /**
   * Default to `0` (picks the first available open port).
   */
  port?: number;
  /**
   * Default to `localhost`.
   */
  host?: string;
  /**
   * Will be ignored if `port` is specified.
   * @see [Identifying paths for IPC connections](https://nodejs.org/api/net.html#identifying-paths-for-ipc-connections).
   */
  path?: string;
  /**
   * Specify the maximum length of the queue of pending connections.
   * The actual length will be determined by the OS through sysctl settings such as `tcp_max_syn_backlog` and `somaxconn` on Linux.
   * Default to `511`.
   */
  backlog?: number;
  /**
   * Default to `false`.
   */
  exclusive?: boolean;
  /**
   * For IPC servers makes the pipe readable for all users.
   * Default to `false`.
   */
  readableAll?: boolean;
  /**
   * For IPC servers makes the pipe writable for all users.
   * Default to `false`.
   */
  writableAll?: boolean;
  /**
   * For TCP servers, setting `ipv6Only` to `true` will disable dual-stack support, i.e., binding to host `::` won't make `0.0.0.0` be bound.
   * Default to `false`.
   */
  ipv6Only?: boolean;
  /**
   * An AbortSignal that may be used to close a listening server.
   * @since This option is available only in Node.js v15.6.0 and greater
   */
  signal?: AbortSignal;
}
