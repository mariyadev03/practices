/**
 * @author Junaid Atari <mj.atari@gmail.com>
 * @link https://github.com/blacksmoke26 Author Website
 * @since 2022-07-04
 */

// Core
import Exception from 'framework/base/Exception';

/**
 * InvalidArgumentException represents an exception caused by invalid arguments passed to a method.
 */
export default class InvalidArgumentException extends Exception {
  constructor ( message: string ) {
    super(message || 'Invalid Arguments');
  }
}
