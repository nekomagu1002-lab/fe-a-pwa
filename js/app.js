const state = {
  sourceQuestions: [],
  sessionQuestions: [],
  currentIndex: 0,
  score: 0,
  answered: false,
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
  resetStatsButton: document.querySelector("#resetStatsButton")
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

  elements.totalAnswersText.textContent = `${totalAnswers}問`;
  elements.totalCorrectText.textContent = `${totalCorrect}問`;
  elements.accuracyText.textContent = `${accuracy}%`;
}

function recordAnswer(question, selectedChoice, isCorrect) {
  const answeredAt = new Date().toISOString();
  const questionStats = state.stats.byQuestion[question.id] || {
    answerCount: 0,
    correctCount: 0,
    lastAnsweredAt: null,
    history: []
  };

  questionStats.answerCount += 1;
  questionStats.correctCount += isCorrect ? 1 : 0;
  questionStats.lastAnsweredAt = answeredAt;
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
}

async function loadQuestions() {
  try {
    const response = await fetch("data/questions.json", { cache: "no-store" });
    if (!response.ok) {
      throw new Error("Question data could not be loaded.");
    }

    const data = await response.json();
    state.sourceQuestions = data.questions;
    startSession();
  } catch (error) {
    elements.categoryLabel.textContent = "読み込み失敗";
    elements.difficultyLabel.textContent = "-";
    elements.questionText.textContent = "問題データを読み込めませんでした。サーバー上で開いているか確認してください。";
    elements.choices.innerHTML = "";
  }
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

function startSession() {
  state.sessionQuestions = shuffleArray(state.sourceQuestions).map(createSessionQuestion);
  state.currentIndex = 0;
  state.score = 0;
  state.answered = false;
  renderQuestion();
}

function renderQuestion() {
  const question = state.sessionQuestions[state.currentIndex];
  state.answered = false;

  elements.progressText.textContent = `${state.currentIndex + 1} / ${state.sessionQuestions.length}`;
  elements.scoreText.textContent = `${state.score}問正解`;
  elements.categoryLabel.textContent = question.category;
  elements.difficultyLabel.textContent = question.difficulty;
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
  elements.progressText.textContent = `${total} / ${total}`;
  elements.categoryLabel.textContent = "全問終了";
  elements.difficultyLabel.textContent = `${percent}%`;
  elements.questionText.textContent = `全問終了。${total}問中 ${state.score}問正解でした。`;
  elements.choices.innerHTML = "";
  elements.resultPanel.classList.remove("hidden");
  elements.resultBadge.textContent = percent >= 80 ? "良好" : "復習";
  elements.resultBadge.className = `result-badge ${percent >= 80 ? "ok" : "ng"}`;
  elements.correctAnswerText.textContent = "もう一度解く場合は「最初から」を押してください。";
  elements.explanationText.textContent = "問題を追加するときは data/questions.json の questions 配列に同じ形式で追加できます。";
  elements.nextButton.disabled = true;
  elements.nextButton.textContent = "完了";
}

function resetQuiz() {
  if (state.sourceQuestions.length > 0) {
    startSession();
  }
  window.scrollTo({ top: 0, behavior: "smooth" });
}

elements.nextButton.addEventListener("click", goNext);
elements.resetButton.addEventListener("click", resetQuiz);
elements.resetStatsButton.addEventListener("click", resetSavedStats);

loadStats();

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("sw.js").catch(() => {
      // The app still works online if service worker registration is blocked.
    });
  });
}

loadQuestions();
