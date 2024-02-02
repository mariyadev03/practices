/**
 * @author Junaid Atari <mj.atari@gmail.com>
 * @link https://github.com/blacksmoke26 Author Website
 * @since 2022-07-04
 */

// Core
import Exception from 'framework/base/Exception';

/**
 * InvalidRouteException represents an exception caused by an invalid route.
 */
export default class InvalidRouteException extends Exception {
  constructor ( message: string ) {
    super(message || 'Invalid route');
  }
}
