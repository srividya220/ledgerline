package com.ledgerline.ledgerline.service;

import com.ledgerline.ledgerline.dto.RegisterRequest;
import com.ledgerline.ledgerline.entity.User;
import com.ledgerline.ledgerline.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public AuthService(UserRepository userRepository,
                       PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional
    public User register(RegisterRequest request) {

        String email = request.getEmail().trim().toLowerCase();

        if (userRepository.existsByEmail(email)) {
            throw new ResponseStatusException(
                HttpStatus.CONFLICT,
                "An account with this email already exists"
            );
        }

        String encodedPassword =
            passwordEncoder.encode(request.getPassword());

        User user = new User(
            request.getFullName().trim(),
            email,
            encodedPassword
        );

        return userRepository.save(user);
    }
}