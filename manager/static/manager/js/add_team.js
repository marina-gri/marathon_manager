document.addEventListener('DOMContentLoaded', function () {
    const modals = document.querySelectorAll('.modal');
    const addTeamForm = document.getElementById('add-team-form');
    const pilotFieldsContainer = document.getElementById('pilot-fields-container');
    const addPilotButton = document.getElementById('add-pilot-btn');

    // Универсальная функция открытия модального окна
    function openModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) modal.style.display = 'block';
    }

    // Универсальная функция закрытия модального окна
    function closeModal(modal) {
        modal.style.display = 'none';
    }

    // Закрытие модального окна при клике на кнопки "Закрыть" или "Отмена"
    document.querySelectorAll('.close-btn, .cancel-btn').forEach((button) => {
        button.addEventListener('click', () => {
            closeModal(button.closest('.modal'));
        });
    });

    // Закрытие модального окна при клике вне его области
    window.addEventListener('click', (event) => {
        modals.forEach((modal) => {
            if (event.target === modal) closeModal(modal);
        });
    });

    // Обработчик для открытия модального окна добавления команды
    document.addEventListener('click', function (event) {
        if (event.target.classList.contains('add-team-btn')) {
            openModal('add-team-modal'); // Открываем модальное окно добавления команды
        }
    });

    // Добавление полей для пилотов
    addPilotButton.addEventListener('click', () => {
        const pilotField = document.createElement('div');
        pilotField.className = 'pilot-field';
        pilotField.innerHTML = `
            <input type="text" name="pilot-names[]" class="pilot-name" placeholder="Имя пилота" required>
            <button type="button" class="button-danger remove-pilot-btn">Удалить</button>
        `;
        pilotFieldsContainer.appendChild(pilotField);

        // Удаление поля пилота
        pilotField.querySelector('.remove-pilot-btn').addEventListener('click', () => {
            pilotField.remove();
        });
    });

    // Обработка отправки формы добавления команды
    addTeamForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const teamName = document.getElementById('team-name').value;
        const teamNumber = document.getElementById('team-number').value;
        const pilotNames = Array.from(document.querySelectorAll('.pilot-name')).map((input) => ({
            name: input.value,
        }));

        if (!teamName || !teamNumber || pilotNames.length === 0) {
            alert('Заполните все поля перед отправкой.');
            return;
        }

        const token = getCookie('access_token');
        if (!token) {
            console.error('Ошибка авторизации. Токен отсутствует.');
            return;
        }

        try {
            const response = await fetch('/api/v1/teams/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                    'X-CSRFToken': getCookie('csrftoken'),
                },
                body: JSON.stringify({
                    name: teamName,
                    number: teamNumber,
                    competition: JSON.parse(document.getElementById('competition-data').textContent).id,
                    pilots: pilotNames, // Список имен пилотов
                }),
            });

            if (response.ok) {
                alert('Команда успешно добавлена!');
                closeModal(document.getElementById('add-team-modal'));
                window.location.reload(); // Обновляем страницу
            } else {
                alert('Ошибка при добавлении команды.');
            }
        } catch (error) {
            console.error('Ошибка при добавлении команды:', error);
        }
    });

    // Функция для получения JWT токена из cookies
    function getCookie(name) {
        const value = "; " + document.cookie;
        const parts = value.split("; " + name + "=");
        if (parts.length === 2) return parts.pop().split(";").shift();
        return null;
    }
});


