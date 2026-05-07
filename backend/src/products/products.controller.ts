import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Inject,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { zParse } from '../common/zod.pipe';
import {
  createProductSchema,
  listProductsQuerySchema,
  updateProductSchema,
  type CreateProductInput,
  type ListProductsQuery,
  type UpdateProductInput,
} from './products.model';
import { PRODUCTS_SERVICE, type ProductsService } from './products.service';

@Controller('products')
export class ProductsController {
  constructor(
    @Inject(PRODUCTS_SERVICE) private readonly products: ProductsService,
  ) {}

  @Get()
  list(@Query(zParse(listProductsQuerySchema)) query: ListProductsQuery) {
    return this.products.list(query);
  }

  @Get('stats')
  stats() {
    return this.products.stats();
  }

  @Get('categories')
  categories() {
    return this.products.categories();
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.products.get(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Body(zParse(createProductSchema)) body: CreateProductInput) {
    return this.products.create(body);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  update(
    @Param('id') id: string,
    @Body(zParse(updateProductSchema)) body: UpdateProductInput,
  ) {
    return this.products.update(id, body);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(200)
  remove(@Param('id') id: string) {
    return this.products.remove(id);
  }
}
