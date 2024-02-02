/**
 * @author Junaid Atari <mj.atari@gmail.com>
 * @link https://github.com/blacksmoke26 Author Website
 * @since 2022-07-05
 */

import { is as R_is } from 'ramda';

/**
 * A decorator function for classes to attach read-only properties such as
 * `namespace` and `className`.
 * @param path - Namespace path with filename (e.g., framework/base/FileHelper)
 */
export default function namespace ( path = '' ): Function {
  return function decorator ( Class ) {
    return ( ...args ) => {
      const config = args[args.length - 1] || null;
      if ( R_is(Object, config) ) {
        args[args.length - 1] = {
          ...config,
          '-namespace': path,
          //'-className': `${path}/${Class.name}`,
        };
      }

      return new Class(...args);
    };
  };
}
