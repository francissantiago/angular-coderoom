import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
} from '@nestjs/common';
import { ClassGroupService } from './class-group.service';
import { ClassGroup } from '../models/class-group.model';

@Controller('class-groups')
export class ClassGroupController {
  constructor(private readonly service: ClassGroupService) {}

  @Post()
  create(@Body() dto: Partial<ClassGroup>): Promise<ClassGroup | null> {
    return this.service.create(dto);
  }

  @Get()
  findAll(): Promise<ClassGroup[]> {
    return this.service.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<ClassGroup | null> {
    return this.service.findOne(+id);
  }

  @Put(':id')
  update(
    @Param('id') id: string,
    @Body() dto: Partial<ClassGroup>,
  ): Promise<ClassGroup | null> {
    return this.service.update(+id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string): Promise<boolean> {
    return this.service.remove(+id);
  }
}
