/**
 * @author Junaid Atari <mj.atari@gmail.com>
 * @link https://github.com/blacksmoke26 Author Website
 * @since 2022-07-02
 */

// Core
import Exception from 'framework/base/Exception';

/**
 * InvalidConfigException represents an exception caused by incorrect object configuration.
 */
export default class InvalidConfigException extends Exception {
  constructor ( message = '' ) {
    super(message || 'Invalid Configuration');
  }
}
