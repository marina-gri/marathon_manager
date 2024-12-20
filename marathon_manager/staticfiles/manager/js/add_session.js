document.addEventListener('DOMContentLoaded', function () {
    const addSessionButton = document.querySelector('.add-next-session');
    const modal = document.getElementById('add-session-modal');
    const closeButton = document.querySelector('.close-btn-session');
    const cancelButton = document.querySelector('.cancel-btn');
    const addSessionForm = document.getElementById('add-session-form');
    const scheduleBlock = document.querySelector('.schedule-block');

    // Открытие модального окна
    addSessionButton.addEventListener('click', () => {
        modal.style.display = 'block';
    });

    // Закрытие модального окна
    closeButton.addEventListener('click', () => {
        modal.style.display = 'none';
    });

    cancelButton.addEventListener('click', () => {
        modal.style.display = 'none';
    });

    // Закрытие окна при клике за его пределами
    window.addEventListener('click', (event) => {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    });

    // Обработка формы добавления сессии
    addSessionForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const pilotName = document.getElementById('pilot-select').value;
        const hours = parseInt(document.getElementById('session-hours').value, 10) || 0;
        const minutes = parseInt(document.getElementById('session-minutes').value, 10) || 0;

        const planingLength = hours * 3600 + minutes * 60;
        const competitionId = JSON.parse(document.getElementById('competition-data').textContent).id;
        const activeTab = document.querySelector('.tab-content[style*="display: block"]').id;
        const teamId = activeTab.split('-')[1];
        const sessionNumber = scheduleBlock.children.length + 1;

        const token = getCookie('access_token'); // Get token from cookies
        if (!token) {
            alert('Ошибка авторизации. Токен не найден!');
            return;
        }

        // Отправка данных на сервер
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
                    session_number: sessionNumber,
                    planing_length: planingLength,
                }),
            });

            if (response.ok) {
                const sessionData = await response.json();
                // Обновление таблицы
                const row = document.createElement('div');
                row.innerHTML = `
                    <div class="session-number-field"><p>${sessionNumber}</p></div>
                    <div class="pilot-name-field"><p>${pilotName}</p></div>
                    <div class="length-session-field"><p>${hours}ч ${minutes}мин</p></div>
                `;
                scheduleBlock.appendChild(row);

                modal.style.display = 'none';
                alert('Сессия успешно добавлена!');
            } else {
                alert('Ошибка при добавлении сессии!');
            }
        } catch (error) {
            console.error('Ошибка при добавлении сессии:', error);
            alert('Ошибка при добавлении сессии.');
        }
    });
});

// Функция для получения токена из cookies
function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
}
