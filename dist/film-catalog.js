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
    "synopsis": "A return to Panem, 24 years before the original Hunger Games. A young Haymitch Abernathy faces the Fiftieth Games, the Second Quarter Quell.",
    "question": "Who gets to tell a story—and who has to live inside it?",
    "url": "https://hungergames.movie/",
    "magazine": {
      "title": "Sunrise on the Reaping",
      "director": "FRANCIS LAWRENCE / 2026",
      "note": "A return to Panem, 24 years before the original Hunger Games. A young Haymitch Abernathy faces the Fiftieth Games, the Second Quarter Quell.",
      "source": "Official film site"
    },
    "korean": {
      "title": "헝거게임 50번째 추첨의 날",
      "synopsis": "제50회 헝거게임에 끌려온 소년 헤이미치. 평소의 두 배인 48명이 맞붙는 잔혹한 경기에서, 그는 힘보다 관찰력과 기지로 살아남을 길을 찾는다. 적은 다른 참가자들만이 아니다. 모두의 운명을 조종하는 캐피톨의 규칙까지 넘어야 한다.",
      "titleStatus": "official",
      "source": "https://cine21.com/movie/info/?movie_id=63412"
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
    "synopsis": "Teenager Billie discovers magical powers that lead her into the witch realm of Hexe. With her mother Alice, she explores a family history with consequences for their new world.",
    "question": "When did someone in your family surprise you?",
    "url": "https://movies.disney.com/hexed",
    "magazine": {
      "title": "Hexed",
      "director": "WALT DISNEY ANIMATION STUDIOS / 2026",
      "note": "Teenager Billie discovers magical powers that lead her into the witch realm of Hexe. With her mother Alice, she explores a family history with consequences for their new world.",
      "source": "Disney / film & trailer"
    },
    "korean": {
      "title": "헥스: 마녀왕국",
      "synopsis": "충동적이고 남다른 십 대 소녀 빌리는 자신에게 숨겨진 마법의 힘을 발견한다. 평범한 일상을 벗어나 마녀들의 세계 헥스로 들어간 빌리는 신중한 엄마 앨리스와 함께 모험에 나선다. 두 사람 앞에 드러나는 가족의 비밀은 마녀왕국의 미래까지 뒤흔든다.",
      "titleStatus": "official",
      "source": "https://www.frame-less.co.kr/news/articleView.html?idxno=4894"
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
    "synopsis": "Greg and Pam Focker’s grown son Henry introduces his fiancée Olivia, a quick-witted former FBI hostage negotiator, to the family. A new generation turns a family introduction into another unpredictable Focker gathering.",
    "question": "What makes somebody feel welcome before they know the rules?",
    "url": "https://www.universalpictures.com/movies/focker-in-law/",
    "magazine": {
      "title": "Focker-In-Law",
      "director": "UNIVERSAL PICTURES / 2026",
      "note": "Greg and Pam Focker’s grown son Henry introduces his fiancée Olivia, a quick-witted former FBI hostage negotiator, to the family. A new generation turns a family introduction into another unpredictable Focker gathering.",
      "source": "Universal / film & trailer"
    },
    "korean": {
      "title": "포커 인 로",
      "synopsis": "그렉과 팸의 아들 헨리가 연인 올리비아를 가족에게 소개한다. 재치 넘치는 전직 FBI 인질 협상가 올리비아가 등장하면서, 포커 가족의 평범할 리 없는 만남은 또 한 번 예측 불가능한 소동으로 번진다.",
      "titleStatus": "transliterated",
      "source": "https://paramountglobalcontent.com/title/focker-in-law"
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
    },
    "korean": {
      "title": "에베니저",
      "synopsis": "돈과 고독 속에 살아가던 에베니저 스크루지가 크리스마스의 유령들과 마주한다. 익숙하다고 믿었던 삶을 다시 돌아보는 기묘한 여정. 타이 웨스트가 찰스 디킨스의 고전 〈크리스마스 캐럴〉을 새롭게 해석하고, 조니 뎁이 스크루지를 연기한다.",
      "titleStatus": "transliterated",
      "source": "https://www.paramount.com/movies/ebenezer"
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
    },
    "korean": {
      "title": "고질라 마이너스 제로",
      "synopsis": "고질라의 습격으로부터 2년이 흐른 1949년. 전쟁과 재난을 딛고 일상을 되찾으려던 시키시마 가족 앞에 또 다른 위협이 닥친다. 가까스로 붙잡은 평화가 무너지는 순간, 이들은 다시 삶과 희망을 지키기 위한 싸움에 나선다.",
      "titleStatus": "transliterated",
      "source": "https://gkids.com/2026/10/06/tickets-now-on-sale-for-godzilla-minus-zero/"
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
    "note": "In Sacramento, a high-school senior who calls herself Lady Bird dreams of leaving for college on the East Coast. During her final year at home, she navigates friendship, first love, and a loving but turbulent relationship with her mother.",
    "prompt": "Can wanting to leave and loving a place be the same feeling?",
    "link": "https://a24films.com/films/lady-bird",
    "source": "A24 / film & trailer",
    "korean": {
      "title": "레이디 버드",
      "synopsis": "캘리포니아 새크라멘토를 떠나 동부의 대학에 가고 싶은 고등학생 크리스틴은 스스로를 ‘레이디 버드’라 부른다. 졸업을 앞둔 한 해, 사랑과 우정 사이에서 자신을 찾아가는 딸과 현실을 걱정하는 엄마의 애틋하고도 격렬한 관계가 펼쳐진다.",
      "titleStatus": "official",
      "source": "https://a24films.com/films/lady-bird"
    }
  },
  {
    "id": "yang",
    "type": "revisit",
    "date": "REVISIT",
    "title": "After Yang",
    "director": "KOGONADA / 2022",
    "image": "yang-poster",
    "note": "When his daughter’s beloved android companion Yang stops working, Jake searches for a way to repair him. Memories stored inside Yang reveal an unexpected private life and change how the family sees its own everyday connections.",
    "prompt": "What ordinary moment would you want somebody to remember?",
    "link": "https://a24films.com/films/after-yang",
    "source": "A24 / film & trailer",
    "korean": {
      "title": "애프터 양",
      "synopsis": "딸이 아끼던 안드로이드 가족 양이 작동을 멈추자, 제이크는 그를 고치기 위해 기억의 조각들을 들여다본다. 수리에서 시작된 여정은 양이 혼자 간직했던 삶을 발견하는 시간으로 바뀌고, 가족은 익숙한 일상 속에서 놓쳤던 관계를 다시 바라본다.",
      "titleStatus": "official",
      "source": "https://a24films.com/films/after-yang"
    }
  },
  {
    "id": "minari",
    "type": "revisit",
    "date": "REVISIT",
    "title": "Minari",
    "director": "LEE ISAAC CHUNG / 2021",
    "image": "minari-poster",
    "note": "A Korean American family moves to rural Arkansas in the 1980s, where Jacob dreams of building a farm. As their new life tests each family member differently, the arrival of grandmother Soonja reshapes their idea of home.",
    "prompt": "What can you carry from home that isn’t an object?",
    "link": "https://a24films.com/films/minari",
    "source": "A24 / film & trailer",
    "korean": {
      "title": "미나리",
      "synopsis": "1980년대 미국 아칸소로 이주한 한국인 가족. 아버지 제이콥은 농장을 일구며 새로운 삶을 꿈꾸지만, 낯선 땅에서의 시작은 가족에게 저마다 다른 무게로 다가온다. 한국에서 온 할머니 순자가 함께하면서, 이들은 서로 다른 방식으로 뿌리내리는 법을 배워간다.",
      "titleStatus": "official",
      "source": "https://a24films.com/films/minari"
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
