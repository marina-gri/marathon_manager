from django.db import models
from django.contrib.auth.base_user import AbstractBaseUser
from django.contrib.auth.models import PermissionsMixin
from .managers import CustomUserManager
from django.utils.translation import gettext_lazy as _
from django.conf import settings


class CustomUser(AbstractBaseUser, PermissionsMixin):
    email = models.EmailField(
        _('email address'),
        unique=True,
        error_messages={
            'unique': 'Пользователь с таким Email уже существует.',
            'invalid': 'Введите корректный Email.',
        },
    )
    password = models.CharField(_('password'), null=False, blank=False)
    name = models.CharField(max_length=150, blank=True, null=True)
    is_staff = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    date_joined = models.DateTimeField(auto_now=True)
    USERNAME_FIELD = 'email'
    objects = CustomUserManager()
    def __str__(self):
        return self.email


class Competition(models.Model):
    title = models.CharField(max_length=200, verbose_name='Название соревнования')
    track = models.CharField(max_length=150, verbose_name='Трасса', blank=True, null=True)
    race_start_at = models.DateTimeField(verbose_name='Дата и время начала гонки')
    race_length = models.PositiveIntegerField(verbose_name='Продолжительность гонки, сек', default=0)
    till_the_end = models.BooleanField(default=False, verbose_name='До завершения')
    creator = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='created_competitions',
        verbose_name='Создатель'
    )
    min_pit = models.PositiveIntegerField(verbose_name='Минимальное время пит-стопа, сек', default=0)
    pit_to = models.CharField(max_length=50, verbose_name='Кому пит')
    max_stint = models.PositiveIntegerField(verbose_name='Максимальная продолжительность сессии, сек', default=0)
    min_pilot = models.PositiveIntegerField(verbose_name='Минимальное общее время пилота, сек', default=0)
    max_pilot = models.PositiveIntegerField(verbose_name='Максимальное общее время пилота, сек', default=0)
    green_flag = models.BooleanField(default=False, verbose_name='Зеленый флаг')
    finish_flag = models.BooleanField(default=False, verbose_name='Финиш')
    red_flag = models.BooleanField(default=False, verbose_name='Красный флаг')
    red_flag_begin = models.DateTimeField(blank=True, null=True, verbose_name='Красный флаг начало')
    red_flag_end = models.DateTimeField(blank=True, null=True, verbose_name='Красный флаг конец')
    delay = models.PositiveIntegerField(verbose_name='Задержка', default=0)
    finish_at = models.DateTimeField(verbose_name='Дата и время финиша гонки', blank=True, null=True)

    def __str__(self):
        return self.title


class CompetitionVisibility(models.Model):
    competition = models.ForeignKey(Competition, on_delete=models.CASCADE, related_name='competition_visibility')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='accessible_competitions')

    def __str__(self):
        return f"{self.user.name} -> {self.competition.title}"

class Team(models.Model):
    name = models.CharField(max_length=200, verbose_name='Название команды')
    number = models.PositiveIntegerField(verbose_name='Номер команды')
    competition = models.ForeignKey(Competition, on_delete=models.CASCADE, related_name='teams')

    def __str__(self):
        return f"{self.name} ({self.competition.title})"


class Pilot(models.Model):
    name = models.CharField(max_length=150, verbose_name='Имя пилота')
    team = models.ForeignKey(Team, on_delete=models.CASCADE, related_name='pilots')

    def __str__(self):
        return f"{self.name} ({self.team.name})"


class SessionInfo(models.Model):
    competition = models.ForeignKey(Competition, on_delete=models.CASCADE, related_name='sessions', verbose_name="Соревнование")
    team_name = models.CharField(max_length=50, verbose_name="Команда")
    pilot_name = models.CharField(max_length=50, verbose_name="Пилот", blank=True)
    session_number = models.PositiveIntegerField(verbose_name="Номер сессии", blank=False, null=False)
    planing_length = models.PositiveIntegerField(verbose_name="Планируемая продолжительность", blank=True, null=True)
    fact_length = models.PositiveIntegerField(verbose_name="Фактическая продолжительность", blank=True, null=True)
    begin = models.PositiveIntegerField(verbose_name="Начало сессии, сек", blank=True, null=True)
    end = models.PositiveIntegerField(verbose_name="Конец сессии, сек", blank=True, null=True)
    active = models.BooleanField(default=False, verbose_name='Активность')
    finished = models.BooleanField(default=False, verbose_name='Завершено')

    def __str__(self):
        return f"{self.team_name} - {self.session_number} ({self.pilot_name}) - {self.begin} - {self.end}"


class PitStopInfo(models.Model):
    competition = models.ForeignKey(Competition, on_delete=models.CASCADE, related_name='pit')
    team_name = models.CharField(max_length=50, verbose_name="Команда")
    session_number = models.PositiveIntegerField(verbose_name="Номер сессии", blank=False, null=False)
    begin = models.PositiveIntegerField(verbose_name="Начало пит-стопа, сек", blank=True, null=True)
    end = models.PositiveIntegerField(verbose_name="Конец пит-стопа, сек", blank=True, null=True)
    length = models.PositiveIntegerField(verbose_name="Продолжительность пит-стопа", blank=True, null=True)
    active = models.BooleanField(default=True, verbose_name='Активность')
    finished = models.BooleanField(default=False, verbose_name='Завершено')

    def __str__(self):
        return f"{self.competition} - {self.session_number} ({self.team_name})"