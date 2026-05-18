import {
  Controller,
  Get,
  Inject,
  NotFoundException,
  Param,
  ParseIntPipe,
  Res,
  VERSION_NEUTRAL,
  Version,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { createReadStream, existsSync, statSync } from 'fs';
import { extname, join } from 'path';
import type { Response } from 'express';

import { CATALOG_PICS_PATH } from '../../infrastructure/pics-path.token';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';

import { imageMimeFromExtension } from '../../application/catalog/image-mime.util';

@ApiTags('Catalog')
@Controller('catalog')
export class CatalogPictureController {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(CATALOG_PICS_PATH) private readonly picsRoot: string,
  ) {}

  @Version(VERSION_NEUTRAL)
  @Get('items/:id/pic')
  async getPicture(@Param('id', ParseIntPipe) id: number, @Res() res: Response): Promise<void> {
    const row = await this.prisma.catalogItem.findUnique({ where: { Id: id } });
    if (!row?.PictureFileName) throw new NotFoundException('Picture not found');

    const filePath = join(this.picsRoot, row.PictureFileName);
    if (!existsSync(filePath)) throw new NotFoundException('Picture not found');

    const mimetype = imageMimeFromExtension(extname(row.PictureFileName));
    const lastModified = statSync(filePath).mtime;

    res.setHeader('Content-Type', mimetype);
    res.setHeader('Last-Modified', lastModified.toUTCString());

    createReadStream(filePath).pipe(res);
  }
}
