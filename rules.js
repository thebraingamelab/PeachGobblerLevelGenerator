'use strict';
const values = {
    fillColors: ['red', 'green', 'blue'],
    lineColors: ['red', 'green', 'blue'],
    shape: ['triangle', 'rectangle', 'circle']
};

function makeRuleLogic() {
    const variable = randomElement(Object.entries(values));
    const randArray = shuffle([0, 1, 2]);
    let result = {};

    variable[1].forEach((key, i) => result[key] = randArray[i])
    return [variable[0], result];
}

function randomElement(list) {
    return list[Math.floor(Math.random() * list.length)];
}

function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}
