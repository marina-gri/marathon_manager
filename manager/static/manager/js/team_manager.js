document.addEventListener('DOMContentLoaded', () => {
    const teamDataElement = document.getElementById('team-data');
    const teamContainer = document.getElementById('team-list'); // Контейнер для команд

    if (!teamDataElement || !teamContainer) {
        console.error('Team data or container not found.');
        return;
    }

    // Получение данных из JSON
    const teams = JSON.parse(teamDataElement.textContent);

    // Функция для рендеринга одной команды
    const renderTeam = (team) => `
        <div class="tab-content" id="team-${team.id}">
            <div class="race-info-container">
                <div class="pit-block pit-settings">
                    <div class="info stopwatch">
                        <p id="stopwatch" class="stopwatch">00:00:00</p>
                    </div>
                    <div class="info session-info">
                        <p></p>
                    </div>
                    <div class="info btn-field">
                        <button id="pit-btn" class="pit-button">PIT-IN</button>
                    </div>
                </div>
            </div>

            <label class="info-block format-view">
                <select id="view-selector" class="stat-selector">
                    <option value="sessions">График сессий</option>
                    <option value="pilots">Статистика пилотов</option>
                    <option value="pitstops">Статистика пит-стопов</option>
                </select>
            </label>
            <section class="schedule-section">
                <header class="header-schedule-block" id="section-header"></header>
                <div class="schedule-block" id="section-content">
                    <!-- здесь выводится динамический контент -->
                </div>
                <button class="add-next-session">следующая сессия</button>
            </section>
        </div>
    `;

    // Рендер всех команд
    const renderTeams = (teams) => {
        teamContainer.innerHTML = teams.map(renderTeam).join('');
    };

    renderTeams(teams);
});