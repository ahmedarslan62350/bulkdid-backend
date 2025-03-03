import { NextFunction, Request, Response } from 'express'
import httpError from '../../utils/httpError'
import responseMessage from '../../constants/responseMessage'
import httpResponse from '../../utils/httpResponse'
import { FileModel } from '../../models/File'
import { IDownloadBody } from '../../types/types'



export default async function downloadFile(req: Request, res: Response, next: NextFunction) {
    try {
        const { fileId } = req.body as IDownloadBody
        if (!fileId) {
            httpResponse(req, res, responseMessage.BAD_REQUEST.code, responseMessage.VALIDATION_ERROR.FIELD_REQUIRED('fileId'))
            return
        }

        const user = req.user!
        const file = await FileModel.findById(fileId)
        if (!file) {
            httpResponse(req, res, responseMessage.NOT_FOUND.code, responseMessage.NOT_FOUND.message('file'))
            return
        }

        if (file.ownerId != user._id) {
            httpResponse(req, res, responseMessage.FORBIDDEN.code, responseMessage.FORBIDDEN.message)
            return
        }

        if (!file.path) {
            httpResponse(req, res, responseMessage.NOT_FOUND.code, 'File at the specified path not exists')
            return
        }

        res.download(file.path, file.name, (err) => {
            if (err) {
                httpResponse(req, res, responseMessage.INTERNAL_SERVER_ERROR.code, responseMessage.INTERNAL_SERVER_ERROR.message)
            }
        })
    } catch (error) {
        httpError(next, error, req, responseMessage.INTERNAL_SERVER_ERROR.code)
    }
}
