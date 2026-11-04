'use strict';
// One release list feeds the cinema posters, magazine cards and local ballot.
const SeenFilmCatalog=(()=>{
 const upcoming=[
   {
     "id": "hunger",
     "title": "The Hunger Games: Sunrise on the Reaping",
     "short": "SUNRISE ON THE REAPING",
     "date": "20 November 2026",
     "stamp": "20 NOV",
     "director": "Francis Lawrence",
     "studio": "Lionsgate",
     "image": "hunger",
     "synopsis": "A return to Panem, 24 years before the original Hunger Games. A young Haymitch Abernathy faces the Fiftieth Games, the Second Quarter Quell.",
     "question": "Who gets to tell a story—and who has to live inside it?",
     "url": "https://hungergames.movie/",
     "magazine": {
       "title": "Sunrise on the Reaping",
       "director": "FRANCIS LAWRENCE / 2026",
       "note": "A return to Panem, and to a younger Haymitch. Bring the person who first introduced you to this world.",
       "source": "Official film site"
     }
   },
   {
     "id": "hexed",
     "title": "Hexed",
     "short": "HEXED",
     "date": "25 November 2026",
     "stamp": "25 NOV",
     "director": "Fawn Veerasunthorn & Jason Hand",
     "studio": "Walt Disney Animation Studios",
     "image": "hexed",
     "synopsis": "Teenager Billie discovers magical powers that lead her into the witch realm of Hexe. With her mother Alice, she explores a family history with consequences for their new world.",
     "question": "When did someone in your family surprise you?",
     "url": "https://movies.disney.com/hexed",
     "magazine": {
       "title": "Hexed",
       "director": "WALT DISNEY ANIMATION STUDIOS / 2026",
       "note": "A mother, a daughter, and an unfamiliar magical world. A Thanksgiving-week invitation to discover something together.",
       "source": "Disney / film & trailer"
     }
   },
   {
     "id": "focker",
     "title": "Focker-In-Law",
     "short": "FOCKER-IN-LAW",
     "date": "25 November 2026",
     "stamp": "25 NOV",
     "director": "John Hamburg",
     "studio": "Universal Pictures",
     "image": "focker-poster",
     "synopsis": "Ben Stiller and Robert De Niro reunite in a new Meet the Parents chapter, joined by Ariana Grande. Another generation brings new introductions to the extended family.",
     "question": "What makes somebody feel welcome before they know the rules?",
     "url": "https://www.universalpictures.com/movies/focker-in-law/",
     "magazine": {
       "title": "Focker-In-Law",
       "director": "UNIVERSAL PICTURES / 2026",
       "note": "Ben Stiller and Robert De Niro return to the Meet the Parents family. For the person who knows how complicated an introduction can be.",
       "source": "Universal / film & trailer"
     }
   },
   {
     "id": "ebenezer",
     "title": "Ebenezer",
     "short": "EBENEZER",
     "date": "13 November 2026",
     "stamp": "13 NOV",
     "director": "Ti West",
     "studio": "Paramount Pictures",
     "image": "ebenezer-poster",
     "synopsis": "Johnny Depp plays Ebenezer Scrooge in Ti West’s take on Charles Dickens’s A Christmas Carol. A ghostly Christmas reckoning invites a man to confront the life he has made.",
     "question": "What would you change if you could revisit one ordinary day?",
     "url": "https://www.paramount.com/movies/ebenezer",
     "magazine": {
       "title": "Ebenezer",
       "director": "Ti West / 2026",
       "note": "Johnny Depp plays Ebenezer Scrooge in Ti West’s take on Charles Dickens’s A Christmas Carol. A ghostly Christmas reckoning invites a man to confront the life he has made.",
       "source": "Film details & trailer"
     }
   },
   {
     "id": "godzilla",
     "title": "Godzilla Minus Zero",
     "short": "GODZILLA MINUS ZERO",
     "date": "6 November 2026",
     "stamp": "06 NOV",
     "director": "Takashi Yamazaki",
     "studio": "TOHO / GKIDS",
     "image": "godzilla-poster",
     "ext": "png",
     "synopsis": "In 1949, two years after Godzilla Minus One, the Shikishima family faces another catastrophe as Japan struggles to rebuild. Takashi Yamazaki returns for the sequel.",
     "question": "What does it mean to rebuild a home after everything changes?",
     "url": "https://gkids.com/2026/10/06/tickets-now-on-sale-for-godzilla-minus-zero/",
     "magazine": {
       "title": "Godzilla Minus Zero",
       "director": "Takashi Yamazaki / 2026",
       "note": "In 1949, two years after Godzilla Minus One, the Shikishima family faces another catastrophe as Japan struggles to rebuild. Takashi Yamazaki returns for the sequel.",
       "source": "Film details & trailer"
     }
   }
 ];
 const revisit=[
   {
     "id": "ladybird",
     "type": "revisit",
     "date": "REVISIT",
     "title": "Lady Bird",
     "director": "GRETA GERWIG / 2017",
     "image": "ladybird",
     "note": "For the friend who had to leave their hometown to see it clearly. Return to the small exchanges between a mother and daughter.",
     "prompt": "Can wanting to leave and loving a place be the same feeling?",
     "link": "https://a24films.com/films/lady-bird",
     "source": "A24 / film & trailer"
   },
   {
     "id": "yang",
     "type": "revisit",
     "date": "REVISIT",
     "title": "After Yang",
     "director": "KOGONADA / 2022",
     "image": "yang",
     "note": "A family discovers a life hidden inside the companion they thought they knew. Watch with someone who keeps the little things.",
     "prompt": "What ordinary moment would you want somebody to remember?",
     "link": "https://a24films.com/films/after-yang",
     "source": "A24 / film & trailer"
   },
   {
     "id": "minari",
     "type": "revisit",
     "date": "REVISIT",
     "title": "Minari",
     "director": "LEE ISAAC CHUNG / 2021",
     "image": "minari",
     "note": "For the person building a home between languages, expectations, and generations. Watch how belonging is made through everyday care.",
     "prompt": "What can you carry from home that isn’t an object?",
     "link": "https://a24films.com/films/minari",
     "source": "A24 / film & trailer"
   }
 ];
 for(const film of upcoming){Object.freeze(film.magazine);Object.freeze(film)}
 for(const film of revisit)Object.freeze(film);
 const magazine=upcoming.map(film=>Object.freeze({
  id:film.id,type:'new',date:film.stamp,title:film.magazine.title,
  director:film.magazine.director,image:film.image,ext:film.ext||'jpg',
  note:film.magazine.note,prompt:film.question,link:film.url,source:film.magazine.source
 })).concat(revisit);
 return Object.freeze({
  upcoming:Object.freeze(upcoming),
  magazine:Object.freeze(magazine),
  // Canvas scenes attach their own DOM buttons without changing shared records.
  createUpcoming:()=>upcoming.map(film=>({...film}))
 });
})();
