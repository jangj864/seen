'use strict';
const seenQuizQuestions=[
  {
    "mode": "all",
    "q": "Who directed Lady Bird?",
    "options": [
      "Sofia Coppola",
      "Greta Gerwig",
      "Céline Sciamma",
      "Kelly Reichardt"
    ],
    "answer": 1,
    "note": "Greta Gerwig wrote and directed Lady Bird (2017)."
  },
  {
    "mode": "all",
    "q": "Who directed After Yang?",
    "options": [
      "Kogonada",
      "Bong Joon Ho",
      "Park Chan-wook",
      "Hirokazu Kore-eda"
    ],
    "answer": 0,
    "note": "Kogonada directed After Yang (2022)."
  },
  {
    "mode": "all",
    "q": "Who directed Minari?",
    "options": [
      "Justin Chon",
      "Lulu Wang",
      "Lee Isaac Chung",
      "Celine Song"
    ],
    "answer": 2,
    "note": "Lee Isaac Chung wrote and directed Minari (2020)."
  },
  {
    "mode": "all",
    "q": "Who directed Spirited Away?",
    "options": [
      "Satoshi Kon",
      "Makoto Shinkai",
      "Mamoru Hosoda",
      "Hayao Miyazaki"
    ],
    "answer": 3,
    "note": "Hayao Miyazaki wrote and directed Spirited Away (2001)."
  },
  {
    "mode": "all",
    "q": "Who directed Parasite?",
    "options": [
      "Bong Joon Ho",
      "Park Chan-wook",
      "Lee Chang-dong",
      "Kim Jee-woon"
    ],
    "answer": 0,
    "note": "Bong Joon Ho directed Parasite (2019)."
  },
  {
    "kind": "eyes",
    "q": "Whose eyes are these?",
    "options": [
      "Emma Stone",
      "Saoirse Ronan",
      "Florence Pugh",
      "Carey Mulligan"
    ],
    "answer": 1,
    "note": "Saoirse Ronan plays Lady Bird in Lady Bird (2017). Publicity still courtesy A24.",
    "image": "ladybird",
    "crop": [
      1080,
      280,
      390,
      135
    ],
    "mode": "eyes"
  },
  {
    "kind": "eyes",
    "q": "Recognize the actor behind these eyes?",
    "options": [
      "Ethan Hawke",
      "Oscar Isaac",
      "Colin Farrell",
      "Jake Gyllenhaal"
    ],
    "answer": 2,
    "note": "Colin Farrell plays Jake in After Yang (2022). Publicity still courtesy A24.",
    "image": "yang",
    "crop": [
      820,
      260,
      320,
      110
    ],
    "mode": "eyes"
  },
  {
    "mode": "eyes",
    "q": "Whose eyes are these?",
    "options": [
      "Annette Bening",
      "Laurie Metcalf",
      "Allison Janney",
      "Frances McDormand"
    ],
    "answer": 1,
    "note": "Laurie Metcalf plays Marion, Lady Bird’s mother. Publicity still courtesy A24.",
    "kind": "eyes",
    "image": "ladybird-mother",
    "imageSize": [
      1200,
      600
    ],
    "crop": [
      342,
      185,
      105,
      43
    ]
  },
  {
    "mode": "eyes",
    "q": "Recognize the actor behind these eyes?",
    "options": [
      "John Cho",
      "Daniel Dae Kim",
      "Steven Yeun",
      "Randall Park"
    ],
    "answer": 2,
    "note": "Steven Yeun plays Jacob in Minari (2020). Publicity still courtesy A24.",
    "kind": "eyes",
    "image": "minari",
    "crop": [
      754,
      156,
      107,
      46
    ]
  },
  {
    "mode": "eyes",
    "q": "Whose eyes are these?",
    "options": [
      "Bae Doona",
      "Kim Min-hee",
      "Jung Eun-chae",
      "Han Ye-ri"
    ],
    "answer": 3,
    "note": "Han Ye-ri plays Monica in Minari (2020). Publicity still courtesy A24.",
    "kind": "eyes",
    "image": "minari",
    "crop": [
      1741,
      429,
      39,
      16
    ]
  },
  {
    "q": "In After Yang, what starts Jake’s search?",
    "options": [
      "A missing photograph",
      "A letter from his father",
      "An A.I. companion malfunctions",
      "A move to another city"
    ],
    "answer": 2,
    "note": "Yang’s malfunction leads Jake to discover a life he did not know about.",
    "mode": "films"
  },
  {
    "q": "Which film follows a Korean American family making a home on a farm?",
    "options": [
      "Minari",
      "Lady Bird",
      "After Yang",
      "Hexed"
    ],
    "answer": 0,
    "note": "Minari, directed by Lee Isaac Chung, follows a family’s move to a farm.",
    "mode": "films"
  },
  {
    "q": "Which city does Lady Bird want to leave?",
    "options": [
      "San Francisco",
      "Sacramento",
      "Los Angeles",
      "Seattle"
    ],
    "answer": 1,
    "note": "Sacramento is both the home she resists and a place she learns to see differently.",
    "mode": "films"
  },
  {
    "mode": "films",
    "q": "In which U.S. state does Minari take place?",
    "options": [
      "California",
      "Arkansas",
      "New York",
      "Oregon"
    ],
    "answer": 1,
    "note": "The Yi family starts a farm in rural Arkansas."
  },
  {
    "mode": "films",
    "q": "What is Lady Bird’s given name?",
    "options": [
      "Julie",
      "Marion",
      "Christine",
      "Jenna"
    ],
    "answer": 2,
    "note": "Christine McPherson gives herself the name Lady Bird."
  }
];
