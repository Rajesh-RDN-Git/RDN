import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { SearchService } from './search.service';
import { SearchPropertiesDto } from './dto/search-properties.dto';

@ApiTags('Search')
@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get('properties')
  @ApiOperation({ summary: 'Search properties with filters and query params' })
  async searchProperties(@Query() query: SearchPropertiesDto): Promise<any> {
    return this.searchService.searchProperties(query);
  }
}
