const target = document.getElementById('target');
const generateBtn = document.getElementById('generateBtn');
const clearBtn = document.getElementById('clearBtn');
const quizEl = document.getElementById('quiz');

const OPTIONS = ['ירי תקין', 'להב נמוך', 'להב גבוה', 'אצבע על ההדק בפנים', 'אצבע על ההדק בחוץ', 'יד חלשה מושכת נגדית', 'יד חלשה דוחפת', 'היורה מפיל',];

let shots = [], dims = {width: 0, height: 0}, current = 0;

function clearDots() {
    target.querySelectorAll('.dot').forEach(el => el.remove());
}

function classifyShot(x, y, width, height) {
    const centerX = width / 2, centerY = height / 2;
    const crossThickness = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--cross-thickness')) || 24;
    const dotSize = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--circle-size')) || 18;

    const validDistance = 3 * dotSize;
    const tiltThreshold = 3 * dotSize;

    const dx = x - centerX;
    const dy = y - centerY;

    const answers = new Set();

    const radialDist = Math.hypot(dx, dy);
    const onCross = (Math.abs(dx) <= crossThickness/2 && Math.abs(dy) <= crossThickness/2);
    if (onCross || radialDist <= validDistance) {
        answers.add('ירי תקין');
        return Array.from(answers);
    }
    if (dy >  crossThickness / 2) { answers.add('היורה מפיל'); answers.add('להב נמוך'); }
    if (dy < -crossThickness / 2) { answers.add('להב גבוה'); }

    const EPS = 0.01;
    if (Math.abs(dx) + EPS >= tiltThreshold) {
        if (dx > 0) answers.add('אצבע על ההדק בפנים');
        else        answers.add('אצבע על ההדק בחוץ');
    }
    return Array.from(answers);
}

function buildSingleQuestionHTML(i, correct) {
    const name = `q_${i}`;
    const checkbox = (value) => `<label><input type="checkbox" name="${name}" value="${value}"> ${value}</label>`;
    const answersMarkup = OPTIONS.map(checkbox).join('');
    return `
    <div class="q" data-idx="${i}" data-correct='${JSON.stringify(correct)}'>
      <h3>שאלה ${i + 1} מתוך 10: סמן את הסיבות לפגיעה עבור העיגול <span style="color: red">המסומן באדום</span> #${i + 1}</h3>
      <div class="answers">${answersMarkup}</div>
      <footer>
        <span class="hint">העיגול הרלוונטי מסומן באדום על המטרה.</span>
        <span class="result" id="res_${i}"></span>
        <span style="flex:1"></span>
        <div style="display:flex; gap:8px; flex-wrap:wrap">
          <button id="checkBtn">בדוק</button>
          <button id="revealBtn" class="secondary">חשוף</button>
          <button id="nextBtn" class="secondary">הבא »</button>
        </div>
      </footer>
    </div>`;
}

function highlightDot(i, on) {
    const prev = target.querySelector('.dot.active');
    prev?.classList.remove('active');
    const dot = target.querySelector(`.dot[data-idx="${i}"]`);
    if (on && dot) dot.classList.add('active');
}

function getChosenFor(i) {
    const q = quizEl.querySelector(`.q[data-idx="${i}"]`);
    return Array.from(q.querySelectorAll('input[type="checkbox"]:checked')).map(x => x.value);
}

function renderCurrentQuestion() {
    const i = current;
    const p = shots[i];
    const correct = classifyShot(p.x, p.y, dims.width, dims.height);
    quizEl.innerHTML = `<h2 style="margin:0">חידון: שאלה ${i + 1}</h2>` + buildSingleQuestionHTML(i, correct);
    highlightDot(i, true);

    document.getElementById('checkBtn').onclick = () => {
        const q = quizEl.querySelector(`.q[data-idx="${i}"]`);
        const resEl = q.querySelector(`#res_${i}`);
        const chosen = getChosenFor(i);
        const chosenSorted = [...new Set(chosen)].sort();
        const correctSorted = [...new Set(correct)].sort();
        const isCorrect = JSON.stringify(chosenSorted) === JSON.stringify(correctSorted);
        resEl.textContent = isCorrect ? 'נכון!' : (correct.length ? `לא מדויק. תשובות נכונות: ${correct.join(' + ')}` : 'אין תשובה מתאימה לפי הכללים');
        resEl.className = `result ${isCorrect ? 'ok' : 'err'}`;
        const dot = target.querySelector(`.dot[data-idx="${i}"]`);
        dot?.classList.remove('ok', 'err');
        dot?.classList.add(isCorrect ? 'ok' : 'err');
    };

    document.getElementById('revealBtn').onclick = () => {
        const q = quizEl.querySelector(`.q[data-idx="${i}"]`);
        const resEl = q.querySelector(`#res_${i}`);
        resEl.textContent = `פתרון: ${correct.length ? correct.join(' + ') : '— אין הטיה לפי הכללים —'}`;
        resEl.className = 'result ok';
        q.querySelectorAll('input[type="checkbox"]').forEach(inp => {
            inp.checked = correct.includes(inp.value);
        });
        const dot = target.querySelector(`.dot[data-idx="${i}"]`);
        dot?.classList.remove('err');
        dot?.classList.add('ok');
    };

    document.getElementById('nextBtn').onclick = () => {
        highlightDot(i, false);
        current = (current + 1) % shots.length;
        renderCurrentQuestion();
    };
}

function createRandomDots(count = 10) {
    clearDots();
    const style = getComputedStyle(target);
    const width = parseFloat(style.width), height = parseFloat(style.height);
    const dotSize = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--circle-size'));
    const centerX = width / 2, centerY = height / 2;
    const radius = dotSize / 2;

    shots = [];
    dims = {width, height};
    current = 0;

    for (let i = 0; i < count; i++) {
        const dot = document.createElement('div');
        dot.className = 'dot';
        dot.dataset.idx = i.toString();

        let x, y;
        if (Math.random() < 0.5) {
            const clusterRadius = width * 0.15;
            const angle = Math.random() * Math.PI * 2;
            const r = Math.random() * clusterRadius;
            x = centerX + r * Math.cos(angle);
            y = centerY + r * Math.sin(angle);
        } else {
            x = Math.random() * (width - 2 * radius) + radius;
            y = Math.random() * (height - 2 * radius) + radius;
        }

        dot.style.left = `${x}px`;
        dot.style.top = `${y}px`;
        target.appendChild(dot);
        shots.push({x, y});
    }
    renderCurrentQuestion();
}

generateBtn.addEventListener('click', () => createRandomDots(10));
clearBtn.addEventListener('click', () => {
    clearDots();
    quizEl.innerHTML = '';
    shots = [];
    current = 0;
});
