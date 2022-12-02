export class StringUtilities {
  static TrimStart(target: string, trimSubstring?: string): string {
    if (trimSubstring == undefined) {
      return target.replace(/^\s+/m, '');
    }

    let result = target;

    while (
      result.length >= trimSubstring.length &&
      result.startsWith(trimSubstring)
    ) {
      result = result.slice(trimSubstring.length);
    }

    return result;
  }

  static TrimEnd(target: string, trimSubstring?: string): string {
    if (trimSubstring == undefined) {
      return target.replace(/\s+$/m, '');
    }

    let result = target;

    while (
      result.length >= trimSubstring.length &&
      result.endsWith(trimSubstring)
    ) {
      result = result.slice(0, -1 * trimSubstring.length);
    }

    return result;
  }

  static TrimBoth(target: string, trimSubstring?: string): string {
    if (trimSubstring == undefined) {
      return target.trim();
    }

    return this.TrimStart(this.TrimEnd(target, trimSubstring), trimSubstring);
  }

  /* *
   * KMP algorithm for searching string index
   * https://en.wikipedia.org/wiki/Knuth%E2%80%93Morris%E2%80%93Pratt_algorithm
   * https://github.com/trekhleb/javascript-algorithms/blob/master/src/algorithms/string/knuth-morris-pratt/knuthMorrisPratt.js
   * @param {string} text, target string
   * @param {string} word, search string
   * @return {number} index of search string in target. return -1 if not found
   * */
  public static IndexOf(text: string, word: string): number {
    if (word.length === 0) {
      return 0;
    }

    let textIndex = 0;
    let wordIndex = 0;

    const patternTable = StringUtilities.BuildPatternTable(word);

    while (textIndex < text.length) {
      if (text[textIndex] === word[wordIndex]) {
        // We've found a match.
        if (wordIndex === word.length - 1) {
          return textIndex - word.length + 1;
        }
        wordIndex += 1;
        textIndex += 1;
      } else if (wordIndex > 0) {
        wordIndex = patternTable[wordIndex - 1];
      } else {
        // wordIndex = 0;
        textIndex += 1;
      }
    }
    return -1;
  }

  //Helper function for KMP algorithm
  private static BuildPatternTable(word: string): number[] {
    const patternTable = [0];
    let prefixIndex = 0;
    let suffixIndex = 1;

    while (suffixIndex < word.length) {
      if (word[prefixIndex] === word[suffixIndex]) {
        patternTable[suffixIndex] = prefixIndex + 1;
        suffixIndex += 1;
        prefixIndex += 1;
      } else if (prefixIndex === 0) {
        patternTable[suffixIndex] = 0;
        suffixIndex += 1;
      } else {
        prefixIndex = patternTable[prefixIndex - 1];
      }
    }
    return patternTable;
  }

  private static EscapeRegExp(input: string): string {
    const regex = new RegExp(/[.*+?^${}()|[\]\\]/, 'g');
    return input.replace(regex, '\\$&');
  }

  private static ReplaceNewlines(input: string): string {
    const regex = new RegExp(/(?:\r\n|\r|\n)/, 'g');
    return input.replace(regex, '\n');
  }

  public static ReplaceAll(
    input: string,
    target: string,
    replacement: string
  ): string {
    var cleanedRegex = StringUtilities.ReplaceNewlines(
      StringUtilities.EscapeRegExp(target)
    );
    const searchRegExp = new RegExp(cleanedRegex, 'g');
    input = StringUtilities.ReplaceNewlines(input);
    return input.replace(searchRegExp, replacement);
  }
}
