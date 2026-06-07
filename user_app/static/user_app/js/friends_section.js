const mainBlock = document.getElementById("friendsMain");
const sectionBlock = document.getElementById("section");
const sectionTitle = document.getElementById("sectionTitle");
const sectionList = document.getElementById("sectionList");
const sectionSentinel = document.getElementById("loadSentinel");

const backMainButtons = document.querySelectorAll(".back-main");
const sectionButtons = document.querySelectorAll("[data-section-link]");
const navButtons = document.querySelectorAll(".sidebar nav button");

const sectionTitles = {
  requests: "Запити",
  recommendations: "Рекомендації",
  friends: "Всі Друзі",
};

let currentSection = "";
let currentPage = 1;
let hasNextPage = false;
let isLoading = false;


function updateActiveNav(activeKey) {
  navButtons.forEach((btn) => {
    if (btn.dataset.nav === activeKey) {
      btn.classList.add("active");
    } else {
      btn.classList.remove("active");
    }
  });
}

async function loadSectionPage(section, page) {
  isLoading = true;
  
  const response = await fetch(`/auth/friends/${section}/?page=${page}`, {
    headers: { "X-Requested-With": "XMLHttpRequest" },
  });
  const data = await response.json();
  
  sectionList.insertAdjacentHTML("beforeend", data.html);
  
  hasNextPage = data.has_next_page;
  isLoading = false;
}


async function openSection(section) {
  currentSection = section;
  currentPage = 1;
  hasNextPage = false;
  
  backMainButtons.forEach(btn => btn.textContent = "Головна");
  const titleText = sectionTitles[section];
  sectionTitle.textContent = titleText;
  
  sectionBlock.classList.add("section");
  sectionBlock.setAttribute("data-section-link", titleText);
  sectionBlock.setAttribute("data-section-type", titleText);

  sectionList.innerHTML = "";
  mainBlock.style.display = "none";
  sectionBlock.style.display = "block";

  updateActiveNav(section);
  await loadSectionPage(section, currentPage);
}

function openMain() {
  sectionBlock.style.display = "none";
  sectionList.innerHTML = "";
  
  backMainButtons.forEach(btn => btn.textContent = "Головна");

  sectionBlock.classList.remove("section");
  sectionBlock.removeAttribute("data-section-link");
  sectionBlock.removeAttribute("data-section-type");

  currentSection = "";
  hasNextPage = false;
  mainBlock.style.display = "block";
  updateActiveNav("main");
}

let observer = null;
if (sectionSentinel) {
  observer = new IntersectionObserver(
    async (entries) => {
      if (entries[0].isIntersecting && hasNextPage && !isLoading) {
        currentPage++;
        await loadSectionPage(currentSection, currentPage);
      }
    },
    { rootMargin: "100px" },
  );
  observer.observe(sectionSentinel);
}

backMainButtons.forEach((button) => {
  button.addEventListener("click", () => {
    openMain();
  });
});

document.addEventListener("click", async (event) => {
  const targetButton = event.target.closest("[data-section-link]");
  
  if (targetButton) {
    const rawLink = targetButton.dataset.sectionLink;
    
    if (rawLink === "requests" || rawLink === "Запити") {
      await openSection("requests");
    } else if (rawLink === "recommendations" || rawLink === "Рекомендації") {
      await openSection("recommendations");
    } else if (rawLink === "friends" || rawLink === "Всі Друзі" || rawLink === "Всі друзі") {
      await openSection("friends");
    }
  }
});