package com.ledgerline.dto;

import java.math.BigDecimal;

public record AccountRequest(
    String accountHolderName,
    String accountNumber,
    BigDecimal initialBalance
) {}
