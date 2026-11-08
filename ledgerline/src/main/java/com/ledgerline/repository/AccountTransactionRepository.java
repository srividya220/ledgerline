package com.ledgerline.repository;

import com.ledgerline.entity.AccountTransaction;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface AccountTransactionRepository
        extends JpaRepository<AccountTransaction, Long> {

    List<AccountTransaction> findByAccount_IdOrderByCreatedAtDesc(Long accountId);
}