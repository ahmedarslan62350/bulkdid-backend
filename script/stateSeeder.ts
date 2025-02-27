import { states } from '../src/constants/states'
import { StateModel } from '../src/models/State' // Import your State model
import { redis } from '../src/service/redisInstance'
import logger from '../src/utils/logger' // Logger for debugging

export async function populateStates() {
    try {
        const count = await StateModel.countDocuments()
        if (count === 0) {
            await StateModel.insertMany(states)
            logger.info('STATE_SEEDER', { message: 'States populated successfully' })
        } else {
            logger.info('STATE_SEEDER', { message: 'States already exist, skipping population' })
        }
        const strStates: [string] = ['']
        states.forEach((e) => {
            strStates.push(JSON.stringify(e))
        })
        await redis.lpush('STATES', ...strStates)
    } catch (error) {
        logger.error('STATE_SEEDER', { message: 'Error populating states', error })
    }
}
