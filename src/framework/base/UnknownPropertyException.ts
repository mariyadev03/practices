/**
 * @author Junaid Atari <mj.atari@gmail.com>
 * @link https://github.com/blacksmoke26 Author Website
 * @since 2022-07-01
 */

// Core
import Exception from 'framework/base/Exception';

/**
 * UnknownPropertyException represents an exception caused by accessing unknown object properties.
 */
export default class UnknownPropertyException extends Exception {
  constructor ( message ) {
    super(message || 'Unknown Property');
  }
}
