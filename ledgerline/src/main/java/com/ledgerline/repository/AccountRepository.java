package com.ledgerline.repository;

import com.ledgerline.entity.Account;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface AccountRepository extends JpaRepository<Account, Long> {

    boolean existsByAccountNumber(String accountNumber);

    Optional<Account> findByAccountNumber(String accountNumber);

    Optional<Account> findByIdAndOwner_Email(Long id, String email);

    List<Account> findAllByOwner_Email(String email);
}
