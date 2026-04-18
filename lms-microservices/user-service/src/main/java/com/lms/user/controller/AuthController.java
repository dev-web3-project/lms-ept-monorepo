package com.lms.user.controller;

import com.lms.user.entity.AppUser;
import com.lms.user.security.JwtService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/user/auth")
@RequiredArgsConstructor
@Tag(name = "Authentification", description = "Connexion et gestion des sessions utilisateur")
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;

    @Operation(summary = "Connexion utilisateur", description = "Authentifie un utilisateur avec son identifiant et son mot de passe. Retourne un token JWT et le rôle de l'utilisateur.")
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> credentials) {
        String email = credentials.get("username"); // Frontend still sends this under the "username" key
        String password = credentials.get("password");

        try {
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(email, password)
            );

            AppUser user = (AppUser) authentication.getPrincipal();
            String jwt = jwtService.generateToken(user);

            Map<String, Object> response = new HashMap<>();
            response.put("token", jwt);
            // Frontend might expect "ADMIN" instead of "ROLE_ADMIN" depending on implementation,
            // but typical Spring Security uses ROLE_ prefix. Adjusting here for backward compatibility with frontend:
            String role = user.getRole().startsWith("ROLE_") ? user.getRole().substring(5) : user.getRole();
            response.put("role", role);

            Map<String, String> userMap = new HashMap<>();
            userMap.put("username", user.getUsername());
            response.put("user", userMap);

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(401).body(Map.of("message", "Identifiants invalides (Email ou Mot de passe incorrect)"));
        }
    }
}
