package com.ledgerline.controller;

import com.ledgerline.dto.AccountRequest;
import com.ledgerline.dto.MoneyRequest;
import com.ledgerline.entity.Account;
import com.ledgerline.service.AccountService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/accounts")
public class AccountController {

    private final AccountService service;

    public AccountController(AccountService service) {
        this.service = service;
    }

    @PostMapping
    public ResponseEntity<Account> createAccount(
            @RequestBody AccountRequest request,
            @AuthenticationPrincipal UserDetails user) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(service.createAccount(request, user.getUsername()));
    }

    @GetMapping
    public List<Account> getAllAccounts(
            @AuthenticationPrincipal UserDetails user) {
        return service.getAllAccounts(user.getUsername());
    }

    @GetMapping("/{id}")
    public Account getAccount(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails user) {
        return service.getAccount(id, user.getUsername());
    }

    @PostMapping("/{id}/deposit")
    public Account deposit(
            @PathVariable Long id,
            @RequestBody MoneyRequest request,
            @AuthenticationPrincipal UserDetails user) {
        return service.deposit(id, request.amount(), user.getUsername());
    }

    @PostMapping("/{id}/withdraw")
    public Account withdraw(
            @PathVariable Long id,
            @RequestBody MoneyRequest request,
            @AuthenticationPrincipal UserDetails user) {
        return service.withdraw(id, request.amount(), user.getUsername());
    }
}
