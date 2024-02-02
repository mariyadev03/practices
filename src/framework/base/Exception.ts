/**
 * @author Junaid Atari <mj.atari@gmail.com>
 * @link https://github.com/blacksmoke26 Author Website
 * @since 2022-07-01
 */

/**
 * Exception represents an exception caused by logic or runtime error
 */
export default class Exception extends Error {
  constructor ( message ) {
    super(message);
    this.name = this.constructor.name;
    if ( typeof Error.captureStackTrace === 'function' ) {
      Error.captureStackTrace(this, this.constructor);
    } else {
      this.stack = (new Error(message)).stack;
    }
  }
}
