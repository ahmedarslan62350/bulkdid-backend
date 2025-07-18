import { createLogger, format, transports } from 'winston'
import { ConsoleTransportInstance } from 'winston/lib/winston/transports'
import util from 'util'
import config from '../config/config'
import { EApplicationEnvironment } from '../constants/application'
import path from 'path'
import * as sourceMapSupport from 'source-map-support'
import { red, yellow, blue, cyan, magenta, bgGreen } from 'colorette'
import 'winston-mongodb'
import DailyRotateFile from 'winston-daily-rotate-file'

// LINKING SUPPORT BETWEEN TYPESCRIPT AND JAVASCRIPT
sourceMapSupport.install()

const colorize = (level: string) => {
    switch (level) {
        case 'ERROR':
            return red(level)
        case 'WARN':
            return yellow(level)
        case 'INFO':
            return blue(level)
        case 'DEBUG':
            return magenta(level)
        default:
            return bgGreen(level)
    }
}

const consoleLogFormat = format.printf((info) => {
    const { level, message, timestamp, meta = {} } = info

    const customMeta = util.inspect(meta, {
        showHidden: false,
        depth: null,
        colors: true
    })

    return `${colorize(level.toUpperCase())} [${cyan(timestamp as string)}] ${yellow(message as string)}\n ${customMeta ? magenta('META: ') + customMeta : ''}\n`
})

const consoleTransport = (): Array<ConsoleTransportInstance> => {
    if (config.ENV === EApplicationEnvironment.DEVELOPMENT) {
        return [
            new transports.Console({
                level: 'info',
                format: format.combine(format.timestamp(), consoleLogFormat)
            })
        ]
    }
    return []
}

const fileLogFormat = format.printf((info) => {
    const { level, message, timestamp, meta = {} } = info

    const logMeta: Record<string, unknown> = {}

    for (const [key, value] of Object.entries(meta as Record<string, unknown>)) {
        if (value instanceof Error) {
            logMeta[key] = {
                name: value.name,
                message: value.message,
                trace: value.stack || ''
            }
        } else {
            logMeta[key] = value
        }
    }

    const logData = {
        level: level.toUpperCase(),
        message,
        timestamp,
        meta: logMeta
    }

    return JSON.stringify(logData, null, 4) + '\n|||'
})

const fileTransport = (): Array<DailyRotateFile> => {
    return [
        new DailyRotateFile({
            filename: path.join(__dirname, '../', '../', './logs', `${config.ENV}`), // Single file, no date in filename
            level: 'info',
            format: format.combine(format.timestamp(), fileLogFormat),
            maxSize: '100k',
            maxFiles: config.LOGS_PERCISTENT_FREQUENCY_IN_DAYS,
            extension: '.info.log',
        }),

        new DailyRotateFile({
            filename: path.join(__dirname, '../', '../', './logs', `${config.ENV}`), // Single file, no date in filename
            level: 'error',
            format: format.combine(format.timestamp(), fileLogFormat),
            maxSize: '100k',
            maxFiles: config.LOGS_PERCISTENT_FREQUENCY_IN_DAYS,
            extension: '.error.log'
        })
    ]
}

export default createLogger({
    defaultMeta: {
        meta: {}
    },
    transports: [...consoleTransport(), ...fileTransport()]
})
