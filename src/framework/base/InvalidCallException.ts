/**
 * @author Junaid Atari <mj.atari@gmail.com>
 * @link https://github.com/blacksmoke26 Author Website
 * @since 2022-07-01
 */

// Core
import Exception from 'framework/base/Exception';

/**
 * InvalidCallException represents an exception caused by accessing write-only object properties.
 */
export default class InvalidCallException extends Exception {
  constructor ( message ) {
    super(message || 'Invalid scope');
  }
}
