document.addEventListener('DOMContentLoaded', () => {
    const viewSelector = document.getElementById('view-selector');
    const sectionHeader = document.getElementById('section-header');
    const sectionContent = document.getElementById('section-content');
    const teamData = JSON.parse(document.getElementById('team-data').textContent);


        // Функция для рендера команд
        function renderTeams(teams) {
            const teamListContainer = document.getElementById('team-list');
            const addTeamButton = document.querySelector('.add-team-btn');
            teamListContainer.innerHTML = ''; // Очистка списка перед рендерингом

            if (teams.length === 0) {
                const noTeamsMessage = document.createElement('p');
                noTeamsMessage.textContent = 'Создайте команду';
                noTeamsMessage.style.color = 'red';
                noTeamsMessage.style.margin = '0 0 0 0';

                teamListContainer.appendChild(noTeamsMessage);

            } else {

                teams.forEach(team => {
                    const tabNav = document.createElement('div');
                    tabNav.className = 'tab-nav';

                    const tabLink = document.createElement('a');
                    tabLink.className = 'tab-link';
                    tabLink.href = `#team-${team.id}`;
                    tabLink.textContent = team.name;

                    tabNav.appendChild(tabLink);
                    teamListContainer.appendChild(tabNav);
                });
            }

            if (teams.length === 1) {
                addTeamButton.style.display = 'none';
            } else {
                addTeamButton.style.display = '';
            }
        }

        renderTeams(teamData);


    //Функция для обновления шапки таблицы
    function updateHeader(selectedView) {
        sectionHeader.innerHTML = '';

        if (selectedView === 'sessions') {
            sectionHeader.innerHTML = `
                <div class="session-number-field"><p>Сессия</p></div>
                <div class="pilot-name-field"><p>Пилот</p></div>
                <div class="length-session-field"><p>Длительность</p></div>
                <div class="await-field"><p>Время</p></div>
            `;
        } else if (selectedView === 'pilots') {
            sectionHeader.innerHTML = `
                <div class="pilot-stat-field"><p>Статистика по сессиям пилотов</p></div>
            `;
        } else if (selectedView === 'pitstops') {
            sectionHeader.innerHTML = `
                <div class="pit-stat-container">
                <div class="pit-number-field"><p>#</p></div>
                <div class="pit-length-field"><p>Длит. пита</p></div>
                <div class="previous-pilot-field"><p>Сдающий</p></div>
                <div class="next-pilot-field"><p>Принимающий</p></div>
                </div>
            `;
        }
    }

        
    //Функция для динамической загрузки данных для выпадающего списка
    function loadScriptForView(selectedView) {

        if (selectedView === 'sessions') {
            sessionsSchedule();
        } else if (selectedView === 'pilots') {
            sessionStat();
        } else if (selectedView === 'pitstops') {
            pitStat();
        }
    }

    // Слушатель изменений в выпадающем списке
    viewSelector.addEventListener('change', () => {
        const selectedView = viewSelector.value;
        updateHeader(selectedView);
        sectionContent.innerHTML = '';
        loadScriptForView(selectedView);
    });

    // Инициализация сессий по умолчанию 
    const defaultView = 'sessions';
    viewSelector.value = defaultView;
    updateHeader(defaultView);
    loadScriptForView(defaultView);



    // функция отображения статистики пит-стопов
    function pitStat() {
        const competitionData = JSON.parse(document.getElementById('competition-data').textContent);
        const sessionData = JSON.parse(document.getElementById('session-data').textContent);
        const pitstopData = JSON.parse(document.getElementById('pitstop-data').textContent);

        /**
         * Форматирование времени
         * @param {number} seconds - Время в секундах
         * @returns {string} - Отформатированное время в формате HH:MM:SS
         */
        function formatTime(seconds) {
            const hrs = Math.floor(seconds / 3600).toString().padStart(2, '0');
            const mins = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
            const secs = (seconds % 60).toString().padStart(2, '0');
            return `${hrs}:${mins}:${secs}`;
        }

        /**
         * Функция для поиска пилота по номеру сессии
         * @param {number} sessionNumber - Номер сессии
         * @param {string} teamName - Название команды
         * @returns {string} - Имя пилота
         */
        function findPilot(sessionNumber, teamName) {
            const session = sessionData.find(session => session.session_number === sessionNumber && session.team_name === teamName);
            return session ? session.pilot_name : 'Неизвестный пилот';
        }

        /**
         * Функция для отображения статистики по пит-стопам
         * @param {Array} pitStops - Массив данных о пит-стопах
         */
        function renderPitStopData(pitStops) {

            const scheduleBlock = document.querySelector('#section-content'); // Блок для отображения данных
            scheduleBlock.innerHTML = '';

            pitStops.forEach(pitStop => {
                const pitStopRow = document.createElement('div');
                pitStopRow.className = 'pitstop-row';

                // Получаем пилотов сдачи и приема
                const pilotGivingChange = findPilot(pitStop.session_number - 1, pitStop.team_name); // Пилот сдающий смену
                const pilotTakingChange = findPilot(pitStop.session_number, pitStop.team_name); // Пилот принимающий смену

                pitStopRow.innerHTML = `
                    <div class="pit-stat-container">
                        <div class="pit-number-field"><p>${pitStop.session_number - 1}</p></div>
                        <div class="pit-length-field"><p>${formatTime(pitStop.length)}</p></div>
                        <div class="previous-pilot-field"><p>${pilotGivingChange}</p></div>
                        <div class="next-pilot-field"><p>${pilotTakingChange}</p></div>
                    </div>
                `;
                scheduleBlock.appendChild(pitStopRow);
            });
        }

        // Отображаем статистику пит-стопов
        renderPitStopData(pitstopData);
    }

    // функция отображения статистики пилотов по сессиям
    function sessionStat() {
        const competitionData = JSON.parse(document.getElementById('competition-data').textContent);
        const sessionData = JSON.parse(document.getElementById('session-data').textContent);
        const teamId = window.location.hash.split('-')[1];

        /**
         * Форматирование времени в формате HH:MM:SS
         * @param {number} seconds - Время в секундах
         * @returns {string} - Отформатированное время
         */
        function formatTime(seconds) {
            const hrs = Math.floor(seconds / 3600).toString().padStart(2, '0');
            const mins = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
            const secs = (seconds % 60).toString().padStart(2, '0');
            return `${hrs}:${mins}:${secs}`;
        }

        /**
         * Функция для поиска пилотов по команде
         * @param {string} teamName - Название команды
         * @returns {Array} - Массив пилотов команды
         */
        function findPilots(teamName) {
            return sessionData.filter(session => session.team_name === teamName);
        }

        /**
         * Функция для подсчета общего времени для пилота
         * @param {string} pilotName - Имя пилота
         * @param {string} teamName - Название команды
         * @returns {number} - Сумма времени по всем сессиям
         */
        function getPilotTrackTime(pilotName, teamName) {
            return sessionData
                .filter(session => session.team_name === teamName && session.pilot_name === pilotName)
                .reduce((total, session) => total + session.fact_length, 0);
        }

        /**
         * Группировка сессий по пилотам
         * @param {Array} sessions - Массив всех сессий для команды
         * @returns {Object} - Объект, где ключ - имя пилота, а значение - массив сессий этого пилота
         */
        function groupSessionsByPilot(sessions) {
            const groupedSessions = {};

            sessions.forEach(session => {
                const pilotName = session.pilot_name;
                if (!groupedSessions[pilotName]) {
                    groupedSessions[pilotName] = [];
                }

                // Группируем сессии по пилотам
                groupedSessions[pilotName].push(session);
            });

            return groupedSessions;
        }

        /**
         * Функция для вывода информации по пилотам и их сессиям
         * @param {Object} groupedSessions - Объект, где ключ - имя пилота, а значение - массив сессий
         */
        function renderPilotData(groupedSessions) {
            const sessionStatisticData = document.querySelector('#section-content');
            sessionStatisticData.innerHTML = '';

            for (const pilotName in groupedSessions) {
                if (groupedSessions.hasOwnProperty(pilotName)) {
                    const sessions = groupedSessions[pilotName];

                    // Сортируем сессии по session_number в порядке возрастания
                    sessions.sort((a, b) => a.session_number - b.session_number);

                    const pilotTrackTime = getPilotTrackTime(pilotName, sessions[0].team_name);

                    const pilotTrackTimeMin = competitionData.min_pilot;
                    const pilotTrackTimeMax = competitionData.max_pilot;

                    // Расчет разницы для min и max
                    const toMinTrackTime = pilotTrackTimeMin - pilotTrackTime < 0 ? '00:00:00' : formatTime(pilotTrackTimeMin - pilotTrackTime);
                    const toMaxTrackTime = pilotTrackTimeMax - pilotTrackTime < 0 
                        ? `+${formatTime(pilotTrackTime - pilotTrackTimeMax)}`  // если разница меньше 0, выводим "pilotTrackTime - pilotTrackTimeMax"
                        : formatTime(pilotTrackTimeMax - pilotTrackTime);  // иначе выводим разницу как есть

                    const toMaxTrackTimeStyle = pilotTrackTimeMax - pilotTrackTime < 0 
                        ? 'color: red;'  // если разница отрицательная, текст красный
                        : '';  // иначе текст черный    
                    
                    const pilotDataDiv = document.createElement('div');
                    pilotDataDiv.classList.add('session-pilot-data');

                    // Добавляем информацию по пилоту
                    pilotDataDiv.innerHTML = `
                        <div class="pilot-stat-block">
                            <div class="pilot-name-container-pilot-stat"><p class="pilot-name-field-pilot-stat">${pilotName}</p></div>

                            <div class="total-time">
                                <div class="pilot-track-time">
                                    <label htmlFor="pilot-track-time">total time: </label>
                                    <p class="time-limit" id="pilot-track-time" style="color: ${pilotTrackTime > pilotTrackTimeMax ? 'red' : (pilotTrackTime > pilotTrackTimeMin ? 'green' : 'black')}">${formatTime(pilotTrackTime)}</p>
                                </div>
                            </div>

                            <div class="summary-time">
                                <div class="to-min-track-time" id="to-min-track-time">
                                    <label htmlFor="to-min-track-time">to min: </label>
                                    <p class="time-limit" >${toMinTrackTime}</p>
                                </div>
                                <div class="to-max-track-time">
                                    <label htmlFor="to-max-track-time">to max: </label>
                                    <p class="time-limit" style="${toMaxTrackTimeStyle}">${toMaxTrackTime}</p>
                                </div>
                            </div>
                            <hr>
                        </div>
                    `;


                    const headerSessionContainer =  document.createElement('div');
                    headerSessionContainer.classList.add('header-session-container');
                    headerSessionContainer.style.display = 'none';
                    headerSessionContainer.innerHTML = `
                            <div class="session-header-section">
                            <div class="session-number-data"><p>Сессия</p></div>
                            <div class="session-length-data"><p>Продолжительность</p></div>
                            <div class="session-over-length-data"><p>Пересид</p></div>
                            </div>
                            <hr class="session-header-section-hr">
                        `;



                    // Создаем контейнер для всех сессий пилота
                    const sessionContainer = document.createElement('div');
                    sessionContainer.classList.add('session-data-container');
                    sessionContainer.style.display = 'none';  // Скрываем все сессии по умолчанию

                    
                    
                    // Добавляем сессии для этого пилота
                    sessions.forEach(session => {
                        const sessionDetail = document.createElement('div');
                        sessionDetail.classList.add('session-data');

                        const toMaxStintTime = session.fact_length - competitionData.max_stint > 0 
                        ? `+${formatTime(session.fact_length - competitionData.max_stint)}`  // если разница больше 0, выводим превышение лимита стинта
                        : '';  // иначе ничего не выводим

                        if (session.finished === true) {
                            sessionDetail.innerHTML = `
                                <div class="session-header-section">
                                <div class="session-number-data"><p>${session.session_number}</p></div>
                                <div class="session-length-data" style="color: ${session.fact_length > competitionData.max_stint ? 'red' : 'black'}">
                                    <p>${formatTime(session.fact_length)}</p>
                                </div>
                                <div class="session-over-length-data" style="color: ${session.fact_length > competitionData.max_stint ? 'red' : 'black'}">
                                    <p>${toMaxStintTime}</p>
                                </div>
                                </div>
                                <hr class="session-header-section-hr">
                            `;
                            sessionContainer.appendChild(sessionDetail);
                        }
                    });

                    // Добавляем обработчик клика для скрытия/показа сессий
                    pilotDataDiv.addEventListener('click', () => {
                        // Показ/скрытие сессий
                        sessionContainer.style.display = sessionContainer.style.display === 'none' ? 'block' : 'none';
                        headerSessionContainer.style.display = headerSessionContainer.style.display === 'none' ? 'block' : 'none';
                    });

                    // Добавляем блок сессий пилота в блок информации о пилоте
                    pilotDataDiv.appendChild(headerSessionContainer);
                    pilotDataDiv.appendChild(sessionContainer);

                    // Добавляем в блок статистики
                    sessionStatisticData.appendChild(pilotDataDiv);
                }
            }
        }

        // Ищем все сессии для выбранной команды
        const teamSessions = sessionData.filter(session => session.team_name === teamId);

        // Группируем сессии по пилотам
        const groupedSessions = groupSessionsByPilot(teamSessions);

        // Отображаем информацию по пилотам
        renderPilotData(groupedSessions);
    }


    // функция отображения и работы с графиком сессий
    function sessionsSchedule() {
        const modals = document.querySelectorAll('.modal');
        const pilotDataElement = document.getElementById('pilot-data');
        const pilotsData = pilotDataElement ? JSON.parse(pilotDataElement.textContent) : [];
        const sessionDataElement = document.getElementById('session-data');
        const sessionsData = sessionDataElement ? JSON.parse(sessionDataElement.textContent) : [];
        const addSessionModal = document.getElementById('add-session-modal');
        const editSessionModal = document.getElementById('edit-session-modal');
        const pilotSelect = document.getElementById('pilot-select');
        const editPilotSelect = document.getElementById('edit-pilot-select');
        const addSessionForm = document.getElementById('add-session-form');
        const editSessionForm = document.getElementById('edit-session-form');
        const editSessionId = document.getElementById('edit-session-id');
        const editSessionNumber = document.getElementById('edit-session-number');
        const editSessionHours = document.getElementById('edit-session-hours');
        const editSessionMinutes = document.getElementById('edit-session-minutes');
        const timerValue = typeof window.globalTimerValue !== 'undefined' ? window.globalTimerValue : 0;
        const pitstopData = JSON.parse(document.getElementById('pitstop-data').textContent);
        const pitTo = JSON.parse(document.getElementById('competition-data').textContent).pit_to;
        const pitMinLength = JSON.parse(document.getElementById('competition-data').textContent).min_pit;


        /**
         * Прокрутка к активной или последней завершенной сессии
         */
        function scrollToRelevantSession(teamId) {
            const scheduleBlock = document.querySelector('.schedule-block#section-content');
            if (!scheduleBlock) {
                console.error('Блок с графиком сессий не найден.');
                return;
            }

            // Получаем данные всех сессий команды
            const teamSessions = sessionsData
                .filter(session => session.team_name === teamId)
                .sort((a, b) => a.session_number - b.session_number);

            if (teamSessions.length === 0) {
                console.warn('Нет доступных сессий для команды.');
                return;
            }

            // Ищем активную сессию
            let relevantSession = teamSessions.find(session => session.active);

            // Если активной сессии нет, ищем последнюю завершенную
            if (!relevantSession) {
                relevantSession = teamSessions
                    .filter(session => session.finished)
                    .reduce((maxSession, currentSession) => {
                        return currentSession.session_number > (maxSession?.session_number || 0) 
                            ? currentSession 
                            : maxSession;
                    }, null);
            }

            // Если подходящая сессия найдена, прокручиваем к ней
            if (relevantSession) {
                const sessionRow = scheduleBlock.querySelector(`.schedule-row[data-session-id="${relevantSession.id}"]`);
                if (sessionRow) {
                    sessionRow.scrollIntoView({
                        behavior: 'smooth',// Плавная прокрутка
                        block: 'center', // Центрируем элемент в видимой области
                    });
                } else {
                    console.warn('Элемент сессии не найден в DOM.');
                }
            } else {
                console.warn('Не удалось определить релевантную сессию.');
            }
        }

        /**
         * Универсальная функция открытия модального окна
         */
        function openModal(modalId) {
            const modal = document.getElementById(modalId);
            if (!modal) {
                console.error(`Modal with ID "${modalId}" not found.`);
                return;
            }
            modal.style.display = 'block';
        }

        /**
         * Универсальная функция закрытия модального окна
         */
        function closeModal(modal) {
            modal.style.display = 'none';
        }

        /**
         * Функция получения team_id из URL
         */
        function getTeamIdFromURL() {
            const hash = window.location.hash;
            if (hash.startsWith('#team-')) {
                return hash.split('-')[1];
            }
            return null;
        }

        /**
         * Обновление выпадающего списка пилотов
         */
        function updatePilotSelect(teamId, pilotSelectElement, currentPilot = null) {
            const teamPilots = pilotsData.find(team => team.team_id == teamId)?.pilots || [];
            pilotSelectElement.innerHTML = ''; // Очищаем текущий список пилотов

            if (teamPilots.length > 0) {
                teamPilots.forEach(pilotName => {
                    const option = document.createElement('option');
                    option.value = pilotName;
                    option.textContent = pilotName;
                    if (currentPilot && pilotName === currentPilot) option.selected = true;
                    pilotSelectElement.appendChild(option);
                });
            } else {
                const noPilotsOption = document.createElement('option');
                noPilotsOption.disabled = true;
                noPilotsOption.textContent = 'Нет доступных пилотов';
                pilotSelectElement.appendChild(noPilotsOption);
            }
        }

            /**
         * Функция инициализации таймеров для графика сессий.
         * Обновляет значения времени для активных и неактивных сессий.
         */
        function initializeSessionTimers(teamId, sessionsData) {
            window.addEventListener('timerUpdate', (event) => {
                // Получаем значение elapsedSeconds из события
                const elapsedSeconds = event.detail.elapsedSeconds;

                const scheduleBlock = document.querySelector(`#team-${teamId} #section-content`);
                if (!scheduleBlock) return;

                const teamSessions = sessionsData
                    .filter(session => session.team_name === teamId)
                    .sort((a, b) => a.session_number - b.session_number);

                let accumulatedCompletedTime = 0;
                let accumulatedActiveTime = 0;
                let counter = 0;

                teamSessions.forEach(session => {
                    const awaitField = scheduleBlock.querySelector(`.schedule-row[data-session-id="${session.id}"] .await-field p`);
                    if (!awaitField) return;

                    if (pitTo == 'nobody') {

                        if (session.active) {
                            const activeSessionTime = elapsedSeconds - session.begin;
                            awaitField.textContent = `${formatTime(activeSessionTime)}`;
                            accumulatedActiveTime += session.planing_length;
                            if (pitstopData[counter]) {

                                if (pitstopData[counter].finished) {
                                    accumulatedCompletedTime += pitstopData[counter].length;
                                } else {
                                    accumulatedCompletedTime += pitMinLength;
                                }

                            } else {
                                accumulatedCompletedTime += pitMinLength;
                            } 

                        } else if (session.finished) {
                            awaitField.textContent = 'Завершено';
                            accumulatedCompletedTime += (session.fact_length);
                            if (pitstopData[counter]) {

                                if (pitstopData[counter].finished) {
                                    accumulatedCompletedTime += pitstopData[counter].length;
                                } else {
                                    accumulatedCompletedTime += pitMinLength;
                                }

                            } else {
                                accumulatedCompletedTime += pitMinLength;
                            } 

                        } else {
                            const timeToStart = accumulatedActiveTime + accumulatedCompletedTime - elapsedSeconds;
                            awaitField.textContent = timeToStart > 0 ? `До старта: ${formatTime(timeToStart)}` : 'Выпускай!';
                            accumulatedActiveTime += session.planing_length;
                            if (pitstopData[counter]) {

                                if (pitstopData[counter].finished) {
                                    accumulatedCompletedTime += pitstopData[counter].length;
                                } else {
                                    accumulatedCompletedTime += pitMinLength;
                                }

                            } else {
                                accumulatedCompletedTime += pitMinLength;
                            } 
                        }

                        counter++;


                    } else {
                        // если пит сдающему или принимающему. Добавить логику
                    }
                    
                });
            });
        }

        /**
         * Форматирование времени
         */
        function formatTime(seconds) {
            const hrs = Math.floor(seconds / 3600).toString().padStart(2, '0');
            const mins = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
            const secs = (seconds % 60).toString().padStart(2, '0');
            return `${hrs}:${mins}:${secs}`;
        }


         /**
         * Обновление графика сессий для команды
         */
        function updateScheduleBlock(teamId) {
            const scheduleBlock = document.querySelector(`#team-${teamId} .schedule-block`);
            if (!scheduleBlock) {
                console.error(`Не найден блок графика для команды ID ${teamId}.`);
                return;
            }

            scheduleBlock.innerHTML = ''; // Очистка текущего графика

            const teamSessions = sessionsData
                .filter(session => session.team_name === teamId)
                .sort((a, b) => a.session_number - b.session_number);


            if (teamSessions.length === 0) {
                scheduleBlock.innerHTML = '<p>Внимание!<br><br>Создайте хотя бы одну сессию до старта гонки!</p>';
                scheduleBlock.style.color = 'red';
                scheduleBlock.style.fontWeight = 'bold';
                scheduleBlock.style.padding = '10px';
                scheduleBlock.style.fontSize = '16px';
               return;
            }

            teamSessions.forEach(session => {
                const sessionRow = document.createElement('div');
                sessionRow.className = 'schedule-row';
                sessionRow.setAttribute('data-session-id', session.id);

                // Условие для установки цвета
                let backgroundColor;
                let textColor;
                if (session.finished) {
                    textColor = 'grey';
                } else if (session.active) {
                    backgroundColor = '#FFE8E0'; // цвет для активных сессий
                } else {
                 // цвет для ожидающих сессий
                }

                // Применяем стиль фона к строке
                sessionRow.style.backgroundColor = backgroundColor;
                sessionRow.style.color = textColor;

                const awaitFieldElement = document.createElement('p');
                awaitFieldElement.className = session.active ? 'active-timer' : 'await-timer';


                if (session.finished) {
                    sessionRow.innerHTML = `
                    <div class="session-number-field"><p">${session.session_number}</p></div>
                    <div class="pilot-name-field"><p>${session.pilot_name}</p></div>
                    <div class="length-session-field"><p>${formatTime(session.fact_length)}</p></div>
                    <div class="await-field"></div>
                `;
                } else {
                    sessionRow.innerHTML = `
                    <div class="session-number-field"><p">${session.session_number}</p></div>
                    <div class="pilot-name-field"><p>${session.pilot_name}</p></div>
                    <div class="length-session-field"><p>${Math.floor(session.planing_length / 3600)}ч ${Math.floor((session.planing_length % 3600) / 60)}мин</p></div>
                    <div class="await-field"></div>
                `;
                }

                // Добавление таймера
                sessionRow.querySelector('.await-field').appendChild(awaitFieldElement);
                scheduleBlock.appendChild(sessionRow);
             
            });

            // Инициализация таймеров
            initializeSessionTimers(teamId, sessionsData, timerValue);
        }
        /**
         * Обновление графика при нажатии на ссылку команды
         */
        function handleTeamTabClick(event) {
            event.preventDefault(); // Останавливаем стандартное поведение ссылки

            const link = event.target.closest('.tab-link'); // Находим ближайшую ссылку
            if (link) {
                const teamId = link.getAttribute('href').replace('#team-', ''); // Получаем ID команды из хэша
                if (teamId) {
                    updateScheduleBlock(teamId); // Обновляем график
                    scrollToRelevantSession(teamId);
                    window.location.hash = `#team-${teamId}`; // Обновляем URL
                }
            }
        }

        /**
         * Навешивание слушателей на все ссылки команд
         */
        function initializeTeamTabListeners() {
            const teamLinks = document.querySelectorAll('.tab-link'); // Все ссылки команд
            teamLinks.forEach(link => {
                link.addEventListener('click', handleTeamTabClick);
            });
        }
        // Инициализация слушателей на ссылки команд
        initializeTeamTabListeners();

        /**
         * Инициализация графика при загрузке страницы
         */
        function initializeScheduleOnLoad() {
            const initialTeamId = getTeamIdFromURL();
            if (initialTeamId) {
                updateScheduleBlock(initialTeamId);
                scrollToRelevantSession(teamId);
            } else {
            }
        }

        window.addEventListener('load', initializeScheduleOnLoad);


        /**
         * Обработчик для открытия окна добавления сессии
         */
        document.addEventListener('click', function (event) {
            if (event.target.classList.contains('add-next-session')) {
                const teamId = getTeamIdFromURL();
                if (teamId) {
                    updatePilotSelect(teamId, pilotSelect);
                    openModal('add-session-modal');
                } else {
                    alert('Выберите команду для добавления сессии.');
                }
            }
        });

        /**
         * Обработчик для кликов по строкам сессий
         */
        document.addEventListener('click', function (event) {
            const sessionRow = event.target.closest('.schedule-row');
            if (sessionRow && sessionRow.dataset.sessionId) {
                openEditSessionModal(sessionRow.dataset.sessionId);
            }
        });

        /**
         * Закрытие модальных окон
         */
        document.querySelectorAll('.close-btn, .cancel-btn').forEach(button => {
            button.addEventListener('click', () => {
                closeModal(button.closest('.modal'));
            });
        });

        /**
         * Вычисление следующего номера сессии
         */
        function calculateNextSessionNumber(teamId) {
            const teamSessions = sessionsData.filter(session => session.team_name == teamId);
            return teamSessions.length + 1;
        }

        /**
         * Открытие модального окна редактирования сессии
         */
        function openEditSessionModal(sessionId) {
            const token = getCookie('access_token');
            if (!token) {
                console.error('Ошибка авторизации. Токен отсутствует.');
                return;
            }

            fetch(`/api/v1/sessions/${sessionId}/`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            })
                .then(response => response.json())
                .then(session => {
                    editSessionId.value = session.id;
                    editSessionNumber.innerText = session.session_number;
                    editSessionHours.value = Math.floor(session.planing_length / 3600);
                    editSessionMinutes.value = Math.floor((session.planing_length % 3600) / 60);
                    updatePilotSelect(session.team_name, editPilotSelect, session.pilot_name);
                    openModal('edit-session-modal');
                })
                .catch(error => {
                    console.error('Ошибка загрузки данных сессии:', error);
                    alert('Не удалось загрузить данные сессии.');
                });
        }

        /**
         * Обработка формы редактирования сессии
         */
        editSessionForm.addEventListener('submit', function (e) {
            e.preventDefault();

            const sessionId = editSessionId.value;
            const sessionLocNumber = editSessionNumber.innerText;
            const pilotName = editPilotSelect.value;
            const hours = parseInt(editSessionHours.value, 10) || 0;
            const minutes = parseInt(editSessionMinutes.value, 10) || 0;
            const planingLength = hours * 3600 + minutes * 60;

            const token = getCookie('access_token');
            if (!token) {
                alert('Ошибка авторизации. Токен не найден!');
                return;
            }

            fetch(`/api/v1/sessions/${sessionId}/`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                    'X-CSRFToken': getCookie('csrftoken'),
                },
                body: JSON.stringify({
                    pilot_name: pilotName,
                    planing_length: planingLength,
                }),
            })
                .then(response => response.json())
                .then(() => {
                    closeModal(editSessionModal);
                    window.location.reload();
                })
                .catch(error => {
                    console.error('Ошибка сохранения изменений:', error);
                    alert('Не удалось сохранить изменения.');
                });
        });

        /**
         * Обработка формы добавления сессии
         */
        if (addSessionForm) {
            addSessionForm.addEventListener('submit', async (e) => {
                e.preventDefault();

                const pilotName = pilotSelect.value;
                const hours = parseInt(document.getElementById('session-hours').value, 10) || 0;
                const minutes = parseInt(document.getElementById('session-minutes').value, 10) || 0;
                const planingLength = hours * 3600 + minutes * 60;

                const competitionId = JSON.parse(document.getElementById('competition-data').textContent).id;
                const teamId = getTeamIdFromURL();

                if (!teamId) {
                    alert('Выберите команду.');
                    return;
                }
                if (!pilotName) {
                    alert('Выберите пилота.');
                    return;
                }

                const sessionNumber = calculateNextSessionNumber(teamId);

                await submitSession(competitionId, teamId, pilotName, planingLength, sessionNumber);
            });
        }

        /**
         * Отправка данных сессии на сервер
         */
        async function submitSession(competitionId, teamId, pilotName, planingLength, sessionNumber) {
            const token = getCookie('access_token');
            if (!token) {
                alert('Ошибка авторизации. Токен не найден!');
                return;
            }

            try {
                const response = await fetch('/api/v1/sessions/', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`,
                        'X-CSRFToken': getCookie('csrftoken'),
                    },
                    body: JSON.stringify({
                        competition: competitionId,
                        team_name: teamId,
                        pilot_name: pilotName,
                        planing_length: planingLength,
                        session_number: sessionNumber,
                    }),
                });

                if (response.ok) {
                    updateScheduleBlock(teamId); // Обновляем график сессий
                    scrollToRelevantSession(teamId);
                    closeModal(addSessionModal);
                    window.location.reload();
                } else {
                    alert('Ошибка добавления сессии.');
                }
            } catch (error) {
                console.error('Ошибка добавления сессии:', error);
            }
        }


        


        /**
         * Функция получения токена из cookies
         */
        function getCookie(name) {
            const value = `; ${document.cookie}`;
            const parts = value.split(`; ${name}=`);
            if (parts.length === 2) return parts.pop().split(';').shift();
        }
        const teamId = window.location.hash.split('-')[1];
        updateScheduleBlock(teamId);
        scrollToRelevantSession(teamId);
    }

});
