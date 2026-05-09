const state = {
  questions: [],
  currentIndex: 0,
  score: 0,
  answered: false
};

const elements = {
  progressText: document.querySelector("#progressText"),
  scoreText: document.querySelector("#scoreText"),
  categoryLabel: document.querySelector("#categoryLabel"),
  difficultyLabel: document.querySelector("#difficultyLabel"),
  questionText: document.querySelector("#questionText"),
  choices: document.querySelector("#choices"),
  resultPanel: document.querySelector("#resultPanel"),
  resultBadge: document.querySelector("#resultBadge"),
  correctAnswerText: document.querySelector("#correctAnswerText"),
  explanationText: document.querySelector("#explanationText"),
  nextButton: document.querySelector("#nextButton"),
  resetButton: document.querySelector("#resetButton")
};

const choiceMarks = ["ア", "イ", "ウ", "エ"];

async function loadQuestions() {
  try {
    const response = await fetch("data/questions.json", { cache: "no-store" });
    if (!response.ok) {
      throw new Error("Question data could not be loaded.");
    }

    const data = await response.json();
    state.questions = data.questions;
    renderQuestion();
  } catch (error) {
    elements.categoryLabel.textContent = "読み込み失敗";
    elements.difficultyLabel.textContent = "-";
    elements.questionText.textContent = "問題データを読み込めませんでした。サーバー上で開いているか確認してください。";
    elements.choices.innerHTML = "";
  }
}

function renderQuestion() {
  const question = state.questions[state.currentIndex];
  state.answered = false;

  elements.progressText.textContent = `${state.currentIndex + 1} / ${state.questions.length}`;
  elements.scoreText.textContent = `${state.score}問正解`;
  elements.categoryLabel.textContent = question.category;
  elements.difficultyLabel.textContent = question.difficulty;
  elements.questionText.textContent = question.question;
  elements.resultPanel.classList.add("hidden");
  elements.nextButton.disabled = true;
  elements.nextButton.textContent = state.currentIndex === state.questions.length - 1 ? "結果を見る" : "次の問題へ";

  elements.choices.innerHTML = "";
  question.choices.forEach((choice, index) => {
    const button = document.createElement("button");
    button.className = "choice-button";
    button.type = "button";
    button.dataset.index = String(index);
    button.innerHTML = `
      <span class="choice-mark">${choiceMarks[index]}</span>
      <span class="choice-label">${choice}</span>
    `;
    button.addEventListener("click", () => answerQuestion(index));
    elements.choices.appendChild(button);
  });
}

function answerQuestion(selectedIndex) {
  if (state.answered) {
    return;
  }

  const question = state.questions[state.currentIndex];
  const isCorrect = selectedIndex === question.answerIndex;
  state.answered = true;

  if (isCorrect) {
    state.score += 1;
  }

  [...elements.choices.children].forEach((button) => {
    const buttonIndex = Number(button.dataset.index);
    button.disabled = true;
    if (buttonIndex === question.answerIndex) {
      button.classList.add("correct");
    } else if (buttonIndex === selectedIndex) {
      button.classList.add("wrong");
    }
  });

  elements.scoreText.textContent = `${state.score}問正解`;
  elements.resultPanel.classList.remove("hidden");
  elements.resultBadge.textContent = isCorrect ? "正解" : "不正解";
  elements.resultBadge.className = `result-badge ${isCorrect ? "ok" : "ng"}`;
  elements.correctAnswerText.textContent = `正解: ${choiceMarks[question.answerIndex]}. ${question.choices[question.answerIndex]}`;
  elements.explanationText.textContent = question.explanation;
  elements.nextButton.disabled = false;
}

function goNext() {
  if (!state.answered) {
    return;
  }

  if (state.currentIndex < state.questions.length - 1) {
    state.currentIndex += 1;
    renderQuestion();
    window.scrollTo({ top: 0, behavior: "smooth" });
    return;
  }

  renderResult();
}

function renderResult() {
  const total = state.questions.length;
  const percent = Math.round((state.score / total) * 100);
  elements.progressText.textContent = `${total} / ${total}`;
  elements.categoryLabel.textContent = "学習結果";
  elements.difficultyLabel.textContent = `${percent}%`;
  elements.questionText.textContent = `${total}問中 ${state.score}問正解でした。`;
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
  state.currentIndex = 0;
  state.score = 0;
  state.answered = false;
  if (state.questions.length > 0) {
    renderQuestion();
  }
  window.scrollTo({ top: 0, behavior: "smooth" });
}

elements.nextButton.addEventListener("click", goNext);
elements.resetButton.addEventListener("click", resetQuiz);

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("sw.js").catch(() => {
      // The app still works online if service worker registration is blocked.
    });
  });
}

loadQuestions();
