import * as sneakerbot from './sneakerbot'

// Start SneakerBot
sneakerbot.start()

// Stop SneakerBot on process terminate
process.on('SIGINT', () => sneakerbot.stop())
process.on('SIGTERM', () => sneakerbot.stop())
