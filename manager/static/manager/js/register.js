document.addEventListener('DOMContentLoaded', () => {
    console.log("JS файл загружен и работает!");

    // Маппинг названий полей
    const fieldLabels = {
        email: 'E-mail',
        name: 'Логин',
        password: 'Пароль',
    };

    async function registerUser(event) {
        event.preventDefault();

        console.log("Функция registerUser вызвана");

        const name = document.getElementById("name").value.trim();
        const email = document.getElementById("email").value.trim();
        const password1 = document.getElementById("password1").value;
        const password2 = document.getElementById("password2").value;

        // Собираем ошибки в массив
        let errors = [];

        if (!email) {
            errors.push('Поле E-mail не может быть пустым');
        }

        if (!name) {
            errors.push('Поле Логин не может быть пустым');
        }

        if (!password1) {
            errors.push('Поле Пароль не может быть пустым');
        }

        if (!password2) {
            errors.push('Поле Подтверждение пароля не может быть пустым');
        }

        if (password1 && password2 && password1 !== password2) {
            errors.push('Пароли не совпадают');
        }

        // Если есть ошибки, показываем их через SweetAlert2
        if (errors.length > 0) {
            Swal.fire({
                icon: 'error',
                title: 'Ошибка',
                html: `<ul style="text-align: left;">${errors.map(err => `<li>${err}</li>`).join('')}</ul>`,
            });
            console.log("Ошибки:", errors);
            return;
        }

        // Если ошибок нет, отправляем данные на сервер
        try {
            const response = await fetch('/api/v1/register/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': '{{ csrf_token }}',
                },
                body: JSON.stringify({
                    name: name,
                    email: email,
                    password: password1,
                }),
            });

            const result = await response.json();
            if (response.ok) {
                console.log("Успешный ответ:", result);
                Swal.fire({
                    icon: 'success',
                    title: 'Успех!',
                    text: result.message,
                }).then(() => {
                    window.location.href = '/login/';
                });
            } else {
                console.log("Ошибки от сервера:", result);

                // Преобразуем названия полей из ответа сервера
                const serverErrors = Object.keys(result)
                    .map(field => {
                        const label = fieldLabels[field] || field; // Если нет соответствия, оставляем оригинальное название
                        return `${label}: ${result[field][0]}`;
                    })
                    .join('<br>');

                Swal.fire({
                    icon: 'error',
                    title: 'Ошибка регистрации',
                    html: serverErrors,
                });
            }
        } catch (error) {
            console.error("Произошла ошибка:", error);
            Swal.fire({
                icon: 'error',
                title: 'Ошибка!',
                text: 'Не удалось отправить данные. Попробуйте позже.',
            });
        }
    }

    document.querySelector('form').addEventListener('submit', registerUser);
});
