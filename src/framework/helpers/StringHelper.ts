/**
 * @author Junaid Atari <mj.atari@gmail.com>
 * @link https://github.com/blacksmoke26 Author Website
 * @since 2022-07-02
 */

import { isMatch, Options } from 'micromatch';

export default class StringHelper {
  public static matchWildcard ( pattern: string, str: string, options: Options = {} ): boolean {
    return isMatch(str, pattern, options);
  }

  public static strpos ( haystack: string, needle: string, offset = 0 ): number | false {
    const i = haystack.indexOf(needle, offset);
    return i === -1 ? false : i;
  }

  public static strrpos ( haystack: string, needle: string, offset?: number ): number | false {
    const i = haystack.lastIndexOf(needle, offset);
    return i === -1 ? false : i;
  }

  public static substr ( str: string, offset: number, length: number | undefined = undefined ): string {
    return String(str || '').substring(offset || 0, length);
  }

  /**
   * Binary safe string comparison of the first n characters
   * @param string1 - The first string
   * @param string2 - The second string
   * @param length - Number of characters to use in the comparison
   * @returns Less 0 if <i>string1</i> is less than <i>string2</i>; &gt; 0 if <i>string1</i>
   * is greater than <i>string2</i>, and 0 if they are equal.
   */
  public static strncmp ( string1: string, string2: string, length: number ): number {
    const s1 = (string1 + '').substring(0, length)
    const s2 = (string2 + '').substring(0, length)
    return (s1 === s2 ? 0 : (s1 > s2 ? 1 : -1))
  }

  /**
   * Make a string's first character uppercase
   * @param str - The input string
   * @param lowercase=false - Transform other than first chars to lowercase first
   */
  public static ucFirst ( str: any, lowercase = false ): string {
    str = String(str || '').toString();
    return str.charAt(0).toUpperCase()
      + (lowercase ? str.substring(1).toLowerCase() : str.substring(1));
  }

  public static trim ( str: string, chr = '' ): string {
    const regex: RegExp = !chr
      ? new RegExp('^\\s+|\\s+$', 'g')
      : new RegExp(`^${chr}+|${chr}+$`, 'g');
    return str.replace(regex, '');
  }

  public static rtrim ( str: string, chr = '' ): string {
    const regex: RegExp = !chr
      ? new RegExp('\\s+$')
      : new RegExp(`${chr}+$`);
    return str.replace(regex, '');
  }

  public static ltrim ( str: string, chr = '' ): string {
    const regex: RegExp = !chr
      ? new RegExp('^\\s+')
      : new RegExp(`^${chr}+`);
    return str.replace(regex, '');
  }
}
