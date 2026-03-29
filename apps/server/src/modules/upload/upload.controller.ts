import { Controller, Post, UseInterceptors, UploadedFile, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { v4 as uuidv4 } from 'uuid';
import { extname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { Public } from '../../common/decorators/public.decorator';

// 我们将存入 apps/server/uploads/avatars 中
const uploadPath = join(process.cwd(), 'uploads', 'avatars');
if (!existsSync(uploadPath)) {
    mkdirSync(uploadPath, { recursive: true });
}

@Controller('upload')
export class UploadController {
    @Public() // 注册时用户还没token，需要允许未登录上传
    @Post('avatar')
    @UseInterceptors(FileInterceptor('file', {
        storage: diskStorage({
            destination: uploadPath,
            filename: (req, file, cb) => {
                const uniqueSuffix = `${uuidv4()}${extname(file.originalname).toLowerCase()}`;
                cb(null, uniqueSuffix);
            },
        }),
        fileFilter: (req, file, cb) => {
            if (!file.mimetype.match(/\/(jpg|jpeg|png|gif|webp)$/)) {
                return cb(new BadRequestException('只允许上传图片文件（jpg/png/webp）！'), false);
            }
            cb(null, true);
        },
        limits: { fileSize: 5 * 1024 * 1024 }, // 5M
    }))
    uploadAvatar(@UploadedFile() file: Express.Multer.File) {
        if (!file) {
            throw new BadRequestException('文件上传失败或未提供文件');
        }
        // 返回带 /uploads/avatars/ 的相对路径URL，后续将配置静态托管
        return { url: `/uploads/avatars/${file.filename}` };
    }
}
