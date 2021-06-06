var fs = require('fs');

//get the list of fileNames from the console
const fileNames = process.argv.slice(2);

fileNames.forEach(fileName => {

    fs.readFile(fileName, 'utf8', (err, data) => {
        if (err) {
            console.error(err.message);
            return;
        }

        let inputWords = data.toString().split("\n");
        //validate input
        const regExpCapitalLetters = new RegExp("[^A-Z]");
        const inValidWords = inputWords.filter(word => word.match(regExpCapitalLetters) != null);
        if (inValidWords.length > 0) {
            console.error("\x1b[31m", `Invalid words: "${inValidWords.join(', ')}" found in file '${fileName}'. Words contains only capital letters!`);
            return;
        }

        //find the shortest word from the input values
        const shortestWord = findShortestWord([...inputWords]);
        const score = (1 - (shortestWord.length / (inputWords.join("").length))) * 100;

        console.log(`Input file: ${fileName}`);
        console.table([{ input: inputWords.join(", "), result: shortestWord, score: Math.round(score) }]);

    });
});


function findShortestWord(words) {

    words = mergeWordsWithSimilarCharacters(words);

    //merge other words
    for (let i = 0; i < words.length; i++) {

        const currentWord = words[i];
        const firstCharacter = currentWord.charAt(0);
        const lastCharacter = currentWord.charAt(currentWord.length - 1);

        for (let j = i + 1; j < words.length; j++) {

            const nextWord = words[j];
            if (nextWord.startsWith(lastCharacter)) {
                words[i] = currentWord.slice(0, -1) + nextWord;
                words[j] = null;
                break;
            }

            if (nextWord.endsWith(firstCharacter)) {
                words[i] = nextWord + currentWord.slice(1);
                words[j] = null;
                break;
            }
        }

        if (words.some(word => word == null)) {
            break;
        }
    }

    if (words.some(word => word == null)) {
        return findShortestWord(words.filter(x => x !== null));
    }

    return words.join("");
}

function mergeWordsWithSimilarCharacters(words) {

    //sort the words in ascending order by length.
    words.sort(stringLengthComparer);

    //starting from the biggest word, check if there is any smaller word contained 
    //in the bigger word
    for (let i = words.length - 1; i >= 0; i--) {

        //get the current biggest word
        const bigWord = words[i];
        if (bigWord == null) {
            continue;
        }

        for (let j = i - 1; j >= 0; j--) {

            //get the next word that appears in the input array after the current biggest word

            //since we have sorted the array by length of input words, the next word will be smaller or
            //equal in equal length(this handles duplicate words) compared to the current biggest word
            const nextWord = words[j];
            if (nextWord == null) {
                continue;
            }

            //check if the next biggest word contains characters are already part of the current biggest word
            if (bigWord.includes(nextWord)) {
                //since nextWord is included in bigWord, we can "throw away" nextWord
                words[j] = null;
                continue;
            }

            //maybe not the entire nextWord is included in bigWord so let's there are parts of nextWord 
            //that are included at the beginning or end of bigWord

            let forwardIndex = 1; //we don't want to start from the 
            let backWardIndex = nextWord.length - 1;
            while (forwardIndex < nextWord.length) {
                let subStringOfNextWord = nextWord.slice(forwardIndex);
                if (bigWord.startsWith(subStringOfNextWord) && subStringOfNextWord.length > 1) {
                    words[i] = nextWord.substring(0, nextWord.length - subStringOfNextWord.length) + bigWord;
                    words[j] = null;
                    break;
                }

                subStringOfNextWord = nextWord.substring(0, backWardIndex);
                if (bigWord.endsWith(subStringOfNextWord) && subStringOfNextWord.length > 1) {
                    //since nextWord is included in bigWord, we can "throw away" nextWord
                    words[i] = bigWord + nextWord.substring(subStringOfNextWord.length);
                    words[j] = null;
                    break;
                }
                backWardIndex--;
                forwardIndex++;
            }
        }
    }

    if (words.some(word => word === null)) {
        return mergeWordsWithSimilarCharacters(words.filter(x => x !== null));
    }

    return words;

}

function stringLengthComparer(str1, str2) {
    return str1?.length - str2?.length;
}