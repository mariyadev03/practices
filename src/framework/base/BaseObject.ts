/**
 * @author Junaid Atari <mj.atari@gmail.com>
 * @link https://github.com/blacksmoke26 Author Website
 * @since 2022-07-04
 */

// Core
import CoreObject from 'framework/base/CoreObject';

// Interfaces
import IBaseObject from 'framework/interfaces/IBaseObject';

/**
 * BaseObject is the base class that implements the *property* feature.
 *
 * A property is defined by a getter method, and/or a setter method.
 *
 * Property names are *case-insensitive*
 */
export default class BaseObject extends CoreObject implements IBaseObject {
  /**
   * Full qualified namespace
   */
  get namespace (): string {
    return 'framework/base/BaseObject';
  }
}
