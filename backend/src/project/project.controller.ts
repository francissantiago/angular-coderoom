import { Controller, Get, Post, Put, Delete, Body, Param } from '@nestjs/common';
import { ProjectService } from './project.service';
import { Project } from '../models/project.model';

@Controller('projects')
export class ProjectController {
  constructor(private readonly service: ProjectService) {}

  @Post()
  create(@Body() dto: Partial<Project>): Promise<Project> {
    return this.service.create(dto);
  }

  @Get()
  findAll(): Promise<Project[]> {
    return this.service.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<Project | null> {
    return this.service.findOne(+id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: Partial<Project>): Promise<Project | null> {
    return this.service.update(+id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string): Promise<boolean> {
    return this.service.remove(+id);
  }
}
