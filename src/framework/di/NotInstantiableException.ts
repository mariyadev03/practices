/**
 * @author Junaid Atari <mj.atari@gmail.com>
 * @link https://github.com/blacksmoke26 Author Website
 * @since 2022-07-03
 */

// Core
import Exception from 'framework/base/Exception';

/**
 * NotInstantiableException represents an exception caused by an object is not constructable.
 */
export default class NotInstantiableException extends Exception {
  constructor ( message) {
    super(message || 'Not Instantiable');
  }
}
