package com.ledgerline.service;

import com.ledgerline.dto.AccountRequest;
import com.ledgerline.dto.TransactionResponse;
import com.ledgerline.dto.TransferRequest;
import com.ledgerline.dto.TransferResponse;
import com.ledgerline.entity.Account;
import com.ledgerline.entity.AccountTransaction;
import com.ledgerline.entity.TransactionType;
import com.ledgerline.ledgerline.entity.User;
import com.ledgerline.ledgerline.repository.UserRepository;
import com.ledgerline.repository.AccountRepository;
import com.ledgerline.repository.AccountTransactionRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.util.List;

@Service
public class AccountService {

    private final AccountRepository accountRepository;
    private final AccountTransactionRepository transactionRepository;
    private final UserRepository userRepository;

    public AccountService(
            AccountRepository accountRepository,
            AccountTransactionRepository transactionRepository,
            UserRepository userRepository) {
        this.accountRepository = accountRepository;
        this.transactionRepository = transactionRepository;
        this.userRepository = userRepository;
    }

    public Account createAccount(AccountRequest request, String email) {

        if (accountRepository.existsByAccountNumber(request.accountNumber())) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT, "Account number already exists"
            );
        }

        User owner = getUserByEmail(email);

        Account account = new Account(
                request.accountHolderName(),
                request.accountNumber(),
                request.initialBalance()
        );

        account.setOwner(owner);

        return accountRepository.save(account);
    }

    public List<Account> getAllAccounts(String email) {
        return accountRepository.findAllByOwner_Email(email);
    }

    public Account getAccount(Long id, String email) {
        return accountRepository.findByIdAndOwner_Email(id, email)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Account not found"
                ));
    }

    @Transactional
    public Account deposit(Long id, BigDecimal amount, String email) {
        validateAmount(amount);

        Account account = getAccount(id, email);
        account.deposit(amount);
        accountRepository.save(account);

        transactionRepository.save(new AccountTransaction(
                account, TransactionType.DEPOSIT,
                amount, account.getBalance()
        ));

        return account;
    }

    @Transactional
    public Account withdraw(Long id, BigDecimal amount, String email) {
        validateAmount(amount);

        Account account = getAccount(id, email);
        checkSufficientBalance(account, amount);

        account.withdraw(amount);
        accountRepository.save(account);

        transactionRepository.save(new AccountTransaction(
                account, TransactionType.WITHDRAW,
                amount, account.getBalance()
        ));

        return account;
    }

    @Transactional
    public TransferResponse transfer(
            Long fromId, TransferRequest request, String email) {

        validateAmount(request.amount());

        if (request.targetAccountNumber() == null
                || request.targetAccountNumber().isBlank()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "Target account number is required"
            );
        }

        Account fromAccount = getAccount(fromId, email);

        Account toAccount = accountRepository
                .findByAccountNumber(request.targetAccountNumber())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Target account not found"
                ));

        if (fromAccount.getId().equals(toAccount.getId())) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Cannot transfer money to the same account"
            );
        }

        BigDecimal amount = request.amount();

        checkSufficientBalance(fromAccount, amount);

        fromAccount.withdraw(amount);
        toAccount.deposit(amount);

        accountRepository.save(fromAccount);
        accountRepository.save(toAccount);

        transactionRepository.save(new AccountTransaction(
                fromAccount,
                TransactionType.TRANSFER_OUT,
                amount,
                fromAccount.getBalance()
        ));

        transactionRepository.save(new AccountTransaction(
                toAccount,
                TransactionType.TRANSFER_IN,
                amount,
                toAccount.getBalance()
        ));

        return new TransferResponse(
                "Transfer successful",
                fromAccount.getAccountNumber(),
                fromAccount.getBalance(),
                toAccount.getAccountNumber(),
                toAccount.getBalance(),
                amount
        );
    }

    public List<TransactionResponse> getTransactionHistory(
            Long accountId, String email) {

        getAccount(accountId, email);

        return transactionRepository
                .findByAccount_IdOrderByCreatedAtDesc(accountId)
                .stream()
                .map(transaction -> new TransactionResponse(
                        transaction.getId(),
                        transaction.getAccount().getId(),
                        transaction.getType().name(),
                        transaction.getAmount(),
                        transaction.getBalanceAfter(),
                        transaction.getCreatedAt()
                ))
                .toList();
    }

    private User getUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "User not found"
                ));
    }

    private void validateAmount(BigDecimal amount) {
        if (amount == null || amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "Amount must be positive"
            );
        }
    }

    private void checkSufficientBalance(Account account, BigDecimal amount) {
        if (account.getBalance().compareTo(amount) < 0) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "Insufficient balance"
            );
        }
    }
}
