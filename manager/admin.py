from django.contrib import admin
from django.contrib.auth.admin import UserAdmin

from .forms import CustomUserCreationForm, CustomUserChangeForm
from .models import CustomUser, Competition, Team, Pilot, CompetitionVisibility, SessionInfo, PitStopInfo


@admin.register(CustomUser)
class CustomUserAdmin(UserAdmin):
    add_form = CustomUserCreationForm
    form = CustomUserChangeForm
    model = CustomUser
    list_display = ('id', 'email', 'name', 'is_staff', 'is_active', 'date_joined')
    list_filter = ('id', 'email', 'name', 'is_staff', 'is_active', 'date_joined')
    fieldsets = (
        (None, {'fields': ('email', 'password', 'name')}),
        ('Permissions', {'fields': ('is_staff', 'is_active')}),
    )
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'password1', 'password2', 'is_staff', 'is_active')}
        ),
    )
    search_fields = ('email',)
    ordering = ('id',)


@admin.register(Competition)
class CompetitionAdmin(admin.ModelAdmin):
    list_display = ('title', 'track', 'race_start_at', 'creator', 'race_length', 'till_the_end', 'min_pit', 'pit_to',
                    'max_stint', 'min_pilot', 'max_pilot', 'green_flag', 'finish_flag', 'red_flag',
                    'red_flag_begin', 'red_flag_end', 'delay', 'finish_at')
    list_filter = ('creator', 'race_start_at', 'pit_to', 'till_the_end')
    search_fields = ('title', 'track')
    ordering = ('race_start_at',)


@admin.register(CompetitionVisibility)
class CompetitionVisibilityAdmin(admin.ModelAdmin):
    list_display = ('user', 'competition')
    list_filter = ('competition', 'user')
    search_fields = ('user__username', 'competition__title')
    ordering = ('competition', 'user')


@admin.register(Team)
class TeamAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'competition')
    search_fields = ('name', 'competition__title')
    ordering = ('competition', 'name')


@admin.register(Pilot)
class PilotAdmin(admin.ModelAdmin):
    list_display = ('name', 'team')
    search_fields = ('name', 'team__name')
    ordering = ('team', 'name')


@admin.register(SessionInfo)
class SessionInfoAdmin(admin.ModelAdmin):
    list_display = ('id', 'competition', 'team_name', 'pilot_name', 'session_number',
                    'planing_length', 'fact_length', 'begin', 'end', 'active', 'finished')
    list_filter = ('competition', 'team_name', 'active', 'finished')
    search_fields = ('team_name', 'pilot_name', 'competition__title')
    ordering = ('competition', 'session_number')


@admin.register(PitStopInfo)
class PitStopInfoAdmin(admin.ModelAdmin):
    list_display = ('id', 'competition', 'team_name', 'session_number', 'begin', 'end', 'length', 'active', 'finished')
    list_filter = ('competition', 'team_name', 'session_number')
    search_fields = ('team_name', 'competition__title')
