const APP_VERSION = "v0.7.0";

const state = {
  sourceQuestions: [],
  sessionQuestions: [],
  currentIndex: 0,
  score: 0,
  answered: false,
  mode: "normal",
  selectedCategory: "",
  stats: createEmptyStats()
};

const elements = {
  progressText: document.querySelector("#progressText"),
  scoreText: document.querySelector("#scoreText"),
  totalAnswersText: document.querySelector("#totalAnswersText"),
  totalCorrectText: document.querySelector("#totalCorrectText"),
  accuracyText: document.querySelector("#accuracyText"),
  categoryLabel: document.querySelector("#categoryLabel"),
  difficultyLabel: document.querySelector("#difficultyLabel"),
  questionText: document.querySelector("#questionText"),
  choices: document.querySelector("#choices"),
  resultPanel: document.querySelector("#resultPanel"),
  resultBadge: document.querySelector("#resultBadge"),
  correctAnswerText: document.querySelector("#correctAnswerText"),
  explanationText: document.querySelector("#explanationText"),
  nextButton: document.querySelector("#nextButton"),
  resetButton: document.querySelector("#resetButton"),
  menuButton: document.querySelector("#menuButton"),
  menuOverlay: document.querySelector("#menuOverlay"),
  menuBackdrop: document.querySelector("#menuBackdrop"),
  closeMenuButton: document.querySelector("#closeMenuButton"),
  normalModeButton: document.querySelector("#normalModeButton"),
  reviewModeButton: document.querySelector("#reviewModeButton"),
  showStatsButton: document.querySelector("#showStatsButton"),
  showHelpButton: document.querySelector("#showHelpButton"),
  resetStatsButton: document.querySelector("#resetStatsButton"),
  categorySelect: document.querySelector("#categorySelect"),
  categoryStartButton: document.querySelector("#categoryStartButton"),
  menuStatsPanel: document.querySelector("#menuStatsPanel"),
  helpPanel: document.querySelector("#helpPanel"),
  sheetTotalAnswersText: document.querySelector("#sheetTotalAnswersText"),
  sheetTotalCorrectText: document.querySelector("#sheetTotalCorrectText"),
  sheetAccuracyText: document.querySelector("#sheetAccuracyText"),
  sheetReviewCountText: document.querySelector("#sheetReviewCountText"),
  appVersionText: document.querySelector("#appVersionText"),
  questionCountText: document.querySelector("#questionCountText")
};

const choiceMarks = ["ア", "イ", "ウ", "エ"];
const STORAGE_KEY = "feAQuizStats.v1";

function createEmptyStats() {
  return {
    totalAnswers: 0,
    totalCorrect: 0,
    byQuestion: {}
  };
}

function normalizeStats(rawStats) {
  const stats = {
    ...createEmptyStats(),
    ...rawStats,
    byQuestion: rawStats && typeof rawStats.byQuestion === "object" ? rawStats.byQuestion : {}
  };

  stats.totalAnswers = Number(stats.totalAnswers) || 0;
  stats.totalCorrect = Number(stats.totalCorrect) || 0;
  Object.keys(stats.byQuestion).forEach((questionId) => {
    const questionStats = stats.byQuestion[questionId] || {};
    const history = Array.isArray(questionStats.history) ? questionStats.history : [];
    const lastAnswer = history[history.length - 1];
    stats.byQuestion[questionId] = {
      answerCount: Number(questionStats.answerCount) || 0,
      correctCount: Number(questionStats.correctCount) || 0,
      lastAnsweredAt: questionStats.lastAnsweredAt || null,
      history,
      needsReview: typeof questionStats.needsReview === "boolean"
        ? questionStats.needsReview
        : Boolean(lastAnswer && !lastAnswer.isCorrect)
    };
  });
  return stats;
}

function loadStats() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    state.stats = saved ? normalizeStats(JSON.parse(saved)) : createEmptyStats();
  } catch (error) {
    state.stats = createEmptyStats();
  }
  renderStats();
}

function saveStats() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.stats));
  renderStats();
}

function renderStats() {
  const totalAnswers = state.stats.totalAnswers;
  const totalCorrect = state.stats.totalCorrect;
  const accuracy = totalAnswers === 0 ? 0 : Math.round((totalCorrect / totalAnswers) * 100);
  const reviewCount = getReviewQuestions().length;

  elements.totalAnswersText.textContent = `${totalAnswers}問`;
  elements.totalCorrectText.textContent = `${totalCorrect}問`;
  elements.accuracyText.textContent = `${accuracy}%`;
  elements.sheetTotalAnswersText.textContent = `${totalAnswers}問`;
  elements.sheetTotalCorrectText.textContent = `${totalCorrect}問`;
  elements.sheetAccuracyText.textContent = `${accuracy}%`;
  elements.sheetReviewCountText.textContent = `${reviewCount}問`;
  updateMenuLabels();
}

function updateMenuLabels() {
  const reviewCount = getReviewQuestions().length;
  elements.reviewModeButton.textContent = state.mode === "review" ? "通常モードへ" : `復習モード ${reviewCount}問`;
  elements.reviewModeButton.disabled = state.mode !== "review" && reviewCount === 0;
  elements.appVersionText.textContent = APP_VERSION;
  elements.questionCountText.textContent = `${state.sourceQuestions.length}問`;
}

function recordAnswer(question, selectedChoice, isCorrect) {
  const answeredAt = new Date().toISOString();
  const questionStats = state.stats.byQuestion[question.id] || {
    answerCount: 0,
    correctCount: 0,
    lastAnsweredAt: null,
    history: [],
    needsReview: false
  };

  questionStats.answerCount += 1;
  questionStats.correctCount += isCorrect ? 1 : 0;
  questionStats.lastAnsweredAt = answeredAt;
  questionStats.needsReview = !isCorrect;
  questionStats.history.push({
    answeredAt,
    selectedOriginalIndex: selectedChoice.originalIndex,
    correctOriginalIndex: question.answerIndex,
    isCorrect
  });

  state.stats.totalAnswers += 1;
  state.stats.totalCorrect += isCorrect ? 1 : 0;
  state.stats.byQuestion[question.id] = questionStats;
  saveStats();
}

function resetSavedStats() {
  const shouldReset = confirm("保存された成績をリセットしますか？");
  if (!shouldReset) {
    return;
  }

  state.stats = createEmptyStats();
  localStorage.removeItem(STORAGE_KEY);
  renderStats();
  if (state.mode === "review") {
    renderReviewComplete();
  }
}

function openMenu(targetPanel = "") {
  elements.menuOverlay.classList.remove("hidden");
  elements.menuOverlay.setAttribute("aria-hidden", "false");
  elements.menuButton.setAttribute("aria-expanded", "true");
  if (targetPanel === "stats") {
    showStatsPanel();
  } else if (targetPanel === "help") {
    showHelpPanel();
  }
}

function closeMenu() {
  elements.menuOverlay.classList.add("hidden");
  elements.menuOverlay.setAttribute("aria-hidden", "true");
  elements.menuButton.setAttribute("aria-expanded", "false");
}

function showStatsPanel() {
  elements.menuStatsPanel.classList.remove("hidden");
  elements.helpPanel.classList.add("hidden");
  renderStats();
}

function showHelpPanel() {
  elements.helpPanel.classList.remove("hidden");
  elements.menuStatsPanel.classList.add("hidden");
  updateMenuLabels();
}

async function loadQuestions() {
  try {
    const response = await fetch("data/questions.json", { cache: "no-store" });
    if (!response.ok) {
      throw new Error("Question data could not be loaded.");
    }

    const data = await response.json();
    state.sourceQuestions = data.questions;
    renderCategoryOptions();
    startNormalSession();
  } catch (error) {
    elements.categoryLabel.textContent = "読み込み失敗";
    elements.difficultyLabel.textContent = "-";
    elements.questionText.textContent = "問題データを読み込めませんでした。サーバー上で開いているか確認してください。";
    elements.choices.innerHTML = "";
  }
}

function getReviewQuestions() {
  if (state.sourceQuestions.length === 0) {
    return [];
  }

  return state.sourceQuestions.filter((question) => {
    return Boolean(state.stats.byQuestion[question.id] && state.stats.byQuestion[question.id].needsReview);
  });
}

function renderCategoryOptions() {
  const categories = [...new Set(state.sourceQuestions.map((question) => question.category))].sort((a, b) => a.localeCompare(b, "ja"));
  elements.categorySelect.innerHTML = "";

  const allOption = document.createElement("option");
  allOption.value = "";
  allOption.textContent = "全カテゴリ";
  elements.categorySelect.appendChild(allOption);

  categories.forEach((category) => {
    const count = state.sourceQuestions.filter((question) => question.category === category).length;
    const option = document.createElement("option");
    option.value = category;
    option.textContent = `${category}（${count}問）`;
    elements.categorySelect.appendChild(option);
  });
}

function shuffleArray(items) {
  const shuffled = [...items];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[randomIndex]] = [shuffled[randomIndex], shuffled[index]];
  }
  return shuffled;
}

function createSessionQuestion(question) {
  const shuffledChoices = shuffleArray(
    question.choices.map((choice, originalIndex) => ({
      choice,
      originalIndex
    }))
  );

  return {
    ...question,
    shuffledChoices
  };
}

function startNormalSession() {
  state.mode = "normal";
  state.selectedCategory = "";
  startSession(state.sourceQuestions);
}

function startCategorySession(category) {
  const questions = category
    ? state.sourceQuestions.filter((question) => question.category === category)
    : state.sourceQuestions;

  state.mode = category ? "category" : "normal";
  state.selectedCategory = category;
  startSession(questions);
}

function startReviewSession() {
  state.mode = "review";
  const reviewQuestions = getReviewQuestions();
  if (reviewQuestions.length === 0) {
    state.sessionQuestions = [];
    state.currentIndex = 0;
    state.score = 0;
    state.answered = false;
    renderReviewComplete();
    updateMenuLabels();
    return;
  }

  startSession(reviewQuestions);
}

function startSession(questions) {
  state.sessionQuestions = shuffleArray(questions).map(createSessionQuestion);
  state.currentIndex = 0;
  state.score = 0;
  state.answered = false;
  renderQuestion();
  updateMenuLabels();
}

function renderQuestion() {
  const question = state.sessionQuestions[state.currentIndex];
  state.answered = false;

  elements.progressText.textContent = `${state.currentIndex + 1} / ${state.sessionQuestions.length}`;
  elements.scoreText.textContent = `${state.score}問正解`;
  elements.categoryLabel.textContent = question.category;
  elements.difficultyLabel.textContent = question.difficulty;
  if (state.mode === "review") {
    elements.categoryLabel.textContent = "復習モード";
    elements.difficultyLabel.textContent = question.category;
  } else if (state.mode === "category") {
    elements.categoryLabel.textContent = "カテゴリ出題";
    elements.difficultyLabel.textContent = state.selectedCategory;
  }
  elements.questionText.textContent = question.question;
  elements.resultPanel.classList.add("hidden");
  elements.nextButton.disabled = true;
  elements.nextButton.textContent = state.currentIndex === state.sessionQuestions.length - 1 ? "全問終了を見る" : "次の問題へ";

  elements.choices.innerHTML = "";
  question.shuffledChoices.forEach((item, index) => {
    const button = document.createElement("button");
    button.className = "choice-button";
    button.type = "button";
    button.dataset.index = String(index);
    button.dataset.originalIndex = String(item.originalIndex);
    button.innerHTML = `
      <span class="choice-mark">${choiceMarks[index]}</span>
      <span class="choice-label">${item.choice}</span>
    `;
    button.addEventListener("click", () => answerQuestion(index));
    elements.choices.appendChild(button);
  });
}

function answerQuestion(selectedIndex) {
  if (state.answered) {
    return;
  }

  const question = state.sessionQuestions[state.currentIndex];
  const selectedChoice = question.shuffledChoices[selectedIndex];
  const correctDisplayIndex = question.shuffledChoices.findIndex((item) => item.originalIndex === question.answerIndex);
  const correctChoice = question.shuffledChoices[correctDisplayIndex];
  const isCorrect = selectedChoice.originalIndex === question.answerIndex;
  state.answered = true;

  if (isCorrect) {
    state.score += 1;
  }

  recordAnswer(question, selectedChoice, isCorrect);

  [...elements.choices.children].forEach((button) => {
    const buttonIndex = Number(button.dataset.index);
    const originalIndex = Number(button.dataset.originalIndex);
    button.disabled = true;
    if (originalIndex === question.answerIndex) {
      button.classList.add("correct");
    } else if (buttonIndex === selectedIndex) {
      button.classList.add("wrong");
    }
  });

  elements.scoreText.textContent = `${state.score}問正解`;
  elements.resultPanel.classList.remove("hidden");
  elements.resultBadge.textContent = isCorrect ? "正解" : "不正解";
  elements.resultBadge.className = `result-badge ${isCorrect ? "ok" : "ng"}`;
  elements.correctAnswerText.textContent = `正解: ${choiceMarks[correctDisplayIndex]}. ${correctChoice.choice}`;
  elements.explanationText.textContent = question.explanation;
  elements.nextButton.disabled = false;
}

function goNext() {
  if (!state.answered) {
    return;
  }

  if (state.mode === "review" && getReviewQuestions().length === 0) {
    renderReviewComplete();
    window.scrollTo({ top: 0, behavior: "smooth" });
    return;
  }

  if (state.currentIndex < state.sessionQuestions.length - 1) {
    state.currentIndex += 1;
    renderQuestion();
    window.scrollTo({ top: 0, behavior: "smooth" });
    return;
  }

  renderResult();
}

function renderResult() {
  const total = state.sessionQuestions.length;
  const percent = Math.round((state.score / total) * 100);
  const reviewLeft = getReviewQuestions().length;
  elements.progressText.textContent = `${total} / ${total}`;
  elements.categoryLabel.textContent = state.mode === "review" && reviewLeft === 0 ? "復習完了" : "全問終了";
  elements.difficultyLabel.textContent = `${percent}%`;
  elements.questionText.textContent = state.mode === "review"
    ? `復習終了。${total}問中 ${state.score}問正解、残りの復習対象は${reviewLeft}問です。`
    : `全問終了。${total}問中 ${state.score}問正解でした。`;
  elements.choices.innerHTML = "";
  elements.resultPanel.classList.remove("hidden");
  const isReviewComplete = state.mode === "review" && reviewLeft === 0;
  elements.resultBadge.textContent = isReviewComplete ? "復習完了" : percent >= 80 ? "良好" : "復習";
  elements.resultBadge.className = `result-badge ${isReviewComplete || percent >= 80 ? "ok" : "ng"}`;
  elements.correctAnswerText.textContent = "もう一度解く場合は「最初から」を押してください。";
  elements.explanationText.textContent = "問題を追加するときは data/questions.json の questions 配列に同じ形式で追加できます。";
  elements.nextButton.disabled = true;
  elements.nextButton.textContent = "完了";
  updateMenuLabels();
}

function renderReviewComplete() {
  state.mode = "review";
  state.sessionQuestions = [];
  state.answered = false;
  elements.progressText.textContent = "0 / 0";
  elements.scoreText.textContent = `${state.score}問正解`;
  elements.categoryLabel.textContent = "復習完了";
  elements.difficultyLabel.textContent = "0問";
  elements.questionText.textContent = "復習対象の問題はありません。";
  elements.choices.innerHTML = "";
  elements.resultPanel.classList.remove("hidden");
  elements.resultBadge.textContent = "復習完了";
  elements.resultBadge.className = "result-badge ok";
  elements.correctAnswerText.textContent = "間違えた問題を正解すると、復習リストから外れます。";
  elements.explanationText.textContent = "通常の出題で不正解になると、この復習モードに追加されます。";
  elements.nextButton.disabled = true;
  elements.nextButton.textContent = "完了";
  updateMenuLabels();
}

function resetQuiz() {
  if (state.sourceQuestions.length > 0) {
    if (state.mode === "review") {
      startReviewSession();
    } else if (state.mode === "category") {
      startCategorySession(state.selectedCategory);
    } else {
      startNormalSession();
    }
  }
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function toggleReviewMode() {
  if (state.mode === "review") {
    startNormalSession();
  } else {
    startReviewSession();
  }
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function startSelectedCategory() {
  startCategorySession(elements.categorySelect.value);
  closeMenu();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

elements.nextButton.addEventListener("click", goNext);
elements.resetButton.addEventListener("click", resetQuiz);
elements.menuButton.addEventListener("click", () => openMenu());
elements.closeMenuButton.addEventListener("click", closeMenu);
elements.menuBackdrop.addEventListener("click", closeMenu);
elements.normalModeButton.addEventListener("click", () => {
  startNormalSession();
  closeMenu();
  window.scrollTo({ top: 0, behavior: "smooth" });
});
elements.reviewModeButton.addEventListener("click", () => {
  toggleReviewMode();
  closeMenu();
});
elements.showStatsButton.addEventListener("click", showStatsPanel);
elements.showHelpButton.addEventListener("click", showHelpPanel);
elements.categoryStartButton.addEventListener("click", startSelectedCategory);
elements.resetStatsButton.addEventListener("click", resetSavedStats);

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !elements.menuOverlay.classList.contains("hidden")) {
    closeMenu();
  }
});

loadStats();

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("sw.js").catch(() => {
      // The app still works online if service worker registration is blocked.
    });
  });
}

loadQuestions();
