from rest_framework.routers import DefaultRouter
from manager.views import RegistrationUserView, CompetitionViewSet, TeamViewSet, SessionInfoViewSet, PitStopInfoViewSet

router = DefaultRouter()
router.register('register', RegistrationUserView, basename='register')
router.register('main', CompetitionViewSet, basename='main')
router.register('teams', TeamViewSet, basename='team')
router.register('sessions', SessionInfoViewSet, basename='sessions')
router.register('pitstops', PitStopInfoViewSet, basename='pitstops')

urlpatterns = router.urls