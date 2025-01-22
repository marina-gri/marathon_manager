document.addEventListener("DOMContentLoaded", () => {
    const logoutButton = document.querySelector('#logout-button'); // Кнопка выхода

    logoutButton.addEventListener('click', async () => {
        try {
            // Выполняем запрос на выход
            const response = await fetch('/api/v1/logout/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${getCookie('access_token')}`, // Токен из куки
                    'X-CSRFToken': getCookie('csrftoken') // CSRF токен из куки
                }
            });

            // Если выход прошел успешно
            if (response.ok) {
                // Показываем уведомление через SweetAlert2
                Swal.fire({
                    icon: 'success',
                    title: 'Выход выполнен!',
                    text: 'Вы успешно вышли из системы.',
                    confirmButtonText: 'Ок'
                }).then(() => {
                    // Перенаправляем пользователя на страницу логина
                    window.location.href = '/login/';
                });
            } else {
                console.error('Ошибка при выходе');
                Swal.fire({
                    icon: 'error',
                    title: 'Ошибка!',
                    text: 'Не удалось выполнить выход.',
                    confirmButtonText: 'Ок'
                });
            }
        } catch (error) {
            console.error('Ошибка при выполнении запроса:', error);
            Swal.fire({
                icon: 'error',
                title: 'Ошибка!',
                text: 'Не удалось выполнить запрос.',
                confirmButtonText: 'Ок'
            });
        }
    });

    // Функция для получения значения из куки
    function getCookie(name) {
        let value = "; " + document.cookie;
        let parts = value.split("; " + name + "=");
        if (parts.length === 2) return parts.pop().split(";").shift();
    }
});
