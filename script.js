const STORAGE_KEY = "soft-noise-notebook-v1";

const seedPosts = [
  {
    id: "the-shape-of-an-unfinished-thought",
    title: "The shape of an unfinished thought",
    category: "Field notes",
    author: "A. Somewhere",
    excerpt: "I used to think a thought had to arrive fully dressed. Turns out, most of mine come in through the side door.",
    body: `I used to think a thought had to arrive fully dressed.

With its shoes on.
Its coat buttoned.
A good reason for being there.

Turns out, most of mine come in through the side door.

They sit on the kitchen floor for a while.
Say nothing.
Look at the light moving across the tiles like it has nowhere else to be.

And I try not to ask them what they want.

I am learning to let an unfinished thing be a thing.
Not a promise. Not a task.
Just a small, open window
the afternoon keeps drifting through.`,
    createdAt: "2025-10-19T11:12:00.000Z",
    status: "published",
  },
  {
    id: "inventory-of-small-weather",
    title: "An inventory of small weather",
    category: "Small things",
    author: "A. Somewhere",
    excerpt: "A list for the days that don't make it into the photographs.",
    body: `The sun on the mug before the coffee is ready.

One sock, somehow, on the stairs.
The hallway smelling like rain though it hasn't rained.

Someone laughing in the apartment upstairs.
The tiny blue bit of sky
between two buildings I keep meaning to look up.

The exact minute the day gives up pretending
it is still morning.

None of this changes anything.
That is not the same as saying
it means nothing.`,
    createdAt: "2025-10-16T08:30:00.000Z",
    status: "published",
  },
  {
    id: "a-letter-to-the-long-way-home",
    title: "A letter to the long way home",
    category: "Letters",
    author: "A. Somewhere",
    excerpt: "Dear detour: you were never really about getting lost.",
    body: `Dear detour,

You were never really about getting lost.

You were the bit after the train,
when the headphones ran out of battery
and the city started talking in its normal voice.

The bakery closing up.
The shopkeeper watering a plant.
A dog taking the kind of long, serious sniff
that makes you wonder what it knows.

I kept calling it the long way home
as if home were a pin on a map.

It was more like this:
one unhurried step,
and then another.`,
    createdAt: "2025-10-12T16:00:00.000Z",
    status: "published",
  },
];

const elements = {
  postList: document.querySelector("#post-list"),
  postCount: document.querySelector("#post-count"),
  searchInput: document.querySelector("#search-input"),
  emptySearch: document.querySelector("#empty-search"),
  filterButtons: document.querySelectorAll(".filter-chip"),
  editorDialog: document.querySelector("#editor-dialog"),
  editorForm: document.querySelector("#editor-form"),
  editorTitle: document.querySelector("#editor-title"),
  postTitle: document.querySelector("#post-title"),
  postCategory: document.querySelector("#post-category"),
  postAuthor: document.querySelector("#post-author"),
  postExcerpt: document.querySelector("#post-excerpt"),
  postBody: document.querySelector("#post-body"),
  wordCount: document.querySelector("#word-count"),
  readerDialog: document.querySelector("#reader-dialog"),
  readerContent: document.querySelector("#reader-content"),
  toast: document.querySelector("#toast"),
};

let selectedCategory = "All";
let activePostId = null;
let editingPostId = null;
let toastTimer;
let posts = loadPosts();

function loadPosts() {
  try {
    const savedPosts = localStorage.getItem(STORAGE_KEY);
    if (savedPosts === null) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(seedPosts));
      return [...seedPosts];
    }

    const parsedPosts = JSON.parse(savedPosts);
    if (!Array.isArray(parsedPosts)) {
      throw new Error("Saved notebook data has an unexpected format.");
    }
    return parsedPosts.filter(isPost);
  } catch (error) {
    console.error("Could not load the saved notebook.", error);
    showToast("Your saved notebook could not be loaded. Check your browser storage settings.");
    return [...seedPosts];
  }
}

function isPost(post) {
  return (
    post !== null &&
    typeof post === "object" &&
    typeof post.id === "string" &&
    typeof post.title === "string" &&
    typeof post.category === "string" &&
    typeof post.body === "string" &&
    typeof post.createdAt === "string" &&
    (post.status === "published" || post.status === "draft")
  );
}

function savePosts() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(posts));
    return true;
  } catch (error) {
    console.error("Could not save the notebook.", error);
    showToast("This change could not be saved. Your browser storage may be full or unavailable.");
    return false;
  }
}

function makeElement(tagName, className, text) {
  const node = document.createElement(tagName);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function formatDate(dateString) {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "a little while ago";
  return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", year: "numeric" }).format(date);
}

function getReadingTime(body) {
  const words = body.trim().split(/\s+/).filter(Boolean).length;
  return `${Math.max(1, Math.ceil(words / 220))} min read`;
}

function getVisiblePosts() {
  const query = elements.searchInput.value.trim().toLocaleLowerCase();
  return [...posts]
    .filter((post) => selectedCategory === "All" || post.category === selectedCategory)
    .filter((post) => {
      const matchesQuery = `${post.title} ${post.category} ${post.author || ""} ${post.excerpt || ""} ${post.body}`
        .toLocaleLowerCase()
        .includes(query);
      return matchesQuery;
    })
    .sort((first, second) => new Date(second.createdAt) - new Date(first.createdAt));
}

function renderPosts() {
  const visiblePosts = getVisiblePosts();
  const publishedCount = posts.filter((post) => post.status === "published").length;
  elements.postCount.textContent = `${publishedCount} ${publishedCount === 1 ? "piece" : "pieces"}`;
  elements.postList.replaceChildren(...visiblePosts.map(renderPostCard));
  elements.emptySearch.hidden = visiblePosts.length > 0;
}

function renderPostCard(post, index) {
  const card = makeElement("article", "post-card");
  card.style.animationDelay = `${Math.min(index, 6) * 55}ms`;
  const art = makeElement("div", "post-art");
  art.setAttribute("aria-hidden", "true");
  art.append(makeElement("span", "post-art-mark", post.title.trim().charAt(0) || "s"));
  art.append(makeElement("span", "post-art-index", `Nº 0${index + 1}`));

  const copy = makeElement("div", "post-copy");
  const meta = makeElement("div", "post-meta");
  meta.append(makeElement("span", "category-mark"), makeElement("span", "", post.category));
  meta.append(makeElement("span", "", "·"));
  meta.append(makeElement("span", "", formatDate(post.createdAt)));
  meta.append(makeElement("span", "", "·"));
  meta.append(makeElement("span", "", getReadingTime(post.body)));

  const title = makeElement("h3", "", post.title);
  const excerpt = makeElement("p", "post-excerpt", post.excerpt || post.body);
  const actions = makeElement("div", "post-card-actions");
  const readButton = makeElement("button", "text-link read-link", "Read this piece");
  readButton.type = "button";
  readButton.dataset.action = "read";
  readButton.dataset.postId = post.id;
  const arrow = makeElement("span", "", "↗");
  arrow.setAttribute("aria-hidden", "true");
  readButton.append(arrow);
  actions.append(readButton);
  if (post.status === "draft") actions.append(makeElement("span", "draft-badge", "Saved draft"));

  copy.append(meta, title, excerpt, actions);
  card.append(art, copy);
  return card;
}

function openEditor(post = null) {
  editingPostId = post?.id || null;
  elements.editorForm.reset();
  elements.editorTitle.innerHTML = post ? "Back to a <em>thought.</em>" : "Start a new <em>thought.</em>";
  if (post) {
    elements.postTitle.value = post.title;
    elements.postCategory.value = post.category;
    elements.postAuthor.value = post.author || "";
    elements.postExcerpt.value = post.excerpt || "";
    elements.postBody.value = post.body;
  }
  updateWordCount();
  elements.editorDialog.showModal();
  elements.postTitle.focus();
}

function openReader(post) {
  if (!post) return;
  activePostId = post.id;
  const meta = makeElement("div", "post-meta");
  meta.append(makeElement("span", "category-mark"), makeElement("span", "", post.category));
  meta.append(makeElement("span", "", "·"), makeElement("span", "", formatDate(post.createdAt)));
  meta.append(makeElement("span", "", "·"), makeElement("span", "", getReadingTime(post.body)));
  if (post.author) {
    meta.append(makeElement("span", "", "·"), makeElement("span", "", `BY ${post.author}`));
  }
  const title = makeElement("h2", "", post.title);
  title.id = "reader-title";
  const children = [meta, title];
  if (post.excerpt) children.push(makeElement("p", "reader-excerpt", post.excerpt));
  children.push(makeElement("div", "reader-body", post.body));
  if (post.status === "draft") {
    children.push(makeElement("p", "draft-badge", "This is a saved draft"));
  }
  elements.readerContent.replaceChildren(...children);
  elements.readerDialog.showModal();
}

function updateWordCount() {
  const count = elements.postBody.value.trim().split(/\s+/).filter(Boolean).length;
  elements.wordCount.textContent = `${count} ${count === 1 ? "word" : "words"}`;
}

function showToast(message) {
  elements.toast.textContent = message;
  elements.toast.classList.add("visible");
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => elements.toast.classList.remove("visible"), 3200);
}

document.querySelectorAll(".write-trigger").forEach((button) => {
  button.addEventListener("click", () => openEditor());
});

document.querySelectorAll(".close-editor").forEach((button) => {
  button.addEventListener("click", () => elements.editorDialog.close());
});

document.querySelector(".close-reader").addEventListener("click", () => elements.readerDialog.close());
elements.postBody.addEventListener("input", updateWordCount);
elements.searchInput.addEventListener("input", renderPosts);
document.querySelector(".clear-search").addEventListener("click", () => {
  elements.searchInput.value = "";
  elements.searchInput.focus();
  renderPosts();
});

elements.filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    selectedCategory = button.dataset.filter;
    elements.filterButtons.forEach((filterButton) => {
      filterButton.classList.toggle("active", filterButton === button);
      filterButton.setAttribute("aria-pressed", String(filterButton === button));
    });
    renderPosts();
  });
});

elements.postList.addEventListener("click", (event) => {
  const button = event.target.closest("[data-action='read']");
  if (!button) return;
  openReader(posts.find((post) => post.id === button.dataset.postId));
});

elements.editorForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const formData = new FormData(elements.editorForm);
  const existingPost = posts.find((post) => post.id === editingPostId);
  const post = {
    id: editingPostId || `${Date.now()}-${crypto.randomUUID()}`,
    title: String(formData.get("title")).trim(),
    category: String(formData.get("category")),
    author: String(formData.get("author")).trim(),
    excerpt: String(formData.get("excerpt")).trim(),
    body: String(formData.get("body")).trim(),
    createdAt: existingPost?.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    status: event.submitter?.value === "draft" ? "draft" : "published",
  };

  if (!post.title || !post.body) {
    elements.editorForm.reportValidity();
    return;
  }

  posts = editingPostId
    ? posts.map((savedPost) => savedPost.id === editingPostId ? post : savedPost)
    : [post, ...posts];

  if (!savePosts()) return;
  elements.editorDialog.close();
  renderPosts();
  showToast(post.status === "draft" ? "Your words are tucked away as a draft." : "Your piece is out in the world.");
});

document.querySelector(".edit-post").addEventListener("click", () => {
  const post = posts.find((savedPost) => savedPost.id === activePostId);
  elements.readerDialog.close();
  if (post) openEditor(post);
});

document.querySelector(".delete-post").addEventListener("click", () => {
  const post = posts.find((savedPost) => savedPost.id === activePostId);
  if (!post || !window.confirm(`Remove “${post.title}” from your notebook? This cannot be undone.`)) return;
  const previousPosts = posts;
  posts = posts.filter((savedPost) => savedPost.id !== activePostId);
  if (!savePosts()) {
    posts = previousPosts;
    return;
  }
  elements.readerDialog.close();
  renderPosts();
  showToast("The piece was removed from your notebook.");
});

document.addEventListener("keydown", (event) => {
  if (event.key !== "/" || event.metaKey || event.ctrlKey || event.altKey) return;
  const target = event.target;
  if (target instanceof HTMLElement && (target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName))) return;
  event.preventDefault();
  elements.searchInput.focus();
});

renderPosts();
