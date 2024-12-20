document.addEventListener('DOMContentLoaded', () => {
    console.log("JS для авторизации загружен!");

    async function authorizeUser(event) {
        event.preventDefault();

        console.log("Функция авторизации вызвана");

        // Получаем значения полей
        const email = String(document.getElementById("email").value).trim();
        const password = String(document.getElementById("password").value);

        // Проверяем заполненность полей
        if (!email || !password) {
            Swal.fire({
                icon: 'error',
                title: 'Ошибка!',
                text: 'Все поля должны быть заполнены.',
            });
            return;
        }

        try {
            // Получаем CSRF токен из cookies
            const csrfToken = getCookie('csrftoken');
            
            // Отправляем данные на сервер
            const response = await fetch('/api/v1/login/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': csrfToken, // Отправляем CSRF токен в заголовке
                },
                body: JSON.stringify({
                    email: email,
                    password: password,
                }),
            });

            const result = await response.json();

            if (response.ok) {
                // Успех
                Swal.fire({
                    icon: 'success',
                    title: 'Добро пожаловать!',
                    text: 'Вы успешно вошли в систему.',
                }).then(() => {
                    window.location.href = '/main/'; // Переадресация на главную страницу
                });
            } else {
                // Ошибки
                const errorText = Object.values(result).join('\n');
                Swal.fire({
                    icon: 'error',
                    title: 'Ошибка авторизации!',
                    text: errorText,
                });
            }
        } catch (error) {
            console.error("Ошибка при отправке запроса:", error);
            Swal.fire({
                icon: 'error',
                title: 'Ошибка!',
                text: 'Произошла ошибка на сервере. Попробуйте позже.',
            });
        }
    }

    // Функция получения CSRF-токена
    function getCookie(name) {
        let cookieValue = null;
        if (document.cookie && document.cookie !== '') {
            const cookies = document.cookie.split(';');
            for (let i = 0; i < cookies.length; i++) {
                const cookie = cookies[i].trim();
                if (cookie.startsWith(name + '=')) {
                    cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                    break;
                }
            }
        }
        return cookieValue;
    }

    // Привязываем обработчик к форме
    const form = document.getElementById('autorization-form');
    form.addEventListener('submit', authorizeUser);
});
