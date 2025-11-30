import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
} from '@nestjs/common';
import { LessonService } from './lesson.service';
import { Lesson } from '../models/lesson.model';

@Controller('lessons')
export class LessonController {
  constructor(private readonly service: LessonService) {}

  @Post()
  create(@Body() dto: Partial<Lesson>): Promise<Lesson> {
    return this.service.create(dto);
  }

  @Get()
  findAll(): Promise<Lesson[]> {
    return this.service.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<Lesson | null> {
    return this.service.findOne(+id);
  }

  @Put(':id')
  update(
    @Param('id') id: string,
    @Body() dto: Partial<Lesson>,
  ): Promise<Lesson | null> {
    return this.service.update(+id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string): Promise<boolean> {
    return this.service.remove(+id);
  }
}
