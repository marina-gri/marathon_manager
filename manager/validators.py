import re
from django.core.exceptions import ValidationError
from manager.models import CustomUser

# Валидатор для email
def validate_email(value):
    email_regex = r'^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$'
    if not re.match(email_regex, value):
        raise ValidationError('Введите действительный адрес электронной почты.')

    if CustomUser.objects.filter(email=value).exists():
        raise ValidationError('Этот Email уже зарегистрирован.')

    if not value:
        raise ValidationError('Заполните поле Email')

# Валидатор для имени пользователя
def validate_name(value):
    if len(value) <= 2:
        raise ValidationError('Имя пользователя должно быть не менее 3 символов.')

# Валидатор для пароля
def validate_password(value):
    if len(value) < 8:
        raise ValidationError("Пароль должен быть не менее 8 символов.")

    if not value:
        raise ValidationError('Введите пароль')
