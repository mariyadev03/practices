/**
 * @author Junaid Atari <mj.atari@gmail.com>
 * @link https://github.com/blacksmoke26 Author Website
 * @since 2022-07-03
 */

/**
 * Placeholders is the interface that should be implemented by placeholders' property
 */
export interface Placeholders {
  [prop: string]: any;
}

/**
 * DynamicContentAwareInterface is the interface that should be implemented by classes
 * which support a {@link View} dynamic content feature.
 */
export default interface DynamicContentAwareInterface {
  /**
   * Returns a list of placeholders for dynamic content. This method
   * is used internally to implement the content-caching feature.
   * @return array a list of placeholders.
   */
  getDynamicPlaceholders (): Placeholders;

  /**
   * Sets a list of placeholders for dynamic content. This method
   * is used internally to implement the content-caching feature.
   * @param placeholders a list of placeholders.
   */
  setDynamicPlaceholders ( placeholders: Placeholders );

  /**
   * Adds a placeholder for dynamic content.
   * This method is used internally to implement the content-caching feature.
   * @param name - The placeholder name.
   * @param statements - The PHP statements for generating the dynamic content.
   */
  addDynamicPlaceholder ( name: string, statements: string ): void;
}
