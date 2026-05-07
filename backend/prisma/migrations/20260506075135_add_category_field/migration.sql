-- AlterTable
ALTER TABLE "products" ADD COLUMN     "category" TEXT NOT NULL DEFAULT 'Other';

-- CreateIndex
CREATE INDEX "products_category_idx" ON "products"("category");
