export class FastSearch {
    private static readonly STRINGLIB_BLOOM_WIDTH = 32;

    private static STRINGLIB_BLOOM_ADD(mask: number, ch: number): number {
        return (mask |= (1 << (ch & (this.STRINGLIB_BLOOM_WIDTH - 1))));
    }

    private static STRINGLIB_BLOOM(mask: number, ch: number): boolean {
        return ((mask & (1 << (ch & (this.STRINGLIB_BLOOM_WIDTH - 1)))) !== 0);
    }

    //From https://github.com/python/cpython/blob/main/Objects/stringlib/fastsearch.h
    public static fast_search(text: string, pattern: string): number {
        const n = text.length;
        const m = pattern.length;
        const w = n - m;
        const mlast = m - 1;
        let skip = mlast - 1;
        let mask = 0;
        let i, j;
        const ss = text.substring(m - 1);
        const pp = pattern.substring(m - 1);

        // create compressed boyer-moore delta 1 table
        // process pattern[:-1]
        for (i = 0; i < mlast; i++) {
            mask = this.STRINGLIB_BLOOM_ADD(mask, pattern.charCodeAt(i));
            if (pattern[i] === pattern[mlast]) {
                skip = mlast - i - 1;
            }
        }
        // process pattern[-1] outside the loop
        mask = this.STRINGLIB_BLOOM_ADD(mask, pattern.charCodeAt(mlast));

        for (i = 0; i <= w; i++) {
            if (ss[i] === pp[0]) {
                // candidate match
                for (j = 0; j < mlast; j++) {
                    if (text[i + j] !== pattern[j]) {
                        break;
                    }
                }
                if (j === mlast) {
                    // got a match!
                    return i;
                }
                // miss: check if next character is part of pattern
                if (!this.STRINGLIB_BLOOM(mask, ss.charCodeAt(i + 1))) {
                    i = i + m;
                } else {
                    i = i + skip;
                }
            } else {
                // skip: check if next character is part of pattern
                if (!this.STRINGLIB_BLOOM(mask, ss.charCodeAt(i + 1))) {
                    i = i + m;
                }
            }
        }
        return -1;
    }

    //Boyer-Moore-Sunday search algorithm
    static boyerMooreSundayStringSearch(text: string, pattern: string): number {
        const n = text.length;
        const m = pattern.length;
    
        if (m === 0) return 0;
        if (n < m) return -1;
    
        const lastOccurrence = new Map<string, number>();
        for (let i = 0; i < m; i++) {
            lastOccurrence.set(pattern[i], i);
        }
    
        let i = 0;
        while (i <= n - m) {
            let j = 0;
            while (j < m && pattern[j] === text[i + j]) {
                j++;
            }
    
            if (j === m) {
                return i;
            }
    
            if (i + m < n) {
                const nextChar = text[i + m];
                const jump = m - (lastOccurrence.get(nextChar) || -1);
                i += jump;
            } else {
                i++;
            }
        }
    
        return -1;
    }
}

