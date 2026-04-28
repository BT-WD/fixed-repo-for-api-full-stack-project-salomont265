const guardianKey = "b3a4e155-dc11-4852-966c-19c9b9f4b839";
const gnewsKey = "a32f1f4bdab1acb4d51e5ed8cbe266e5";

// keeping track of what category we're on
let guardianSection = "news";
let gnewsTopic = "breaking-news";

async function fetchGuardian(section) {
  let url = "https://content.guardianapis.com/search?api-key=" + guardianKey + "&section=" + section + "&page=1&show-fields=thumbnail,trailText";
  
  const res = await fetch(url);
  if (!res.ok) {
    console.log("guardian fetch failed", res.status);
    return [];
  }
  const data = await res.json();
  console.log("guardian data", data);
  
  // pull out just what we need from each article
  let articles = [];
  for (let i = 0; i < data.response.results.length; i++) {
    let a = data.response.results[i];
    articles.push({
      title: a.webTitle,
      desc: a.fields.trailText || "no description",
      img: a.fields.thumbnail || "",
      link: a.webUrl,
      from: "The Guardian",
      date: a.webPublicationDate.slice(0, 10)
    });
  }
  return articles;
}

async function fetchGnews(topic) {
  let url = "https://gnews.io/api/v4/top-headlines?topic=" + topic + "&lang=en&apikey=" + gnewsKey;
  
  const res = await fetch(url);
  if (!res.ok) {
    console.log("gnews fetch failed", res.status);
    return [];
  }
  const data = await res.json();
  console.log("gnews data", data);
  
  let articles = [];
  for (let i = 0; i < data.articles.length; i++) {
    let a = data.articles[i];
    articles.push({
      title: a.title,
      desc: a.description || "no description",
      img: a.image || "",
      link: a.url,
      from: a.source.name,
      date: a.publishedAt.slice(0, 10)
    });
  }
  return articles;
}

function showHero(article) {
  let hero = document.getElementById("hero-article");
  
  let saved = getSavedArticles();
  let alreadySaved = saved.some(s => s.link === article.link);
  let btnText = alreadySaved ? "Saved ✓" : "Save Article";

  hero.innerHTML = `
    <img src="${article.img}" onerror="this.style.display='none'" />
    <div class="hero-content">
      <span class="article-source">${article.from}</span>
      <h2 class="hero-headline">${article.title}</h2>
      <p class="hero-desc">${article.desc}</p>
      <div class="hero-meta">
        <span class="article-date">${article.date}</span>
        <a href="${article.link}" target="_blank" class="btn-read">Read More</a>
        <button class="btn-save" id="hero-save-btn">${btnText}</button>
      </div>
    </div>
  `;

  document.getElementById("hero-save-btn").addEventListener("click", function() {
    handleSave(article, this);
  });
}

function makeArticleCard(article) {
  let card = document.createElement("div");
  card.className = "article-card";

  let saved = getSavedArticles();
  let alreadySaved = saved.some(s => s.link === article.link);
  let btnText = alreadySaved ? "Saved ✓" : "Save";

  card.innerHTML = `
    <img src="${article.img}" onerror="this.style.display='none'" />
    <div class="card-body">
      <span class="article-source">${article.from}</span>
      <h3 class="card-headline">${article.title}</h3>
      <p class="card-desc">${article.desc}</p>
      <div class="card-meta">
        <span class="article-date">${article.date}</span>
        <a href="${article.link}" target="_blank" class="btn-read">Read More</a>
        <button class="btn-save">${btnText}</button>
      </div>
    </div>
  `;

  card.querySelector(".btn-save").addEventListener("click", function() {
    handleSave(article, this);
  });

  return card;
}

function showArticles(allArticles) {
  if (allArticles.length === 0) {
    console.log("no articles to show");
    return;
  }
  showHero(allArticles[0]);

  let grid = document.getElementById("article-grid");
  grid.innerHTML = "";
  for (let i = 1; i < allArticles.length; i++) {
    grid.appendChild(makeArticleCard(allArticles[i]));
  }
}

async function loadNews() {
  let guardianArticles = await fetchGuardian(guardianSection);
  let gnewsArticles = await fetchGnews(gnewsTopic);
  let combined = guardianArticles.concat(gnewsArticles);
  showArticles(combined);
}

// localStorage stuff
function getSavedArticles() {
  let saved = localStorage.getItem("saved_articles");
  if (saved == null) return [];
  return JSON.parse(saved);
}

function handleSave(article, btn) {
  let saved = getSavedArticles();
  let alreadySaved = saved.some(s => s.link === article.link);

  if (alreadySaved) {
    // unsave it
    let updated = saved.filter(s => s.link !== article.link);
    localStorage.setItem("saved_articles", JSON.stringify(updated));
    btn.textContent = "Save";
    btn.classList.remove("saved");
    console.log("removed from saved:", article.title);
  } else {
    // save it
    saved.push(article);
    localStorage.setItem("saved_articles", JSON.stringify(saved));
    btn.textContent = "Saved ✓";
    btn.classList.add("saved");
    console.log("saved article:", article.title);
  }
}

function showSavedModal() {
  let saved = getSavedArticles();
  let list = document.getElementById("saved-articles-list");
  list.innerHTML = "";

  if (saved.length == 0) {
    list.innerHTML = "<p class='empty-state'>Nothing saved yet.</p>";
    return;
  }

  for (let i = 0; i < saved.length; i++) {
    let a = saved[i];
    let item = document.createElement("div");
    item.className = "article-card";
    item.innerHTML = `
      <div class="card-body">
        <span class="article-source">${a.from}</span>
        <h3 class="card-headline">${a.title}</h3>
        <div class="card-meta">
          <span class="article-date">${a.date}</span>
          <a href="${a.link}" target="_blank" class="btn-read">Read More</a>
          <button class="btn-remove" data-link="${a.link}">Remove</button>
        </div>
      </div>
    `;
    item.querySelector(".btn-remove").addEventListener("click", function() {
      let updated = getSavedArticles().filter(s => s.link !== a.link);
      localStorage.setItem("saved_articles", JSON.stringify(updated));
      showSavedModal();
    });
    list.appendChild(item);
  }
}

// filter chips
let chips = document.querySelectorAll(".filter-chip");
for (let i = 0; i < chips.length; i++) {
  chips[i].addEventListener("click", function() {
    for (let j = 0; j < chips.length; j++) chips[j].classList.remove("active");
    this.classList.add("active");
    guardianSection = this.dataset.guardian;
    gnewsTopic = this.dataset.gnews;
    loadNews();
  });
}

document.getElementById("saved-btn").addEventListener("click", function() {
  showSavedModal();
  document.getElementById("saved-modal").classList.remove("hidden");
});

document.getElementById("close-modal").addEventListener("click", function() {
  document.getElementById("saved-modal").classList.add("hidden");
});

document.getElementById("modal-overlay").addEventListener("click", function() {
  document.getElementById("saved-modal").classList.add("hidden");
});

loadNews();