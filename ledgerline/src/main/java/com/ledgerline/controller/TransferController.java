package com.ledgerline.controller;

import com.ledgerline.dto.TransferRequest;
import com.ledgerline.dto.TransferResponse;
import com.ledgerline.service.AccountService;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/accounts")
public class TransferController {

    private final AccountService accountService;

    public TransferController(AccountService accountService) {
        this.accountService = accountService;
    }

    @PostMapping("/{id}/transfer")
    public TransferResponse transfer(
            @PathVariable Long id,
            @RequestBody TransferRequest request,
            @AuthenticationPrincipal UserDetails user) {

        return accountService.transfer(id, request, user.getUsername());
    }
}
