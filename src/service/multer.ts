 
 
 
import multer from 'multer'

const storage = multer.memoryStorage()
export const upload = multer({
    storage,
    dest: '/uploads',
    limits: { fileSize: 1024 * 1024 * 200 }, // 200MB
    fileFilter: (req, file, cb) => {
        const allowedMimeTypes = [
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
            'application/vnd.ms-excel', // .xls
            'text/csv' // .csv
        ]
        const filetype = file.mimetype
        if (allowedMimeTypes.includes(filetype)) {
            cb(null, true)
        } else {
            cb(null, false)
        }
    }
})
