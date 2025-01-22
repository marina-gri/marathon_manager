document.addEventListener('DOMContentLoaded', function() {
    const form = document.querySelector('#create-race-form');
    form.addEventListener('submit', function(event) {
        event.preventDefault();  // Предотвращаем стандартное поведение формы

        // Получаем значения из формы
        const title = document.querySelector('input[name="title"]').value;  // Название соревнования
        const track = document.querySelector('input[name="track"]').value || '';  // Трасса
        const raceStartAt = document.querySelector('input[name="race_start_at"]').value || '';  // Дата старта
        const tillTheEnd = document.querySelector('input[name="till_the_end"]').checked;  // Пока не закончится

        // Проверяем обязательные поля
        if (!title || !raceStartAt) {
            Swal.fire({
                icon: 'error',
                title: 'Ошибка',
                text: 'Название соревнования и дата старта обязательны!',
            });
            return;
        }

        // Обработка времени гонки
        let raceLength = 0;  // Значение по умолчанию, если гонка длится до конца
        if (!tillTheEnd) {
            // Если till_the_end не выбран, преобразуем введенные значения в секунды
            const raceLengthHours = document.querySelector('input[name="race_length_hours"]').value || 0;
            const raceLengthMinutes = document.querySelector('input[name="race_length_minutes"]').value || 0;
            raceLength = (parseInt(raceLengthHours) * 3600) + (parseInt(raceLengthMinutes) * 60);
        }

        // Преобразуем числовые поля в секунды, если они не пустые
        const minPitMinutes = document.querySelector('input[name="min_pit_minutes"]').value || 0;
        const minPitSeconds = document.querySelector('input[name="min_pit_seconds"]').value || 0;
        const minPit = (parseInt(minPitMinutes) * 60) + parseInt(minPitSeconds);

        const maxStintHours = document.querySelector('input[name="max_stint_hours"]').value || 0;
        const maxStintMinutes = document.querySelector('input[name="max_stint_minutes"]').value || 0;
        const maxStint = (parseInt(maxStintHours) * 3600) + (parseInt(maxStintMinutes) * 60);

        const minPilotHours = document.querySelector('input[name="min_pilot_hours"]').value || 0;
        const minPilotMinutes = document.querySelector('input[name="min_pilot_minutes"]').value || 0;
        const minPilot = (parseInt(minPilotHours) * 3600) + (parseInt(minPilotMinutes) * 60);

        const maxPilotHours = document.querySelector('input[name="max_pilot_hours"]').value || 0;
        const maxPilotMinutes = document.querySelector('input[name="max_pilot_minutes"]').value || 0;
        const maxPilot = (parseInt(maxPilotHours) * 3600) + (parseInt(maxPilotMinutes) * 60);

        const pitTo = document.querySelector('select[name="pit_to"]').value || 'nobody';

        // Собирать ID пользователей в объект для поля visibilities
        const userIds = [];
        const userInputs = document.querySelectorAll('.user_id');
        userInputs.forEach(input => {
            if(input.value) {
                userIds.push({ user_id: parseInt(input.value) });  // Мы создаем объект с полем `user_id`, где значение - это ID пользователя
            }
        });
        // Создаем объект для отправки на сервер
        const formData = {
            title: title,
            track: track,
            race_start_at: raceStartAt,
            race_length: raceLength,  // Отправляем продолжительность гонки в секундах
            till_the_end: tillTheEnd,
            min_pit: minPit,  // Минимальное время пит-стопа в секундах
            pit_to: pitTo,
            max_stint: maxStint,  // Максимальная продолжительность сессии в секундах
            min_pilot: minPilot,  // Минимальное время пилота в секундах
            max_pilot: maxPilot,  // Максимальное время пилота в секундах
            visibilities: userIds  // Передаем сформированный список объектов
        };

        const token = getCookie('access_token'); // Получаем токен из cookies

        if (!token) {
            Swal.fire({
                icon: 'error',
                title: 'Ошибка',
                text: 'Необходимо авторизоваться',
            });
            return;
        }

        // Отправляем данные на сервер через fetch (AJAX)
        fetch('/api/v1/main/', {
            method: 'POST',
            headers: {
                'Authorization': 'Bearer ' + token,  // Добавляем токен в заголовок
                'Content-Type': 'application/json',  // Указываем, что отправляем данные в формате JSON
            },
            body: JSON.stringify(formData),  // Отправляем данные как JSON
        })
        .then(response => response.json())
        .then(data => {
            if (data.id) {
                Swal.fire({
                    icon: 'success',
                    title: 'Успех!',
                    text: 'Соревнование успешно создано!',
                }).then(() => {
                    window.location.href = '/main';  // Перенаправляем на страницу соревнований
                });
            } else {
                Swal.fire({
                    icon: 'error',
                    title: 'Ошибка',
                    text: 'Ошибка при создании соревнования: ' + JSON.stringify(data),
                });
            }
        })
        .catch(error => {
            console.error('Ошибка при отправке данных:', error);
            Swal.fire({
                icon: 'error',
                title: 'Произошла ошибка',
                text: 'Ошибка при создании соревнования.',
            });
        });
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
