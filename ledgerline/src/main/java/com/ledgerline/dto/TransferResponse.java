package com.ledgerline.dto;

import java.math.BigDecimal;

public record TransferResponse(
        String message,
        String fromAccountNumber,
        BigDecimal fromAccountBalance,
        String toAccountNumber,
        BigDecimal toAccountBalance,
        BigDecimal transferredAmount
) {
}