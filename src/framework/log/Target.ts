import Component from 'framework/base/Component';

export default abstract class Target extends Component {
  /**
   * Full qualified namespace
   */
  get namespace (): string {
    return 'framework/log/Target';
  }
}
