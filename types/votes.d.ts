export interface Vote {
  id: string;
  word: string;
  category: "general" | "phonetic" | "writing" | "interview" | "usable";
  vote: number;
}
