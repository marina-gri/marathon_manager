
document.addEventListener('DOMContentLoaded', async function () {
    // Инициализация глобальной переменной
    window.elapsedSeconds = 0;

    // Селекторы таймеров
    const timerFromStart = document.querySelector('.timer-from-start');
    const timerTillTheEnd = document.querySelector('.timer-till-the-end');

    let competitionData;
    try {
        // Асинхронная функция для получения данных из контекста
        competitionData = await getCompetitionData();
    } catch (error) {
        console.error('Ошибка получения данных:', error);
        return;
    }

    // Извлечение данных из контекста
    const raceStartAt = competitionData.race_start_at ? new Date(competitionData.race_start_at) : null;
    const raceLength = competitionData.race_length;
    const greenFlag = competitionData.green_flag;
    const finishFlag = competitionData.finish_flag;
    const finishAt = competitionData.finish_at ? new Date(competitionData.finish_at) : null;
    const raceCaption = competitionData.title;

    const raceCaptionElem = document.getElementById('competition-caption');
    raceCaptionElem.textContent = raceCaption;

    let timerInterval = null;
    let timerStopped = false; // Флаг для остановки таймера обратного отсчета

    // Функция для форматирования времени в чч:мм:сс
    function formatTime(seconds) {
        const hrs = Math.floor(seconds / 3600).toString().padStart(2, '0');
        const mins = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
        const secs = (seconds % 60).toString().padStart(2, '0');
        return `${hrs}:${mins}:${secs}`;
    }

    // Логика работы таймеров
    if (!greenFlag && !finishFlag) {
        timerFromStart.textContent = '00:00:00';
        timerTillTheEnd.textContent = formatTime(raceLength);
    } else if (greenFlag && !finishFlag) {
        if (!localStorage.getItem(`race_start_at_${competitionData.id}`)) {
            localStorage.setItem(`race_start_at_${competitionData.id}`, raceStartAt.toISOString());
        }

        startTimer();
    } else if (finishFlag) {
        if (raceStartAt && finishAt) {
            const elapsedSeconds = Math.floor((finishAt - raceStartAt) / 1000);
            window.elapsedSeconds = elapsedSeconds; // Устанавливаем значение в глобальную переменную
            timerFromStart.textContent = formatTime(elapsedSeconds);
        } else {
            console.error('raceStartAt или finishAt не определены.');
            timerFromStart.textContent = 'Ошибка';
        }
        timerTillTheEnd.textContent = '00:00:00';
    }

    // Функция для запуска таймера
    function startTimer() {
        clearInterval(timerInterval); // Очищаем любой ранее запущенный таймер

        timerInterval = setInterval(function () {
            const now = new Date();
            const elapsedSeconds = Math.floor((now - raceStartAt) / 1000);

            // Обновляем значение в глобальной переменной
            window.elapsedSeconds = elapsedSeconds;

            // Секундомер
            timerFromStart.textContent = formatTime(elapsedSeconds);

            // Отправляем событие с текущим временем
            const event = new CustomEvent('timerUpdate', { detail: { elapsedSeconds } });
            window.dispatchEvent(event);

            // Таймер обратного отсчета
            if (!timerStopped) {
                const remainingTime = Math.max(0, raceLength - elapsedSeconds);
                timerTillTheEnd.textContent = formatTime(remainingTime);

                if (remainingTime === 0) {
                    timerStopped = true; // Останавливаем только таймер обратного отсчета
                }
            }
        }, 1000); // Обновление каждую секунду
    }

    // Автоматический запуск таймера, если green_flag = true
    if (greenFlag && !finishFlag) {
        startTimer();
    }

    // функция перехода к настройкам соревнования
    const settingsButton = document.getElementById('change-race-settings');

    settingsButton.addEventListener('click', () => {
        const competitionId = competitionData.id;
        if (competitionId) {
            window.location.href = `/race/edit/${competitionId}/`; // Переход на страницу настроек
        } else {
            alert('ID соревнования не найден.');
        }
    });

});

// Асинхронная функция для получения данных из JSON
async function getCompetitionData() {
    try {
        const jsonElement = document.getElementById('competition-data');
        if (!jsonElement) {
            throw new Error('Элемент с ID competition-data не найден');
        }

        const jsonData = jsonElement.textContent;
        return JSON.parse(jsonData);
    } catch (error) {
        console.error('Ошибка парсинга данных из контекста:', error);
        throw error;
    }
}
