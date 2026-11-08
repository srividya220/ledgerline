package com.ledgerline.controller;

import com.ledgerline.dto.TransactionResponse;
import com.ledgerline.service.AccountService;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/accounts")
public class TransactionController {

    private final AccountService accountService;

    public TransactionController(AccountService accountService) {
        this.accountService = accountService;
    }

    @GetMapping("/{id}/transactions")
    public List<TransactionResponse> getTransactionHistory(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails user) {
        return accountService.getTransactionHistory(id, user.getUsername());
    }
}
