// Функция для получения JWT токена из cookies
function getCookie(name) {
    const value = "; " + document.cookie;
    const parts = value.split("; " + name + "=");
    if (parts.length === 2) return parts.pop().split(";").shift();
    return null;
}

// Функция для отправки GET-запроса с токеном в заголовке
function fetchCompetitions() {
    const token = getCookie('access_token');  // Получаем токен из cookies

    if (!token) {
        console.error('Токен не найден!');
        return;
    }

    // Отправляем GET запрос на API с токеном в заголовке
    fetch(`/api/v1/main/`, {
        method: 'GET',
        headers: {
            'Authorization': 'Bearer ' + token,  // Указываем токен в Authorization header
            'X-CSRFToken': getCookie('csrftoken'), // Добавляем CSRF токен в заголовки
        },
        credentials: 'include',
    })
    .then(response => response.json())  // Преобразуем ответ в JSON
    .then(data => {
        console.log('Данные получены с сервера:', data);  // Логируем полученные данные
        displayCompetitions(data);  // Обрабатываем полученные данные
    })
    .catch(error => {
        console.error('Ошибка при получении данных:', error);
    });
}

// Функция для преобразования времени из секунд в формат "часы:минуты:секунды"
function formatTime(seconds) {
    const hours = Math.floor(seconds / 3600);  // Получаем количество часов
    const minutes = Math.floor((seconds % 3600) / 60);  // Получаем количество минут
    const remainingSeconds = seconds % 60;  // Оставшиеся секунды

    // Форматируем строку в "часы:минуты:секунды"
    return `${hours}ч ${minutes < 10 ? '0' + minutes : minutes}мин`;
    //${remainingSeconds < 10 ? '0' + remainingSeconds : remainingSeconds}
}

// Функция для отображения соревнований на странице
function displayCompetitions(competitions) {
    const raceItemsContainer = document.getElementById('race-items-container');
    if (!raceItemsContainer) {
        console.error('Элемент race-items-container не найден!');
        return;
    }

    competitions.sort((a, b) => new Date(b.race_start_at) - new Date(a.race_start_at));

    raceItemsContainer.innerHTML = '';  // Очищаем текущий список

    // Проходим по каждому соревнованию и создаем элемент для каждого
    competitions.forEach(competition => {
        const listItem = document.createElement('li');
        // Преобразуем строку даты в объект Date
        const raceDate = new Date(competition.race_start_at);

        // Получаем дату и время отдельно
        const date = raceDate.toLocaleDateString();
        const time = raceDate.toLocaleTimeString();

        // Форматируем продолжительность гонки в "часы:минуты:секунды"
        const raceLengthFormatted = formatTime(competition.race_length);

        const statusColor = competition.green_flag ? 'green' : 'lightgrey';

        listItem.innerHTML = `
            <a href="/race/${competition.id}/">
               <div class="race-card">
                    <div class="race-info-block">
                        <div class="title-block-style">
                            <p>${competition.title}</p>
                        </div>
                        <div class="track-block-style">
                                <p>Трасса: ${competition.track}</p>
                            </div>
                        
                        <div class="track-lenth-block">
                            <div class="datetime-block-style">
                                <p>Дата и время: ${date} ${time}</p>
                            </div>
                            <div class="length-block-style">
                                <p>Продолжительность: ${raceLengthFormatted}</p>
                            </div>
                        </div>
                    </div>
                    <div class="status-info-block" style="color: ${statusColor};">
                        <p>•</p>
                    </div>
                </div> 
            </a>
        `;

        listItem.classList.add('li-element');  

        raceItemsContainer.appendChild(listItem);  // Добавляем новый элемент в контейнер
    });
}


// Запускаем при загрузке страницы
document.addEventListener('DOMContentLoaded', function() {
    fetchCompetitions();  // Загружаем все соревнования через API
});

// Обработчик для кнопки
document.getElementById('add-race-button').addEventListener('click', function() {
    // Перенаправление на страницу создания соревнования
    window.location.href = '/create_race/';  // Убедитесь, что этот путь правильный
});
