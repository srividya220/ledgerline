package com.ledgerline.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record TransactionResponse(
        Long id,
        Long accountId,
        String type,
        BigDecimal amount,
        BigDecimal balanceAfter,
        LocalDateTime createdAt
) {
}