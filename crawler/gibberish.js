const fs = require("node:fs");

const names = fs.readFileSync("./dictionaries/names", "utf8").split("\n");
const words = fs
  .readFileSync("./dictionaries/wordlist.10000", "utf8")
  .split("\n");

module.exports = class GibberishGenerator {
  constructor() {
    this.index = 0;
    this.chars = "abcdefghijklmnopqrstuvwxyz";
  }

  randomIntLessThan(max) {
    return Math.floor(Math.random() * max);
  }

  randomChoice(indexable) {
    return indexable[this.randomIntLessThan(indexable.length)];
  }

  randomLetters(length) {
    let word = "";
    for (let i = 0; i < length; i++) word += this.randomChoice(this.chars);
    return word;
  }

  fragment(string, length) {
    if (string.length <= length) return string;
    const start = this.randomIntLessThan(string.length - length);
    return string.slice(start, start + length);
  }

  randomNameFragment(length) {
    return this.fragment(this.randomChoice(names), length);
  }

  randomWordFragment(length) {
    return this.fragment(this.randomChoice(words), length);
  }

  generate(length) {
    this.index = (this.index + 1) % 3;
    if (this.index === 0) return this.randomLetters(length);
    else if (this.index === 1) return this.randomNameFragment(length);
    else return this.randomWordFragment(length);
  }
};
