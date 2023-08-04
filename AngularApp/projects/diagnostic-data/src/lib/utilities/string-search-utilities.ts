// class AhoCorasickNode {
//     public children: Map<string, AhoCorasickNode>;
//     public output: string[];
//     public fail: AhoCorasickNode;

//     constructor() {
//         this.children = new Map();
//         this.output = [];
//         this.fail = null;
//     }
// }

// class AhoCorasick {
//     private root: AhoCorasickNode;

//     constructor(patterns: string[]) {
//         this.root = new AhoCorasickNode();
//         this.buildTrie(patterns);
//         this.buildFailTransitions();
//     }

//     private buildTrie(patterns: string[]): void {
//         for (const pattern of patterns) {
//             let node = this.root;
//             for (const char of pattern) {
//                 if (!node.children.has(char)) {
//                     node.children.set(char, new AhoCorasickNode());
//                 }
//                 node = node.children.get(char);
//             }
//             node.output.push(pattern);
//         }
//     }

//     private buildFailTransitions(): void {
//         const queue: AhoCorasickNode[] = [];
//         for (const childNode of this.root.children.keys()) {
//             childNode.fail = this.root;
//             queue.push(childNode);
//         }

//         while (queue.length > 0) {
//             const currentNode = queue.shift();
//             for (const [char, childNode] of currentNode.children) {
//                 queue.push(childNode);
//                 let failNode = currentNode.fail;
//                 while (failNode && !failNode.children.has(char)) {
//                     failNode = failNode.fail;
//                 }
//                 childNode.fail = failNode ? failNode.children.get(char) : this.root;
//                 childNode.output = childNode.output.concat(childNode.fail.output);
//             }
//         }
//     }

//     public findMatches(candidateString: string): Map<string, string[]> {
//         const matches = new Map<string, string[]>();
//         let currentNode = this.root;

//         for (const char of candidateString) {
//             while (currentNode && !currentNode.children.has(char)) {
//                 currentNode = currentNode.fail;
//             }

//             currentNode = currentNode ? currentNode.children.get(char) : this.root;
//             if (currentNode.output.length > 0) {
//                 for (const pattern of currentNode.output) {
//                     if (!matches.has(pattern)) {
//                         matches.set(pattern, []);
//                     }
//                     matches.get(pattern).push(candidateString);
//                 }
//             }
//         }

//         return matches;
//     }
// }


// export function findMatchingStringsByAhoCorasick(inputStrings: string[], candidateStrings: string[]): Record<string, string[]> {
//     const automaton = new AhoCorasick(inputStrings);
//     const result: Record<string, string[]> = {};

//     for (const inputString of inputStrings) {
//         result[inputString] = [];
//     }

//     for (const candidateString of candidateStrings) {
//         const matches = automaton.findMatches(candidateString);
//         for (const [pattern, occurrences] of matches.entries()) {
//             result[pattern] = result[pattern].concat(occurrences);
//         }
//     }

//     return result;
// }

export class SuffixArray {
    public static buildSuffixArray(s: string): Array<string> {
        const suffixArray: Array<string> = new Array<string>();
        if(!s) return suffixArray;
        s = s.toLowerCase();
        for (let i = 0; i < s.length; i++) {
            suffixArray.push(s.substring(i));
        }
        suffixArray.sort();
        return suffixArray;
    }

    public static contains(target: string, suffixArray: Array<string>): boolean {
        if(!suffixArray) return false;
        target = target.toLowerCase();
        let left = 0;
        let right = suffixArray.length - 1;
        while (left <= right) {
            const mid = Math.floor((left + right) / 2);
            const suffix = suffixArray[mid];
            const suffixContainsTarget = suffix.startsWith(target);
            if (suffixContainsTarget) {
                return true;
            } else if (suffix < target) {
                left = mid + 1;
            } else {
                right = mid - 1;
            }
        }
        return false;
    }
}
//Boyer-Moore-Sunday search algorithm
export function boyerMooreSundayStringSearch(text: string, pattern: string): number {
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


