document.addEventListener('DOMContentLoaded', () => {
    // Получаем данные соревнования из JSON-скрипта
    const competitionDataElement = document.getElementById('competition-data');
    if (!competitionDataElement) {
        console.error('Competition data not found.');
        return;
    }

    const competitionData = JSON.parse(competitionDataElement.textContent);

    // Заполняем поля формы
    function populateForm(data) {
        document.getElementById('title').value = data.title || '';
        document.getElementById('track').value = data.track || '';

        if (data.race_start_at) {
            const dateTime = new Date(data.race_start_at);
            document.getElementById('race_start_at_date').value = dateTime.toISOString().slice(0, 10);
            document.getElementById('race_start_at_time').value = dateTime.toTimeString().slice(0, 8);
        } else {
            document.getElementById('race_start_at_date').value = '';
            document.getElementById('race_start_at_time').value = '';
        }

        document.getElementById('race_length_hours').value = Math.floor((data.race_length || 0) / 3600);
        document.getElementById('race_length_minutes').value = Math.floor(((data.race_length || 0) % 3600) / 60);
        document.getElementById('till_the_end').checked = data.till_the_end || false;

        document.getElementById('min_pit_minutes').value = Math.floor((data.min_pit || 0) / 60);
        document.getElementById('min_pit_seconds').value = (data.min_pit || 0) % 60;
        document.getElementById('pit_to').value = data.pit_to || 'nobody';

        document.getElementById('max_stint_hours').value = Math.floor((data.max_stint || 0) / 3600);
        document.getElementById('max_stint_minutes').value = Math.floor(((data.max_stint || 0) % 3600) / 60);

        document.getElementById('min_pilot_hours').value = Math.floor((data.min_pilot || 0) / 3600);
        document.getElementById('min_pilot_minutes').value = Math.floor(((data.min_pilot || 0) % 3600) / 60);

        document.getElementById('max_pilot_hours').value = Math.floor((data.max_pilot || 0) / 3600);
        document.getElementById('max_pilot_minutes').value = Math.floor(((data.max_pilot || 0) % 3600) / 60);
    }

    populateForm(competitionData);

    

    // Обработчик для кнопки "Сохранить изменения"
    const form = document.getElementById('edit-race-form');
    form.addEventListener('submit', async (event) => {

        event.preventDefault();

        // Собирать ID пользователей в объект для поля visibilities
        const userIds = [];
        const userInputs = document.querySelectorAll('.user_id');
        userInputs.forEach(input => {
            if(input.value) {
                userIds.push({ user_id: parseInt(input.value) });  // Мы создаем объект с полем `user_id`, где значение - это ID пользователя
            }
        });
        

        const raceStartDate = document.getElementById('race_start_at_date').value;
        const raceStartTime = document.getElementById('race_start_at_time').value;
        let raceStartAtValue = null;

        if (raceStartDate && raceStartTime) {
            raceStartAtValue = `${raceStartDate}T${raceStartTime}`;
        }

        const updatedData = {
            title: document.getElementById('title').value,
            track: document.getElementById('track').value,
            race_start_at: raceStartAtValue,
            race_length: (
                (parseInt(document.getElementById('race_length_hours').value, 10) || 0) * 3600 +
                (parseInt(document.getElementById('race_length_minutes').value, 10) || 0) * 60
            ),
            till_the_end: document.getElementById('till_the_end').checked,
            min_pit: (
                (parseInt(document.getElementById('min_pit_minutes').value, 10) || 0) * 60 +
                (parseInt(document.getElementById('min_pit_seconds').value, 10) || 0)
            ),
            pit_to: document.getElementById('pit_to').value,
            max_stint: (
                (parseInt(document.getElementById('max_stint_hours').value, 10) || 0) * 3600 +
                (parseInt(document.getElementById('max_stint_minutes').value, 10) || 0) * 60
            ),
            min_pilot: (
                (parseInt(document.getElementById('min_pilot_hours').value, 10) || 0) * 3600 +
                (parseInt(document.getElementById('min_pilot_minutes').value, 10) || 0) * 60
            ),
            max_pilot: (
                (parseInt(document.getElementById('max_pilot_hours').value, 10) || 0) * 3600 +
                (parseInt(document.getElementById('max_pilot_minutes').value, 10) || 0) * 60
            ),
            visibilities: userIds,
        };

        const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]').value;
        const token = getCookie('access_token'); // Получаем токен из cookies

        if (!token) {
            Swal.fire({
                icon: 'error',
                title: 'Ошибка',
                text: 'Необходимо авторизоваться',
            });
            return;
        }

        try {
            const response = await fetch(`/api/v1/main/${competitionData.id}/`, {
                method: 'PATCH',
                headers: {
                    'Authorization': 'Bearer ' + token,
                    'Content-Type': 'application/json',
                    'X-CSRFToken': csrfToken,
                },
                body: JSON.stringify(updatedData),
            });

            if (response.ok) {
                alert('Данные сохранены успешно!');
                window.location.href = `/race/${competitionData.id}`;
            } else {
                const errorData = await response.json();
                console.error('Ошибка сохранения данных:', errorData);
                alert('Произошла ошибка при сохранении.');
            }
        } catch (error) {
            console.error('Ошибка при отправке запроса:', error);
            alert('Произошла ошибка. Попробуйте позже.');
        }
    });

    // Функция для получения cookie
    function getCookie(name) {
        const value = "; " + document.cookie;
        const parts = value.split("; " + name + "=");
        if (parts.length === 2) return parts.pop().split(";").shift();
        return null;
    }
});
// Функция для добавления новых инпутов ID пользователей
function addFn() {
    // Находим родительский контейнер для инпутов
    const container = document.querySelector('.add-new-input');

    // Создаем новый контейнер для нового инпута
    const newInputWrapper = document.createElement('div');
    newInputWrapper.classList.add('add-new-input');  // Можно добавить класс для нового инпута

    // Создаем новый input
    const newInput = document.createElement('input');
    newInput.type = 'number';  // Устанавливаем тип поля
    newInput.name = 'user_id';  // Устанавливаем имя поля
    newInput.classList.add('user_id');  // Добавляем класс для стилизации

    // Создаем кнопку для добавления еще одного инпута (если необходимо)
    const addButton = document.createElement('button');
    addButton.type = 'button';  // Устанавливаем тип кнопки
    addButton.textContent = ' + ';  // Текст на кнопке
    addButton.classList.add('add-button');  // Класс кнопки для стилизации

    // Добавляем событие на клик для добавления нового инпута
    addButton.addEventListener('click', addFn);

    // Добавляем input и кнопку в новый контейнер
    newInputWrapper.appendChild(newInput);
    newInputWrapper.appendChild(addButton);

    // Вставляем новый контейнер после последнего инпута
    container.parentElement.appendChild(newInputWrapper);
}