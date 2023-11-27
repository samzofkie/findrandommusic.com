const fs = require('node:fs');

const names = fs.readFileSync('./dictionaries/names', 'utf8').split('\n');
const words = fs.readFileSync('./dictionaries/wordlist.10000', 'utf8').split('\n');

let gibberishIndex = 0;

function gibberishTruncate(word) {
  if (word.length < 5)
    return word;
  const desiredLength = 5 + Math.floor(Math.random() * (word.length - 5));
  const startIndex = Math.floor(Math.random() * (word.length - desiredLength));
  return word.slice(startIndex, startIndex + desiredLength);
}

exports.gibberish = function gibberish() {
  function gib1() {
    const chars = 'abcdefghijklmnopqrstuvwxyz';
    const len = 3 + Math.floor(Math.random() * 4);
    let gib = '';
    for (let i=0; i<len; i++)
      gib += chars.charAt(Math.floor(Math.random() * chars.length));
    return gib; 
  }

  function gib2() {
    const index = Math.floor(Math.random() * names.length);
    return gibberishTruncate(names[index]);
  }

  function gib3() {
    const index = Math.floor(Math.random() * words.length);
    return gibberishTruncate(words[index]);
  }

  const gibFunctions = [gib1, gib2, gib3];
  gibberishIndex++;
  if (gibberishIndex > gibFunctions.length - 1)
    gibberishIndex = 0;

  return gibFunctions[gibberishIndex]();
};
