export class StringUtilities {
    static TrimStart(target: string, trimSubstring?: string): string {
        if (trimSubstring == undefined) {
            return target.replace(/^\s+/m, '');
        }

        let result = target;

        while (result.length >= trimSubstring.length && result.startsWith(trimSubstring)) {
            result = result.slice(trimSubstring.length);
        }

        return result;
    }

    static TrimEnd(target: string, trimSubstring?: string): string {
        if (trimSubstring == undefined) {
            return target.replace(/\s+$/m, '');
        }

        let result = target;

        while (result.length >= trimSubstring.length && result.endsWith(trimSubstring)) {
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

    static ReplaceNewlines(input: string): string {
        const regex = new RegExp(/(?:\r\n|\r|\n)/, 'g');
        return input.replace(regex, '\n');
    }

    static Equals(input1: string, input2: string, ignoreCarriageReturn: boolean = true): boolean {
        if (ignoreCarriageReturn) {
            return this.ReplaceNewlines(input1) == this.ReplaceNewlines(input2);
        }

        return input1 == input2;
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
                    return (textIndex - word.length) + 1;
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

    public static ReplaceAll(input: string, target: string, replacement: string): string {
        var cleanedRegex = StringUtilities.ReplaceNewlines(StringUtilities.EscapeRegExp(target));
        const searchRegExp = new RegExp(cleanedRegex, 'g');
        input = StringUtilities.ReplaceNewlines(input);
        return input.replace(searchRegExp, replacement);
    }

    public static shuffleArray<T>(array: T[]): T[] {

        // Loop through the array using forEach
        array.forEach((_, index) => {

            // Generate a random index between 0 and index
            const randomIndex = Math.floor(Math.random() * (index + 1));

            // Swap the current element with the randomly selected one
            [array[index], array[randomIndex]] = [array[randomIndex], array[index]];
        });

        return array;
    }
    
    public static mergeOverlappingStrings(s1: string, s2: string): string {  
        const overlapLength = this.overlappedStringLength(s1, s2);
        return s1 + s2.substring(overlapLength);  
    }  

    // KMP to find overlapped string length between two strings
    public static overlappedStringLength(s1: string, s2: string): number {  
        // Trim s1 so it isn't longer than s2  
        if (s1.length > s2.length) s1 = s1.substring(s1.length - s2.length);  
      
        const T: number[] = this.computeBackTrackTable(s2); // O(n)  
      
        let m = 0;  
        let i = 0;  
        while (m + i < s1.length) {  
            if (s2[i] === s1[m + i]) {  
                i += 1;  
            } else {  
                m += i - T[i];  
                if (i > 0) i = T[i];  
            }  
        }
      
        return i; // <-- changed the return here to return characters matched  
    }
      
    private static computeBackTrackTable(s: string): number[] {  
        const T: number[] = new Array(s.length);  
        let cnd = 0;  
        T[0] = -1;  
        T[1] = 0;  
        let pos = 2;  
        while (pos < s.length) {  
            if (s[pos - 1] === s[cnd]) {  
                T[pos] = cnd + 1;  
                pos += 1;  
                cnd += 1;  
            } else if (cnd > 0) {  
                cnd = T[cnd];  
            } else {  
                T[pos] = 0;  
                pos += 1;  
            }  
        }  
      
        return T;  
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

    public static isValidJSON(strJson:any): boolean {
        try {
            const parsed = JSON.parse(strJson)
            if (parsed && typeof parsed === "object") {
              return true
            }
          } catch { return false }
          return false
    }

    public static markdownToHtmlWithTargetBlank(markdown) {  
        const linkRegex = /\[([^\[]+)\]\(([^\)]+)\)/g;  
        
        return markdown.replace(linkRegex, (match, title, url) => {  
          return `<a href="${url}" target="_blank">${title}</a>`;  
        });  
    }
}
