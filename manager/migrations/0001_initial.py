# Generated by Django 5.1.3 on 2024-12-20 13:58

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ('auth', '0012_alter_user_first_name_max_length'),
    ]

    operations = [
        migrations.CreateModel(
            name='CustomUser',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('last_login', models.DateTimeField(blank=True, null=True, verbose_name='last login')),
                ('is_superuser', models.BooleanField(default=False, help_text='Designates that this user has all permissions without explicitly assigning them.', verbose_name='superuser status')),
                ('email', models.EmailField(error_messages={'invalid': 'Введите корректный Email.', 'unique': 'Пользователь с таким Email уже существует.'}, max_length=254, unique=True, verbose_name='email address')),
                ('password', models.CharField(verbose_name='password')),
                ('name', models.CharField(blank=True, max_length=150, null=True)),
                ('is_staff', models.BooleanField(default=False)),
                ('is_active', models.BooleanField(default=True)),
                ('date_joined', models.DateTimeField(auto_now=True)),
                ('groups', models.ManyToManyField(blank=True, help_text='The groups this user belongs to. A user will get all permissions granted to each of their groups.', related_name='user_set', related_query_name='user', to='auth.group', verbose_name='groups')),
                ('user_permissions', models.ManyToManyField(blank=True, help_text='Specific permissions for this user.', related_name='user_set', related_query_name='user', to='auth.permission', verbose_name='user permissions')),
            ],
            options={
                'abstract': False,
            },
        ),
        migrations.CreateModel(
            name='Competition',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('title', models.CharField(max_length=200, verbose_name='Название соревнования')),
                ('track', models.CharField(blank=True, max_length=150, null=True, verbose_name='Трасса')),
                ('race_start_at', models.DateTimeField(verbose_name='Дата и время начала гонки')),
                ('race_length', models.PositiveIntegerField(default=0, verbose_name='Продолжительность гонки, сек')),
                ('till_the_end', models.BooleanField(default=False, verbose_name='До завершения')),
                ('min_pit', models.PositiveIntegerField(default=0, verbose_name='Минимальное время пит-стопа, сек')),
                ('pit_to', models.CharField(max_length=50, verbose_name='Кому пит')),
                ('max_stint', models.PositiveIntegerField(default=0, verbose_name='Максимальная продолжительность сессии, сек')),
                ('min_pilot', models.PositiveIntegerField(default=0, verbose_name='Минимальное общее время пилота, сек')),
                ('max_pilot', models.PositiveIntegerField(default=0, verbose_name='Максимальное общее время пилота, сек')),
                ('green_flag', models.BooleanField(default=False, verbose_name='Зеленый флаг')),
                ('finish_flag', models.BooleanField(default=False, verbose_name='Финиш')),
                ('red_flag', models.BooleanField(default=False, verbose_name='Красный флаг')),
                ('red_flag_begin', models.DateTimeField(blank=True, null=True, verbose_name='Красный флаг начало')),
                ('red_flag_end', models.DateTimeField(blank=True, null=True, verbose_name='Красный флаг конец')),
                ('delay', models.PositiveIntegerField(default=0, verbose_name='Задержка')),
                ('finish_at', models.DateTimeField(blank=True, null=True, verbose_name='Дата и время финиша гонки')),
                ('creator', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='created_competitions', to=settings.AUTH_USER_MODEL, verbose_name='Создатель')),
            ],
        ),
        migrations.CreateModel(
            name='CompetitionVisibility',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('competition', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='competition_visibility', to='manager.competition')),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='accessible_competitions', to=settings.AUTH_USER_MODEL)),
            ],
        ),
        migrations.CreateModel(
            name='PitStopInfo',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('team_name', models.CharField(max_length=50, verbose_name='Команда')),
                ('session_number', models.PositiveIntegerField(verbose_name='Номер сессии')),
                ('begin', models.PositiveIntegerField(blank=True, null=True, verbose_name='Начало пит-стопа, сек')),
                ('end', models.PositiveIntegerField(blank=True, null=True, verbose_name='Конец пит-стопа, сек')),
                ('length', models.PositiveIntegerField(blank=True, null=True, verbose_name='Продолжительность пит-стопа')),
                ('active', models.BooleanField(default=True, verbose_name='Активность')),
                ('finished', models.BooleanField(default=False, verbose_name='Завершено')),
                ('competition', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='pit', to='manager.competition')),
            ],
        ),
        migrations.CreateModel(
            name='SessionInfo',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('team_name', models.CharField(max_length=50, verbose_name='Команда')),
                ('pilot_name', models.CharField(blank=True, max_length=50, verbose_name='Пилот')),
                ('session_number', models.PositiveIntegerField(verbose_name='Номер сессии')),
                ('planing_length', models.PositiveIntegerField(blank=True, null=True, verbose_name='Планируемая продолжительность')),
                ('fact_length', models.PositiveIntegerField(blank=True, null=True, verbose_name='Фактическая продолжительность')),
                ('begin', models.PositiveIntegerField(blank=True, null=True, verbose_name='Начало сессии, сек')),
                ('end', models.PositiveIntegerField(blank=True, null=True, verbose_name='Конец сессии, сек')),
                ('active', models.BooleanField(default=False, verbose_name='Активность')),
                ('finished', models.BooleanField(default=False, verbose_name='Завершено')),
                ('competition', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='sessions', to='manager.competition')),
            ],
        ),
        migrations.CreateModel(
            name='Team',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=200, verbose_name='Название команды')),
                ('number', models.PositiveIntegerField(verbose_name='Номер команды')),
                ('competition', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='teams', to='manager.competition')),
            ],
        ),
        migrations.CreateModel(
            name='Pilot',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=150, verbose_name='Имя пилота')),
                ('team', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='pilots', to='manager.team')),
            ],
        ),
    ]
