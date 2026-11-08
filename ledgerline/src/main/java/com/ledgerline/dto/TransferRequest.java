package com.ledgerline.dto;

import java.math.BigDecimal;

public record TransferRequest(
        String targetAccountNumber,
        BigDecimal amount
) {
}