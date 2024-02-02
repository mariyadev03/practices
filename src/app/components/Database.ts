import Component from 'framework/base/Component';
import { Configuration } from 'framework/base/CoreObject';

export default class Database extends Component {
  constructor ( connection: string, config: Configuration ) {
    super(config);
  }
}
