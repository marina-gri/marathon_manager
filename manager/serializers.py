from rest_framework import serializers
from manager.models import CustomUser, Competition, CompetitionVisibility, Team, Pilot, SessionInfo, PitStopInfo
from manager.validators import validate_email, validate_name, validate_password


class CustomUserSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(validators=[validate_email])
    name = serializers.CharField(validators=[validate_name])
    password = serializers.CharField(write_only=True, validators=[validate_password])

    class Meta:
        model = CustomUser
        fields = ['id', 'email', 'password', 'name', 'is_staff', 'is_active', 'date_joined']

    def create(self, validated_data):
        """
        Переопределяем метод create, чтобы пароль сохранялся в хэшированном виде
        """
        password = validated_data.pop('password')  # Извлекаем пароль
        user = CustomUser.objects.create(**validated_data)  # Создаём пользователя
        user.set_password(password)  # Хэшируем пароль
        user.save()  # Сохраняем пользователя
        return user

    def update(self, instance, validated_data):
        """
        Переопределяем метод update, чтобы обновление пароля также приводило к его хэшированию.
        """
        password = validated_data.pop('password', None)
        if password:
            instance.set_password(password)  # Хэшируем новый пароль
        return super().update(instance, validated_data)


class CompetitionVisibilitySerializer(serializers.Serializer):
    user_id = serializers.IntegerField()

    def create(self, validated_data):
        user = CustomUser.objects.get(id=validated_data['user_id'])
        competition = validated_data.get('competition')
        return CompetitionVisibility.objects.create(competition=competition, user=user)


class CompetitionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Competition
        fields = [
            'id',
            'title',
            'track',
            'race_start_at',
            'race_length',
            'till_the_end',
            'min_pit',
            'pit_to',
            'max_stint',
            'min_pilot',
            'max_pilot',
            'finish_at',
            'green_flag',
            'finish_flag',
            'red_flag',
            'red_flag_begin',
            'red_flag_end',
            'delay',

        ]

    def create(self, validated_data):
        # Создание соревнования
        competition = Competition.objects.create(**validated_data)

        # Получаем данные для видимостей и связываем их с созданным соревнованием
        visibilities_data = self.context.get('visibilities', [])
        for visibility_data in visibilities_data:
            user = CustomUser.objects.get(id=visibility_data['user_id'])
            CompetitionVisibility.objects.create(competition=competition, user=user)

        return competition


class PilotSerializer(serializers.ModelSerializer):
    class Meta:
        model = Pilot
        fields = ['name']

class TeamSerializer(serializers.ModelSerializer):
    pilots = PilotSerializer(many=True, write_only=True)

    class Meta:
        model = Team
        fields = ['id', 'name', 'number', 'competition', 'pilots']

    def create(self, validated_data):
        pilots_data = validated_data.pop('pilots')
        team = Team.objects.create(**validated_data)
        for pilot_data in pilots_data:
            Pilot.objects.create(team=team, **pilot_data)
        return team


class SessionInfoSerializer(serializers.ModelSerializer):
    class Meta:
        model = SessionInfo
        fields = ['id', 'competition', 'team_name', 'pilot_name', 'session_number',
                  'planing_length', 'fact_length', 'begin', 'end', 'active', 'finished']


class PitStopInfoSerializer(serializers.ModelSerializer):
    class Meta:
        model = PitStopInfo
        fields = ['id', 'competition', 'team_name', 'session_number', 'begin', 'end', 'length', 'active', 'finished']