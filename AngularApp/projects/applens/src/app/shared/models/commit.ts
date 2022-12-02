export interface Commit {
  sha: string;
  author: string;
  date: string;
  previousSha: string;
  changedFiles: string[];
}
