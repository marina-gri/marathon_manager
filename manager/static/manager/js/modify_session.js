document.addEventListener('DOMContentLoaded', function () {
    const editSessionModal = document.getElementById('edit-session-modal');
    const editSessionForm = document.getElementById('edit-session-form');
    const editPilotSelect = document.getElementById('edit-pilot-select');
    const editSessionHours = document.getElementById('edit-session-hours');
    const editSessionMinutes = document.getElementById('edit-session-minutes');
    const editSessionId = document.getElementById('edit-session-id');
    const pilotDataElement = document.getElementById('pilot-data');
    const pilotsData = pilotDataElement ? JSON.parse(pilotDataElement.textContent) : [];

    /**
     * Обработчик клика по строкам сессий
     */
    document.addEventListener('click', function (event) {
        const sessionRow = event.target.closest('.schedule-row');
        if (sessionRow && sessionRow.dataset.sessionId) {
            const sessionId = sessionRow.dataset.sessionId;
            openEditSessionModal(sessionId);

        }
    });

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
            .then((response) => {
                if (!response.ok) {
                    throw new Error(`Ошибка ${response.status}: ${response.statusText}`);
                }
                return response.json();
            })
            .then((session) => {
                editSessionId.value = session.id;
                editSessionHours.value = Math.floor(session.planing_length / 3600);
                editSessionMinutes.value = Math.floor((session.planing_length % 3600) / 60);
                updatePilotSelect(session.team_name, session.pilot_name);
                editSessionModal.style.display = 'block';
            })
            .catch((error) => {
                console.error('Ошибка загрузки данных сессии:', error);
                alert('Не удалось загрузить данные сессии.');
            });
    }

    /**
     * Обновление списка пилотов
     */
    function updatePilotSelect(teamName, currentPilot) {
        const teamPilots = pilotsData.find((team) => team.team_name === teamName)?.pilots || [];

        editPilotSelect.innerHTML = ''; // Очищаем список
        if (teamPilots.length > 0) {
            teamPilots.forEach((pilotName) => {
                const option = document.createElement('option');
                option.value = pilotName;
                option.textContent = pilotName;
                if (pilotName === currentPilot) option.selected = true;
                editPilotSelect.appendChild(option);
            });
        } else {
            const noPilotOption = document.createElement('option');
            noPilotOption.textContent = 'Нет доступных пилотов';
            noPilotOption.disabled = true;
            editPilotSelect.appendChild(noPilotOption);
        }
    }

    /**
     * Закрытие модального окна
     */
    document.querySelectorAll('.close-btn, .cancel-btn').forEach((button) => {
        button.addEventListener('click', () => {
            editSessionModal.style.display = 'none';
        });
    });

    /**
     * Сохранение изменений сессии
     */
    editSessionForm.addEventListener('submit', function (e) {
        e.preventDefault();

        const sessionId = editSessionId.value;
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
            .then((response) => {
                if (!response.ok) {
                    throw new Error(`Ошибка ${response.status}: ${response.statusText}`);
                }
                return response.json();
            })
            .then(() => {
                editSessionModal.style.display = 'none';
                window.location.reload();
            })
            .catch((error) => {
                console.error('Ошибка сохранения изменений:', error);
                alert('Не удалось сохранить изменения сессии.');
            });
    });

    /**
     * Получение токена из cookies
     */
    function getCookie(name) {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop().split(';').shift();
    }
});
