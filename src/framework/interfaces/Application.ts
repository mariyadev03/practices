/**
 * @author Junaid Atari <mj.atari@gmail.com>
 * @link https://github.com/blacksmoke26 Author Website
 * @since 2022-07-11
 */

import { Configuration } from 'framework/base/CoreObject';

export type Bootstrap = Array<string | Function | Promise<any> | Configuration>;
