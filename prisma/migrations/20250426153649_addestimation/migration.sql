-- CreateTable
CREATE TABLE "ConnectionPricing" (
    "id" TEXT NOT NULL,
    "connectionType" TEXT NOT NULL,
    "voltageLevel" TEXT NOT NULL,
    "cost" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "ConnectionPricing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VoltageRate" (
    "id" TEXT NOT NULL,
    "voltage" TEXT NOT NULL,
    "rate" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "VoltageRate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ConnectionPricing_connectionType_voltageLevel_key" ON "ConnectionPricing"("connectionType", "voltageLevel");

-- CreateIndex
CREATE UNIQUE INDEX "VoltageRate_voltage_key" ON "VoltageRate"("voltage");
