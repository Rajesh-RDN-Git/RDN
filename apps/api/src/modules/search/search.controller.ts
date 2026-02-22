import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import type { SearchService } from './search.service';

@ApiTags('Search')
@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get('properties')
  @ApiOperation({ summary: 'Search properties with filters and query params' })
  searchProperties(@Query() query: any) {
    return this.searchService.searchProperties(query);
  }
}
