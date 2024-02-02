import Component from 'framework/base/Component';

export default class Logger extends Component {
  /**
   * Full qualified namespace
   */
  get namespace (): string {
    return 'framework/log/Logger';
  }
}
