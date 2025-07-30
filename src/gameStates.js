const gameStates = {}

module.exports = {
    pauseGame: (sessionId, state) => {
        if (gameStates[sessionId]) {
            gameStates[sessionId].isPaused = state
        }
    },
    getGameState: (sessionId) => {
        return gameStates[sessionId] || null
    },
    addGameState: (sessionId, state) => {
        gameStates[sessionId] = state
    },
    removeGameState: (sessionId) => {
        delete gameStates[sessionId]
    },
}