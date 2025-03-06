import { NextFunction, Request, Response } from 'express'
import httpError from '../../utils/httpError'
import responseMessage from '../../constants/responseMessage'
import httpResponse from '../../utils/httpResponse'
import { IGetLengthByIndex } from '../../types/types'
import { FileModel } from '../../models/File'

export default async function getAllFiles(req: Request, res: Response, next: NextFunction) {
    try {
        const { index = 0, length = 10 } = req.body as IGetLengthByIndex

        const files = await FileModel.find()
        const paginatedFiles = files.slice(index * length, index * length + length)

        httpResponse(req, res, responseMessage.SUCCESS.code, responseMessage.SUCCESS.message, { files: [...paginatedFiles] })
    } catch (error) {
        httpError(next, error, req, responseMessage.INTERNAL_SERVER_ERROR.code)
    }
}
