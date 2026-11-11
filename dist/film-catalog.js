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
    "image": "hunger-poster",
    "synopsis": "Set 24 years before Katniss’s first Games, this prequel follows a young Haymitch Abernathy into the Fiftieth Hunger Games. The Second Quarter Quell sends twice the usual number of tributes into the arena.",
    "question": "Which earlier Hunger Games film would you watch again before this one?",
    "url": "https://hungergames.movie/",
    "magazine": {
      "title": "Sunrise on the Reaping",
      "director": "FRANCIS LAWRENCE / 2026",
      "note": "Set 24 years before Katniss’s first Games, this prequel follows a young Haymitch Abernathy into the Fiftieth Hunger Games. The Second Quarter Quell sends twice the usual number of tributes into the arena.",
      "source": "Official film site"
    },
    "korean": {
      "title": "헝거게임 50번째 추첨의 날",
      "synopsis": "캣니스가 처음 헝거게임에 참가하기 24년 전, 어린 헤이미치 애버내시가 제50회 헝거게임에 참가한다. 두 번째 쿼터 퀠을 맞아 평소의 두 배인 48명의 참가자가 경기장에 들어간다.",
      "titleStatus": "official",
      "source": "https://cine21.com/movie/info/?movie_id=63412",
      "question": "이 영화를 보기 전에 다시 보고 싶은 헝거게임 시리즈는?"
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
    "image": "hexed-poster",
    "synopsis": "Billie discovers she has magical powers. With her mother Alice, she enters Hexe, a world of witches connected to her family’s past.",
    "question": "Which animated film did you watch with your family growing up?",
    "url": "https://movies.disney.com/hexed",
    "magazine": {
      "title": "Hexed",
      "director": "WALT DISNEY ANIMATION STUDIOS / 2026",
      "note": "Billie discovers she has magical powers. With her mother Alice, she enters Hexe, a world of witches connected to her family’s past.",
      "source": "Disney / film & trailer"
    },
    "korean": {
      "title": "헥스: 마녀왕국",
      "synopsis": "십 대 소녀 빌리는 자신에게 마법의 힘이 있다는 사실을 알게 된다. 엄마 앨리스와 함께 마녀들의 세계 헥스에 들어간 빌리는 그곳에서 가족의 과거를 알아간다.",
      "titleStatus": "official",
      "source": "https://www.frame-less.co.kr/news/articleView.html?idxno=4894",
      "question": "어릴 때 가족과 함께 본 애니메이션이 있나요?"
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
    "synopsis": "Greg has doubts about his son Henry’s fiancée Olivia, a former FBI hostage negotiator. His father-in-law Jack takes to her immediately, complicating another round of family introductions.",
    "question": "Which Meet the Parents character makes you laugh the most?",
    "url": "https://www.universalpictures.com/movies/focker-in-law/",
    "magazine": {
      "title": "Focker-In-Law",
      "director": "UNIVERSAL PICTURES / 2026",
      "note": "Greg has doubts about his son Henry’s fiancée Olivia, a former FBI hostage negotiator. His father-in-law Jack takes to her immediately, complicating another round of family introductions.",
      "source": "Universal / film & trailer"
    },
    "korean": {
      "title": "포커 인 로",
      "synopsis": "그레그는 아들 헨리의 약혼녀 올리비아를 못 미더워한다. 전직 FBI 인질 협상가인 올리비아에게 장인 잭은 오히려 호감을 보인다. 가족의 첫 만남부터 그레그의 걱정이 늘어난다.",
      "titleStatus": "transliterated",
      "source": "https://paramountglobalcontent.com/title/focker-in-law",
      "question": "〈미트 페어런츠〉에서 가장 웃겼던 인물은 누구였나요?"
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
    "synopsis": "Ti West adapts Charles Dickens’s A Christmas Carol, with Johnny Depp as Ebenezer Scrooge. Visits from Christmas spirits force the miser to look back at his choices and at the future ahead of him.",
    "question": "Do you prefer A Christmas Carol as a comedy or a ghost story?",
    "url": "https://www.paramount.com/movies/ebenezer",
    "magazine": {
      "title": "Ebenezer",
      "director": "Ti West / 2026",
      "note": "Ti West adapts Charles Dickens’s A Christmas Carol, with Johnny Depp as Ebenezer Scrooge. Visits from Christmas spirits force the miser to look back at his choices and at the future ahead of him.",
      "source": "Film details & trailer"
    },
    "korean": {
      "title": "에베니저",
      "synopsis": "타이 웨스트가 찰스 디킨스의 〈크리스마스 캐럴〉을 영화로 옮겼다. 조니 뎁이 연기하는 구두쇠 스크루지는 크리스마스의 유령들과 만나 자신의 과거와 앞으로 닥칠 일을 보게 된다.",
      "titleStatus": "transliterated",
      "source": "https://www.paramount.com/movies/ebenezer",
      "question": "〈크리스마스 캐럴〉은 코미디와 유령 이야기 중 어느 쪽이 더 잘 어울릴까요?"
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
    "synopsis": "Takashi Yamazaki’s sequel is set in 1949, two years after Godzilla Minus One. As Japan rebuilds, the Shikishima family faces another threat.",
    "question": "What would you like to see carried over from Godzilla Minus One?",
    "url": "https://gkids.com/2026/10/06/tickets-now-on-sale-for-godzilla-minus-zero/",
    "magazine": {
      "title": "Godzilla Minus Zero",
      "director": "Takashi Yamazaki / 2026",
      "note": "Takashi Yamazaki’s sequel is set in 1949, two years after Godzilla Minus One. As Japan rebuilds, the Shikishima family faces another threat.",
      "source": "Film details & trailer"
    },
    "korean": {
      "title": "고질라 마이너스 제로",
      "synopsis": "〈고질라 마이너스 원〉으로부터 2년이 지난 1949년이 배경이다. 일본이 전후 복구에 나선 가운데 시키시마 가족에게 또 다른 위협이 닥친다. 야마자키 다카시가 전편에 이어 연출을 맡았다.",
      "titleStatus": "transliterated",
      "source": "https://gkids.com/2026/10/06/tickets-now-on-sale-for-godzilla-minus-zero/",
      "question": "〈고질라 마이너스 원〉에서 이번 영화로 이어졌으면 하는 점은?"
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
    "image": "ladybird-poster",
    "note": "A high-school senior who calls herself Lady Bird wants to leave Sacramento for college on the East Coast. In her final year at home, she argues with her mother, changes friends and tries to work out who she wants to be.",
    "prompt": "Which argument between Lady Bird and Marion felt familiar?",
    "link": "https://a24films.com/films/lady-bird",
    "source": "A24 / film & trailer",
    "korean": {
      "title": "레이디 버드",
      "synopsis": "스스로를 레이디 버드라 부르는 고등학생 크리스틴은 새크라멘토를 떠나 동부의 대학에 가고 싶어 한다. 졸업을 앞둔 한 해 동안 엄마와 다투고, 친구와 멀어졌다 가까워지고, 첫 연애를 겪으며 앞으로의 삶을 그려본다.",
      "titleStatus": "official",
      "source": "https://a24films.com/films/lady-bird",
      "question": "레이디 버드와 매리언의 다툼 중 익숙하게 느껴진 장면이 있나요?"
    }
  },
  {
    "id": "yang",
    "type": "revisit",
    "date": "REVISIT",
    "title": "After Yang",
    "director": "KOGONADA / 2022",
    "image": "yang-poster",
    "note": "When the android Yang stops working, Jake searches for a way to repair him. Recordings stored in Yang’s memory reveal parts of his life that the family knew nothing about.",
    "prompt": "Which of Yang’s memories would you want to watch again?",
    "link": "https://a24films.com/films/after-yang",
    "source": "A24 / film & trailer",
    "korean": {
      "title": "애프터 양",
      "synopsis": "가족과 함께 살던 안드로이드 양이 작동을 멈춘다. 수리할 방법을 찾던 제이크는 양의 기억을 보게 되고, 가족이 모르고 있던 그의 일상을 조금씩 알게 된다.",
      "titleStatus": "official",
      "source": "https://a24films.com/films/after-yang",
      "question": "양의 기억 중 다시 보고 싶은 장면은?"
    }
  },
  {
    "id": "minari",
    "type": "revisit",
    "date": "REVISIT",
    "title": "Minari",
    "director": "LEE ISAAC CHUNG / 2021",
    "image": "minari-poster",
    "note": "A Korean American family moves to rural Arkansas in the 1980s. Jacob wants to grow Korean produce, while his wife Monica worries about their new life. The arrival of grandmother Soonja changes things for their young son David.",
    "prompt": "Whose decisions did you understand better by the end?",
    "link": "https://a24films.com/films/minari",
    "source": "A24 / film & trailer",
    "korean": {
      "title": "미나리",
      "synopsis": "1980년대, 한국계 미국인 가족이 아칸소의 시골로 이사한다. 제이콥은 한국 채소를 재배할 농장을 꿈꾸지만 아내 모니카는 새 생활이 불안하다. 한국에서 할머니 순자가 오면서 아들 데이비드의 일상도 달라진다.",
      "titleStatus": "official",
      "source": "https://a24films.com/films/minari",
      "question": "처음보다 마지막에 더 이해가 됐던 인물은 누구였나요?"
    }
  }
];
 for(const film of upcoming){Object.freeze(film.magazine);Object.freeze(film.korean);Object.freeze(film)}
 for(const film of revisit){Object.freeze(film.korean);Object.freeze(film)}
 const magazine=upcoming.map(film=>Object.freeze({
  id:film.id,type:'new',date:film.stamp,title:film.magazine.title,
  director:film.magazine.director,image:film.image,ext:film.ext||'jpg',
  note:film.magazine.note,prompt:film.question,link:film.url,source:film.magazine.source,korean:film.korean
 })).concat(revisit);
 return Object.freeze({
  upcoming:Object.freeze(upcoming),
  magazine:Object.freeze(magazine),
  // Canvas scenes attach their own DOM buttons without changing shared records.
  createUpcoming:()=>upcoming.map(film=>({...film}))
 });
})();
