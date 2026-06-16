-- AlterTable
ALTER TABLE "user_permissions" ADD COLUMN     "address_book_change_request_target" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "address_book_edit" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "address_book_view" BOOLEAN NOT NULL DEFAULT true;

-- CreateTable
CREATE TABLE "t_address_book_change_requests" (
    "id" TEXT NOT NULL,
    "uid" TEXT NOT NULL,
    "address_book_id" TEXT NOT NULL,
    "requester_id" TEXT,
    "status" TEXT NOT NULL DEFAULT '依頼中',
    "remarks" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "t_address_book_change_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "t_address_book_change_request_items" (
    "id" TEXT NOT NULL,
    "change_request_id" TEXT NOT NULL,
    "field_name" TEXT NOT NULL,
    "field_label" TEXT NOT NULL,
    "before_value" TEXT,
    "after_value" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "t_address_book_change_request_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "t_address_book_change_requests_uid_key" ON "t_address_book_change_requests"("uid");

-- AddForeignKey
ALTER TABLE "t_address_book_change_requests" ADD CONSTRAINT "t_address_book_change_requests_address_book_id_fkey" FOREIGN KEY ("address_book_id") REFERENCES "t_address_book"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "t_address_book_change_requests" ADD CONSTRAINT "t_address_book_change_requests_requester_id_fkey" FOREIGN KEY ("requester_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "t_address_book_change_request_items" ADD CONSTRAINT "t_address_book_change_request_items_change_request_id_fkey" FOREIGN KEY ("change_request_id") REFERENCES "t_address_book_change_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;
