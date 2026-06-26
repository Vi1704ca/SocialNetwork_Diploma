const mainBlock = document.getElementById("friendsMain");
const sectionBlock = document.getElementById("section");
const sectionTitle = document.getElementById("sectionTitle");
const sectionList = document.getElementById("sectionList");
const sectionSentinel = document.getElementById("loadSentinel");

const backMainButtons = document.querySelectorAll(".back-main");
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
  navButtons.forEach(function (btn) {
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
    headers: {
      "X-Requested-With": "XMLHttpRequest",
    },
  });

  const data = await response.json();

  sectionList.insertAdjacentHTML("beforeend", data.html);

  if (window.connectFriendActionButtons) {
    window.connectFriendActionButtons(sectionList);
  }

  hasNextPage = data.has_next_page;
  isLoading = false;
}

async function openSection(section) {
  currentSection = section;
  currentPage = 1;
  hasNextPage = false;

  sectionTitle.textContent = sectionTitles[section];

  sectionList.innerHTML = "";

  mainBlock.style.display = "none";
  sectionBlock.style.display = "block";

  updateActiveNav(section);

  await loadSectionPage(section, currentPage);
}

function openMain() {
  sectionBlock.style.display = "none";
  sectionList.innerHTML = "";

  currentSection = "";
  hasNextPage = false;

  mainBlock.style.display = "block";

  updateActiveNav("main");
}

if (sectionSentinel) {
  const observer = new IntersectionObserver(
    async function (entries) {
      if (entries[0].isIntersecting && hasNextPage && !isLoading) {
        currentPage++;
        await loadSectionPage(currentSection, currentPage);
      }
    },
    {
      rootMargin: "100px",
    }
  );

  observer.observe(sectionSentinel);
}

backMainButtons.forEach(function (button) {
  button.addEventListener("click", function (event) {
    event.preventDefault();
    event.stopPropagation();
    openMain();
  });
});

document.addEventListener("click", async function (event) {
  if (event.target.closest(".action-button")) {
    return;
  }

  const targetButton = event.target.closest("[data-section-link]");

  if (!targetButton) {
    return;
  }

  event.preventDefault();

  const rawLink = targetButton.dataset.sectionLink;

  if (rawLink === "requests" || rawLink === "Запити" || rawLink === "Р—Р°РїРёС‚Рё") {
    await openSection("requests");
  }

  if (
    rawLink === "recommendations" ||
    rawLink === "Рекомендації" ||
    rawLink === "Р РµРєРѕРјРµРЅРґР°С†С–С—"
  ) {
    await openSection("recommendations");
  }

  if (
    rawLink === "friends" ||
    rawLink === "Всі Друзі" ||
    rawLink === "Всі друзі" ||
    rawLink === "Р’СЃС– Р”СЂСѓР·С–" ||
    rawLink === "Р’СЃС– РґСЂСѓР·С–"
  ) {
    await openSection("friends");
  }
});