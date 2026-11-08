package com.ledgerline.ledgerline.controller;

import com.ledgerline.ledgerline.dto.AuthResponse;
import com.ledgerline.ledgerline.dto.LoginRequest;
import com.ledgerline.ledgerline.dto.RegisterRequest;
import com.ledgerline.ledgerline.entity.User;
import com.ledgerline.ledgerline.repository.UserRepository;
import com.ledgerline.ledgerline.service.AuthService;
import com.ledgerline.ledgerline.service.JwtService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;
    private final JwtService jwtService;
    private final UserRepository userRepository;
    private final AuthenticationManager authenticationManager;

    public AuthController(
        AuthService authService,
        JwtService jwtService,
        UserRepository userRepository,
        AuthenticationManager authenticationManager
    ) {
        this.authService = authService;
        this.jwtService = jwtService;
        this.userRepository = userRepository;
        this.authenticationManager = authenticationManager;
    }

    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    public AuthResponse register(@Valid @RequestBody RegisterRequest request) {

        User user = authService.register(request);

        return new AuthResponse(
            user.getId(),
            user.getFullName(),
            user.getEmail(),
            jwtService.generateToken(user)
        );
    }

    @PostMapping("/login")
    public AuthResponse login(@Valid @RequestBody LoginRequest request) {

        String email = request.getEmail().trim().toLowerCase();

        authenticationManager.authenticate(
            new UsernamePasswordAuthenticationToken(
                email,
                request.getPassword()
            )
        );

        User user = userRepository.findByEmail(email)
            .orElseThrow(() ->
                new org.springframework.security.core.userdetails.UsernameNotFoundException(
                    "User not found"
                )
            );

        return new AuthResponse(
            user.getId(),
            user.getFullName(),
            user.getEmail(),
            jwtService.generateToken(user)
        );
    }
}