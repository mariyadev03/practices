/**
 * @author Junaid Atari <mj.atari@gmail.com>
 * @link https://github.com/blacksmoke26 Author Website
 * @since 2022-07-12
 */

import { Level } from 'pino';

export default interface ILoggerOptions {
  [field: string]: any;
  level?: Level,
}
