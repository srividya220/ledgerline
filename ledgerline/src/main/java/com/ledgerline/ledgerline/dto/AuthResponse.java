package com.ledgerline.ledgerline.dto;

public record AuthResponse(
    Long userId,
    String fullName,
    String email,
    String token
) {}