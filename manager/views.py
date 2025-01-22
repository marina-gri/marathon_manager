from collections import defaultdict
from functools import wraps
from datetime import timedelta
from django.utils import timezone

from django.core.serializers.json import DjangoJSONEncoder
import json
from django.forms import model_to_dict
from django.http import JsonResponse, HttpResponseForbidden
from django.shortcuts import render, redirect
from django.urls import reverse
from django.utils.safestring import mark_safe
from django.views.decorators.csrf import csrf_exempt
from rest_framework.decorators import action
from rest_framework.generics import get_object_or_404
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.views import APIView
from rest_framework.viewsets import ModelViewSet
from rest_framework.response import Response
from rest_framework import status
from manager.models import CustomUser, Competition, CompetitionVisibility, Team, Pilot, SessionInfo, PitStopInfo
from manager.serializers import CustomUserSerializer, CompetitionSerializer, TeamSerializer, PilotSerializer, \
    SessionInfoSerializer, PitStopInfoSerializer
from django.conf import settings
import jwt
from django.db import IntegrityError
from django.contrib.auth import logout as django_logout


def redirect_if_authenticated(view_func):
    """
    Декоратор для проверки аутентификации пользователя.
    Если пользователь авторизован — пустить на запрашиваемую страницу.
    Если не авторизован — перенаправить на страницу авторизации.
    """
    @wraps(view_func)
    def _wrapped_view(request, *args, **kwargs):
        # Получаем токен из cookies
        token = request.COOKIES.get('access_token')

        # Если пользователь уже на странице авторизации, не делаем редирект
        if request.path == reverse('autorization_page'):
            return view_func(request, *args, **kwargs)

        if token:
            try:
                # Попытка расшифровать токен
                jwt.decode(token, settings.SIMPLE_JWT['SIGNING_KEY'], algorithms=["HS256"])
                # Если токен валиден, пускаем пользователя на запрашиваемую страницу
                return view_func(request, *args, **kwargs)
            except (jwt.ExpiredSignatureError, jwt.InvalidTokenError):
                pass  # Токен невалиден или истек
        # Если нет токена или он невалиден, перенаправляем на страницу авторизации
        return redirect('autorization_page')

    return _wrapped_view

def get_user_info(request):
    user_id = None
    user_name = None
    token = request.COOKIES.get('access_token')

    if token:
        try:
            payload = jwt.decode(token, settings.SIMPLE_JWT['SIGNING_KEY'], algorithms=["HS256"])
            user_id = payload.get('user_id')
            user = CustomUser.objects.get(id=user_id)
            user_name = user.name
        except (jwt.ExpiredSignatureError, jwt.InvalidTokenError, CustomUser.DoesNotExist):
            pass

    context = {
        'user_id': user_id,
        'user_name': user_name,
    }
    return context


def is_superuser(user_id):
    User = CustomUser  # Получаем модель пользователя
    try:
        user = User.objects.get(id=user_id)  # Пытаемся найти пользователя по ID
        return user.is_superuser  # Возвращаем True, если пользователь суперпользователь
    except User.DoesNotExist:
        return False

def registration_page(request):
    return render(request, 'manager/registration.html')

@redirect_if_authenticated
def autorization_page(request):
    return render(request, 'manager/autorization.html')


@redirect_if_authenticated
def main_page(request):
    context = get_user_info(request)
    return render(request, 'manager/main.html', context)


@redirect_if_authenticated
def create_race_page(request):
    context = get_user_info(request)
    return render(request, 'manager/create_race.html', context)


@redirect_if_authenticated
def race_page(request, pk):
    user_info = get_user_info(request)
    if (not is_superuser(user_info['user_id'])
        and not CompetitionVisibility.objects.filter(user_id=user_info['user_id'], competition_id=pk).exists()
        and not Competition.objects.filter(creator=user_info['user_id'], id=pk).exists()):
        return HttpResponseForbidden("У вас нет доступа к этому соревнованию.")

    competition_info = get_object_or_404(Competition, pk=pk)
    pilots_list = Pilot.objects.filter(team__competition_id=pk)

    # Преобразуем race_length из секунд в чч:мм:сс
    race_length_seconds = competition_info.race_length
    race_length_formatted = str(timedelta(seconds=race_length_seconds))  # Формат чч:мм:сс

    # Подготавливаем данные для сериализации
    competition_info_dict = {
        'id': competition_info.id,
        'title': competition_info.title,
        'track': competition_info.track,
        'race_start_at': competition_info.race_start_at.isoformat() if competition_info.race_start_at else None,
        'race_length': competition_info.race_length,
        'till_the_end': competition_info.till_the_end,
        'creator': competition_info.creator.id if competition_info.creator else None,
        'min_pit': competition_info.min_pit,
        'pit_to': competition_info.pit_to,
        'max_stint': competition_info.max_stint,
        'min_pilot': competition_info.min_pilot,
        'max_pilot': competition_info.max_pilot,
        'green_flag': competition_info.green_flag,
        'finish_flag': competition_info.finish_flag,
        'red_flag': competition_info.red_flag,
        'red_flag_begin': competition_info.red_flag_begin.isoformat() if competition_info.red_flag_begin else None,
        'red_flag_end': competition_info.red_flag_end.isoformat() if competition_info.red_flag_end else None,
        'delay': competition_info.delay,
        'finish_at': competition_info.finish_at.isoformat() if competition_info.finish_at else None,
        'race_length_formatted': race_length_formatted,
        'flag_image': 'finish_flag.png' if competition_info.green_flag else 'green_flag.png',
    }

    competition_info_json = json.dumps(competition_info_dict, cls=DjangoJSONEncoder)

    # Формируем список команд
    teams_list = list(Team.objects.filter(competition=pk).values(
        'id',
        'name',
        'number',
        'competition'
    ))
    team_json = json.dumps(teams_list, cls=DjangoJSONEncoder)

    # Формируем список пилотов
    teams_dict = defaultdict(lambda: {'team_id': None, 'team_name': None, 'pilots': []})
    for pilot in pilots_list:
        team = pilot.team
        if teams_dict[team.id]['team_id'] is None:  # Инициализация информации о команде
            teams_dict[team.id]['team_id'] = team.id
            teams_dict[team.id]['team_name'] = team.name
        # Добавляем пилота в список пилотов
        teams_dict[team.id]['pilots'].append(pilot.name)
    team_pilots = list(teams_dict.values())
    team_pilots_json = json.dumps(team_pilots, cls=DjangoJSONEncoder)

    # Подготавливаем данные для сериализации сессий
    sessions_list = list(SessionInfo.objects.filter(competition=pk).values(
        'id',
        'competition_id',
        'team_name',
        'pilot_name',
        'session_number',
        'planing_length',
        'fact_length',
        'begin',
        'end',
        'active',
        'finished'
    ))
    sessions_json = json.dumps(sessions_list, cls=DjangoJSONEncoder)


    # Подготавливаем данные для сериализации пит-стопов
    pitstop_list = list(PitStopInfo.objects.filter(competition=pk).values(
        'id',
        'competition_id',
        'team_name',
        'session_number',
        'begin',
        'end',
        'length',
        'active',
        'finished'
    ))
    pitstop_json = json.dumps(pitstop_list, cls=DjangoJSONEncoder)

    teams_info = Team.objects.filter(competition=pk)
    teams_info_list = [model_to_dict(team) for team in teams_info]

    # Передаем сериализованный JSON в контекст
    context = {
        **user_info,
        'competition': competition_info_json,
        'teams': team_json,
        'pilots': team_pilots_json,
        'sessions': sessions_json,
        'pitstop': pitstop_json,
        'teams_list': teams_info_list
    }
    return render(request, 'manager/race.html', context)

@redirect_if_authenticated
def edit_race_settings(request, pk):

    user_info = get_user_info(request)
    if (not is_superuser(user_info['user_id']) and
            not CompetitionVisibility.objects.filter(user_id=user_info['user_id'],competition_id=pk).exists() and
            not Competition.objects.filter(creator=user_info['user_id'],id=pk).exists()):
        return HttpResponseForbidden("У вас нет доступа к этому соревнованию.")
    competition = get_object_or_404(Competition, pk=pk)
    competition_data = {
        "id": competition.id,
        "title": competition.title,
        "track": competition.track,
        "race_start_at": competition.race_start_at.isoformat() if competition.race_start_at else None,
        "race_length": competition.race_length,
        "till_the_end": competition.till_the_end,
        "min_pit": competition.min_pit,
        "pit_to": competition.pit_to,
        "max_stint": competition.max_stint,
        "min_pilot": competition.min_pilot,
        "max_pilot": competition.max_pilot,
    }

    competition_visibility = list(CompetitionVisibility.objects.filter(competition_id=pk).values(
        'competition',
        'user'
    ))
    competition_visibility_json = json.dumps(competition_visibility, cls=DjangoJSONEncoder)

    context = {
        **user_info,
        'competition': mark_safe(json.dumps(competition_data)),
        'competition_visibility': competition_visibility_json,
    }
    return render(request, 'manager/race_settings.html', context)


class RegistrationUserView(ModelViewSet):
    """ Регистрация пользователя """
    serializer_class = CustomUserSerializer
    queryset = CustomUser.objects.all()
    permission_classes = [AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response({"message": "Регистрация прошла успешно!"}, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class LoginUserView(APIView):
    permission_classes = [AllowAny]
    """ Авторизация пользователя и выдача токенов """

    def post(self, request, *args, **kwargs):
        try:
            email = request.data.get('email')
            password = request.data.get('password')

            # Проверка, что email и пароль переданы
            if not email or not password:
                return Response({'detail': 'Email и пароль обязательны.'}, status=status.HTTP_400_BAD_REQUEST)

            # Ищем пользователя по email
            try:
                user = CustomUser.objects.get(email=email)
            except CustomUser.DoesNotExist:
                return Response({"detail": "Неверный email или пароль."}, status=status.HTTP_400_BAD_REQUEST)

            # Проверяем пароль
            if not user.check_password(password):
                return Response({"detail": "Неверный email или пароль."}, status=status.HTTP_400_BAD_REQUEST)

            # Создаем JWT токены
            try:
                refresh = RefreshToken.for_user(user)
                access_token = refresh.access_token
            except Exception as e:
                return Response({"detail": f"Ошибка при генерации токенов: {str(e)}"},
                                status=status.HTTP_500_INTERNAL_SERVER_ERROR)

            # Проверяем типы токенов
            if not isinstance(str(access_token), str) or not isinstance(str(refresh), str):
                return Response({"detail": "Некорректные токены."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

            # Возвращаем токены
            response = Response({
                'message': 'Успешная авторизация.',
                'access': str(access_token),
                'refresh': str(refresh),
            }, status=status.HTTP_200_OK)
            response['Content-Type'] = 'application/json'

            # Устанавливаем токены в cookies
            response.set_cookie('access_token', str(access_token))
            response.set_cookie('refresh_token', str(refresh))

            return response
        except IntegrityError:
            return Response({"detail": "Ошибка базы данных."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        except Exception as e:
            return Response({"detail": f"Произошла ошибка: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@csrf_exempt
def logout_view(request):
    """
    Выход пользователя: удаление токенов из куков и завершение сессии.
    """
    response = JsonResponse({'message': 'Выход выполнен'})

    # Удаляем куки
    response.delete_cookie('access_token', path='/')
    response.delete_cookie('refresh_token', path='/')
    response.delete_cookie('csrftoken', path='/')

    # Очистить сессию
    django_logout(request)

    return response


class CompetitionViewSet(ModelViewSet):
    serializer_class = CompetitionSerializer
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.is_superuser:
            return Competition.objects.all()

        competitions_created = Competition.objects.filter(creator=user)
        competitions_visible = Competition.objects.filter(competition_visibility__user=user)

        return (competitions_created | competitions_visible).distinct().order_by('-race_start_at')

    def perform_create(self, serializer):
        competition = serializer.save(creator=self.request.user)

        visibilities_data = self.request.data.get('visibilities', [])
        for visibility_data in visibilities_data:
            user_id = visibility_data.get('user_id')
            if user_id:
                try:
                    user = CustomUser.objects.get(id=user_id)
                    CompetitionVisibility.objects.create(competition=competition, user=user)
                except CustomUser.DoesNotExist:
                    continue

        return competition

    def partial_update(self, request, *args, **kwargs):
        kwargs['partial'] = True
        response = self.update(request, *args, **kwargs)  # Выполняем обновление Competition
        competition = self.get_object()
        # Получаем переданные данные о видимости
        visibilities_data = self.request.data.get('visibilities', [])
        for visibility_data in visibilities_data:
            user_id = visibility_data.get('user_id')
            if user_id:
                try:
                    user = CustomUser.objects.get(id=user_id)
                    CompetitionVisibility.objects.create(competition=competition, user=user)
                except CustomUser.DoesNotExist:
                    continue

        return response

    @action(detail=True, methods=['post'])
    def update_flags(self, request, pk=None):
        competition = get_object_or_404(Competition, pk=pk)
        flag_action = request.data.get('action')
        timer_value = request.data.get('timerValue')
        now = timezone.now()

        if flag_action == 'start':
            if competition.green_flag or competition.red_flag or competition.finish_flag:
                return Response(
                    {'error': 'Невозможно начать гонку в текущем состоянии.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            competition.green_flag = True
            competition.race_start_at = now

            sessions = SessionInfo.objects.filter(competition=pk).filter(session_number=1)
            for session in sessions:
                session.active = True
                session.begin = 0
                session.save()
        elif flag_action == 'red_flag':
            if competition.finish_flag:
                return Response(
                    {'error': 'Гонка завершена, изменения недопустимы.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            if competition.red_flag:
                competition.red_flag = False
                competition.green_flag = True
                competition.red_flag_end = now
            else:
                competition.red_flag = True
                competition.green_flag = False
                competition.red_flag_begin = now
        elif flag_action == 'finish':
            if competition.finish_flag:
                return Response(
                    {'error': 'Гонка уже завершена.'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            sessions = SessionInfo.objects.filter(competition=pk).filter(active=True)
            for session in sessions:
                session.active = False
                session.finished = True
                end = timer_value

                session.fact_length = end - session.begin
                session.end = end
                session.save()

            competition.finish_flag = True
            competition.green_flag = False
            competition.red_flag = False
            competition.finish_at = now

            if competition.red_flag:
                competition.red_flag_end = now

            sessions = SessionInfo.objects.filter(competition=pk).filter(active=True)
            for session in sessions:
                session.active = False
                session.finished = True
                session.end = timer_value
                session.save()
        else:
            return Response(
                {'error': 'Некорректное действие.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        competition.save()

        return Response({'success': True, 'competition': CompetitionSerializer(competition).data})

class TeamViewSet(ModelViewSet):
    serializer_class = TeamSerializer
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        competition_id = self.request.query_params.get('competition_id')
        if competition_id:
            return Team.objects.filter(competition_id=competition_id)
        return Team.objects.all()

    @action(detail=False, methods=['post'])
    def add_team_with_pilots(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        team = serializer.save()
        return Response({'message': f'Команда "{team.name}" с пилотами добавлена успешно!', 'team': serializer.data})


class SessionInfoViewSet(ModelViewSet):
    serializer_class = SessionInfoSerializer
    queryset = SessionInfo.objects.all()
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def partial_update(self, request, *args, **kwargs):
        kwargs['partial'] = True
        return self.update(request, *args, **kwargs)


class PitStopInfoViewSet(ModelViewSet):
    queryset = PitStopInfo.objects.all()
    serializer_class = PitStopInfoSerializer
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def partial_update(self, request, *args, **kwargs):
        kwargs['partial'] = True
        return self.update(request, *args, **kwargs)