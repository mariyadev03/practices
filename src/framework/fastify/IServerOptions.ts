/**
 * @author Junaid Atari <mj.atari@gmail.com>
 * @link https://github.com/blacksmoke26 Author Website
 * @since 2022-07-12
 */

import { FastifyServerOptions } from 'fastify';

export default interface IServerOptions {
  [field: string]: any;
  serverOptions?: FastifyServerOptions;
}
