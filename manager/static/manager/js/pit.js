document.addEventListener('DOMContentLoaded', () => {   
    let activePitStop = null; // Хранит активный пит-стоп
    let elapsedSeconds = 0;   // Глобальная переменная для текущего времени гонки
    let stopwatchInterval = null; // Интервал для секундомера

    // Получаем данные из контекста (серверного рендера)
    const pitstops = JSON.parse(document.getElementById('pitstop-data').textContent);
    const sessions = JSON.parse(document.getElementById('session-data').textContent);
    const competition = JSON.parse(document.getElementById('competition-data').textContent);
    console.log("pit:", pitstops);


    const pitButton = document.getElementById('pit-btn');
    const stopwatchElement = document.getElementById('stopwatch');

    const currentTeamId = getCurrentTeamId(); // Получаем ID текущей команды

    // Ищем активный пит-стоп для команды
    activePitStop = pitstops
    .find(pit => pit.active === true);
    console.log("active_pit", activePitStop);

    if (activePitStop) {
        const pitElapsed = elapsedSeconds - activePitStop.begin;
        startStopwatch(stopwatchElement, pitElapsed);
    }

    // Добавляем обработчик кнопки
    pitButton.addEventListener('click', () => handlePitButtonClick(stopwatchElement));

    function startStopwatch(element, startSeconds = 0) {
        let currentSeconds = startSeconds;

        // Обновляем каждую секунду
        stopwatchInterval = setInterval(() => {
            currentSeconds++;
            element.textContent = formatTime(currentSeconds);
        }, 1000);
    }

    function stopStopwatch() {
        clearInterval(stopwatchInterval);
    }

    function formatTime(seconds) {
        const hrs = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }

    function handlePitButtonClick(stopwatchElement) {
        const currentTeamId = getCurrentTeamId(); // Получить выбранную команду
        const currentSession = getCurrentSession(currentTeamId);

        if (!currentSession) {
            console.error('Текущая сессия не найдена');
            return;
        }

        if (activePitStop) {
            // Завершаем активный пит-стоп
            stopStopwatch();
            const payload = {
                end: elapsedSeconds,
                active: false,
                finished: true,
            };
            updatePitStop(activePitStop.id, payload);

            // Переключаем активную сессию
            const nextSession = getNextSession(currentTeamId);
            if (nextSession) {
                updateSession(nextSession.id, {
                    active: true,
                    begin: elapsedSeconds,
                });
            }

            activePitStop = null;
            stopwatchElement.textContent = '00:00:00'; // Сбрасываем секундомер
        } else {
            // Начинаем новый пит-стоп
            const payload = {
                competition_id: competition.id,
                team_name: currentTeamId,
                session_number: currentSession.session_number,
                begin: elapsedSeconds,
                active: true,
            };

            createPitStop(payload);

            // Завершаем текущую сессию
            updateSession(currentSession.id, {
                active: false,
                finished: true,
                end: elapsedSeconds,
            });

            startStopwatch(stopwatchElement);
            activePitStop = payload; // Обновляем состояние
        }
    }

    function getCookie(name) {
        const value = "; " + document.cookie;
        const parts = value.split("; " + name + "=");
        if (parts.length === 2) return parts.pop().split(";").shift();
        return null;
    }

    const token = getCookie('access_token');  // Получаем токен из cookies
    if (!token) {
        console.error('Токен не найден!');
        return;
    }

    function updatePitStop(pitStopId, data) {
        fetch(`/api/v1/pitstops/${pitStopId}/`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + token,  
                'X-CSRFToken': getCookie('csrftoken'),
            },
            body: JSON.stringify(data),
        }).then(response => {
            if (!response.ok) {
                return response.json().then(err => {
                    console.error('Failed to update pit stop:', err);
                });
            }
        }).catch(error => console.error('Error in updatePitStop:', error));
    }

    function createPitStop(data) {
        fetch(`/api/v1/pitstops/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + token,  
                'X-CSRFToken': getCookie('csrftoken'),
            },
            body: JSON.stringify(data),
        }).then(response => {
            if (!response.ok) {
                return response.json().then(err => {
                    console.error('Failed to create pit stop:', err);
                });
            }
        }).catch(error => console.error('Error in createPitStop:', error));
    }

    function updateSession(sessionId, data) {
        fetch(`/api/v1/sessions/${sessionId}/`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + token,  
                'X-CSRFToken': getCookie('csrftoken'),
            },
            body: JSON.stringify(data),
        }).then(response => {
            if (!response.ok) {
                return response.json().then(err => {
                    console.error('Failed to update session:', err);
                });
            }
        }).catch(error => console.error('Error in updateSession:', error));
    }

    function getCurrentTeamId() {
        const hash = window.location.hash;

        if (hash.startsWith("#team-")) {
            const teamId = hash.split("-")[1];
            return parseInt(teamId, 10);
        }
        return null;
    }

    function getCurrentSession(currentTeamId) {
        // Проверяем, есть ли данные о сессиях в контексте
        const sessionDataElement = document.getElementById('session-data');
        if (!sessionDataElement) {
            console.error('Данные о сессиях не найдены в контексте.');
            return null;
        }

        try {
            // Парсим JSON-данные из контекста
            const sessions = JSON.parse(sessionDataElement.textContent);
            
            // Ищем сессию для текущей команды, где active=true
            const currentSession = sessions.filter(session => session.active === true)
            .map(session => session.session_number)[0];
            console.log('Полный список:', currentSession);
            // Возвращаем найденную сессию или null, если её нет
            return currentSession || null;
        } catch (error) {
            console.error('Ошибка при парсинге данных сессий:', error);
            return null;
        }
    }

    function getNextSession(teamId) {
        const teamSessions = sessions.filter(session => session.team_name === teamId);
        const currentSessionIndex = teamSessions.findIndex(session => session.active);

        if (currentSessionIndex >= 0 && currentSessionIndex < teamSessions.length - 1) {
            return teamSessions[currentSessionIndex + 1];
        }
        return null;
    }
});
