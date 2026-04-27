const GUARDIAN_KEY = "b3a4e155-dc11-4852-966c-19c9b9f4b839";
const GNEWS_KEY = "a32f1f4bdab1acb4d51e5ed8cbe266e5";

let currentGuardian = "news";
let currentGnews = "breaking-news";

const getGuardianArticles = async (section) => {
  const url = `https://content.guardianapis.com/search?api-key=${GUARDIAN_KEY}&section=${section}&page=1&show-fields=thumbnail,trailText`;
  try {
    const response = await fetch(url);
    if (response.ok) {
      const jsonResponse = await response.json();
      const articles = jsonResponse.response.results;
      console.log("Guardian:", articles);
      return articles;
    }
  } catch (error) {
    console.log(error);
  }
};

const getGNewsArticles = async (topic) => {
  const url = `https://gnews.io/api/v4/top-headlines?topic=${topic}&lang=en&apikey=${GNEWS_KEY}`;
  try {
    const response = await fetch(url);
    if (response.ok) {
      const jsonResponse = await response.json();
      const articles = jsonResponse.articles;
      console.log("GNews:", articles);
      return articles;
    }
  } catch (error) {
    console.log(error);
  }
};

const parseGuardian = (articles) => {
  return articles.map(a => ({
    title: a.webTitle,
    description: a.fields?.trailText || "",
    image: a.fields?.thumbnail || "",
    url: a.webUrl,
    source: "The Guardian",
    date: a.webPublicationDate?.slice(0, 10) || ""
  }));
};

const parseGNews = (articles) => {
  return articles.map(a => ({
    title: a.title,
    description: a.description || "",
    image: a.image || "",
    url: a.url,
    source: a.source?.name || "GNews",
    date: a.publishedAt?.slice(0, 10) || ""
  }));
};

const makeCard = (article) => {
  const card = document.createElement("div");
  card.className = "article-card";
  card.innerHTML = `
    <img src="${article.image}" alt="${article.title}" onerror="this.style.display='none'" />
    <div class="card-body">
      <span class="article-source">${article.source}</span>
      <h3 class="card-headline">${article.title}</h3>
      <p class="card-desc">${article.description}</p>
      <div class="card-meta">
        <span class="article-date">${article.date}</span>
        <a href="${article.url}" target="_blank" class="btn-read">Read More</a>
      </div>
    </div>
  `;
  return card;
};

const displayHero = (article) => {
  document.getElementById("hero-article").innerHTML = `
    <img src="${article.image}" alt="${article.title}" onerror="this.style.display='none'" />
    <div class="hero-content">
      <span class="article-source">${article.source}</span>
      <h2 class="hero-headline">${article.title}</h2>
      <p class="hero-desc">${article.description}</p>
      <div class="hero-meta">
        <span class="article-date">${article.date}</span>
        <a href="${article.url}" target="_blank" class="btn-read">Read More</a>
      </div>
    </div>
  `;
};

const displayGrid = (articles) => {
  const grid = document.getElementById("article-grid");
  grid.innerHTML = "";
  articles.forEach(article => {
    grid.appendChild(makeCard(article));
  });
};

const loadArticles = async (guardianSection, gnewsTopic) => {
  const guardianRaw = await getGuardianArticles(guardianSection);
  const gnewsRaw = await getGNewsArticles(gnewsTopic);

  const guardianArticles = guardianRaw ? parseGuardian(guardianRaw) : [];
  const gnewsArticles = gnewsRaw ? parseGNews(gnewsRaw) : [];

  const all = [...guardianArticles, ...gnewsArticles];

  if (all.length === 0) return;
  displayHero(all[0]);
  displayGrid(all.slice(1));
};

document.querySelectorAll(".filter-chip").forEach(chip => {
  chip.addEventListener("click", () => {
    document.querySelectorAll(".filter-chip").forEach(c => c.classList.remove("active"));
    chip.classList.add("active");
    currentGuardian = chip.dataset.guardian;
    currentGnews = chip.dataset.gnews;
    loadArticles(currentGuardian, currentGnews);
  });
});

loadArticles(currentGuardian, currentGnews);