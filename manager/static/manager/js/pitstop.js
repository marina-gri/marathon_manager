document.addEventListener('DOMContentLoaded', () => {
    const competitionData = JSON.parse(document.getElementById('competition-data').textContent);

    function waitForElapsedSecondsUpdate() {
        return new Promise((resolve) => {
            const handler = (event) => {
                window.removeEventListener('timerUpdate', handler); // Удаляем обработчик
                resolve(event.detail.elapsedSeconds);
            };
            window.addEventListener('timerUpdate', handler);
        });
    }

    waitForElapsedSecondsUpdate().then((initialElapsedSeconds) => {
    
        window.addEventListener('timerUpdate', (event) => {
            window.elapsedSeconds = event.detail.elapsedSeconds; // Сохраняем актуальное значение
    });

        const pitButton = document.getElementById('pit-btn'); // кнопка PIT-IN
        const stopwatchElement = document.getElementById('stopwatch');
        const currentTeamId = getCurrentTeamId(); // Получить выбранную команду
        const currentSession = getCurrentSession(currentTeamId);
        const minPitTime = competitionData.min_pit;

        if (currentSession === null) {
            const nextSession = 0;
        } else {
            const nextSession = currentSession + 1;
        }
        const activePitStop = getCurrentPitStop(currentTeamId);

        if (activePitStop) {
            const pitElapsed = elapsedSeconds - activePitStop.begin;
            startStopwatch(stopwatchElement, pitElapsed);
            stopwatchElement.style.fontWeight = 'bold';
            pitButton.textContent = 'PIT-OUT';
            
            // Проверяем состояние каждые 1000 мс (1 секунда)
            const intervalId = setInterval(() => {
            const updatedPitElapsed = window.elapsedSeconds - activePitStop.begin;

            // Обновляем стиль секундомера, если остается меньше 10 секунд
            if (minPitTime - updatedPitElapsed < 10) {
                stopwatchElement.style.color = 'green';
            } 
            }, 1000);
        };


        pitButton.addEventListener('click', handlePitButtonClick);
        async function handlePitButtonClick() {
            const currentTime = window.elapsedSeconds;
            const nextSession = currentSession.session_number + 1
            let pitStopData, sessionFinishData, sessionStartData;
            if (!activePitStop) {
                // Кнопка нажата. нет активного пит-стопа.
                // создаем новый пит, завершаем текущую сессию
                
                pitButton.textContent = 'PIT-OUT';
                startStopwatch(stopwatchElement, 0);

                if (currentSession === null) {
                    pitStopData = {
                        competition: competitionData.id,
                        team_name: currentTeamId,
                        session_number: 1,
                        begin: currentTime,
                        active: true,
                        finished: false
                    };

                    sessionFinishData = {
                        competition: competitionData.id,
                        team_name: currentTeamId,
                        session_number: 1,
                        end: currentTime,
                        fact_length: currentTime - currentSession.begin, 
                        active: false,
                        finished: true
                    };


                } else {
                    pitStopData = {
                        competition: competitionData.id,
                        team_name: currentTeamId,
                        session_number: nextSession,
                        begin: currentTime,
                        active: true,
                        finished: false
                    };

                    sessionFinishData = {
                        competition: competitionData.id,
                        team_name: currentTeamId,
                        session_number: currentSession.session_number,
                        end: currentTime,
                        fact_length: currentTime - currentSession.begin,
                        active: false,
                        finished: true
                    };

                    // Проверка на существование следующей сессии
                    if (getNextSession(currentTeamId, nextSession)) {

                    } else {
                        sessionStartData = {
                            competition: competitionData.id,
                            team_name: currentTeamId,
                            session_number: currentSession.session_number + 1,
                            pilot_name: "Выберите пилота",
                            length: 0,
                            active: false,
                            finished: false
                        };
                        console.log('NEXT_SESSION ${nextSession}');
                        await createSession(sessionStartData);

                    }
                }

                // Подтверждение начала пит-стопа
                const confirmation = confirm('Вы уверены, что хотите начать пит-стоп?');
                if (!confirmation) {
                    window.location.reload(true);
                    return;
                }
                    

                try {
                    await createPitStop(pitStopData);
                    startStopwatch(stopwatchElement, 0); // Запускаем таймер

                    // Завершаем текущую сессию
                    await updateSession(currentSession.id, sessionFinishData);

                    // ДОБАВИТЬ УСЛОВИЕ КОМУ ПИТ. Если пит текущему, то...
                    // Если пит следующему, то... Если пит никому, то...

                    // Запускаем следующую сессию, если она существует
                    // await updateSession(currentSession.id + 1, sessionStartData);
                    // console.log(`Сессия ${sessionStartData.session_number} обновлена`);

                    pitButton.textContent = 'PIT-OUT';
                    window.location.reload(true);
                } catch (error) {
                    console.error('Ошибка при запуске пит-стопа:', error);
                    alert('Ошибка при запуске пит-стопа.');
                }


            } else {
                // Останавливаем текущий пит-стоп
                
                const pitStopData = {
                        competition: competitionData.id,
                        team_name: currentTeamId,
                        session_number: currentSession.session_number,
                        end: currentTime,
                        length: currentTime - activePitStop.begin,
                        active: false,
                        finished: true
                    };

                    const sessionStartData = {
                        competition: competitionData.id,
                        team_name: currentTeamId,
                        begin: currentTime,
                        active: true,
                        finished: false
                    };

                // Подтверждение завершения пит-стопа
                const confirmation = confirm('Вы уверены, что хотите завершить пит-стоп?');
                if (confirmation) {
                    // Отсановка пит-стопа. передаем данные на сервер
                    try {
                        clearInterval(stopwatchInterval);
                        stopwatchInterval = null;
                        await updatePitStop(activePitStop.id ,pitStopData);
                        startStopwatch(stopwatchElement, 0); // Запускаем таймер

                        // Запускаем следующую сессию, если она существует
                        console.log(`Текущая сессия`, currentSession.id);
                        await updateSession(currentSession.id, sessionStartData);

                        pitButton.textContent = 'PIT-IN';
                        window.location.reload(true);
                    } catch (error) {
                        console.error('Ошибка при остановке пит-стопа:', error);
                        alert('Ошибка при остановке пит-стопа.');
                    }
                } else {
                    window.location.reload(true);    
                }
            }
        }



        function startStopwatch(element, startSeconds) {
                let currentSeconds = startSeconds;

                // Обновляем каждую секунду
                stopwatchInterval = setInterval(() => {
                    currentSeconds++;
                    element.textContent = formatTime(currentSeconds);
                }, 1000);
            }

        function getElapsedSeconds() {
            return elapsedSeconds;
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
                const currentSession = sessions.filter(session => session.team_name == currentTeamId && session.active === true)
                .map(session => session)[0];

                if (!currentSession) {
                    const currentSession = sessions.filter(session => session.team_name == currentTeamId && session.finished === false)
                    .reduce((minSession, current) => {
                        return (minSession === null || current.session_number < minSession.session_number) 
                            ? current 
                            : minSession;
                    }, null);

                    return currentSession || null;
                } else {
                    // const currentSession = currentSession;
                    return currentSession || null;
                }

                // Возвращаем найденную сессию или null, если её нет
                
            } catch (error) {
                console.error('Ошибка при парсинге данных сессий:', error);
                return null;
            }
        }



        function getNextSession(currentTeamId, nextSessionNumber) {
            // Проверяем, есть ли данные о сессиях в контексте
            const sessionDataElement = document.getElementById('session-data');
            if (!sessionDataElement) {
                console.error('Данные о сессиях не найдены в контексте.');
                return null;
            }

            if (currentSession === null) {
                return false;
            }

            try {

                // Парсим JSON-данные из контекста
                const sessions = JSON.parse(sessionDataElement.textContent);
                
                // Ищем сессию для текущей команды с session_number равным nextSessionNumber
                const nextSession = sessions.find(session => session.team_name == currentTeamId && session.session_number === nextSessionNumber);

                // Если нашли следующую сессию, возвращаем ее, иначе возвращаем false
                if (nextSession) {
                    return true;
                } else {
                    return false;
                }
            } catch (error) {
                console.error('Ошибка при парсинге данных сессий:', error);
                return null;
            }
        }

        function getCurrentPitStop(currentTeamId) {
            //ищем, есть ли для выбранной команды активный пит-стоп
            const pitstopDataElement = document.getElementById('pitstop-data');
            if (!pitstopDataElement) {
                console.error('Данные о пит-стопах не найдены в контексте.');
                return null;
            }

            try {
                const pitstops = JSON.parse(pitstopDataElement.textContent);
                const activePitStop = pitstops.filter(pitstop => pitstop.team_name == currentTeamId && pitstop.active === true)
                .map(pitstop => pitstop)[0];
            
                return activePitStop || null;
            } catch (error) {
                console.error('Ошибка при парсинге данных сессий:', error);
                return null;
            }
        }

        // Функция для форматирования времени в чч:мм:сс
        function formatTime(seconds) {
            const hrs = Math.floor(seconds / 3600);
            const mins = Math.floor((seconds % 3600) / 60);
            const secs = seconds % 60;
            return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        }

        // функция для создания пит-стопа
        async function createPitStop(pitStopData) {
            const token = getCookie('access_token');
            if (!token) {
                throw new Error('Токен не найден.');
            }

            try {
                const response = await fetch(`/api/v1/pitstops/`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`,
                        'X-CSRFToken': getCookie('csrftoken'),
                    },
                    body: JSON.stringify(pitStopData),
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    console.error('Ошибка создания PitStop:', errorData);
                    throw new Error('Не удалось создать запись о пит-стопе.');
                }

                return await response.json();
            } catch (error) {
                console.error('Ошибка при отправке POST-запроса:', error);
                throw error;
            }
        }

        // Обновление пит-стопа
        async function updatePitStop(pitStopId, pitStopData) {
            const token = getCookie('access_token');
            if (!token) {
                throw new Error('Токен не найден.');
            }

            try {
                const response = await fetch(`/api/v1/pitstops/${pitStopId}/`, {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`,
                        'X-CSRFToken': getCookie('csrftoken'),
                    },
                    body: JSON.stringify(pitStopData),
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    console.error('Ошибка обновления PitStop:', errorData);
                    throw new Error('Не удалось обновить запись о пит-стопе.');
                }

                return await response.json();
            } catch (error) {
                console.error('Ошибка при отправке PATCH-запроса:', error);
                throw error;
            }
        }

        // Обновление сессии
        async function updateSession(sessionId, sessionData) {
            const token = getCookie('access_token');
            if (!token) {
                throw new Error('Токен не найден.');
            }

            try {
                const response = await fetch(`/api/v1/sessions/${sessionId}/`, {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`,
                        'X-CSRFToken': getCookie('csrftoken'),
                    },
                    body: JSON.stringify(sessionData),
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    console.error('Ошибка обновления Session:', errorData);
                    throw new Error('Не удалось обновить запись о сессии.');
                }

                return await response.json();
            } catch (error) {
                console.error('Ошибка при отправке PATCH-запроса:', error);
                throw error;
            }
        }

        // Создание новой сессии
        async function createSession(sessionData) {
            const token = getCookie('access_token');
            if (!token) {
                throw new Error('Токен не найден.');
            }

            try {
                const response = await fetch(`/api/v1/sessions/`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`,
                        'X-CSRFToken': getCookie('csrftoken'),
                    },
                    body: JSON.stringify(sessionData),
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    console.error('Ошибка создания Session:', errorData);
                    throw new Error('Не удалось создать запись о сессии.');
                }

                return await response.json();
            } catch (error) {
                console.error('Ошибка при отправке POST-запроса:', error);
                throw error;
            }
        }

        // Функция для получения CSRF-токена
        function getCookie(name) {
            const value = `; ${document.cookie}`;
            const parts = value.split(`; ${name}=`);
            if (parts.length === 2) return parts.pop().split(';').shift();
        }

    });

});
