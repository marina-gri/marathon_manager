document.addEventListener('DOMContentLoaded', function () {
    const greenButton = document.querySelector('.flag-btn.start');
    const redButton = document.querySelector('.flag-btn.red');
    const finishButton = document.querySelector('.flag-btn.finish');

    let timerValue = 0;

    // Слушаем обновления таймера из race.js
    window.addEventListener('timerUpdate', function (event) {
        timerValue = event.detail.elapsedSeconds;
    });

    async function sendFlagUpdate(action) {
        const token = getCookie('access_token');  // Получаем токен из cookies
        if (!token) {
            console.error('Токен не найден!');
            return;
        }
        try {
            const competitionId = JSON.parse(document.getElementById('competition-data').textContent).id;

            const response = await fetch(`/api/v1/main/${competitionId}/update_flags/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + token,
                    'X-CSRFToken': getCookie('csrftoken'),
                },
                body: JSON.stringify({ action, timerValue }),
            });
            const result = await response.json();

            if (response.ok) {
                alert('Состояние обновлено!');
                location.reload(); // Перезагрузка страницы для обновления данных
            } else {
                alert(result.error || 'Ошибка при обновлении состояния.');
            }
        } catch (error) {
            console.error('Ошибка:', error);
            alert('Произошла ошибка при взаимодействии с сервером.');
        }
    }

    greenButton.addEventListener('click', async function () {
        const competitionData = JSON.parse(document.getElementById('competition-data').textContent);
        if (competitionData.green_flag) {
            alert('Гонка уже началась.');
        } else if (competitionData.finish_flag) {
            alert('Гонка завершена. Возобновить невозможно.');
        } else if (competitionData.red_flag) {
            alert('Для снятия режима красных флагов нажмите повторно кнопку "Красный флаг".');
        } else {
            await sendFlagUpdate('start');
        }
    });

    redButton.addEventListener('click', async function () {
        const competitionData = JSON.parse(document.getElementById('competition-data').textContent);
        if (!competitionData.green_flag && !competitionData.red_flag && !competitionData.finish_flag) {
            alert('Гонка еще не началась. Для старта нажмите кнопку "Зеленый флаг".');
        } else if (competitionData.finish_flag) {
            alert('Гонка завершена. Возобновить невозможно.');
        } else if (competitionData.red_flag) {
            await sendFlagUpdate('red_flag');
        } else {
            await sendFlagUpdate('red_flag');
        }
    });

    finishButton.addEventListener('click', async function () {
        const competitionData = JSON.parse(document.getElementById('competition-data').textContent);
        if (!competitionData.green_flag && !competitionData.red_flag && !competitionData.finish_flag) {
            alert('Гонка еще не началась. Для старта нажмите кнопку "Зеленый флаг".');
        } else if (competitionData.finish_flag) {
            alert('Гонка уже завершена.');
        } else if (competitionData.red_flag || competitionData.green_flag) {
            if (confirm('Вы действительно хотите завершить гонку?')) {
                await sendFlagUpdate('finish');
            }
        }
    });

    // Функция для получения CSRF-токена
    function getCookie(name) {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop().split(';').shift();
    }
});
