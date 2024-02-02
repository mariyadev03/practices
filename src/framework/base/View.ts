/**
 * @author Junaid Atari <mj.atari@gmail.com>
 * @link https://github.com/blacksmoke26 Author Website
 * @since 2022-07-04
 */

import Component from 'framework/base/Component';

// Interfaces
import DynamicContentAwareInterface from 'framework/interfaces/DynamicContentAwareInterface';

/**
 * View represents a view object in the MVC pattern.
 *
 * View provides a set of methods (e.g. {@link render()}) for rendering purpose.
 */
export default class View extends Component implements DynamicContentAwareInterface {
  /**
   * Full qualified namespace
   */
  get namespace (): string {
    return 'framework/base/View';
  }
}
