const STARS_KEY = "stars";
const FETCH_TIME_KEY = "fetchTime";
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

function isMoreThanOneDayOld(timestamp) {
  return Date.now() - timestamp > ONE_DAY_MS;
}

async function fetchGithubStars() {
  const response = await fetch("https://api.github.com/repos/AOSSIE-Org/EduAid");
  if (!response.ok) {
    throw new Error("Failed to fetch stars");
  }

  const data = await response.json();
  return data.stargazers_count;
}

export async function getCachedGithubStars() {
  const storedStars = localStorage.getItem(STARS_KEY);
  const storedTime = localStorage.getItem(FETCH_TIME_KEY);

  if (storedStars && storedTime && !isMoreThanOneDayOld(Number(storedTime))) {
    return Number(storedStars);
  }

  const stars = await fetchGithubStars();
  localStorage.setItem(STARS_KEY, String(stars));
  localStorage.setItem(FETCH_TIME_KEY, String(Date.now()));
  return stars;
}
