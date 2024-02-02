/**
 * @author Junaid Atari <mj.atari@gmail.com>
 * @link https://github.com/blacksmoke26 Author Website
 * @since 2022-07-02
 */

import BaseApp from 'framework/BaseApp';
import Container from 'framework/di/Container';

/**
 * App is a helper-class serving common framework functionalities.
 *
 * It extends from [[framework/BaseApp]] which provides the actual implementation.
 * By writing your own App class, you can customize some functionalities of [[framework/BaseApp]]
 */
class App extends BaseApp {
}

// Set globals
global.App = App;

App.container = new Container({});

export default App;
