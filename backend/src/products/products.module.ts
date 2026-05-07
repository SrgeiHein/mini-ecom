import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { ProductsController } from './products.controller';
import { productsServiceProvider } from './products.service';

@Module({
  imports: [AuthModule],
  controllers: [ProductsController],
  providers: [productsServiceProvider],
})
export class ProductsModule {}
