import { Controller, Get, Post, Put, Delete, Body, Param } from '@nestjs/common';
import { ClassSessionService } from './class-session.service';
import { ClassSession } from '../models/class-session.model';

@Controller('class-sessions')
export class ClassSessionController {
  constructor(private readonly service: ClassSessionService) {}

  @Post()
  create(@Body() dto: Partial<ClassSession>): Promise<ClassSession> {
    return this.service.create(dto);
  }

  @Get()
  findAll(): Promise<ClassSession[]> {
    return this.service.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<ClassSession | null> {
    return this.service.findOne(+id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: Partial<ClassSession>): Promise<ClassSession | null> {
    return this.service.update(+id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string): Promise<boolean> {
    return this.service.remove(+id);
  }
}
