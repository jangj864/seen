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
    "mode": "all",
    "q": "Who directed Inception?",
    "options": [
      "Ridley Scott",
      "Denis Villeneuve",
      "Christopher Nolan",
      "David Fincher"
    ],
    "answer": 2,
    "note": "Christopher Nolan directed Inception (2010).",
    "source": "https://www.legendary.com/film/inception/"
  },
  {
    "mode": "all",
    "q": "Who directed Titanic?",
    "options": [
      "James Cameron",
      "Steven Spielberg",
      "Robert Zemeckis",
      "Ron Howard"
    ],
    "answer": 0,
    "note": "James Cameron wrote and directed Titanic (1997).",
    "source": "https://www.paramount.com/movies/titanic"
  },
  {
    "mode": "all",
    "q": "Who directed Jaws?",
    "options": [
      "George Lucas",
      "Martin Scorsese",
      "Francis Ford Coppola",
      "Steven Spielberg"
    ],
    "answer": 3,
    "note": "Steven Spielberg directed Jaws (1975).",
    "source": "https://www.universalpicturesathome.com/movies/jaws"
  },
  {
    "mode": "all",
    "q": "Who directed Pulp Fiction?",
    "options": [
      "Guy Ritchie",
      "Quentin Tarantino",
      "David Lynch",
      "Paul Thomas Anderson"
    ],
    "answer": 1,
    "note": "Quentin Tarantino directed Pulp Fiction (1994).",
    "source": "https://www.miramax.com/movie/pulp-fiction/"
  },
  {
    "mode": "all",
    "q": "Who directed The Lord of the Rings: The Return of the King?",
    "options": [
      "Guillermo del Toro",
      "Sam Raimi",
      "Peter Jackson",
      "Tim Burton"
    ],
    "answer": 2,
    "note": "Peter Jackson directed The Return of the King (2003).",
    "source": "https://www.oscars.org/oscars/ceremonies/2004"
  },
  {
    "mode": "all",
    "q": "Who directed the original Star Wars (1977)?",
    "options": [
      "George Lucas",
      "J. J. Abrams",
      "Irvin Kershner",
      "Rian Johnson"
    ],
    "answer": 0,
    "note": "George Lucas wrote and directed Star Wars: A New Hope (1977).",
    "source": "https://www.lucasfilm.com/productions/episode-iv/"
  },
  {
    "mode": "all",
    "q": "Who directed The Grand Budapest Hotel?",
    "options": [
      "Noah Baumbach",
      "Sofia Coppola",
      "Taika Waititi",
      "Wes Anderson"
    ],
    "answer": 3,
    "note": "Wes Anderson directed The Grand Budapest Hotel (2014).",
    "source": "https://www.searchlightpictures.com/thegrandbudapesthotel/"
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
    "mode": "eyes",
    "q": "Whose eyes are these?",
    "options": [
      "Brad Pitt",
      "Tom Cruise",
      "Matt Damon",
      "Christian Bale"
    ],
    "answer": 1,
    "note": "Tom Cruise plays Ethan Hunt in Mission: Impossible.",
    "source": "https://www.paramount.com/movies/mission-impossible",
    "kind": "eyes",
    "image": "quiz-tom-cruise",
    "imageSize": [
      960,
      1210
    ],
    "crop": [
      400,
      365,
      330,
      100
    ]
  },
  {
    "mode": "eyes",
    "q": "Whose eyes are these?",
    "options": [
      "Leonardo DiCaprio",
      "Bradley Cooper",
      "Ryan Gosling",
      "Jude Law"
    ],
    "answer": 0,
    "note": "Leonardo DiCaprio plays Jack Dawson in Titanic (1997).",
    "source": "https://www.paramount.com/movies/titanic",
    "kind": "eyes",
    "image": "quiz-leonardo-dicaprio",
    "imageSize": [
      960,
      1141
    ],
    "crop": [
      135,
      338,
      270,
      90
    ]
  },
  {
    "mode": "eyes",
    "q": "Whose eyes are these?",
    "options": [
      "Johnny Depp",
      "Nicolas Cage",
      "Hugh Jackman",
      "Keanu Reeves"
    ],
    "answer": 3,
    "note": "Keanu Reeves plays Neo in The Matrix (1999).",
    "source": "https://www.warnerbros.com/movies/matrix",
    "kind": "eyes",
    "image": "quiz-keanu-reeves",
    "imageSize": [
      960,
      1354
    ],
    "crop": [
      355,
      329,
      320,
      80
    ]
  },
  {
    "mode": "eyes",
    "q": "Whose eyes are these?",
    "options": [
      "Jennifer Lawrence",
      "Margot Robbie",
      "Emma Stone",
      "Anne Hathaway"
    ],
    "answer": 2,
    "note": "Emma Stone plays Mia in La La Land (2016).",
    "source": "https://www.lionsgate.com/movies/la-la-land",
    "kind": "eyes",
    "image": "quiz-emma-stone",
    "imageSize": [
      960,
      1064
    ],
    "crop": [
      240,
      315,
      350,
      100
    ]
  },
  {
    "mode": "eyes",
    "q": "Whose eyes are these?",
    "options": [
      "Chris Evans",
      "Robert Downey Jr.",
      "Mark Ruffalo",
      "Jeremy Renner"
    ],
    "answer": 1,
    "note": "Robert Downey Jr. plays Tony Stark in Iron Man (2008).",
    "source": "https://www.marvel.com/movies/iron-man",
    "kind": "eyes",
    "image": "quiz-robert-downey",
    "imageSize": [
      960,
      1360
    ],
    "crop": [
      480,
      515,
      340,
      110
    ]
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
    "q": "Which school does Harry Potter attend?",
    "options": [
      "Durmstrang",
      "Beauxbatons",
      "Hogwarts",
      "Ilvermorny"
    ],
    "answer": 2,
    "note": "Harry Potter attends Hogwarts School of Witchcraft and Wizardry.",
    "source": "https://www.harrypotter.com/fact-file/locations/hogwarts"
  },
  {
    "mode": "films",
    "q": "What kind of toy is Woody in Toy Story?",
    "options": [
      "A space ranger",
      "A cowboy",
      "A race car",
      "A dinosaur"
    ],
    "answer": 1,
    "note": "Woody is the cowboy toy; Buzz Lightyear is the space ranger.",
    "source": "https://www.pixar.com/toy-story"
  },
  {
    "mode": "films",
    "q": "On which ship do Jack and Rose meet?",
    "options": [
      "RMS Olympic",
      "Queen Mary",
      "SS United States",
      "RMS Titanic"
    ],
    "answer": 3,
    "note": "Jack and Rose meet aboard RMS Titanic on its maiden voyage.",
    "source": "https://www.paramount.com/movies/titanic"
  },
  {
    "mode": "films",
    "q": "In Inception, where does Cobb steal secrets?",
    "options": [
      "Inside dreams",
      "Inside video games",
      "In outer space",
      "In the distant past"
    ],
    "answer": 0,
    "note": "Cobb extracts secrets from the subconscious while people dream.",
    "source": "https://www.legendary.com/film/inception/"
  },
  {
    "mode": "films",
    "q": "Which creatures return to life in Jurassic Park?",
    "options": [
      "Dragons",
      "Woolly mammoths",
      "Dinosaurs",
      "Giant sea monsters"
    ],
    "answer": 2,
    "note": "Jurassic Park is a theme park populated by living dinosaurs.",
    "source": "https://www.universalpicturesathome.com/movies/jurassic-park"
  },
  {
    "mode": "films",
    "q": "Who carries the One Ring toward Mordor?",
    "options": [
      "Gandalf",
      "Legolas",
      "Aragorn",
      "Frodo Baggins"
    ],
    "answer": 3,
    "note": "Frodo Baggins is entrusted with the quest to destroy the One Ring.",
    "source": "https://www.warnerbros.com/movies/lord-rings-fellowship-ring"
  },
  {
    "mode": "films",
    "q": "Which film features Neo, Morpheus and Trinity?",
    "options": [
      "Blade Runner",
      "The Matrix",
      "Minority Report",
      "Tron"
    ],
    "answer": 1,
    "note": "Neo, Morpheus and Trinity are central characters in The Matrix (1999).",
    "source": "https://www.warnerbros.com/movies/matrix"
  },
  {
    "mode": "films",
    "q": "How is Darth Vader related to Luke Skywalker?",
    "options": [
      "He is Luke’s father",
      "He is Luke’s brother",
      "He is Luke’s uncle",
      "They are unrelated"
    ],
    "answer": 0,
    "note": "The Empire Strikes Back reveals that Darth Vader is Luke’s father.",
    "source": "https://www.starwars.com/databank/darth-vader"
  }
];
