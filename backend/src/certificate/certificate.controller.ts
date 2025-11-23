import { Controller, Get, Post, Put, Delete, Body, Param } from '@nestjs/common';
import { CertificateService } from './certificate.service';
import { Certificate } from '../models/certificate.model';

@Controller('certificates')
export class CertificateController {
  constructor(private readonly service: CertificateService) {}

  @Post()
  create(@Body() dto: Partial<Certificate>): Promise<Certificate> {
    return this.service.create(dto);
  }

  @Get()
  findAll(): Promise<Certificate[]> {
    return this.service.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<Certificate | null> {
    return this.service.findOne(+id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: Partial<Certificate>): Promise<Certificate | null> {
    return this.service.update(+id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string): Promise<boolean> {
    return this.service.remove(+id);
  }
}
